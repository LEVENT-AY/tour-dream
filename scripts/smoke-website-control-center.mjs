import admin from 'firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { chromium } from 'playwright';
import { ensureDemoAccounts } from './ensure-demo-accounts.mjs';

const PROJECT_ID = 'tour-tunisi';
const BASE_URL = process.env.BASE_URL || 'http://localhost:5174';
const TEST_SITE_NAME = `Website Control Center ${Date.now()}`;

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

async function loginAsAdmin(page, email, password) {
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
  await page.locator('#loader-wrapper').waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
  const loginCard = page.locator('.authentication-card');
  await loginCard.waitFor({ state: 'visible', timeout: 15000 });
  await loginCard.locator('input[placeholder="Enter Email"]').first().fill(email);
  await loginCard.locator('input[placeholder="Enter Password"]').first().fill(password);
  await loginCard.getByRole('button', { name: /login|signing in/i }).click();
  await page.waitForURL((url) => url.pathname === '/admin/dashboard', { timeout: 30000 });
}

async function openWebsiteSettings(page) {
  await page.goto(`${BASE_URL}/admin/settings`, { waitUntil: 'domcontentloaded' });
  await page.locator('h3:has-text("Website Settings")').waitFor({ state: 'visible', timeout: 15000 });
  await page.locator('[data-testid="website-control-center"]').waitFor({ state: 'visible', timeout: 15000 });
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

async function restoreWebsiteSettings(settingsRef, snapshot) {
  if (snapshot.exists) {
    await settingsRef.set(snapshot.data());
    return;
  }
  await settingsRef.delete();
}

async function main() {
  const adminEmail = requireEnv('DEMO_ADMIN_EMAIL');
  const adminPassword = requireEnv('DEMO_ADMIN_PASSWORD');

  await ensureDemoAccounts();
  await verifyDemoAdmin(adminEmail);

  const { db } = initAdminSdk();
  const settingsRef = db.collection('siteSettings').doc('homepage');
  const beforeSnap = await settingsRef.get();

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  const errors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (err) => errors.push(err.message));

  let controlCenterVisible = false;
  let templateControlsVisible = false;
  let headerEditorVisible = false;
  let saveWorked = false;
  let reloadKeptValue = false;
  let homepageLoaded = false;
  let canonicalHome = false;
  let navigationShellOk = false;

  try {
    await loginAsAdmin(page, adminEmail, adminPassword);
    await openWebsiteSettings(page);
    controlCenterVisible = await page.locator('[data-testid="website-control-center"]').isVisible();

    await page.getByRole('button', { name: 'Templates & Layouts' }).click();
    await page.locator('[data-testid="template-selection-controls"]').waitFor({ state: 'visible', timeout: 15000 });
    templateControlsVisible = true;

    await page.getByRole('button', { name: 'Header Navigation' }).click();
    await page.locator('[data-testid="header-nav-editor"]').waitFor({ state: 'visible', timeout: 15000 });
    headerEditorVisible = true;

    await page.getByRole('button', { name: 'Branding & Contact' }).click();
    const siteNameInput = page.locator('div.card:has(h5:has-text("Branding")) input.form-control').first();
    await siteNameInput.fill(TEST_SITE_NAME);
    await page.getByRole('button', { name: 'Save Settings' }).click();
    await page.getByText('Website Control Center saved successfully.').waitFor({ state: 'visible', timeout: 15000 });

    const savedSnap = await settingsRef.get();
    saveWorked = (savedSnap.data()?.siteName || '') === TEST_SITE_NAME;

    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.locator('h3:has-text("Website Settings")').waitFor({ state: 'visible', timeout: 15000 });
    await page.getByRole('button', { name: 'Branding & Contact' }).click();
    reloadKeptValue = (await siteNameInput.inputValue()) === TEST_SITE_NAME;

    await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
    const homeState = await waitForHomeShell(page);
    homepageLoaded = homeState.path === '/';
    canonicalHome = homeState.path === '/';
    navigationShellOk = homeState.profileDropdownVisible && homeState.loginVisible === 0;

    const success =
      controlCenterVisible &&
      templateControlsVisible &&
      headerEditorVisible &&
      saveWorked &&
      reloadKeptValue &&
      homepageLoaded &&
      canonicalHome &&
      navigationShellOk &&
      errors.length === 0;

    console.log(JSON.stringify({
      success,
      controlCenterVisible,
      templateControlsVisible,
      headerEditorVisible,
      saveWorked,
      reloadKeptValue,
      homepageLoaded,
      canonicalHome,
      navigationShellOk,
      firestorePath: 'siteSettings/homepage',
      errors,
    }));
    process.exitCode = success ? 0 : 1;
  } catch (error) {
    console.log(JSON.stringify({
      success: false,
      controlCenterVisible,
      templateControlsVisible,
      headerEditorVisible,
      saveWorked,
      reloadKeptValue,
      homepageLoaded,
      canonicalHome,
      navigationShellOk,
      firestorePath: 'siteSettings/homepage',
      errors,
      reason: error.message || String(error),
    }));
    process.exitCode = 1;
  } finally {
    try {
      await restoreWebsiteSettings(settingsRef, beforeSnap);
    } catch {}
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
