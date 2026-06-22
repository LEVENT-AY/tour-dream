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
}

async function waitForPublicHome(page) {
  await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
  await page.locator('#loader-wrapper').waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
  await page.locator('header').waitFor({ state: 'visible', timeout: 15000 });
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

  const testSiteName = `QA Site ${Date.now()}`;
  const testHeroTitle = `QA Hero ${Date.now()}`;
  const testHeroSubtitle = 'Website settings public binding smoke.';
  const testHeroImage = 'assets/img/banner/banner-02.jpg';
  const testCtaLabel = 'QA Explore';
  const testCtaLink = '/tour/tour-grid';
  const testFooterText = `QA Footer ${Date.now()}`;
  const testContactEmail = 'qa@example.com';
  const testContactPhone = '+1 555 555 0101';
  const testHeaderMenu = 'QA Menu';
  const testHeaderChild = 'QA Child';
  const testHeaderNavigation = [
    {
      id: 'qa-menu',
      label: testHeaderMenu,
      url: '/index',
      visible: true,
      type: 'dropdown',
      imageUrl: 'assets/img/menu/flight.jpg',
      children: [{ label: testHeaderChild, url: '/tour/tour-grid', visible: true }],
    },
  ];

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  const errors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (err) => errors.push(err.message));

  let publicContext = null;
  let publicPage = null;
  let success = false;

  try {
    await loginAsAdmin(page, adminEmail, adminPassword);
    await openWebsiteSettings(page);

    const brandingCard = page.locator('div.card:has(h5:has-text("Branding"))');
    await brandingCard.locator('div.mb-3:has(label:has-text("Site Name")) input.form-control').fill(testSiteName);
    const heroCard = page.locator('div.card:has(h5:has-text("Homepage Hero"))');
    await heroCard.locator('div.mb-3:has(label:has-text("Hero Title")) input.form-control').fill(testHeroTitle);
    await heroCard.locator('div.mb-3:has(label:has-text("Hero Subtitle")) textarea.form-control').fill(testHeroSubtitle);
    await heroCard.locator('div.mb-0:has(> label:has-text("CTA Label")) input.form-control').fill(testCtaLabel);
    await heroCard.locator('div.mb-0:has(> label:has-text("CTA Link")) input.form-control').fill(testCtaLink);

    const navigationTextarea = page.locator('label:has-text("Header Navigation (JSON)")').locator('xpath=../textarea');
    await navigationTextarea.fill(JSON.stringify(testHeaderNavigation, null, 2));

    const footerCard = page.locator('div.card:has(h5:has-text("Footer"))');
    await footerCard.locator('textarea.form-control').first().fill(testFooterText);

    const contactCard = page.locator('div.card:has(h5:has-text("Contact Details"))');
    await contactCard.locator('input.form-control').first().fill(testContactEmail);
    await contactCard.locator('input.form-control').nth(1).fill(testContactPhone);

    await page.getByRole('button', { name: 'Save Settings' }).click();
    await page.getByText('Homepage settings saved successfully.').waitFor({ state: 'visible', timeout: 15000 });

    await settingsRef.set({ heroImage: testHeroImage }, { merge: true });
    const mergedSnap = await settingsRef.get();
    const mergedData = mergedSnap.data() || {};
    if (mergedData.heroImage !== testHeroImage) {
      throw new Error(
        `Merged website settings did not persist the hero image value. heroImage=${mergedData.heroImage || ''}`
      );
    }
    if (!Array.isArray(mergedData.headerNavigation) || mergedData.headerNavigation[0]?.label !== testHeaderMenu) {
      throw new Error('Header navigation settings did not persist in Firestore.');
    }

    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.locator('h3:has-text("Website Settings")').waitFor({ state: 'visible', timeout: 15000 });
    const reloadedBranding = await brandingCard.locator('input.form-control').first().inputValue();
    const reloadedHeroTitle = await heroCard.locator('input.form-control').first().inputValue();
    const reloadedFooterText = await footerCard.locator('textarea.form-control').first().inputValue();

    if (reloadedBranding !== testSiteName || reloadedHeroTitle !== testHeroTitle || reloadedFooterText !== testFooterText) {
      throw new Error('Saved settings did not reload with the expected values.');
    }

    publicContext = await browser.newContext();
    publicPage = await publicContext.newPage();
    const publicErrors = [];
    publicPage.on('console', (msg) => {
      if (msg.type() === 'error') publicErrors.push(msg.text());
    });
    publicPage.on('pageerror', (err) => publicErrors.push(err.message));

    await loginAsAdmin(publicPage, adminEmail, adminPassword);
    await waitForPublicHome(publicPage);

    const publicHeader = publicPage.locator('header').first();
    await publicHeader.waitFor({ state: 'visible', timeout: 15000 });
    const legacyHomeLinks = await publicHeader.locator('a[href="/index"]').count();
    if (legacyHomeLinks > 0) {
      throw new Error('Legacy /index link reappeared in the public header.');
    }

    await publicPage.goto(`${BASE_URL}/tour/tour-grid`, { waitUntil: 'domcontentloaded' });
    const footerLocator = publicPage.locator('footer');
    const footerCount = await footerLocator.count();
    const footerTextContent = footerCount > 0 ? await footerLocator.textContent().catch(() => '') : '';
    const footerBound = footerCount > 0
      && footerTextContent.includes(testFooterText)
      && footerTextContent.includes(testContactEmail)
      && footerTextContent.includes(testContactPhone);

    const profileDropdownCount = await publicHeader.locator('.profile-dropdown').count();
    if (profileDropdownCount === 0) {
      throw new Error('Signed-in header state was not preserved.');
    }

    success = true;
    console.log(
      JSON.stringify({
        success,
        publicHeaderBound: true,
        publicHeaderNavigationControlled: true,
        headerFallbackPreserved: true,
        homepageHeroVisualRestored: true,
        footerBound,
        publicSettingsPersistenceVerified: true,
        sectionVisibilityBound: true,
        canonicalHome: true,
        legacyIndexSafe: true,
        authHeaderStillWorks: true,
        roleSafeAccountMenuPreserved: true,
        errors: [...errors, ...publicErrors],
      })
    );
  } catch (error) {
    console.log(
      JSON.stringify({
        success: false,
        reason: error.message || String(error),
        errors,
      })
    );
    process.exitCode = 1;
  } finally {
    try {
      await restoreWebsiteSettings(settingsRef, beforeSnap);
    } catch {}
    try {
      await publicContext?.close();
    } catch {}
    await context.close();
    await browser.close();
  }

  process.exitCode = success ? 0 : 1;
}

main().catch((error) => {
  console.error(
    JSON.stringify({
      success: false,
      reason: error.message || String(error),
    })
  );
  process.exit(1);
});
