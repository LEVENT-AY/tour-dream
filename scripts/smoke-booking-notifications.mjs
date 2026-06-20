import admin from 'firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { chromium } from 'playwright';
import { createTemporaryApprovedAgent } from './agentListingVerification.mjs';

const PROJECT_ID = 'tour-tunisi';
const BASE_URL = process.env.BASE_URL || 'https://tour-tunisi.web.app';
const FIREBASE_API_KEY = 'AIzaSyA53UvUPYNbs5sBK7Y8dS1-GnidLbmXO3g';
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
  const email = `temp.booking.notifications.customer.${Date.now()}@example.com`;
  const password = 'TempBookingNotifications123!';
  const user = await auth.createUser({ email, password, displayName: 'Temp Booking Notifications Customer' });
  await auth.setCustomUserClaims(user.uid, { role: 'customer' });
  const now = new Date().toISOString();
  await db.collection('users').doc(user.uid).set({
    uid: user.uid,
    email,
    displayName: 'Temp Booking Notifications Customer',
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

async function fetchUserNotifications(db, userId, bookingId) {
  const snap = await db.collection('users').doc(userId).collection('notifications').where('bookingId', '==', bookingId).get();
  return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

async function waitFor(check, { timeoutMs = 20000, intervalMs = 500 } = {}) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const result = await check();
    if (result) return result;
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
  return null;
}

async function signInWithPassword(email, password) {
  const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, returnSecureToken: true }),
  });
  if (!response.ok) {
    throw new Error(`Failed to sign in for REST validation: ${response.status}`);
  }
  return response.json();
}

async function firestoreGet(path, idToken) {
  const response = await fetch(`https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${path}`, {
    headers: { Authorization: `Bearer ${idToken}` },
  });
  return response;
}

async function firestorePatchRead(path, idToken) {
  const params = new URLSearchParams();
  params.append('updateMask.fieldPaths', 'read');
  params.append('updateMask.fieldPaths', 'readAt');
  params.append('updateMask.fieldPaths', 'updatedAt');
  const now = new Date().toISOString();
  return fetch(`https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${path}?${params.toString()}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${idToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      fields: {
        read: { booleanValue: true },
        readAt: { stringValue: now },
        updatedAt: { stringValue: now },
      },
    }),
  });
}

async function firestoreCreateNotification(path, idToken, payload) {
  return fetch(`https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${idToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      fields: {
        title: { stringValue: payload.title },
        message: { stringValue: payload.message },
        body: { stringValue: payload.message },
        type: { stringValue: payload.type },
        bookingId: { stringValue: payload.bookingId },
        status: { stringValue: payload.status },
        read: { booleanValue: false },
        createdAt: { stringValue: new Date().toISOString() },
        updatedAt: { stringValue: new Date().toISOString() },
      },
    }),
  });
}

async function fetchBookingDocs(db, customerUid, bookingId) {
  const [userSnap, topLevelSnap] = await Promise.all([
    db.collection('users').doc(customerUid).collection('bookings').doc(bookingId).get(),
    db.collection('bookings').doc(bookingId).get(),
  ]);
  return {
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
  let customerSubmittedNotification = false;
  let agentSubmittedNotification = false;
  let customerConfirmedNotification = false;
  let agentConfirmedNotification = false;
  let customerConfirmedStatus = false;
  let mirrorStillSynced = false;
  let customerOwnNotificationReadAccess = false;
  let customerOwnNotificationUpdateAccess = false;
  let agentOwnNotificationReadAccess = false;
  let agentOwnNotificationUpdateAccess = false;
  let crossUserNotificationAccessBlocked = false;
  let arbitraryCustomerToAgentWriteBlocked = false;

  try {
    const hotelTitle = `Temp Booking Notifications Hotel ${Date.now()}`;
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

    const customerCreateNotifications = await waitFor(async () => {
      const items = await fetchUserNotifications(db, customer.uid, bookingId);
      return items.some((item) => item.type === 'booking_submitted') ? items : null;
    });
    const agentCreateNotifications = await waitFor(async () => {
      const items = await fetchUserNotifications(db, agent.uid, bookingId);
      return items.some((item) => item.type === 'booking_submitted') ? items : null;
    });
    customerSubmittedNotification = customerCreateNotifications.some((item) => item.type === 'booking_submitted');
    agentSubmittedNotification = agentCreateNotifications.some((item) => item.type === 'booking_submitted');

    const customerToken = (await signInWithPassword(customer.email, customer.password)).idToken;
    const agentToken = (await signInWithPassword(agent.email, agent.password)).idToken;
    const customerNotificationId = customerCreateNotifications[0]?.id;
    const agentNotificationId = agentCreateNotifications[0]?.id;

    if (customerNotificationId) {
      const ownReadResponse = await firestoreGet(`users/${customer.uid}/notifications/${customerNotificationId}`, customerToken);
      customerOwnNotificationReadAccess = ownReadResponse.status === 200;
      const ownPatchResponse = await firestorePatchRead(`users/${customer.uid}/notifications/${customerNotificationId}`, customerToken);
      customerOwnNotificationUpdateAccess = ownPatchResponse.status === 200;
    }

    if (agentNotificationId) {
      const ownReadResponse = await firestoreGet(`users/${agent.uid}/notifications/${agentNotificationId}`, agentToken);
      agentOwnNotificationReadAccess = ownReadResponse.status === 200;
      const ownPatchResponse = await firestorePatchRead(`users/${agent.uid}/notifications/${agentNotificationId}`, agentToken);
      agentOwnNotificationUpdateAccess = ownPatchResponse.status === 200;
      const customerReadAgentResponse = await firestoreGet(`users/${agent.uid}/notifications/${agentNotificationId}`, customerToken);
      crossUserNotificationAccessBlocked = customerReadAgentResponse.status === 403;
    }

    const arbitraryWriteResponse = await firestoreCreateNotification(`users/${otherAgent.uid}/notifications`, customerToken, {
      title: 'Arbitrary write',
      message: 'This should be blocked.',
      type: 'booking_submitted',
      bookingId,
      status: 'pending',
    });
    arbitraryCustomerToAgentWriteBlocked = arbitraryWriteResponse.status === 403;

    const adminContext = await browser.newContext();
    const adminPage = await adminContext.newPage();
    await login(adminPage, ADMIN_EMAIL, ADMIN_PASSWORD);
    await adminPage.goto(`${BASE_URL}/admin/bookings`, { waitUntil: 'domcontentloaded' });
    await adminPage.waitForTimeout(8000);
    const row = adminPage.locator('tr', { hasText: hotelTitle }).filter({ hasText: customer.email }).first();
    await row.waitFor({ state: 'visible', timeout: 20000 });
    await row.getByRole('button', { name: 'Confirm' }).click();
    await adminPage.waitForTimeout(2500);

    const customerConfirmNotifications = await waitFor(async () => {
      const items = await fetchUserNotifications(db, customer.uid, bookingId);
      return items.some((item) => item.type === 'booking_confirmed') ? items : null;
    });
    const agentConfirmNotifications = await waitFor(async () => {
      const items = await fetchUserNotifications(db, agent.uid, bookingId);
      return items.some((item) => item.type === 'booking_confirmed') ? items : null;
    });
    const bookingDocs = await waitFor(async () => {
      const docs = await fetchBookingDocs(db, customer.uid, bookingId);
      return docs.userData?.status === 'confirmed' && docs.topLevelData?.status === 'confirmed' ? docs : null;
    });
    customerConfirmedNotification = customerConfirmNotifications.some((item) => item.type === 'booking_confirmed');
    agentConfirmedNotification = agentConfirmNotifications.some((item) => item.type === 'booking_confirmed');
    mirrorStillSynced = !!bookingDocs;

    await customerPage.goto(`${BASE_URL}/user/customer-hotel-booking`, { waitUntil: 'domcontentloaded' });
    await customerPage.waitForTimeout(3000);
    const customerBody = (await customerPage.textContent('body')) || '';
    customerConfirmedStatus = customerBody.includes(hotelTitle) && /confirmed/i.test(customerBody);

    console.log(JSON.stringify({
      hotelId,
      bookingId,
      customerSubmittedNotification,
      agentSubmittedNotification,
      customerConfirmedNotification,
      agentConfirmedNotification,
      customerConfirmedStatus,
      mirrorStillSynced,
      customerOwnNotificationReadAccess,
      customerOwnNotificationUpdateAccess,
      agentOwnNotificationReadAccess,
      agentOwnNotificationUpdateAccess,
      crossUserNotificationAccessBlocked,
      arbitraryCustomerToAgentWriteBlocked,
    }));

    process.exitCode = customerSubmittedNotification
      && agentSubmittedNotification
      && customerConfirmedNotification
      && agentConfirmedNotification
      && customerConfirmedStatus
      && mirrorStillSynced
      && customerOwnNotificationReadAccess
      && customerOwnNotificationUpdateAccess
      && agentOwnNotificationReadAccess
      && agentOwnNotificationUpdateAccess
      && crossUserNotificationAccessBlocked
      && arbitraryCustomerToAgentWriteBlocked
      ? 0
      : 1;
  } catch (err) {
    console.log(JSON.stringify({
      hotelId,
      bookingId,
      customerSubmittedNotification,
      agentSubmittedNotification,
      customerConfirmedNotification,
      agentConfirmedNotification,
      customerConfirmedStatus,
      mirrorStillSynced,
      customerOwnNotificationReadAccess,
      customerOwnNotificationUpdateAccess,
      agentOwnNotificationReadAccess,
      agentOwnNotificationUpdateAccess,
      crossUserNotificationAccessBlocked,
      arbitraryCustomerToAgentWriteBlocked,
      reason: err.message || String(err),
    }));
    process.exitCode = 1;
  } finally {
    try {
      if (bookingId) {
        await db.collection('users').doc(customer.uid).collection('bookings').doc(bookingId).delete();
        await db.collection('bookings').doc(bookingId).delete();
      }
      for (const uid of [customer.uid, agent.uid, otherAgent.uid]) {
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
      if (hotelId) {
        await db.collection('hotels').doc(hotelId).delete();
      }
    } catch {}

    try {
      await db.collection('users').doc(otherAgent.uid).delete();
      await auth.deleteUser(otherAgent.uid);
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
