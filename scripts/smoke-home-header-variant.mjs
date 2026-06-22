import admin from 'firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { chromium } from 'playwright';
import { ensureDemoAccounts } from './ensure-demo-accounts.mjs';

const PROJECT_ID = 'tour-tunisi';
const BASE_URL = process.env.BASE_URL || 'http://localhost:5174';
const TARGET_HOME_ROUTE = '/index-3';
const TARGET_HOME_LABEL = 'All Services 3';
const TARGET_HOME_MARKER_SELECTOR = 'a[data-bs-target="#Guide"]';
const TARGET_HEADER_VARIANT = 'shared-four-family';
const TARGET_HEADER_SELECTOR = 'div.main-header-four';
const LOCAL_TEMPLATE_ROUTE = '/index-10';

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

async function waitForHomePage(page, route, markerSelector, headerSelector) {
  await page.goto(`${BASE_URL}${route}`, { waitUntil: 'domcontentloaded' });
  await page.locator('#loader-wrapper').waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
  const header = page.locator(headerSelector).first();
  await header.waitFor({ state: 'visible', timeout: 15000 });
  await page.locator(markerSelector).first().waitFor({ state: 'visible', timeout: 30000 });
  return {
    path: new URL(page.url()).pathname,
    headerClass: await header.getAttribute('class'),
  };
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
  let homeCardsVisible = false;
  let sharedCardBadgesVisible = false;
  let localCardBadgesVisible = false;
  let localSelectorDisabled = false;
  let saveWorked = false;
  let reloadKeptValue = false;
  let rootMarkerVisible = false;
  let directPreviewMarkerVisible = false;
  let rootHeaderVariantApplied = false;
  let directPreviewVariantApplied = false;
  let publicPreviewLinksHidden = false;

  try {
    await loginAsAdmin(page, adminEmail, adminPassword);
    await openWebsiteSettings(page);
    controlCenterVisible = true;

    await page.locator('[data-testid="control-tab-templates"]').click();
    const homeSelector = page.locator('[data-testid="active-home-template-selector"]');
    await homeSelector.waitFor({ state: 'visible', timeout: 15000 });
    homeCardsVisible = (await homeSelector.locator('.col-12.col-xl-4').count()) === 12;

    const sharedCard = homeSelector.locator('.col-12.col-xl-4').filter({ hasText: TARGET_HOME_ROUTE }).first();
    const localCard = homeSelector.locator('.col-12.col-xl-4').filter({ hasText: LOCAL_TEMPLATE_ROUTE }).first();
    sharedCardBadgesVisible =
      (await sharedCard.getByText('Shared Header', { exact: false }).count()) > 0 &&
      (await sharedCard.getByText('Global Menu', { exact: false }).count()) > 0 &&
      (await sharedCard.getByText('Safe', { exact: false }).count()) > 0;
    localCardBadgesVisible =
      (await localCard.getByText('Local Template Header', { exact: false }).count()) > 0 &&
      (await localCard.getByText('Template-only', { exact: false }).count()) > 0;

    const localSelect = localCard.locator('select.form-select-sm').first();
    localSelectorDisabled = await localSelect.isDisabled();

    const activeHomeCard = homeSelector.locator('.col-12.col-xl-4').filter({ hasText: TARGET_HOME_LABEL }).first();
    const activeHomeButton = activeHomeCard.getByRole('button', { name: /Make Active|Selected/i }).first();
    const activeHomeButtonLabel = (await activeHomeButton.textContent())?.trim() || '';
    if (activeHomeButtonLabel !== 'Selected') {
      await activeHomeButton.click();
    }
    const homeSelect = activeHomeCard.locator('select.form-select-sm').first();
    await homeSelect.selectOption(TARGET_HEADER_VARIANT);

    await page.getByRole('button', { name: 'Save Settings' }).click();
    await page.getByText('Website Control Center saved successfully.').waitFor({ state: 'visible', timeout: 15000 });

    const savedSnap = await settingsRef.get();
    const savedData = savedSnap.data() || {};
    saveWorked =
      (savedData.publicTemplates?.home || '') === TARGET_HOME_ROUTE &&
      (savedData.headerVariantOverrides?.[TARGET_HOME_ROUTE] || '') === TARGET_HEADER_VARIANT;

    await page.reload({ waitUntil: 'domcontentloaded' });
    await openWebsiteSettings(page);
    await page.locator('[data-testid="control-tab-templates"]').click();
    await homeSelector.waitFor({ state: 'visible', timeout: 15000 });
    const reloadedHomeSelect = homeSelector.locator('.col-12.col-xl-4').filter({ hasText: TARGET_HOME_LABEL }).first().locator('select.form-select-sm').first();
    reloadKeptValue = (await reloadedHomeSelect.inputValue()) === TARGET_HEADER_VARIANT;

    const rootState = await waitForHomePage(page, '/', TARGET_HOME_MARKER_SELECTOR, TARGET_HEADER_SELECTOR);
    rootMarkerVisible = rootState.path === '/';
    rootHeaderVariantApplied = typeof rootState.headerClass === 'string' && rootState.headerClass.includes('main-header-four');

    const previewState = await waitForHomePage(page, TARGET_HOME_ROUTE, TARGET_HOME_MARKER_SELECTOR, TARGET_HEADER_SELECTOR);
    directPreviewMarkerVisible = previewState.path === TARGET_HOME_ROUTE;
    directPreviewVariantApplied = typeof previewState.headerClass === 'string' && previewState.headerClass.includes('main-header-four');

    await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
    await page.locator('#loader-wrapper').waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
    await page.locator('header').waitFor({ state: 'visible', timeout: 15000 });
    const publicHeader = page.locator('header').first();
    const publicPreviewCount = await publicHeader.locator('a[href="/index-2"], a[href="/index-3"], a[href="/index-4"], a[href="/index-10"], a[href="/index-12"]').count();
    publicPreviewLinksHidden = publicPreviewCount === 0;

    const success =
      controlCenterVisible &&
      homeCardsVisible &&
      sharedCardBadgesVisible &&
      localCardBadgesVisible &&
      localSelectorDisabled &&
      saveWorked &&
      reloadKeptValue &&
      rootMarkerVisible &&
      directPreviewMarkerVisible &&
      rootHeaderVariantApplied &&
      directPreviewVariantApplied &&
      publicPreviewLinksHidden &&
      errors.length === 0;

    console.log(JSON.stringify({
      success,
      controlCenterVisible,
      homeCardsVisible,
      sharedCardBadgesVisible,
      localCardBadgesVisible,
      localSelectorDisabled,
      saveWorked,
      reloadKeptValue,
      rootMarkerVisible,
      directPreviewMarkerVisible,
      rootHeaderVariantApplied,
      directPreviewVariantApplied,
      publicPreviewLinksHidden,
      firestorePath: 'siteSettings/homepage',
      errors,
    }));
    process.exitCode = success ? 0 : 1;
  } catch (error) {
    console.log(JSON.stringify({
      success: false,
      controlCenterVisible,
      homeCardsVisible,
      sharedCardBadgesVisible,
      localCardBadgesVisible,
      localSelectorDisabled,
      saveWorked,
      reloadKeptValue,
      rootMarkerVisible,
      directPreviewMarkerVisible,
      rootHeaderVariantApplied,
      directPreviewVariantApplied,
      publicPreviewLinksHidden,
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
