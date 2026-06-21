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
  const email = `temp.lodging.customer.${Date.now()}@example.com`;
  const password = 'TempLodgingCustomer123!';
  const user = await auth.createUser({ email, password, displayName: 'Temp Lodging Customer' });
  await auth.setCustomUserClaims(user.uid, { role: 'customer' });
  const now = new Date().toISOString();
  await db.collection('users').doc(user.uid).set({
    uid: user.uid,
    email,
    displayName: 'Temp Lodging Customer',
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
  const errors = [];

  const customerContext = await browser.newContext();
  const customerPage = await customerContext.newPage();
  customerPage.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  customerPage.on('pageerror', (err) => errors.push(err.message));

  const agentContext = await browser.newContext();
  const agentPage = await agentContext.newPage();
  agentPage.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  agentPage.on('pageerror', (err) => errors.push(err.message));

  let chaletId = '';
  let bookingId = '';
  let openedRealDetails = false;
  let bookingCreated = false;
  let bookingMirrorExists = false;
  let ownerMetadataPreserved = false;
  let agentSawBooking = false;
  let notificationsCreated = false;
  let pageUrl = '';
  let bodyPreview = '';
  let agentPageUrl = '';
  let agentBodyPreview = '';

  try {
    const title = `Temp Agent Chalet ${Date.now()}`;
    const chaletDoc = await db.collection('chalets').add({
      agentId: agent.uid,
      ownerId: agent.uid,
      createdBy: agent.uid,
      listingCategory: 'lodging',
      propertyType: 'chalet',
      title,
      name: title,
      description: 'Temporary chalet for public details smoke',
      mainImage: 'assets/img/hotels/hotel-large-02.jpg',
      gallery: ['assets/img/hotels/hotel-large-02.jpg'],
      location: 'Test Chalet Valley',
      pricePerNight: 456,
      capacity: 6,
      bedrooms: 3,
      bathrooms: 2,
      amenities: ['Fireplace', 'Mountain view'],
      published: true,
      approvalStatus: 'approved',
      status: 'approved',
      availability: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    chaletId = chaletDoc.id;

    await login(customerPage, customer.email, customer.password);
    await customerPage.goto(`${BASE_URL}/chalet/chalet-details?id=${chaletId}`, { waitUntil: 'domcontentloaded' });
    await customerPage.waitForTimeout(5000);
    const detailsBody = (await customerPage.textContent('body')) || '';
    pageUrl = customerPage.url();
    bodyPreview = detailsBody.slice(0, 500);
    openedRealDetails = detailsBody.includes(title) || detailsBody.includes('Test Chalet Valley');

    await customerPage.getByRole('button', { name: 'Book Now' }).click();
    await customerPage.waitForURL((url) => url.toString().includes('/user/customer-hotel-booking'), { timeout: 30000 });
    await customerPage.waitForTimeout(4000);

    const bookingSnap = await db.collection('users').doc(customer.uid).collection('bookings').orderBy('createdAt', 'desc').limit(1).get();
    if (!bookingSnap.empty) {
      const doc = bookingSnap.docs[0];
      bookingId = doc.id;
      const bookingData = doc.data();
      bookingCreated = bookingData.listingType === 'chalet' && bookingData.status === 'pending' && bookingData.customerId === customer.uid;
      const topLevelSnap = await db.collection('bookings').doc(bookingId).get();
      bookingMirrorExists = topLevelSnap.exists;
      if (topLevelSnap.exists) {
        const topLevelData = topLevelSnap.data();
        ownerMetadataPreserved = topLevelData.ownerId === agent.uid || topLevelData.agentId === agent.uid || topLevelData.listingOwnerId === agent.uid;
      }
    }

    await login(agentPage, agent.email, agent.password);
    await agentPage.goto(`${BASE_URL}/agent/agent-booking-requests`, { waitUntil: 'domcontentloaded' });
    await agentPage.waitForTimeout(4000);
    const agentBody = (await agentPage.textContent('body')) || '';
    agentPageUrl = agentPage.url();
    agentBodyPreview = agentBody.slice(0, 500);
    agentSawBooking = agentBody.includes(title) && agentBody.includes(customer.email);

    const [customerNotifications, agentNotifications] = await Promise.all([
      db.collection('users').doc(customer.uid).collection('notifications').where('bookingId', '==', bookingId).get(),
      db.collection('users').doc(agent.uid).collection('notifications').where('bookingId', '==', bookingId).get(),
    ]);
    notificationsCreated = !customerNotifications.empty && !agentNotifications.empty;

    console.log(JSON.stringify({
      chaletId,
      bookingId,
      openedRealDetails,
      bookingCreated,
      bookingMirrorExists,
      ownerMetadataPreserved,
      agentSawBooking,
      notificationsCreated,
      pageUrl,
      bodyPreview,
      agentPageUrl,
      agentBodyPreview,
      errors,
    }));
    process.exitCode = openedRealDetails && bookingCreated && bookingMirrorExists && ownerMetadataPreserved && agentSawBooking && notificationsCreated ? 0 : 1;
  } catch (err) {
    console.log(JSON.stringify({
      chaletId,
      bookingId,
      openedRealDetails,
      bookingCreated,
      bookingMirrorExists,
      ownerMetadataPreserved,
      agentSawBooking,
      notificationsCreated,
      pageUrl,
      bodyPreview,
      agentPageUrl,
      agentBodyPreview,
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
      if (chaletId) {
        await db.collection('chalets').doc(chaletId).delete();
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
