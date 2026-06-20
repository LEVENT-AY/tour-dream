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
  const email = `temp.hotel.customer.${Date.now()}@example.com`;
  const password = 'TempHotelCustomer123!';
  const user = await auth.createUser({ email, password, displayName: 'Temp Hotel Customer' });
  await auth.setCustomUserClaims(user.uid, { role: 'customer' });
  const now = new Date().toISOString();
  await db.collection('users').doc(user.uid).set({
    uid: user.uid,
    email,
    displayName: 'Temp Hotel Customer',
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
  let hotelId = '';
  let bookingId = '';
  let openedRealHotel = false;
  let bookingCreated = false;
  let bookingOwnerMatch = false;
  let topLevelMirrorExists = false;
  let topLevelOwnerMatch = false;
  let userBookingsVisible = false;
  const errors = [];

  try {
    // Create agent-owned hotel with reliable ownership metadata.
    const hotelDoc = await db.collection('hotels').add({
      agentId: agent.uid,
      ownerId: agent.uid,
      createdBy: agent.uid,
      title: `Temp Agent Hotel ${Date.now()}`,
      name: `Temp Agent Hotel ${Date.now()}`,
      image: 'assets/img/hotels/hotel-large-01.jpg',
      gallery: ['assets/img/hotels/hotel-large-01.jpg'],
      location: 'Test City',
      price: 321,
      pricePerNight: 321,
      published: true,
      approvalStatus: 'approved',
      status: 'approved',
      rating: 4.8,
      reviewsCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    hotelId = hotelDoc.id;

    await login(page, customer.email, customer.password);
    await page.goto(`${BASE_URL}/hotel/hotel-details?id=${hotelId}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(5000);
    const bodyBefore = (await page.textContent('body')) || '';
    openedRealHotel = bodyBefore.includes('Temp Agent Hotel') || bodyBefore.includes('Test City');

    await page.getByRole('button', { name: 'Book Now' }).click();
    await page.waitForURL((url) => url.toString().includes('/user/customer-hotel-booking'), { timeout: 30000 });
    await page.waitForTimeout(4000);

    const bookingSnap = await db.collection('users').doc(customer.uid).collection('bookings').orderBy('createdAt', 'desc').limit(1).get();
    if (!bookingSnap.empty) {
      const doc = bookingSnap.docs[0];
      bookingId = doc.id;
      const data = doc.data();
      bookingCreated = data.listingType === 'hotel' && data.status === 'pending' && data.customerId === customer.uid && !!data.createdAt;
      bookingOwnerMatch = data.ownerId === agent.uid || data.agentId === agent.uid || data.listingOwnerId === agent.uid;
      const topLevelSnap = await db.collection('bookings').doc(bookingId).get();
      topLevelMirrorExists = topLevelSnap.exists;
      if (topLevelSnap.exists) {
        const topLevelData = topLevelSnap.data();
        topLevelOwnerMatch = topLevelData.ownerId === agent.uid || topLevelData.agentId === agent.uid || topLevelData.listingOwnerId === agent.uid;
      }
    }

    await page.goto(`${BASE_URL}/user/customer-hotel-booking`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    const userBookingsBody = (await page.textContent('body')) || '';
    userBookingsVisible = userBookingsBody.includes('Temp Agent Hotel') || userBookingsBody.toLowerCase().includes('pending');

    console.log(JSON.stringify({ hotelId, bookingId, openedRealHotel, bookingCreated, bookingOwnerMatch, topLevelMirrorExists, topLevelOwnerMatch, userBookingsVisible, errors }));
    process.exitCode = openedRealHotel && bookingCreated && bookingOwnerMatch && topLevelMirrorExists && topLevelOwnerMatch && userBookingsVisible ? 0 : 1;
  } catch (err) {
    console.log(JSON.stringify({ hotelId, bookingId, openedRealHotel, bookingCreated, bookingOwnerMatch, topLevelMirrorExists, topLevelOwnerMatch, userBookingsVisible, errors, reason: err.message || String(err) }));
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

    try {
      await auth.deleteUser(agent.uid);
      await db.collection('users').doc(agent.uid).delete();
    } catch {}

    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
