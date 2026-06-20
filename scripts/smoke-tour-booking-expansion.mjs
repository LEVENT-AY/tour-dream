import admin from 'firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { chromium } from 'playwright';
import { createTemporaryApprovedAgent } from './agentListingVerification.mjs';

const PROJECT_ID = 'tour-tunisi';
const BASE_URL = process.env.BASE_URL || 'https://tour-tunisi.web.app';

function initAdminSdk() {
  if (admin.getApps().length === 0) {
    admin.initializeApp({ projectId: PROJECT_ID });
  }
  return { auth: getAuth(), db: getFirestore() };
}

async function createTempCustomer() {
  const { auth, db } = initAdminSdk();
  const email = `temp.tour.customer.${Date.now()}@example.com`;
  const password = 'TempTourCustomer123!';
  const user = await auth.createUser({ email, password, displayName: 'Temp Tour Customer' });
  await auth.setCustomUserClaims(user.uid, { role: 'customer' });
  const now = new Date().toISOString();
  await db.collection('users').doc(user.uid).set({
    uid: user.uid,
    email,
    displayName: 'Temp Tour Customer',
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

async function main() {
  const { auth, db } = initAdminSdk();
  const agent = await createTemporaryApprovedAgent();
  const customer = await createTempCustomer();
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  let tourId = '';
  let bookingId = '';
  let openedRealTour = false;
  let bookingCreated = false;
  let topLevelMirrorExists = false;
  let ownerMetadataExists = false;
  let customerBookingVisible = false;

  try {
    const title = `Temp Agent Tour ${Date.now()}`;
    const tourDoc = await db.collection('tours').add({
      agentId: agent.uid,
      ownerId: agent.uid,
      createdBy: agent.uid,
      title,
      name: title,
      image: 'assets/img/tours/tours-16.jpg',
      gallery: ['assets/img/tours/tours-16.jpg'],
      location: 'Test City',
      duration: '2 Day, 1 Night',
      price: 222,
      published: true,
      approvalStatus: 'approved',
      status: 'approved',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    tourId = tourDoc.id;

    await login(page, customer.email, customer.password);
    await page.goto(`${BASE_URL}/tour/tour-details?id=${tourId}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(5000);
    const bodyBefore = (await page.textContent('body')) || '';
    openedRealTour = bodyBefore.includes(title) || bodyBefore.includes('Test City');

    await page.getByRole('button', { name: 'Book Now' }).click();
    await page.waitForURL((url) => url.toString().includes('/user/customer-tour-booking'), { timeout: 30000 });
    await page.waitForTimeout(4000);

    const bookingSnap = await db.collection('users').doc(customer.uid).collection('bookings').orderBy('createdAt', 'desc').limit(1).get();
    if (!bookingSnap.empty) {
      const doc = bookingSnap.docs[0];
      bookingId = doc.id;
      const data = doc.data();
      bookingCreated = data.listingType === 'tour' && data.status === 'pending' && data.customerId === customer.uid;
      const topLevelSnap = await db.collection('bookings').doc(bookingId).get();
      topLevelMirrorExists = topLevelSnap.exists;
      if (topLevelSnap.exists) {
        const topLevelData = topLevelSnap.data();
        ownerMetadataExists = topLevelData.ownerId === agent.uid || topLevelData.agentId === agent.uid || topLevelData.listingOwnerId === agent.uid;
      }
    }

    await page.goto(`${BASE_URL}/user/customer-tour-booking`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    const customerBody = (await page.textContent('body')) || '';
    customerBookingVisible = customerBody.includes(title) || customerBody.toLowerCase().includes('pending');

    console.log(JSON.stringify({
      tourId,
      bookingId,
      openedRealTour,
      bookingCreated,
      topLevelMirrorExists,
      ownerMetadataExists,
      customerBookingVisible,
    }));

    process.exitCode = openedRealTour && bookingCreated && topLevelMirrorExists && ownerMetadataExists && customerBookingVisible ? 0 : 1;
  } catch (err) {
    console.log(JSON.stringify({
      tourId,
      bookingId,
      openedRealTour,
      bookingCreated,
      topLevelMirrorExists,
      ownerMetadataExists,
      customerBookingVisible,
      reason: err.message || String(err),
    }));
    process.exitCode = 1;
  } finally {
    try {
      if (bookingId) {
        await db.collection('users').doc(customer.uid).collection('bookings').doc(bookingId).delete();
        await db.collection('bookings').doc(bookingId).delete();
      }
      const customerNotifications = await db.collection('users').doc(customer.uid).collection('notifications').get();
      for (const doc of customerNotifications.docs) {
        await doc.ref.delete();
      }
      const customerBookings = await db.collection('users').doc(customer.uid).collection('bookings').get();
      for (const doc of customerBookings.docs) {
        await doc.ref.delete();
      }
      await db.collection('users').doc(customer.uid).delete();
      await auth.deleteUser(customer.uid);
    } catch {}

    try {
      if (tourId) {
        await db.collection('tours').doc(tourId).delete();
      }
    } catch {}

    try {
      const agentNotifications = await db.collection('users').doc(agent.uid).collection('notifications').get();
      for (const doc of agentNotifications.docs) {
        await doc.ref.delete();
      }
      await db.collection('users').doc(agent.uid).delete();
      await auth.deleteUser(agent.uid);
    } catch {}

    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
