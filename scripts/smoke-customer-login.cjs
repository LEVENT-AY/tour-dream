const admin = require('firebase-admin');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore } = require('firebase-admin/firestore');
const { chromium } = require('playwright');

const BASE_URL = process.env.BASE_URL || 'https://tour-tunisi.web.app';
const DISPLAY_NAME = process.env.SMOKE_CUSTOMER_NAME || 'Smoke Customer';
const PASSWORD = process.env.SMOKE_CUSTOMER_PASSWORD || 'SmokeCustomer123!';
const EMAIL = process.env.SMOKE_CUSTOMER_EMAIL || `smoke-customer-${Date.now()}@example.com`;

function initFirebase() {
  if (admin.getApps().length === 0) {
    admin.initializeApp({ projectId: 'tour-tunisi' });
  }
  return { auth: getAuth(), db: getFirestore() };
}

async function clearSession(page) {
  await page.goto(`${BASE_URL}/login`);
  await page.context().clearCookies();
  await page.evaluate(() => new Promise((resolve) => {
    const req = indexedDB.deleteDatabase('firebaseLocalStorageDb');
    req.onsuccess = resolve;
    req.onerror = resolve;
    req.onblocked = resolve;
    setTimeout(resolve, 1000);
  }));
}

async function main() {
  const { auth, db } = initFirebase();
  const browser = await chromium.launch({ headless: true });
  let user;
  let page;
  let tempCreated = false;
  let docCreated = false;
  let loginPassed = false;
  let finalUrl = '';
  let reason = 'not run';

  try {
    try {
      user = await auth.createUser({ email: EMAIL, password: PASSWORD });
      tempCreated = true;
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        user = await auth.getUserByEmail(EMAIL);
      } else {
        throw err;
      }
    }

    await auth.setCustomUserClaims(user.uid, { role: 'customer' });
    const profile = {
      uid: user.uid,
      email: EMAIL,
      displayName: DISPLAY_NAME,
      role: 'customer',
      createdAt: new Date().toISOString(),
      joinedAt: new Date().toISOString(),
    };
    await db.collection('users').doc(user.uid).set(profile);
    docCreated = true;

    const docSnap = await db.collection('users').doc(user.uid).get();
    const data = docSnap.data();
    const required = ['uid', 'email', 'displayName', 'role', 'createdAt', 'joinedAt'];
    const missing = required.filter((key) => !data || !(key in data));
    if (missing.length > 0) {
      throw new Error(`Missing required user fields: ${missing.join(', ')}`);
    }
    if (data.uid !== user.uid || data.email !== EMAIL || data.displayName !== DISPLAY_NAME || data.role !== 'customer') {
      throw new Error('User document fields do not match expected values');
    }

    const context = await browser.newContext();
    page = await context.newPage();
    await clearSession(page);

    await page.fill('input[type=email]', EMAIL);
    await page.fill('input[type=password]', PASSWORD);
    await page.click('button[type=submit]');
    let alertText = '';
    let successText = '';
    for (let i = 0; i < 15; i++) {
      alertText = await page.locator('.alert-danger').textContent().catch(() => '');
      successText = await page.locator('.alert-success').textContent().catch(() => '');
      if (page.url().includes('/user/dashboard') || successText) break;
      await page.waitForTimeout(1000);
    }
    if (!page.url().includes('/user/dashboard')) {
      await page.goto(`${BASE_URL}/user/dashboard`);
      await page.waitForTimeout(4000);
    }

    finalUrl = page.url();
    const body = (await page.textContent('body')) || '';
    loginPassed = finalUrl.includes('/user/dashboard') && /dashboard|recent bookings|customer dashboard basics/i.test(body);
    reason = loginPassed
      ? 'customer dashboard reached'
      : `final url: ${finalUrl}; alert: ${alertText || 'none'}; success: ${successText || 'none'}; body preview: ${body.slice(0, 200).replace(/\s+/g, ' ')}`;

    console.log(JSON.stringify({ EMAIL, uid: user.uid, finalUrl, loginPassed, reason }));

    if (!loginPassed) {
      process.exitCode = 1;
    }
  } catch (err) {
    finalUrl = page ? page.url() : '';
    reason = err && err.message ? err.message : String(err);
    console.log(JSON.stringify({ EMAIL, uid: user && user.uid, finalUrl, loginPassed: false, reason }));
    process.exitCode = 1;
  } finally {
    try {
      if (page) {
        await page.context().clearCookies();
      }
    } catch {}

    try {
      if (user) {
        await db.collection('users').doc(user.uid).delete();
      }
    } catch {}

    try {
      if (user) {
        await auth.deleteUser(user.uid);
      }
    } catch {}

    await browser.close();

    console.log(`Temp customer Auth created: ${tempCreated ? 'yes' : 'no'}`);
    console.log(`users/{uid} doc created: ${docCreated ? 'yes' : 'no'}`);
    console.log(`Required user fields present: ${docCreated ? 'yes' : 'no'}`);
    console.log(`Customer login smoke passed: ${loginPassed ? 'yes' : 'no'}`);
    console.log(`Final URL: ${finalUrl || 'unknown'}`);
    console.log(`Reason: ${reason}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
