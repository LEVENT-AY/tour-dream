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

async function login(page, email, password) {
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
  await page.locator('#loader-wrapper').waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
  await page.getByPlaceholder('Enter Email').fill(email);
  await page.getByPlaceholder('Enter Password').fill(password);
  await page.getByRole('button', { name: /login|signing in/i }).click();
  const deadline = Date.now() + 30000;
  while (Date.now() < deadline) {
    if (page.url().includes('/dashboard')) {
      break;
    }
    await page.waitForTimeout(250);
  }
}

async function verifyLoggedOutHomepage(page) {
  await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
  const footerCountDuringLoad = await page.locator('footer').count();
  await page.locator('#loader-wrapper').waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
  const header = page.locator('header').first();
  const settleDeadline = Date.now() + 15000;
  let loginVisible = 0;
  let profileVisible = 0;
  let backdropCount = 0;
  let bodyModalOpen = false;
  while (Date.now() < settleDeadline) {
    loginVisible = await header.locator('.header-btn [data-bs-target="#login-modal"]:visible').count();
    profileVisible = await page.locator('.profile-dropdown').count();
    backdropCount = await page.locator('.modal-backdrop').count();
    bodyModalOpen = await page.evaluate(() => document.body.classList.contains('modal-open'));
    if (loginVisible > 0 || profileVisible > 0) {
      break;
    }
    await page.waitForTimeout(250);
  }
  return {
    loginVisible,
    profileVisible,
    backdropCount,
    bodyModalOpen,
    footerCountDuringLoad,
  };
}

async function logoutFromDashboard(page, logoutSelector) {
  const logoutLink = page.locator(logoutSelector).first();
  await logoutLink.waitFor({ state: 'visible', timeout: 15000 });
  await logoutLink.scrollIntoViewIfNeeded().catch(() => {});
  await logoutLink.click({ force: true }).catch(() => {});
  const deadline = Date.now() + 30000;
  while (Date.now() < deadline) {
    const currentUrl = page.url();
    if (currentUrl.endsWith('/') || currentUrl.includes('/index')) {
      break;
    }
    await page.waitForTimeout(250);
  }
  await page.waitForTimeout(1000);
}

async function main() {
  const customerEmail = requireEnv('DEMO_CUSTOMER_EMAIL');
  const customerPassword = requireEnv('DEMO_CUSTOMER_PASSWORD');
  const agentEmail = requireEnv('DEMO_AGENT_EMAIL');
  const agentPassword = requireEnv('DEMO_AGENT_PASSWORD');
  const adminEmail = requireEnv('DEMO_ADMIN_EMAIL');
  const adminPassword = requireEnv('DEMO_ADMIN_PASSWORD');

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

  let customerLogoutOk = false;
  let agentLogoutOk = false;
  let adminLogoutOk = false;
  let homepageFlashGuard = false;

  try {
    await login(page, customerEmail, customerPassword);
    await page.goto(`${BASE_URL}/user/dashboard`, { waitUntil: 'domcontentloaded' });
    await page.locator('#loader-wrapper').waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
    await logoutFromDashboard(page, '.user-sidebar a:has(.isax-logout-15)');
    const customerHome = await verifyLoggedOutHomepage(page);
    customerLogoutOk =
      customerHome.loginVisible > 0 &&
      customerHome.profileVisible === 0 &&
      customerHome.backdropCount === 0 &&
      customerHome.bodyModalOpen === false;
    homepageFlashGuard = customerHome.footerCountDuringLoad === 0;

    await login(page, agentEmail, agentPassword);
    await page.goto(`${BASE_URL}/agent/agent-dashboard`, { waitUntil: 'domcontentloaded' });
    await page.locator('#loader-wrapper').waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
    await logoutFromDashboard(page, '.agent-sidebar .logout-link button');
    const agentHome = await verifyLoggedOutHomepage(page);
    agentLogoutOk =
      agentHome.loginVisible > 0 &&
      agentHome.profileVisible === 0 &&
      agentHome.backdropCount === 0 &&
      agentHome.bodyModalOpen === false;
    homepageFlashGuard = homepageFlashGuard && agentHome.footerCountDuringLoad === 0;

    await login(page, adminEmail, adminPassword);
    await page.goto(`${BASE_URL}/admin/dashboard`, { waitUntil: 'domcontentloaded' });
    await page.locator('#loader-wrapper').waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
    await page.locator('.admin-header .btn.btn-link').click();
    await logoutFromDashboard(page, '.admin-header .dropdown-item.d-flex');
    const adminHome = await verifyLoggedOutHomepage(page);
    adminLogoutOk =
      adminHome.loginVisible > 0 &&
      adminHome.profileVisible === 0 &&
      adminHome.backdropCount === 0 &&
      adminHome.bodyModalOpen === false;
    homepageFlashGuard = homepageFlashGuard && adminHome.footerCountDuringLoad === 0;

    const success = customerLogoutOk && agentLogoutOk && adminLogoutOk && homepageFlashGuard;
    console.log(JSON.stringify({
      success,
      customerLogoutOk,
      agentLogoutOk,
      adminLogoutOk,
      homepageFlashGuard,
      errors,
    }));
    process.exitCode = success ? 0 : 1;
  } catch (error) {
    console.log(JSON.stringify({
      success: false,
      customerLogoutOk,
      agentLogoutOk,
      adminLogoutOk,
      homepageFlashGuard,
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
