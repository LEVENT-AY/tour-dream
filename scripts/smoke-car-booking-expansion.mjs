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
  const email = `temp.car.customer.${Date.now()}@example.com`;
  const password = 'TempCarCustomer123!';
  const user = await auth.createUser({ email, password, displayName: 'Temp Car Customer' });
  await auth.setCustomUserClaims(user.uid, { role: 'customer' });
  const now = new Date().toISOString();
  await db.collection('users').doc(user.uid).set({
    uid: user.uid,
    email,
    displayName: 'Temp Car Customer',
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
  const errors = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (err) => errors.push(err.message));

  let carId = '';
  let bookingId = '';
  let gridLoadedRealListing = false;
  let openedRealDetails = false;
  let bookingCreated = false;
  let bookingMirrorExists = false;
  let ownerMetadataPreserved = false;
  let agentSawBooking = false;
  let notificationsCreated = false;

  try {
    const title = `Temp Agent Car ${Date.now()}`;
    const carDoc = await db.collection('cars').add({
      agentId: agent.uid,
      ownerId: agent.uid,
      createdBy: agent.uid,
      title,
      name: title,
      type: 'SUV',
      description: 'Temporary car for public detail booking smoke',
      image: 'assets/img/cars/car-large-01.jpg',
      gallery: [
        'assets/img/cars/car-large-01.jpg',
        'assets/img/cars/car-large-02.jpg',
      ],
      location: 'Test Car Pickup Hub',
      price: 444,
      priceUnit: 'day',
      rating: 4.7,
      reviewsCount: 16,
      fuel: 'Hybrid',
      gear: 'Automatic',
      travelled: '8,000 KM',
      published: true,
      approvalStatus: 'approved',
      status: 'approved',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    carId = carDoc.id;

    await page.goto(`${BASE_URL}/car/car-grid`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(5000);
    const gridBody = (await page.textContent('body')) || '';
    gridLoadedRealListing = gridBody.includes(title);

    await login(page, customer.email, customer.password);
    await page.goto(`${BASE_URL}/car/car-details?id=${carId}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(5000);
    const detailsBody = (await page.textContent('body')) || '';
    openedRealDetails = detailsBody.includes(title) || detailsBody.includes('Test Car Pickup Hub');

    await page.getByRole('button', { name: 'Book Now' }).click();
    await page.waitForURL((url) => url.toString().includes('/user/customer-car-booking'), { timeout: 30000 });
    await page.waitForTimeout(4000);

    const bookingSnap = await db.collection('users').doc(customer.uid).collection('bookings').orderBy('createdAt', 'desc').limit(1).get();
    if (!bookingSnap.empty) {
      const doc = bookingSnap.docs[0];
      bookingId = doc.id;
      const bookingData = doc.data();
      bookingCreated = bookingData.listingType === 'car' && bookingData.status === 'pending' && bookingData.customerId === customer.uid;
      const topLevelSnap = await db.collection('bookings').doc(bookingId).get();
      bookingMirrorExists = topLevelSnap.exists;
      if (topLevelSnap.exists) {
        const topLevelData = topLevelSnap.data();
        ownerMetadataPreserved = topLevelData.ownerId === agent.uid || topLevelData.agentId === agent.uid || topLevelData.listingOwnerId === agent.uid;
      }
    }

    await login(page, agent.email, agent.password);
    await page.goto(`${BASE_URL}/agent/agent-booking-requests`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(4000);
    const agentBody = (await page.textContent('body')) || '';
    agentSawBooking = agentBody.includes(title) && agentBody.includes(customer.email);

    const [customerNotifications, agentNotifications] = await Promise.all([
      db.collection('users').doc(customer.uid).collection('notifications').where('bookingId', '==', bookingId).get(),
      db.collection('users').doc(agent.uid).collection('notifications').where('bookingId', '==', bookingId).get(),
    ]);
    notificationsCreated = !customerNotifications.empty && !agentNotifications.empty;

    console.log(JSON.stringify({
      carId,
      bookingId,
      gridLoadedRealListing,
      openedRealDetails,
      bookingCreated,
      bookingMirrorExists,
      ownerMetadataPreserved,
      agentSawBooking,
      notificationsCreated,
      errors,
    }));
    process.exitCode = gridLoadedRealListing && openedRealDetails && bookingCreated && bookingMirrorExists && ownerMetadataPreserved && agentSawBooking && notificationsCreated ? 0 : 1;
  } catch (err) {
    console.log(JSON.stringify({
      carId,
      bookingId,
      gridLoadedRealListing,
      openedRealDetails,
      bookingCreated,
      bookingMirrorExists,
      ownerMetadataPreserved,
      agentSawBooking,
      notificationsCreated,
      errors,
      reason: err.message || String(err),
    }));
    process.exitCode = 1;
  } finally {
    try {
      if (bookingId) {
        await db.collection('users').doc(customer.uid).collection('bookings').doc(bookingId).delete();
        await db.collection('bookings').doc(bookingId).delete();
      }
      for (const uid of [customer.uid, agent.uid]) {
        const notifications = await db.collection('users').doc(uid).collection('notifications').get();
        for (const doc of notifications.docs) {
          await doc.ref.delete();
        }
      }
      const customerBookings = await db.collection('users').doc(customer.uid).collection('bookings').get();
      for (const doc of customerBookings.docs) {
        await doc.ref.delete();
      }
      await db.collection('users').doc(customer.uid).delete();
      await auth.deleteUser(customer.uid);
    } catch {}

    try {
      if (carId) {
        await db.collection('cars').doc(carId).delete();
      }
    } catch {}

    try {
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
