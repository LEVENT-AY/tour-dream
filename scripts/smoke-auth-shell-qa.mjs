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

async function verifyDemoCustomer(email) {
  const { auth, db } = initAdminSdk();
  const user = await auth.getUserByEmail(email);
  const profileSnap = await db.collection('users').doc(user.uid).get();
  if (!profileSnap.exists) {
    throw new Error('Missing Firestore profile for demo customer.');
  }
  const profile = profileSnap.data();
  if (profile.role !== 'customer' || user.customClaims?.role !== 'customer') {
    throw new Error('Demo customer role is invalid.');
  }
}

async function readHomeState(page) {
  await page.locator('#loader-wrapper').waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
  const settleDeadline = Date.now() + 15000;
  let loginVisible = 0;
  let profileVisible = 0;
  let profileDropdownVisible = false;
  const header = page.locator('header').first();
  while (Date.now() < settleDeadline) {
    loginVisible = await header.locator('.header-btn [data-bs-target="#login-modal"]:visible').count();
    profileVisible = await page.locator('.profile-dropdown').count();
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
    backdropCount: await page.locator('.modal-backdrop').count(),
    bodyModalOpen: await page.evaluate(() => document.body.classList.contains('modal-open')),
  };
}

async function main() {
  const customerEmail = requireEnv('DEMO_CUSTOMER_EMAIL');
  const customerPassword = requireEnv('DEMO_CUSTOMER_PASSWORD');

  await ensureDemoAccounts();
  await verifyDemoCustomer(customerEmail);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  const errors = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (err) => errors.push(err.message));

  let loginSuccess = false;
  let homepageHeaderSynced = false;
  let dashboardClickable = false;
  let modalBackdropCleared = false;
  let bodyModalOpenCleared = false;
  let logoutReturnedToLoggedOutUi = false;
  let loginTriggerCount = 0;
  let profileDropdownCount = 0;

  try {
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
    await page.locator('#loader-wrapper').waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
    const loginCard = page.locator('.authentication-card');
    await loginCard.waitFor({ state: 'visible', timeout: 15000 });
    await loginCard.locator('input[placeholder="Enter Email"]').first().fill(customerEmail);
    await loginCard.locator('input[placeholder="Enter Password"]').first().fill(customerPassword);
    await loginCard.getByRole('button', { name: /login|signing in/i }).click();
    await page.waitForURL((url) => url.toString().includes('/user/dashboard'), { timeout: 30000 });
    await page.waitForTimeout(1000);

    loginSuccess = page.url().includes('/user/dashboard');

    modalBackdropCleared = await page.evaluate(() => document.querySelectorAll('.modal-backdrop').length === 0);
    bodyModalOpenCleared = await page.evaluate(() => !document.body.classList.contains('modal-open'));

    await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
    const settledHomeState = await readHomeState(page);
    const header = page.locator('header').first();
    loginTriggerCount = await header.locator('.header-btn [data-bs-target="#login-modal"]:visible').count();
    profileDropdownCount = await page.locator('.profile-dropdown').count();
    const profileDropdownVisible = profileDropdownCount > 0 && await page.locator('.profile-dropdown').first().isVisible().catch(() => false);
    homepageHeaderSynced = loginTriggerCount === 0 && profileDropdownVisible && settledHomeState.profileDropdownVisible;

    await page.locator('.profile-dropdown [data-bs-toggle="dropdown"]').click();
    await page.locator('.profile-dropdown').getByRole('link', { name: 'Dashboard' }).click();
    await page.waitForURL((url) => url.toString().includes('/user/dashboard'), { timeout: 30000 });
    dashboardClickable = page.url().includes('/user/dashboard');

    await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
    await readHomeState(page);
    await page.locator('.profile-dropdown [data-bs-toggle="dropdown"]').click();
    await page.locator('.profile-dropdown').getByRole('link', { name: 'Logout' }).click();
    await page.waitForURL((url) => url.pathname === '/', { timeout: 30000 });

    logoutReturnedToLoggedOutUi =
      (await header.locator('.header-btn [data-bs-target="#login-modal"]:visible').count()) > 0 &&
      !(await page.locator('.profile-dropdown').isVisible().catch(() => false));

    const success =
      loginSuccess &&
      homepageHeaderSynced &&
      dashboardClickable &&
      modalBackdropCleared &&
      bodyModalOpenCleared &&
      logoutReturnedToLoggedOutUi;

    console.log(JSON.stringify({
      success,
      loginSuccess,
      homepageHeaderSynced,
      dashboardClickable,
      modalBackdropCleared,
      bodyModalOpenCleared,
      logoutReturnedToLoggedOutUi,
      loginTriggerCount,
      profileDropdownCount,
      errors,
    }));

    process.exitCode = success ? 0 : 1;
  } catch (error) {
    console.log(JSON.stringify({
      success: false,
      loginSuccess,
      homepageHeaderSynced,
      dashboardClickable,
      modalBackdropCleared,
      bodyModalOpenCleared,
      logoutReturnedToLoggedOutUi,
      loginTriggerCount,
      profileDropdownCount,
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
