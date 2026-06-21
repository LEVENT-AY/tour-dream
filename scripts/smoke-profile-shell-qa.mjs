import admin from 'firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { chromium } from 'playwright';
import { ensureDemoAccounts } from './ensure-demo-accounts.mjs';

const PROJECT_ID = 'tour-tunisi';
const BASE_URL = process.env.BASE_URL || 'http://localhost:5174';
const PNG_BUFFER = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y5f3e8AAAAASUVORK5CYII=',
  'base64'
);

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

async function verifyDemoAccount({ email, expectedRole }) {
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

  return {
    uid: user.uid,
    email,
    role: expectedRole,
    photoURL: profile.photoURL || '',
  };
}

async function login(page, email, password, targetPath) {
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
  await page.locator('#loader-wrapper').waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
  await page.getByPlaceholder('Enter Email').fill(email);
  await page.getByPlaceholder('Enter Password').fill(password);
  await page.getByRole('button', { name: /login|signing in/i }).click();
  await page.waitForURL((url) => url.toString().includes(targetPath), { timeout: 30000 });
  await page.locator('#loader-wrapper').waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
}

async function waitForPhotoUrlChange(db, uid, previousUrl) {
  const deadline = Date.now() + 30000;
  while (Date.now() < deadline) {
    const snap = await db.collection('users').doc(uid).get();
    const photoURL = snap.data()?.photoURL || '';
    if (photoURL && photoURL !== previousUrl) {
      return photoURL;
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`Timed out waiting for photoURL update for ${uid}.`);
}

async function restorePhotoUrl(db, uid, photoURL) {
  await db.collection('users').doc(uid).update({ photoURL: photoURL || '' });
}

async function readHomeState(page, waitForLoader = true) {
  if (waitForLoader) {
    await page.locator('#loader-wrapper').waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
  }
  const header = page.locator('header').first();
  return {
    loginVisible: await header.locator('.header-btn [data-bs-target="#login-modal"]:visible').count(),
    profileVisible: await page.locator('.profile-dropdown').count(),
    backdropCount: await page.locator('.modal-backdrop').count(),
    bodyModalOpen: await page.evaluate(() => document.body.classList.contains('modal-open')),
    footerCount: await page.locator('footer').count(),
    path: new URL(page.url()).pathname,
  };
}

async function waitForHomepageAuthState(page) {
  const deadline = Date.now() + 15000;
  let lastState = null;
  while (Date.now() < deadline) {
    lastState = await readHomeState(page);
    if (lastState.profileVisible > 0 || lastState.loginVisible > 0) {
      return lastState;
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Timed out waiting for homepage auth state to settle${lastState ? `: ${JSON.stringify(lastState)}` : ''}.`);
}

async function clickBackToWebsite(page, selector) {
  const link = page.locator(selector).first();
  await link.waitFor({ state: 'visible', timeout: 15000 });
  await link.scrollIntoViewIfNeeded().catch(() => {});
  await link.click({ force: true });
  await page.waitForURL((url) => url.pathname === '/' || url.pathname === '/index', { timeout: 30000 });
}

async function uploadProfilePhoto(page, inputSelector) {
  await page.locator(inputSelector).setInputFiles({
    name: 'profile-photo.png',
    mimeType: 'image/png',
    buffer: PNG_BUFFER,
  });
}

async function main() {
  const demoAdminEmail = requireEnv('DEMO_ADMIN_EMAIL');
  const demoAdminPassword = requireEnv('DEMO_ADMIN_PASSWORD');
  const demoCustomerEmail = requireEnv('DEMO_CUSTOMER_EMAIL');
  const demoCustomerPassword = requireEnv('DEMO_CUSTOMER_PASSWORD');

  await ensureDemoAccounts();
  const { db } = initAdminSdk();
  const [adminAccount, customerAccount] = await Promise.all([
    verifyDemoAccount({ email: demoAdminEmail, expectedRole: 'admin' }),
    verifyDemoAccount({ email: demoCustomerEmail, expectedRole: 'customer' }),
  ]);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  const errors = [];
  let adminOriginalPhotoURL = adminAccount.photoURL;
  let customerOriginalPhotoURL = customerAccount.photoURL;
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (err) => errors.push(err.message));

  let adminBadgeOk = false;
  let customerBadgeOk = false;
  let adminPhotoOk = false;
  let customerPhotoOk = false;
  let backToWebsiteOk = false;
  let logoutStillWorks = false;
  let homepageFlashGuard = false;

  try {
    await login(page, demoAdminEmail, demoAdminPassword, '/admin/dashboard');
    await page.goto(`${BASE_URL}/user/my-profile`, { waitUntil: 'domcontentloaded' });
    await page.waitForURL((url) => url.pathname === '/admin/dashboard', { timeout: 30000 });
    await page.locator('#loader-wrapper').waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
    const adminDashboardText = (await page.locator('body').textContent()) || '';
    if (!adminDashboardText.toLowerCase().includes('admin')) {
      throw new Error('Admin redirect did not land on the admin dashboard.');
    }
    adminBadgeOk = true;

    adminOriginalPhotoURL = adminAccount.photoURL;
    await page.goto(`${BASE_URL}/admin/dashboard`, { waitUntil: 'domcontentloaded' });
    await page.locator('#loader-wrapper').waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
    await page.locator('.admin-header .btn.btn-link').click();
    await uploadProfilePhoto(page, '.admin-header input[type="file"]');
    const adminPhotoURL = await waitForPhotoUrlChange(db, adminAccount.uid, adminOriginalPhotoURL);
    const adminAvatarSrc = await page.locator('.admin-header .avatar img').first().getAttribute('src');
    if (!adminAvatarSrc || !adminAvatarSrc.includes(adminPhotoURL)) {
      throw new Error('Admin avatar did not update after photo upload.');
    }
    if (!decodeURIComponent(adminPhotoURL).includes(`/users/${adminAccount.uid}/profile/`)) {
      throw new Error('Admin photo was not saved under the user-owned profile path.');
    }
    adminPhotoOk = true;

    await clickBackToWebsite(page, '.admin-sidebar .btn-outline-primary');
    const adminHomeTransition = await readHomeState(page, false);
    homepageFlashGuard = adminHomeTransition.footerCount === 0;
    await page.locator('#loader-wrapper').waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
    const adminHomeReady = await waitForHomepageAuthState(page);
    backToWebsiteOk = adminHomeReady.path === '/' || adminHomeReady.path === '/index';
    logoutStillWorks = adminHomeReady.backdropCount === 0 && adminHomeReady.bodyModalOpen === false;
    if (adminHomeReady.loginVisible > 0) {
      throw new Error('Admin homepage showed logged-out UI after Back to Website.');
    }
    if (adminHomeReady.profileVisible === 0) {
      throw new Error('Admin session was not preserved after Back to Website.');
    }

    await page.locator('.profile-dropdown [data-bs-toggle="dropdown"]').click();
    await page.locator('.profile-dropdown').getByRole('link', { name: 'Logout' }).click();
    await page.waitForURL((url) => url.pathname === '/' || url.pathname === '/index', { timeout: 30000 });
    const adminLoggedOutHome = await readHomeState(page);
    logoutStillWorks = logoutStillWorks && adminLoggedOutHome.loginVisible > 0 && adminLoggedOutHome.profileVisible === 0;

    await restorePhotoUrl(db, adminAccount.uid, adminOriginalPhotoURL);

    await login(page, demoCustomerEmail, demoCustomerPassword, '/user/dashboard');
    await page.goto(`${BASE_URL}/user/my-profile`, { waitUntil: 'domcontentloaded' });
    await page.waitForURL((url) => url.pathname === '/user/my-profile', { timeout: 30000 });
    await page.locator('#loader-wrapper').waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
    const customerProfileText = (await page.locator('body').textContent()) || '';
    if (customerProfileText.toLowerCase().includes('role missing')) {
      throw new Error('Customer profile showed a missing role state.');
    }
    customerBadgeOk = true;

    customerOriginalPhotoURL = customerAccount.photoURL;
    await page.goto(`${BASE_URL}/user/profile-settings`, { waitUntil: 'domcontentloaded' });
    await page.locator('#loader-wrapper').waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
    await uploadProfilePhoto(page, 'input[type="file"]');
    const customerPhotoURL = await waitForPhotoUrlChange(db, customerAccount.uid, customerOriginalPhotoURL);
    const customerAvatarSrc = await page.locator('.avatar-xxl img').first().getAttribute('src');
    if (!customerAvatarSrc || !customerAvatarSrc.includes(customerPhotoURL)) {
      throw new Error('Customer avatar did not update after photo upload.');
    }
    if (!decodeURIComponent(customerPhotoURL).includes(`/users/${customerAccount.uid}/profile/`)) {
      throw new Error('Customer photo was not saved under the user-owned profile path.');
    }
    customerPhotoOk = true;

    await clickBackToWebsite(page, '.user-sidebar .btn-outline-primary');
    const customerHomeTransition = await readHomeState(page, false);
    homepageFlashGuard = homepageFlashGuard && customerHomeTransition.footerCount === 0;
    await page.locator('#loader-wrapper').waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
    const customerHomeReady = await waitForHomepageAuthState(page);
    backToWebsiteOk = backToWebsiteOk && (customerHomeReady.path === '/' || customerHomeReady.path === '/index');
    logoutStillWorks = logoutStillWorks && customerHomeReady.backdropCount === 0 && customerHomeReady.bodyModalOpen === false;
    if (customerHomeReady.loginVisible > 0) {
      throw new Error('Customer homepage showed logged-out UI after Back to Website.');
    }
    if (customerHomeReady.profileVisible === 0) {
      throw new Error('Customer session was not preserved after Back to Website.');
    }

    await page.locator('.profile-dropdown [data-bs-toggle="dropdown"]').click();
    await page.locator('.profile-dropdown').getByRole('link', { name: 'Logout' }).click();
    await page.waitForURL((url) => url.pathname === '/' || url.pathname === '/index', { timeout: 30000 });
    const customerLoggedOutHome = await readHomeState(page);
    logoutStillWorks =
      logoutStillWorks &&
      customerLoggedOutHome.loginVisible > 0 &&
      customerLoggedOutHome.profileVisible === 0 &&
      customerLoggedOutHome.backdropCount === 0 &&
      customerLoggedOutHome.bodyModalOpen === false;

    await restorePhotoUrl(db, customerAccount.uid, customerOriginalPhotoURL);

    const success =
      adminBadgeOk &&
      customerBadgeOk &&
      adminPhotoOk &&
      customerPhotoOk &&
      backToWebsiteOk &&
      logoutStillWorks &&
      homepageFlashGuard &&
      errors.length === 0;

    console.log(JSON.stringify({
      success,
      adminBadgeOk,
      customerBadgeOk,
      adminPhotoOk,
      customerPhotoOk,
      backToWebsiteOk,
      logoutStillWorks,
      homepageFlashGuard,
      errors,
    }));
    process.exitCode = success ? 0 : 1;
  } catch (error) {
    console.log(JSON.stringify({
      success: false,
      adminBadgeOk,
      customerBadgeOk,
      adminPhotoOk,
      customerPhotoOk,
      backToWebsiteOk,
      logoutStillWorks,
      homepageFlashGuard,
      errors,
      reason: error.message || String(error),
    }));
    process.exitCode = 1;
  } finally {
    await Promise.allSettled([
      restorePhotoUrl(db, adminAccount.uid, adminOriginalPhotoURL),
      restorePhotoUrl(db, customerAccount.uid, customerOriginalPhotoURL),
    ]);
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
