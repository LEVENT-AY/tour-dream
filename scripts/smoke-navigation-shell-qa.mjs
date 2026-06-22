import admin from 'firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { chromium } from 'playwright';
import { ensureDemoAccounts } from './ensure-demo-accounts.mjs';

const PROJECT_ID = 'tour-tunisi';
const BASE_URL = process.env.BASE_URL || 'http://localhost:5174';

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function initAdminSdk() {
  if (admin.getApps().length === 0) {
    admin.initializeApp({ projectId: PROJECT_ID });
  }
  return { auth: getAuth(), db: getFirestore() };
}

async function verifyDemoAccount({ email, expectedRole, requiresApprovedAgent = false }) {
  const { auth, db } = initAdminSdk();
  const user = await auth.getUserByEmail(email);
  const profileSnap = await db.collection('users').doc(user.uid).get();

  if (!profileSnap.exists) {
    throw new Error(`Missing Firestore profile for ${expectedRole} demo account.`);
  }

  const profile = profileSnap.data();
  if (profile.role !== expectedRole || user.customClaims?.role !== expectedRole) {
    throw new Error(`Role mismatch for ${expectedRole} demo account.`);
  }

  if (requiresApprovedAgent && (profile.agentStatus !== 'approved' || profile.approved !== true || profile.suspended === true)) {
    throw new Error('Agent demo account is not approved.');
  }
}

async function waitForHomepage(page) {
  await page.locator('#loader-wrapper').waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(500);
  await page.waitForFunction(() => {
    const path = window.location.pathname;
    return path === '/' || path === '/index';
  }, null, { timeout: 30000 });
  return new URL(page.url()).pathname;
}

async function login(page, email, password, dashboardPath) {
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
  await page.locator('#loader-wrapper').waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
  await page.getByPlaceholder('Enter Email').fill(email);
  await page.getByPlaceholder('Enter Password').fill(password);
  await page.getByRole('button', { name: /login|signing in/i }).click();
  await page.waitForURL((url) => url.pathname === dashboardPath, { timeout: 30000 });
}

async function openAccountMenu(page) {
  const profileDropdown = page.locator('header .profile-dropdown').first();
  await profileDropdown.waitFor({ state: 'visible', timeout: 30000 });
  const toggle = profileDropdown.locator('[data-bs-toggle="dropdown"]').first();
  await toggle.waitFor({ state: 'attached', timeout: 30000 });
  await toggle.click({ force: true });
  await profileDropdown.locator('.dropdown-menu').first().waitFor({ state: 'visible', timeout: 10000 });
}

async function readHomeShell(page, { waitForProfile = false } = {}) {
  await page.locator('#loader-wrapper').waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
  const settleDeadline = Date.now() + 15000;
  const header = page.locator('header').first();
  let loginVisible = 0;
  let profileVisible = 0;
  let backdropCount = 0;
  let bodyModalOpen = false;
  let profileDropdownVisible = false;
  while (Date.now() < settleDeadline) {
    loginVisible = await header.locator('.header-btn [data-bs-target="#login-modal"]:visible').count();
    profileVisible = await page.locator('.profile-dropdown').count();
    backdropCount = await page.locator('.modal-backdrop').count();
    bodyModalOpen = await page.evaluate(() => document.body.classList.contains('modal-open'));
    profileDropdownVisible = profileVisible > 0 && await page.locator('.profile-dropdown').first().isVisible().catch(() => false);
    if (profileDropdownVisible || (!waitForProfile && loginVisible > 0)) {
      break;
    }
    await page.waitForTimeout(250);
  }
  return {
    loginVisible,
    profileVisible,
    profileDropdownVisible,
    backdropCount,
    bodyModalOpen,
    path: new URL(page.url()).pathname,
  };
}

async function clickBackToWebsite(page, selector) {
  const link = page.locator(selector).first();
  await link.waitFor({ state: 'visible', timeout: 15000 });
  await link.scrollIntoViewIfNeeded().catch(() => {});
  await link.click({ force: true });
  return waitForHomepage(page);
}

async function runBackFlow(page, role) {
  await login(page, role.email, role.password, role.dashboardPath);
  await page.goto(`${BASE_URL}${role.dashboardPath}`, { waitUntil: 'domcontentloaded' });
  await page.locator('#loader-wrapper').waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
  const path = await clickBackToWebsite(page, role.backSelector);
  const shell = await readHomeShell(page);
  const signedIn = shell.profileVisible > 0 && shell.loginVisible === 0;
  await openAccountMenu(page);
  await page.locator('.profile-dropdown').getByRole('link', { name: 'Logout' }).click();
  await page.waitForURL((url) => url.pathname === '/' || url.pathname === '/index', { timeout: 30000 });
  const loggedOutShell = await readHomeShell(page);

  return {
    backToWebsiteOk: path === '/' || path === '/index',
    sessionPreserved: signedIn,
    homepageSignedIn: signedIn,
    logoutStillWorks: loggedOutShell.loginVisible > 0 && loggedOutShell.profileVisible === 0,
    homepagePath: shell.path,
  };
}

async function runRoleProfileRoute(browser, errors, role) {
  const roleContext = await browser.newContext();
  const rolePage = await roleContext.newPage();
  rolePage.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      if (!text.includes('Missing or insufficient permissions')) {
        errors.push(text);
      }
    }
  });
  rolePage.on('pageerror', (err) => errors.push(err.message));

  try {
    await login(rolePage, role.email, role.password, role.dashboardPath);
    await rolePage.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
    const shell = await readHomeShell(rolePage, { waitForProfile: true });
    if (shell.profileVisible === 0) {
      throw new Error(
        `${role.name} profile dropdown did not render on the public header. loginVisible=${shell.loginVisible}, profileVisible=${shell.profileVisible}, path=${shell.path}`
      );
    }
    await openAccountMenu(rolePage);
    await rolePage.locator('.profile-dropdown').getByRole('link', { name: 'My Profile' }).click();
    await rolePage.waitForURL((url) => url.pathname === role.expectedProfilePath, { timeout: 30000 });
    return new URL(rolePage.url()).pathname === role.expectedProfilePath;
  } finally {
    await roleContext.close();
  }
}

async function main() {
  const adminEmail = requireEnv('DEMO_ADMIN_EMAIL');
  const adminPassword = requireEnv('DEMO_ADMIN_PASSWORD');
  const agentEmail = requireEnv('DEMO_AGENT_EMAIL');
  const agentPassword = requireEnv('DEMO_AGENT_PASSWORD');
  const customerEmail = requireEnv('DEMO_CUSTOMER_EMAIL');
  const customerPassword = requireEnv('DEMO_CUSTOMER_PASSWORD');

  await ensureDemoAccounts();
  await Promise.all([
    verifyDemoAccount({ email: adminEmail, expectedRole: 'admin' }),
    verifyDemoAccount({ email: agentEmail, expectedRole: 'agent', requiresApprovedAgent: true }),
    verifyDemoAccount({ email: customerEmail, expectedRole: 'customer' }),
  ]);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  const errors = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      if (!text.includes('Missing or insufficient permissions') && !text.includes('Could not reach Cloud Firestore backend')) {
        errors.push(text);
      }
    }
  });
  page.on('pageerror', (err) => errors.push(err.message));

  let rootOk = false;
  let legacyRootOk = false;
  let homeLinkOk = false;
  let customerOk = false;
  let agentOk = false;
  let adminOk = false;
  let roleRoutesOk = false;
  let logoutStillWorks = false;

  try {
    await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
    await waitForHomepage(page);
    rootOk = new URL(page.url()).pathname === '/';
    const activeTopNavLabels = await page.locator('header .main-nav > li.active:visible > a').evaluateAll((links) =>
      links
        .map((link) => (link.textContent || '').replace(/\s+/g, ' ').trim())
        .filter(Boolean)
    );
    if (activeTopNavLabels.length !== 1 || !activeTopNavLabels[0].includes('Home')) {
      throw new Error(`Homepage nav active styling is incorrect: ${JSON.stringify(activeTopNavLabels)}`);
    }

    await page.goto(`${BASE_URL}/index`, { waitUntil: 'domcontentloaded' });
    const legacyPath = await waitForHomepage(page);
    legacyRootOk = legacyPath === '/';

    await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
    await waitForHomepage(page);
    await page.locator('header .navbar-brand, header .header-logo').first().click({ force: true });
    const logoPath = await waitForHomepage(page);
    homeLinkOk = logoPath === '/';

    const customerFlow = await runBackFlow(page, {
      email: customerEmail,
      password: customerPassword,
      dashboardPath: '/user/dashboard',
      backSelector: '.user-sidebar a:has(.isax-arrow-left-2)',
    });
    customerOk = customerFlow.sessionPreserved;

    const agentFlow = await runBackFlow(page, {
      email: agentEmail,
      password: agentPassword,
      dashboardPath: '/agent/agent-dashboard',
      backSelector: '.agent-sidebar .btn-outline-primary',
    });
    agentOk = agentFlow.sessionPreserved;

    const adminFlow = await runBackFlow(page, {
      email: adminEmail,
      password: adminPassword,
      dashboardPath: '/admin/dashboard',
      backSelector: '.admin-sidebar .btn-outline-primary',
    });
    adminOk = adminFlow.sessionPreserved;
    logoutStillWorks = customerFlow.logoutStillWorks && agentFlow.logoutStillWorks && adminFlow.logoutStillWorks;

    const customerProfile = await runRoleProfileRoute(browser, errors, {
      name: 'customer',
      email: customerEmail,
      password: customerPassword,
      dashboardPath: '/user/dashboard',
      expectedProfilePath: '/user/my-profile',
    });
    const agentProfile = await runRoleProfileRoute(browser, errors, {
      name: 'agent',
      email: agentEmail,
      password: agentPassword,
      dashboardPath: '/agent/agent-dashboard',
      expectedProfilePath: '/agent/agent-dashboard',
    });
    const adminProfile = await runRoleProfileRoute(browser, errors, {
      name: 'admin',
      email: adminEmail,
      password: adminPassword,
      dashboardPath: '/admin/dashboard',
      expectedProfilePath: '/admin/dashboard',
    });
    roleRoutesOk = customerProfile && agentProfile && adminProfile;

    const success = rootOk && legacyRootOk && homeLinkOk && customerOk && agentOk && adminOk && roleRoutesOk && logoutStillWorks && errors.length === 0;

    console.log(JSON.stringify({
      success,
      rootOk,
      legacyRootOk,
      homeLinkOk,
      customerOk,
      agentOk,
      adminOk,
      roleRoutesOk,
      logoutStillWorks,
      errors,
    }));
    process.exitCode = success ? 0 : 1;
  } catch (error) {
    console.log(JSON.stringify({
      success: false,
      rootOk,
      legacyRootOk,
      homeLinkOk,
      customerOk,
      agentOk,
      adminOk,
      roleRoutesOk,
      logoutStillWorks,
      errors,
      reason: error.message || String(error),
    }));
    process.exitCode = 1;
  } finally {
    await context.close();
    await browser.close();
  }
}

main().catch((error) => {
  console.error(JSON.stringify({
    success: false,
    reason: error.message || String(error),
  }));
  process.exit(1);
});
