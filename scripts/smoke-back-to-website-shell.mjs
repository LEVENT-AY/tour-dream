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

async function login(page, email, password, dashboardPath) {
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
  await page.locator('#loader-wrapper').waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
  await page.getByPlaceholder('Enter Email').fill(email);
  await page.getByPlaceholder('Enter Password').fill(password);
  await page.getByRole('button', { name: /login|signing in/i }).click();
  const deadline = Date.now() + 30000;
  while (Date.now() < deadline) {
    if (page.url().includes(dashboardPath)) {
      return;
    }
    await page.waitForTimeout(250);
  }
  throw new Error(`Timed out waiting for ${dashboardPath}`);
}

async function clickBackToWebsite(page, selector) {
  const backLink = page.locator(selector).first();
  await backLink.waitFor({ state: 'visible', timeout: 15000 });
  await backLink.scrollIntoViewIfNeeded().catch(() => {});
  await backLink.click({ force: true });
  const deadline = Date.now() + 30000;
  while (Date.now() < deadline) {
    const pathname = new URL(page.url()).pathname;
    if (pathname === '/' || pathname === '/index') {
      return pathname;
    }
    await page.waitForTimeout(250);
  }
  throw new Error('Timed out waiting for homepage after Back to Website.');
}

async function readHomeState(page) {
  await page.locator('#loader-wrapper').waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
  const settleDeadline = Date.now() + 15000;
  let loginVisible = 0;
  let profileVisible = 0;
  let backdropCount = 0;
  let bodyModalOpen = false;
  let profileDropdownVisible = false;
  const header = page.locator('header').first();
  while (Date.now() < settleDeadline) {
    loginVisible = await header.locator('.header-btn [data-bs-target="#login-modal"]:visible').count();
    profileVisible = await page.locator('.profile-dropdown').count();
    backdropCount = await page.locator('.modal-backdrop').count();
    bodyModalOpen = await page.evaluate(() => document.body.classList.contains('modal-open'));
    profileDropdownVisible = profileVisible > 0 && await page.locator('.profile-dropdown').first().isVisible().catch(() => false);
    if (loginVisible > 0 || profileDropdownVisible) {
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

async function logoutFromHomepage(page) {
  const dropdownToggle = page.locator('.profile-dropdown [data-bs-toggle="dropdown"]').first();
  await dropdownToggle.click();
  await page.locator('.profile-dropdown').getByRole('link', { name: 'Logout' }).click();
  const deadline = Date.now() + 30000;
  while (Date.now() < deadline) {
    if ((await page.locator('header').first().locator('.header-btn [data-bs-target="#login-modal"]:visible').count()) > 0) {
      return;
    }
    await page.waitForTimeout(250);
  }
  throw new Error('Timed out waiting for logged-out header after logout.');
}

async function runRole(page, role) {
  const result = {
    backToWebsiteOk: false,
    sessionPreserved: false,
    homepageSignedIn: false,
    homepagePath: '',
    logoutStillWorks: false,
  };

  await login(page, role.email, role.password, role.dashboardPath);
  await page.goto(`${BASE_URL}${role.dashboardPath}`, { waitUntil: 'domcontentloaded' });
  await page.locator('#loader-wrapper').waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
  const homepagePath = await clickBackToWebsite(page, role.backSelector);
  const homeState = await readHomeState(page);

  result.backToWebsiteOk = homepagePath === '/' || homepagePath === '/index';
  result.sessionPreserved = homeState.profileVisible > 0 && homeState.loginVisible === 0;
  result.homepageSignedIn = homeState.profileDropdownVisible && homeState.loginVisible === 0;
  result.homepagePath = homeState.path;

  await logoutFromHomepage(page);
  result.logoutStillWorks = (await readHomeState(page)).loginVisible > 0;

  return result;
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
  const errors = [];
  const context = await browser.newContext();
  const page = await context.newPage();
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (err) => errors.push(err.message));

  try {
    const customer = await runRole(page, {
      email: customerEmail,
      password: customerPassword,
      dashboardPath: '/user/dashboard',
      backSelector: '.user-sidebar a:has(.isax-arrow-left-2)',
    });

    const agent = await runRole(page, {
      email: agentEmail,
      password: agentPassword,
      dashboardPath: '/agent/agent-dashboard',
      backSelector: '.agent-sidebar .btn-outline-primary',
    });

    const admin = await runRole(page, {
      email: adminEmail,
      password: adminPassword,
      dashboardPath: '/admin/dashboard',
      backSelector: '.admin-sidebar .btn-outline-primary',
    });

    const success =
      customer.backToWebsiteOk &&
      customer.sessionPreserved &&
      customer.homepageSignedIn &&
      customer.logoutStillWorks &&
      agent.backToWebsiteOk &&
      agent.sessionPreserved &&
      agent.homepageSignedIn &&
      agent.logoutStillWorks &&
      admin.backToWebsiteOk &&
      admin.sessionPreserved &&
      admin.homepageSignedIn &&
      admin.logoutStillWorks &&
      errors.length === 0;

    console.log(JSON.stringify({
      success,
      customer,
      agent,
      admin,
      errors,
    }));
    process.exitCode = success ? 0 : 1;
  } catch (error) {
    console.log(JSON.stringify({
      success: false,
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
