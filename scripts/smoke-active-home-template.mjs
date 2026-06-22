import admin from 'firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { chromium } from 'playwright';
import { ensureDemoAccounts } from './ensure-demo-accounts.mjs';

const PROJECT_ID = 'tour-tunisi';
const BASE_URL = process.env.BASE_URL || 'http://localhost:5174';
const TEST_ROUTE = '/index-10';
const TEST_LABEL = 'Guide';
const TEST_MARKER = 'Explore All Guides';
const PREVIEW_ROUTE = '/index-3';

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
  await page.locator('h3:has-text("Website Control Center")').waitFor({ state: 'visible', timeout: 15000 });
  await page.locator('[data-testid="website-control-center"]').waitFor({ state: 'visible', timeout: 15000 });
}

async function restoreWebsiteSettings(settingsRef, snapshot) {
  if (snapshot.exists) {
    await settingsRef.set(snapshot.data());
    return;
  }
  await settingsRef.delete();
}

async function waitForHomeMarker(page, path, markerText) {
  await page.goto(`${BASE_URL}${path}`, { waitUntil: 'domcontentloaded' });
  await page.locator('#loader-wrapper').waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
  await page.getByText(markerText, { exact: false }).first().waitFor({ state: 'visible', timeout: 30000 });
  return new URL(page.url()).pathname;
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

  let selectorVisible = false;
  let saveWorked = false;
  let reloadKeptValue = false;
  let canonicalHomeRendered = false;
  let directPreviewRouteWorked = false;
  let publicHeaderCollapsed = false;
  let allHomeCardsVisible = false;
  let allPreviewLinksPresent = false;
  let previewRouteAccessible = false;

  try {
    await loginAsAdmin(page, adminEmail, adminPassword);
    await openWebsiteSettings(page);
    await page.locator('[data-testid="control-tab-templates"]').click();
    await page.locator('[data-testid="active-home-template-selector"]').waitFor({ state: 'visible', timeout: 15000 });
    selectorVisible = true;

    const activeHomeCard = page.locator('[data-testid="active-home-template-selector"]');
    allHomeCardsVisible = (await activeHomeCard.locator('.col-12.col-xl-4').count()) === 12;
    allPreviewLinksPresent = (await activeHomeCard.locator('a.btn.btn-sm.btn-light.border').count()) === 12;
    const targetButton = activeHomeCard.locator('.col-12.col-xl-4').filter({ hasText: TEST_LABEL }).locator('button').first();
    await targetButton.click();
    await page.getByRole('button', { name: 'Save Settings' }).click();
    await page.getByText('Website Control Center saved successfully.').waitFor({ state: 'visible', timeout: 15000 });

    const savedSnap = await settingsRef.get();
    saveWorked = (savedSnap.data()?.publicTemplates?.home || '') === TEST_ROUTE;

    await page.reload({ waitUntil: 'domcontentloaded' });
    await openWebsiteSettings(page);
    await page.locator('[data-testid="control-tab-templates"]').click();
    await page.locator('[data-testid="active-home-template-selector"]').waitFor({ state: 'visible', timeout: 15000 });
    const selectedCard = page.locator('[data-testid="active-home-template-selector"] .col-12.col-xl-4').filter({ hasText: TEST_LABEL });
    reloadKeptValue = await selectedCard.getByText('Active now', { exact: false }).first().isVisible();

    const canonicalPath = await waitForHomeMarker(page, '/', TEST_MARKER);
    canonicalHomeRendered = canonicalPath === '/';

    const directPreviewPath = await waitForHomeMarker(page, TEST_ROUTE, TEST_MARKER);
    directPreviewRouteWorked = directPreviewPath === TEST_ROUTE;

    await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
    await page.locator('header').first().waitFor({ state: 'visible', timeout: 15000 });
    const publicPreviewLinks = await page.locator('header a[href="/index-2"], header a[href="/index-3"]').count();
    publicHeaderCollapsed = publicPreviewLinks === 0;

    await page.goto(`${BASE_URL}${PREVIEW_ROUTE}`, { waitUntil: 'domcontentloaded' });
    await page.locator('#loader-wrapper').waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
    const previewPath = new URL(page.url()).pathname;
    previewRouteAccessible = previewPath === PREVIEW_ROUTE && (await page.locator('body').innerText()).length > 0;

    const success =
      selectorVisible &&
      allHomeCardsVisible &&
      allPreviewLinksPresent &&
      saveWorked &&
      reloadKeptValue &&
      canonicalHomeRendered &&
      directPreviewRouteWorked &&
      publicHeaderCollapsed &&
      previewRouteAccessible &&
      errors.length === 0;

    console.log(JSON.stringify({
      success,
      selectorVisible,
      allHomeCardsVisible,
      allPreviewLinksPresent,
      saveWorked,
      reloadKeptValue,
      canonicalHomeRendered,
      directPreviewRouteWorked,
      publicHeaderCollapsed,
      previewRouteAccessible,
      savedRoute: TEST_ROUTE,
      errors,
    }));
    process.exitCode = success ? 0 : 1;
  } catch (error) {
    console.log(JSON.stringify({
      success: false,
      selectorVisible,
      allHomeCardsVisible,
      allPreviewLinksPresent,
      saveWorked,
      reloadKeptValue,
      canonicalHomeRendered,
      directPreviewRouteWorked,
      publicHeaderCollapsed,
      previewRouteAccessible,
      savedRoute: TEST_ROUTE,
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
