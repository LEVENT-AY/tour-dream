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
  const email = `temp.booking.requests.customer.${Date.now()}@example.com`;
  const password = 'TempBookingRequests123!';
  const user = await auth.createUser({ email, password, displayName: 'Temp Booking Requests Customer' });
  await auth.setCustomUserClaims(user.uid, { role: 'customer' });
  const now = new Date().toISOString();
  await db.collection('users').doc(user.uid).set({
    uid: user.uid,
    email,
    displayName: 'Temp Booking Requests Customer',
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
  const { db, auth } = initAdminSdk();
  const agent = await createTemporaryApprovedAgent();
  const customer = await createTempCustomer();
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  let hotelId = '';
  let bookingId = '';
  let agentSawRequest = false;
  let pageUrl = '';
  let bodyText = '';

  try {
    const hotelDoc = await db.collection('hotels').add({
      agentId: agent.uid,
      ownerId: agent.uid,
      createdBy: agent.uid,
      title: `Temp Booking Requests Hotel ${Date.now()}`,
      name: `Temp Booking Requests Hotel ${Date.now()}`,
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
    await page.getByRole('button', { name: 'Book Now' }).click();
    await page.waitForURL((url) => url.toString().includes('/user/customer-hotel-booking'), { timeout: 30000 });
    await page.waitForTimeout(4000);

    const bookingSnap = await db.collection('users').doc(customer.uid).collection('bookings').orderBy('createdAt', 'desc').limit(1).get();
    if (!bookingSnap.empty) {
      bookingId = bookingSnap.docs[0].id;
    }

    await login(page, agent.email, agent.password);
    await page.goto(`${BASE_URL}/agent/agent-booking-requests`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(4000);
    pageUrl = page.url();
    bodyText = (await page.textContent('body')) || '';
    agentSawRequest = bodyText.includes('Temp Booking Requests Hotel') && bodyText.includes(customer.email) && !bodyText.includes('No booking requests found');

    console.log(JSON.stringify({ hotelId, bookingId, agentSawRequest, pageUrl, bodyPreview: bodyText.slice(0, 500) }));
    process.exitCode = agentSawRequest ? 0 : 1;
  } catch (err) {
    console.log(JSON.stringify({ hotelId, bookingId, agentSawRequest, pageUrl, bodyPreview: bodyText.slice(0, 500), reason: err.message || String(err) }));
    process.exitCode = 1;
  } finally {
    try {
      if (bookingId) {
        await db.collection('users').doc(customer.uid).collection('bookings').doc(bookingId).delete();
        await db.collection('bookings').doc(bookingId).delete();
      }
      const notificationSnap = await db.collection('users').doc(customer.uid).collection('notifications').get();
      for (const doc of notificationSnap.docs) {
        await doc.ref.delete();
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
      const agentNotifications = await db.collection('users').doc(agent.uid).collection('notifications').get();
      for (const doc of agentNotifications.docs) {
        await doc.ref.delete();
      }
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
