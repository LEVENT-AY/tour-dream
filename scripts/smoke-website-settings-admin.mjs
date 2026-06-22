import admin from 'firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { chromium } from 'playwright';
import { ensureDemoAccounts } from './ensure-demo-accounts.mjs';

const PROJECT_ID = 'tour-tunisi';
const BASE_URL = process.env.BASE_URL || 'http://localhost:5174';
const TEST_VALUE = `Website Settings smoke ${new Date().toISOString()}`;

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

async function verifyDemoAdmin(email) {
  const { auth, db } = initAdminSdk();
  const user = await auth.getUserByEmail(email);
  const profileSnap = await db.collection('users').doc(user.uid).get();
  if (!profileSnap.exists) {
    throw new Error('Missing Firestore profile for demo admin.');
  }
  const profile = profileSnap.data();
  if (profile.role !== 'admin' || user.customClaims?.role !== 'admin') {
    throw new Error('Demo admin role is invalid.');
  }
}

async function login(page, email, password) {
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
  await page.locator('#loader-wrapper').waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
  const loginCard = page.locator('.authentication-card');
  await loginCard.waitFor({ state: 'visible', timeout: 15000 });
  await loginCard.locator('input[placeholder="Enter Email"]').first().fill(email);
  await loginCard.locator('input[placeholder="Enter Password"]').first().fill(password);
  await loginCard.getByRole('button', { name: /login|signing in/i }).click();
  await page.waitForURL((url) => url.pathname === '/admin/dashboard', { timeout: 30000 });
}

async function waitForHomeShell(page) {
  await page.locator('#loader-wrapper').waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
  const settleDeadline = Date.now() + 15000;
  let loginVisible = 0;
  let profileVisible = 0;
  let profileDropdownVisible = false;
  while (Date.now() < settleDeadline) {
    const header = page.locator('header').first();
    loginVisible = await header.locator('.header-btn [data-bs-target="#login-modal"]:visible').count();
    profileVisible = await page.locator('.profile-dropdown').count();
    profileDropdownVisible = profileVisible > 0 && await page.locator('.profile-dropdown').first().isVisible().catch(() => false);
    if (loginVisible > 0 || profileDropdownVisible) {
      break;
    }
    await page.waitForTimeout(250);
  }
  return { loginVisible, profileVisible, profileDropdownVisible, path: new URL(page.url()).pathname };
}

async function main() {
  const adminEmail = requireEnv('DEMO_ADMIN_EMAIL');
  const adminPassword = requireEnv('DEMO_ADMIN_PASSWORD');

  await ensureDemoAccounts();
  await verifyDemoAdmin(adminEmail);

  const { db } = initAdminSdk();
  const settingsRef = db.collection('siteSettings').doc('homepage');
  const beforeSnap = await settingsRef.get();
  const beforeData = beforeSnap.exists ? beforeSnap.data() : {};
  const originalFooterText = typeof beforeData?.footerText === 'string' ? beforeData.footerText : '';

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  const errors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (err) => errors.push(err.message));

  let pageRendered = false;
  let saveWorked = false;
  let reloadKeptValue = false;
  let homepageLoaded = false;
  let canonicalHome = false;
  let authHydrated = false;

  try {
    await login(page, adminEmail, adminPassword);
    await page.goto(`${BASE_URL}/admin/settings`, { waitUntil: 'domcontentloaded' });
    await page.locator('h3:has-text("Website Control Center")').waitFor({ state: 'visible', timeout: 15000 });
    await page.locator('[data-testid="website-control-center"]').waitFor({ state: 'visible', timeout: 15000 });
    pageRendered = true;

    await page.locator('[data-testid="control-tab-footer"]').click();
    const footerInput = () => page.locator('div.card:has(h5:has-text("Footer copy & links")) textarea').first();
    await footerInput().fill(TEST_VALUE);
    await page.getByRole('button', { name: 'Save Settings' }).click();
    await page.getByText('Website Control Center saved successfully.').waitFor({ state: 'visible', timeout: 15000 });

    const savedSnap = await settingsRef.get();
    saveWorked = (savedSnap.data()?.footerText || '') === TEST_VALUE;

    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.locator('h3:has-text("Website Control Center")').waitFor({ state: 'visible', timeout: 15000 });
    await page.locator('[data-testid="control-tab-footer"]').click();
    await footerInput().waitFor({ state: 'visible', timeout: 15000 });
    await page.waitForTimeout(1000);
    const reloadedValue = await footerInput().inputValue();
    reloadKeptValue = reloadedValue === TEST_VALUE;

    await settingsRef.set({ footerText: originalFooterText }, { merge: true });
    await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
    await page.locator('#loader-wrapper').waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
    const homeState = await waitForHomeShell(page);
    homepageLoaded = homeState.path === '/';
    canonicalHome = homeState.path === '/';
    authHydrated = homeState.profileDropdownVisible && homeState.loginVisible === 0;

    const success = pageRendered && saveWorked && reloadKeptValue && homepageLoaded && canonicalHome && authHydrated && errors.length === 0;
    console.log(JSON.stringify({
      success,
      pageRendered,
      saveWorked,
      reloadKeptValue,
      homepageLoaded,
      canonicalHome,
      authHydrated,
      firestorePath: 'siteSettings/homepage',
      errors,
    }));
    process.exitCode = success ? 0 : 1;
  } catch (error) {
    try {
      await settingsRef.set({ footerText: originalFooterText }, { merge: true });
    } catch {}
    console.log(JSON.stringify({
      success: false,
      pageRendered,
      saveWorked,
      reloadKeptValue,
      homepageLoaded,
      canonicalHome,
      authHydrated,
      firestorePath: 'siteSettings/homepage',
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
