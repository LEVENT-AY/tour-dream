import admin from 'firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { chromium } from 'playwright';
import { createTemporaryApprovedAgent } from './agentListingVerification.mjs';

const PROJECT_ID = 'tour-tunisi';
const BASE_URL = process.env.BASE_URL || 'https://tour-tunisi.web.app';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'manager.emtilek@gmail.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'ChangeMe123!';

function initAdminSdk() {
  if (admin.getApps().length === 0) {
    admin.initializeApp({ projectId: PROJECT_ID });
  }
  return { auth: getAuth(), db: getFirestore() };
}

async function createTempCustomer() {
  const { auth, db } = initAdminSdk();
  const email = `temp.booking.mirror.customer.${Date.now()}@example.com`;
  const password = 'TempBookingMirror123!';
  const user = await auth.createUser({ email, password, displayName: 'Temp Booking Mirror Customer' });
  await auth.setCustomUserClaims(user.uid, { role: 'customer' });
  const now = new Date().toISOString();
  await db.collection('users').doc(user.uid).set({
    uid: user.uid,
    email,
    displayName: 'Temp Booking Mirror Customer',
    role: 'customer',
    createdAt: now,
    joinedAt: now,
  });
  return { uid: user.uid, email, password };
}

async function login(page, email, password) {
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
  await page.getByPlaceholder('Enter Email').fill(email);
  await page.getByPlaceholder('Enter Password').fill(password);
  await page.getByRole('button', { name: 'Login' }).click();
  await page.waitForTimeout(8000);
}

async function readBookingDocs(db, customerUid, bookingId) {
  const [userSnap, topLevelSnap] = await Promise.all([
    db.collection('users').doc(customerUid).collection('bookings').doc(bookingId).get(),
    db.collection('bookings').doc(bookingId).get(),
  ]);
  return {
    userSnap,
    topLevelSnap,
    userData: userSnap.exists ? userSnap.data() : null,
    topLevelData: topLevelSnap.exists ? topLevelSnap.data() : null,
  };
}

async function main() {
  const { auth, db } = initAdminSdk();
  const agent = await createTemporaryApprovedAgent();
  const otherAgent = await createTemporaryApprovedAgent();
  const customer = await createTempCustomer();
  const browser = await chromium.launch({ headless: true });

  let hotelId = '';
  let bookingId = '';
  let userBookingExists = false;
  let topLevelMirrorExists = false;
  let ownerMetadataExists = false;
  let adminConfirmedBoth = false;
  let customerSawConfirmed = false;
  let agentSawBooking = false;
  let otherAgentBlocked = false;
  let adminCancelledBoth = false;

  try {
    const hotelTitle = `Temp Mirror Hotel ${Date.now()}`;
    const hotelDoc = await db.collection('hotels').add({
      agentId: agent.uid,
      ownerId: agent.uid,
      createdBy: agent.uid,
      title: hotelTitle,
      name: hotelTitle,
      image: 'assets/img/hotels/hotel-large-01.jpg',
      gallery: ['assets/img/hotels/hotel-large-01.jpg'],
      location: 'Test City',
      price: 321,
      pricePerNight: 321,
      published: true,
      approvalStatus: 'approved',
      status: 'approved',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    hotelId = hotelDoc.id;

    const customerContext = await browser.newContext();
    const customerPage = await customerContext.newPage();
    await login(customerPage, customer.email, customer.password);
    await customerPage.goto(`${BASE_URL}/hotel/hotel-details?id=${hotelId}`, { waitUntil: 'domcontentloaded' });
    await customerPage.waitForTimeout(5000);
    await customerPage.getByRole('button', { name: 'Book Now' }).click();
    await customerPage.waitForURL((url) => url.toString().includes('/user/customer-hotel-booking'), { timeout: 30000 });
    await customerPage.waitForTimeout(4000);

    const bookingSnap = await db.collection('users').doc(customer.uid).collection('bookings').orderBy('createdAt', 'desc').limit(1).get();
    if (!bookingSnap.empty) {
      bookingId = bookingSnap.docs[0].id;
    }

    const createdDocs = await readBookingDocs(db, customer.uid, bookingId);
    userBookingExists = createdDocs.userSnap.exists;
    topLevelMirrorExists = createdDocs.topLevelSnap.exists;
    ownerMetadataExists = !!createdDocs.topLevelData && (
      createdDocs.topLevelData.ownerId === agent.uid
      || createdDocs.topLevelData.agentId === agent.uid
      || createdDocs.topLevelData.listingOwnerId === agent.uid
    );

    const adminContext = await browser.newContext();
    const adminPage = await adminContext.newPage();
    await login(adminPage, ADMIN_EMAIL, ADMIN_PASSWORD);
    await adminPage.goto(`${BASE_URL}/admin/bookings`, { waitUntil: 'domcontentloaded' });
    await adminPage.waitForTimeout(8000);
    const row = adminPage.locator('tr', { hasText: hotelTitle }).filter({ hasText: customer.email }).first();
    await row.waitFor({ state: 'visible', timeout: 20000 });
    await row.getByRole('button', { name: 'Confirm' }).click();
    await adminPage.waitForTimeout(2500);

    const confirmedDocs = await readBookingDocs(db, customer.uid, bookingId);
    adminConfirmedBoth = confirmedDocs.userData?.status === 'confirmed' && confirmedDocs.topLevelData?.status === 'confirmed';

    const customerConfirmedContext = await browser.newContext();
    const customerConfirmedPage = await customerConfirmedContext.newPage();
    await login(customerConfirmedPage, customer.email, customer.password);
    await customerConfirmedPage.goto(`${BASE_URL}/user/customer-hotel-booking`, { waitUntil: 'domcontentloaded' });
    await customerConfirmedPage.waitForTimeout(3000);
    const customerBody = (await customerConfirmedPage.textContent('body')) || '';
    customerSawConfirmed = customerBody.includes(hotelTitle) && /confirmed/i.test(customerBody);

    const agentContext = await browser.newContext();
    const agentPage = await agentContext.newPage();
    await login(agentPage, agent.email, agent.password);
    await agentPage.goto(`${BASE_URL}/agent/agent-booking-requests`, { waitUntil: 'domcontentloaded' });
    await agentPage.waitForTimeout(4000);
    const agentBody = (await agentPage.textContent('body')) || '';
    agentSawBooking = agentBody.includes(hotelTitle) && agentBody.includes(customer.email);

    const otherAgentContext = await browser.newContext();
    const otherAgentPage = await otherAgentContext.newPage();
    await login(otherAgentPage, otherAgent.email, otherAgent.password);
    await otherAgentPage.goto(`${BASE_URL}/agent/agent-booking-requests`, { waitUntil: 'domcontentloaded' });
    await otherAgentPage.waitForTimeout(4000);
    const otherAgentBody = (await otherAgentPage.textContent('body')) || '';
    otherAgentBlocked = !otherAgentBody.includes(hotelTitle) && !otherAgentBody.includes(customer.email);

    await adminPage.goto(`${BASE_URL}/admin/bookings`, { waitUntil: 'domcontentloaded' });
    await adminPage.waitForTimeout(8000);
    const cancelRow = adminPage.locator('tr', { hasText: hotelTitle }).filter({ hasText: customer.email }).first();
    await cancelRow.waitFor({ state: 'visible', timeout: 20000 });
    await cancelRow.getByRole('button', { name: 'Cancel' }).click();
    await adminPage.waitForTimeout(2500);

    const cancelledDocs = await readBookingDocs(db, customer.uid, bookingId);
    adminCancelledBoth = cancelledDocs.userData?.status === 'cancelled' && cancelledDocs.topLevelData?.status === 'cancelled';

    console.log(JSON.stringify({
      hotelId,
      bookingId,
      userBookingExists,
      topLevelMirrorExists,
      ownerMetadataExists,
      adminConfirmedBoth,
      customerSawConfirmed,
      agentSawBooking,
      otherAgentBlocked,
      adminCancelledBoth,
    }));

    process.exitCode = userBookingExists
      && topLevelMirrorExists
      && ownerMetadataExists
      && adminConfirmedBoth
      && customerSawConfirmed
      && agentSawBooking
      && otherAgentBlocked
      && adminCancelledBoth
      ? 0
      : 1;
  } catch (err) {
    console.log(JSON.stringify({
      hotelId,
      bookingId,
      userBookingExists,
      topLevelMirrorExists,
      ownerMetadataExists,
      adminConfirmedBoth,
      customerSawConfirmed,
      agentSawBooking,
      otherAgentBlocked,
      adminCancelledBoth,
      reason: err.message || String(err),
    }));
    process.exitCode = 1;
  } finally {
    try {
      if (bookingId) {
        await db.collection('users').doc(customer.uid).collection('bookings').doc(bookingId).delete();
        await db.collection('bookings').doc(bookingId).delete();
      }
      const bookingSnap = await db.collection('users').doc(customer.uid).collection('bookings').get();
      for (const doc of bookingSnap.docs) {
        await doc.ref.delete();
      }
      await db.collection('users').doc(customer.uid).delete();
      await auth.deleteUser(customer.uid);
    } catch {}

    try {
      if (hotelId) {
        await db.collection('hotels').doc(hotelId).delete();
      }
    } catch {}

    for (const tempAgent of [agent, otherAgent]) {
      try {
        await auth.deleteUser(tempAgent.uid);
      } catch {}
      try {
        await db.collection('users').doc(tempAgent.uid).delete();
      } catch {}
    }

    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
