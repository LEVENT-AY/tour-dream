const admin = require('firebase-admin');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore } = require('firebase-admin/firestore');
const { chromium } = require('playwright');

const BASE_URL = process.env.BASE_URL || 'https://tour-tunisi.web.app';
const CUSTOMER_EMAIL = process.env.SMOKE_CUSTOMER_EMAIL || `smoke-admin-booking-${Date.now()}@example.com`;
const CUSTOMER_PASSWORD = process.env.SMOKE_CUSTOMER_PASSWORD || 'SmokeBooking123!';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'manager.emtilek@gmail.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'ChangeMe123!';

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

async function login(page, email, password) {
  await page.goto(`${BASE_URL}/login`);
  await page.fill('input[type=email]', email);
  await page.fill('input[type=password]', password);
  await page.click('button[type=submit]');
  await page.waitForTimeout(4000);
}

async function main() {
  const { auth, db } = initFirebase();
  const browser = await chromium.launch({ headless: true });
  let user;
  let bookingRef;
  let topLevelBookingRef;
  let bookingId = '';
  let adminSawBooking = false;
  let confirmed = false;
  let cancelled = false;
  let customerSawStatus = false;
  let topLevelCreated = false;
  let mirroredConfirmed = false;
  let mirroredCancelled = false;
  let adminUrl = '';
  let adminBody = '';
  const errors = [];

  try {
    try {
      user = await auth.createUser({ email: CUSTOMER_EMAIL, password: CUSTOMER_PASSWORD });
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        user = await auth.getUserByEmail(CUSTOMER_EMAIL);
      } else {
        throw err;
      }
    }

    await auth.setCustomUserClaims(user.uid, { role: 'customer' });
    await db.collection('users').doc(user.uid).set({
      uid: user.uid,
      email: CUSTOMER_EMAIL,
      displayName: 'Smoke Booking Customer',
      role: 'customer',
      createdAt: new Date().toISOString(),
      joinedAt: new Date().toISOString(),
    });

    bookingRef = db.collection('users').doc(user.uid).collection('bookings').doc();
    bookingId = bookingRef.id;
    topLevelBookingRef = db.collection('bookings').doc(bookingId);
    const bookingPayload = {
      bookingId,
      userId: user.uid,
      customerId: user.uid,
      customerName: 'Smoke Booking Customer',
      customerEmail: CUSTOMER_EMAIL,
      customerPhone: '+0000000000',
      agentId: null,
      ownerId: null,
      listingOwnerId: null,
      title: 'Hotel Plaza Athenee',
      name: 'Hotel Plaza Athenee',
      listingId: 'hotel-plaza-athenee',
      listingType: 'hotel',
      itemId: 'hotel-plaza-athenee',
      itemTitle: 'Hotel Plaza Athenee',
      itemType: 'hotel',
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await bookingRef.set(bookingPayload);
    await topLevelBookingRef.set(bookingPayload);
    topLevelCreated = (await topLevelBookingRef.get()).exists;

    const customerContext = await browser.newContext();
    const page = await customerContext.newPage();
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    page.on('pageerror', (err) => errors.push(err.message));
    await login(page, CUSTOMER_EMAIL, CUSTOMER_PASSWORD);
    await page.goto(`${BASE_URL}/user/customer-hotel-booking`);
    await page.waitForTimeout(2000);

    const adminContext = await browser.newContext();
    const adminPage = await adminContext.newPage();
    adminPage.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    adminPage.on('pageerror', (err) => errors.push(err.message));
    await login(adminPage, ADMIN_EMAIL, ADMIN_PASSWORD);
    await adminPage.goto(`${BASE_URL}/admin/dashboard`);
    await adminPage.waitForTimeout(4000);
    await adminPage.goto(`${BASE_URL}/admin/bookings`);
    await adminPage.waitForTimeout(8000);
    adminUrl = adminPage.url();
    adminBody = (await adminPage.textContent('body')) || '';

    const row = adminPage.locator('tr', { hasText: 'Hotel Plaza Athenee' }).filter({ hasText: CUSTOMER_EMAIL }).first();
    await row.waitFor({ state: 'visible', timeout: 20000 });
    adminSawBooking = true;

    await row.getByRole('button', { name: 'Confirm' }).click();
    await adminPage.waitForTimeout(2500);
    const afterConfirm = await bookingRef.get();
    const topAfterConfirm = await topLevelBookingRef.get();
    confirmed = afterConfirm.exists && afterConfirm.data().status === 'confirmed';
    mirroredConfirmed = topAfterConfirm.exists && topAfterConfirm.data().status === 'confirmed' && confirmed;

    const customerContext2 = await browser.newContext();
    const customerPage2 = await customerContext2.newPage();
    await login(customerPage2, CUSTOMER_EMAIL, CUSTOMER_PASSWORD);
    await customerPage2.goto(`${BASE_URL}/user/customer-hotel-booking`);
    await customerPage2.waitForTimeout(3000);
    const confirmedBody = (await customerPage2.textContent('body')) || '';
    customerSawStatus = /confirmed/i.test(confirmedBody);

    const adminContext2 = await browser.newContext();
    const adminPage2 = await adminContext2.newPage();
    await login(adminPage2, ADMIN_EMAIL, ADMIN_PASSWORD);
    await adminPage2.goto(`${BASE_URL}/admin/dashboard`);
    await adminPage2.waitForTimeout(4000);
    await adminPage2.goto(`${BASE_URL}/admin/bookings`);
    await adminPage2.waitForTimeout(8000);
    const row2 = adminPage2.locator('tr', { hasText: 'Hotel Plaza Athenee' }).filter({ hasText: CUSTOMER_EMAIL }).first();
    await row2.waitFor({ state: 'visible', timeout: 20000 });
    await row2.getByRole('button', { name: 'Cancel' }).click();
    await adminPage2.waitForTimeout(2500);
    const afterCancel = await bookingRef.get();
    const topAfterCancel = await topLevelBookingRef.get();
    cancelled = afterCancel.exists && afterCancel.data().status === 'cancelled';
    mirroredCancelled = topAfterCancel.exists && topAfterCancel.data().status === 'cancelled' && cancelled;

    console.log(JSON.stringify({ adminSawBooking, topLevelCreated, confirmed, mirroredConfirmed, customerSawStatus, cancelled, mirroredCancelled, adminUrl, adminBodyPreview: adminBody.slice(0, 200).replace(/\s+/g, ' '), errors }));
    process.exitCode = adminSawBooking && topLevelCreated && confirmed && mirroredConfirmed && customerSawStatus && cancelled && mirroredCancelled ? 0 : 1;
  } catch (err) {
    console.log(JSON.stringify({ adminSawBooking, topLevelCreated, confirmed, mirroredConfirmed, customerSawStatus, cancelled, mirroredCancelled, adminUrl, adminBodyPreview: adminBody.slice(0, 200).replace(/\s+/g, ' '), errors, reason: err.message || String(err) }));
    process.exitCode = 1;
  } finally {
    try {
      const sub = db.collection('users').doc(user.uid).collection('bookings');
      const snap = await sub.get();
      for (const doc of snap.docs) await doc.ref.delete();
      if (bookingId) await db.collection('bookings').doc(bookingId).delete();
      await db.collection('users').doc(user.uid).delete();
    } catch {}

    try {
      await auth.deleteUser(user.uid);
    } catch {}

    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
