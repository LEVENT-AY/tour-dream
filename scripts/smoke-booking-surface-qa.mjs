import admin from 'firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { chromium } from 'playwright';
import { createTemporaryApprovedAgent } from './agentListingVerification.mjs';
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

async function createTempCustomer() {
  const { auth, db } = initAdminSdk();
  const email = `temp.booking.qa.customer.${Date.now()}@example.com`;
  const password = 'TempBookingQa123!';
  const user = await auth.createUser({ email, password, displayName: 'Temp Booking QA Customer' });
  await auth.setCustomUserClaims(user.uid, { role: 'customer' });
  const now = new Date().toISOString();
  await db.collection('users').doc(user.uid).set({
    uid: user.uid,
    email,
    displayName: 'Temp Booking QA Customer',
    role: 'customer',
    createdAt: now,
    joinedAt: now,
  });
  return { uid: user.uid, email, password };
}

async function verifyDemoProfile(email, expectedRole, approvedAgent = false) {
  const { auth, db } = initAdminSdk();
  const user = await auth.getUserByEmail(email);
  const profileSnap = await db.collection('users').doc(user.uid).get();
  if (!profileSnap.exists) {
    throw new Error(`Missing Firestore profile for demo ${expectedRole}.`);
  }
  const profile = profileSnap.data();
  if (profile.role !== expectedRole || user.customClaims?.role !== expectedRole) {
    throw new Error(`Role mismatch for demo ${expectedRole}.`);
  }
  if (approvedAgent && (profile.agentStatus !== 'approved' || profile.approved !== true)) {
    throw new Error('Demo agent is not approved.');
  }
}

async function loginAndWait(page, email, password, expectedUrlPart) {
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
  await page.locator('#loader-wrapper').waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
  await page.getByPlaceholder('Enter Email').fill(email);
  await page.getByPlaceholder('Enter Password').fill(password);
  await page.getByRole('button', { name: /login|signing in/i }).click();
  await page.waitForURL((url) => url.toString().includes(expectedUrlPart), { timeout: 30000 });
  await page.locator('#loader-wrapper').waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(2500);
}

async function verifyDemoLogin(browser, email, password, expectedUrlPart) {
  const context = await browser.newContext();
  const page = await context.newPage();
  const errors = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (err) => errors.push(err.message));

  try {
    await loginAndWait(page, email, password, expectedUrlPart);
    return {
      success: page.url().includes(expectedUrlPart),
      errors,
    };
  } finally {
    await context.close();
  }
}

async function readBody(page) {
  return (await page.textContent('body')) || '';
}

async function main() {
  const demoAdminEmail = requireEnv('DEMO_ADMIN_EMAIL');
  const demoAdminPassword = requireEnv('DEMO_ADMIN_PASSWORD');
  const demoAgentEmail = requireEnv('DEMO_AGENT_EMAIL');
  const demoAgentPassword = requireEnv('DEMO_AGENT_PASSWORD');
  const demoCustomerEmail = requireEnv('DEMO_CUSTOMER_EMAIL');
  const demoCustomerPassword = requireEnv('DEMO_CUSTOMER_PASSWORD');

  await ensureDemoAccounts();
  await Promise.all([
    verifyDemoProfile(demoAdminEmail, 'admin'),
    verifyDemoProfile(demoAgentEmail, 'agent', true),
    verifyDemoProfile(demoCustomerEmail, 'customer'),
  ]);

  const browser = await chromium.launch({ headless: true });
  const { auth, db } = initAdminSdk();

  let hotelId = '';
  let bookingId = '';
  let agentUid = '';
  let customerUid = '';
  let bookingTitle = '';
  let bookingCreated = false;
  let customerPageReadable = false;
  let customerNotificationVisible = false;
  let agentSawRequest = false;
  let adminUpdatedStatus = false;
  let customerSawUpdatedStatus = false;
  let demoLoginVerified = false;
  const consoleErrors = [];

  try {
    const [adminLogin, agentLogin, customerLogin] = await Promise.all([
      verifyDemoLogin(browser, demoAdminEmail, demoAdminPassword, '/admin/dashboard'),
      verifyDemoLogin(browser, demoAgentEmail, demoAgentPassword, '/agent/agent-dashboard'),
      verifyDemoLogin(browser, demoCustomerEmail, demoCustomerPassword, '/user/dashboard'),
    ]);
    demoLoginVerified = adminLogin.success && agentLogin.success && customerLogin.success;
    consoleErrors.push(...adminLogin.errors, ...agentLogin.errors, ...customerLogin.errors);

    const agent = await createTemporaryApprovedAgent();
    const customer = await createTempCustomer();
    agentUid = agent.uid;
    customerUid = customer.uid;
    bookingTitle = `Temp Booking Surface Hotel ${Date.now()}`;

    const hotelDoc = await db.collection('hotels').add({
      agentId: agent.uid,
      ownerId: agent.uid,
      createdBy: agent.uid,
      title: bookingTitle,
      name: bookingTitle,
      image: 'assets/img/hotels/hotel-large-01.jpg',
      gallery: ['assets/img/hotels/hotel-large-01.jpg'],
      location: 'Surface QA City',
      price: 345,
      pricePerNight: 345,
      published: true,
      approvalStatus: 'approved',
      status: 'approved',
      rating: 4.9,
      reviewsCount: 2,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    hotelId = hotelDoc.id;

    const customerContext = await browser.newContext();
    const customerPage = await customerContext.newPage();
    await loginAndWait(customerPage, customer.email, customer.password, '/user/dashboard');
    await customerPage.goto(`${BASE_URL}/hotel/hotel-details?id=${hotelId}`, { waitUntil: 'domcontentloaded' });
    await customerPage.locator('#loader-wrapper').waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
    await customerPage.waitForTimeout(3000);
    await customerPage.getByRole('button', { name: 'Book Now' }).click();
    await customerPage.waitForURL((url) => url.toString().includes('/user/customer-hotel-booking'), { timeout: 30000 });
    await customerPage.waitForTimeout(2500);

    const bookingSnap = await db.collection('users').doc(customer.uid).collection('bookings').orderBy('createdAt', 'desc').limit(1).get();
    if (bookingSnap.empty) {
      throw new Error('Customer booking was not created.');
    }
    bookingId = bookingSnap.docs[0].id;
    bookingCreated = true;

    await customerPage.goto(`${BASE_URL}/user/customer-hotel-booking`, { waitUntil: 'domcontentloaded' });
    await customerPage.locator('#loader-wrapper').waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
    await customerPage.waitForTimeout(2000);
    const customerBookingsBody = await readBody(customerPage);
    customerPageReadable =
      customerBookingsBody.includes(bookingTitle) &&
      /Hotel/i.test(customerBookingsBody) &&
      /Pending/i.test(customerBookingsBody);

    await customerPage.goto(`${BASE_URL}/user/notifications`, { waitUntil: 'domcontentloaded' });
    await customerPage.locator('#loader-wrapper').waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
    await customerPage.waitForTimeout(2000);
    const customerNotificationsBody = await readBody(customerPage);
    customerNotificationVisible =
      customerNotificationsBody.includes('Booking request submitted') &&
      customerNotificationsBody.includes(bookingTitle);

    await customerContext.close();

    const agentContext = await browser.newContext();
    const agentPage = await agentContext.newPage();
    await loginAndWait(agentPage, agent.email, agent.password, '/agent/agent-dashboard');
    await agentPage.goto(`${BASE_URL}/agent/agent-booking-requests`, { waitUntil: 'domcontentloaded' });
    await agentPage.locator('#loader-wrapper').waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
    await agentPage.waitForTimeout(2500);
    const agentBody = await readBody(agentPage);
    agentSawRequest =
      agentPage.url().includes('/agent/agent-booking-requests') &&
      agentBody.includes(bookingTitle) &&
      agentBody.includes(customer.email) &&
      /Hotel/i.test(agentBody);
    await agentContext.close();

    const adminContext = await browser.newContext();
    const adminPage = await adminContext.newPage();
    await loginAndWait(adminPage, demoAdminEmail, demoAdminPassword, '/admin/dashboard');
    await adminPage.goto(`${BASE_URL}/admin/bookings`, { waitUntil: 'domcontentloaded' });
    await adminPage.locator('#loader-wrapper').waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
    await adminPage.waitForTimeout(2500);
    const row = adminPage.locator('tr', { hasText: bookingTitle }).filter({ hasText: customer.email }).first();
    await row.waitFor({ state: 'visible', timeout: 20000 });
    await row.getByRole('button', { name: 'Confirm' }).click();
    await adminPage.waitForTimeout(2500);
    adminUpdatedStatus = true;

    const customerContextAfterConfirm = await browser.newContext();
    const customerPageAfterConfirm = await customerContextAfterConfirm.newPage();
    await loginAndWait(customerPageAfterConfirm, customer.email, customer.password, '/user/dashboard');
    await customerPageAfterConfirm.goto(`${BASE_URL}/user/customer-hotel-booking`, { waitUntil: 'domcontentloaded' });
    await customerPageAfterConfirm.locator('#loader-wrapper').waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
    await customerPageAfterConfirm.waitForTimeout(2000);
    const updatedBookingsBody = await readBody(customerPageAfterConfirm);
    customerSawUpdatedStatus = /Confirmed/i.test(updatedBookingsBody);
    await customerContextAfterConfirm.close();

    const customerNotificationsAfterConfirmContext = await browser.newContext();
    const customerNotificationsAfterConfirmPage = await customerNotificationsAfterConfirmContext.newPage();
    await loginAndWait(customerNotificationsAfterConfirmPage, customer.email, customer.password, '/user/dashboard');
    await customerNotificationsAfterConfirmPage.goto(`${BASE_URL}/user/notifications`, { waitUntil: 'domcontentloaded' });
    await customerNotificationsAfterConfirmPage.locator('#loader-wrapper').waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
    await customerNotificationsAfterConfirmPage.waitForTimeout(2000);
    const updatedNotificationsBody = await readBody(customerNotificationsAfterConfirmPage);
    customerNotificationVisible =
      customerNotificationVisible &&
      updatedNotificationsBody.includes('Booking confirmed') &&
      updatedNotificationsBody.includes(bookingTitle);
    await customerNotificationsAfterConfirmContext.close();

    console.log(JSON.stringify({
      demoLoginVerified,
      bookingCreated,
      customerPageReadable,
      customerNotificationVisible,
      agentSawRequest,
      adminUpdatedStatus,
      customerSawUpdatedStatus,
      consoleErrors,
      bookingId,
      hotelId,
    }));

    process.exitCode = demoLoginVerified &&
      bookingCreated &&
      customerPageReadable &&
      customerNotificationVisible &&
      agentSawRequest &&
      adminUpdatedStatus &&
      customerSawUpdatedStatus ? 0 : 1;
  } catch (error) {
    console.log(JSON.stringify({
      demoLoginVerified,
      bookingCreated,
      customerPageReadable,
      customerNotificationVisible,
      agentSawRequest,
      adminUpdatedStatus,
      customerSawUpdatedStatus,
      consoleErrors,
      bookingId,
      hotelId,
      reason: error.message || String(error),
    }));
    process.exitCode = 1;
  } finally {
    try {
      if (bookingId) {
        await db.collection('users').doc(customerUid).collection('bookings').doc(bookingId).delete();
        await db.collection('bookings').doc(bookingId).delete();
      }
      const customerNotifications = await db.collection('users').doc(customerUid).collection('notifications').get();
      for (const docSnap of customerNotifications.docs) {
        await docSnap.ref.delete();
      }
      const agentNotifications = await db.collection('users').doc(agentUid).collection('notifications').get();
      for (const docSnap of agentNotifications.docs) {
        await docSnap.ref.delete();
      }
      await db.collection('users').doc(customerUid).delete();
      await db.collection('users').doc(agentUid).delete();
      await auth.deleteUser(customerUid);
      await auth.deleteUser(agentUid);
      if (hotelId) {
        await db.collection('hotels').doc(hotelId).delete();
      }
    } catch {}

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
