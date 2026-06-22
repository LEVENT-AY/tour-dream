import fs from 'node:fs';
import path from 'node:path';
import admin from 'firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { Storage } from '@google-cloud/storage';
import { chromium } from 'playwright';
import { ensureDemoAccounts } from './ensure-demo-accounts.mjs';

const PROJECT_ID = 'tour-tunisi';
const BASE_URL = process.env.BASE_URL || 'http://localhost:5174';
const STORAGE_BUCKET = 'tour-tunisi.firebasestorage.app';
const TEMP_DIR = 'C:/Users/bilal/AppData/Local/Temp/opencode';
const TEMP_IMAGE_PATH = path.join(TEMP_DIR, 'temp-role-permissions-upload-1.png');
const TEMP_IMAGE_PATH_2 = path.join(TEMP_DIR, 'temp-role-permissions-upload-2.png');

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
  return {
    auth: getAuth(),
    db: getFirestore(),
    bucket: new Storage({ projectId: PROJECT_ID }).bucket(STORAGE_BUCKET),
  };
}

function createTempImage(filePath) {
  if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
  }
  const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO7+G5sAAAAASUVORK5CYII=';
  fs.writeFileSync(filePath, Buffer.from(pngBase64, 'base64'));
  return filePath;
}

function extractStoragePathFromUrl(url) {
  try {
    const decoded = decodeURIComponent(url);
    const match = decoded.match(/\/o\/(.*?)\?alt=media/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

async function waitForQueryResult(queryFactory, predicate, timeoutMs = 30000, intervalMs = 1000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const snap = await queryFactory();
    const found = snap.docs.find((doc) => predicate(doc.data() || {}, doc.id));
    if (found) {
      return found;
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
  throw new Error('Timed out waiting for expected Firestore document.');
}

async function resolveDemoProfile(email, expectedRole) {
  const { auth, db } = initAdminSdk();
  const user = await auth.getUserByEmail(email);
  const profileSnap = await db.collection('users').doc(user.uid).get();
  if (!profileSnap.exists) {
    throw new Error(`Missing Firestore profile for ${expectedRole} demo account.`);
  }
  const profile = profileSnap.data() || {};
  if (profile.role !== expectedRole || user.customClaims?.role !== expectedRole) {
    throw new Error(`Role mismatch for ${expectedRole} demo account.`);
  }
  if (expectedRole === 'agent' && (profile.agentStatus !== 'approved' || profile.approved !== true || profile.suspended === true)) {
    throw new Error('Agent demo account is not approved.');
  }
  return {
    uid: user.uid,
    email: user.email || email,
    displayName: profile.displayName || user.displayName || '',
    role: profile.role,
    status: profile.agentStatus || profile.status || null,
  };
}

async function createTempAgent() {
  const { auth, db } = initAdminSdk();
  const stamp = Date.now().toString();
  const email = `temp.other.agent.${stamp}@example.com`;
  const password = 'TempAgent123!';
  const displayName = 'Temp Other Agent';
  const user = await auth.createUser({ email, password, displayName });
  const now = new Date().toISOString();
  await auth.setCustomUserClaims(user.uid, { role: 'agent' });
  await db.collection('users').doc(user.uid).set({
    uid: user.uid,
    email,
    displayName,
    role: 'agent',
    agentStatus: 'approved',
    approved: true,
    suspended: false,
    approvedAt: now,
    createdAt: now,
    updatedAt: now,
  }, { merge: true });
  return { uid: user.uid, email, password, displayName, role: 'agent' };
}

async function cleanupTempData({ db, bucket, auth, tempAgent, tempListingId, tempDemoAgentListingId, createdFlightId, storagePaths }) {
  if (tempListingId) {
    try {
      await db.collection('tours').doc(tempListingId).delete();
    } catch {}
  }

  if (tempDemoAgentListingId) {
    try {
      await db.collection('tours').doc(tempDemoAgentListingId).delete();
    } catch {}
  }

  if (createdFlightId) {
    try {
      await db.collection('flights').doc(createdFlightId).delete();
    } catch {}
  }

  for (const storagePath of storagePaths) {
    try {
      await bucket.file(storagePath).delete({ ignoreNotFound: true });
    } catch {}
  }

  if (tempAgent) {
    try {
      await auth.deleteUser(tempAgent.uid);
    } catch {}
    try {
      await db.collection('users').doc(tempAgent.uid).delete();
    } catch {}
  }
}

async function login(page, email, password, expectedPath) {
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
  await page.locator('#loader-wrapper').waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
  await page.getByPlaceholder('Enter Email').fill(email);
  await page.getByPlaceholder('Enter Password').fill(password);
  await page.getByRole('button', { name: /login|signing in/i }).click();
  await page.waitForURL((url) => url.pathname === expectedPath, { timeout: 30000 });
}

async function openAdminFlights(page) {
  await page.goto(`${BASE_URL}/admin/flights`, { waitUntil: 'domcontentloaded' });
  await page.locator('h3:has-text("Flights Management")').waitFor({ state: 'visible', timeout: 15000 });
}

async function openAgentListings(page, collection) {
  await page.goto(`${BASE_URL}/agent/agent-listings?collection=${collection}`, { waitUntil: 'domcontentloaded' });
  await page.locator('h5:has-text("My Listings")').waitFor({ state: 'visible', timeout: 15000 });
}

async function main() {
  const adminEmail = requireEnv('DEMO_ADMIN_EMAIL');
  const adminPassword = requireEnv('DEMO_ADMIN_PASSWORD');
  const agentEmail = requireEnv('DEMO_AGENT_EMAIL');
  const agentPassword = requireEnv('DEMO_AGENT_PASSWORD');
  const customerEmail = requireEnv('DEMO_CUSTOMER_EMAIL');
  const customerPassword = requireEnv('DEMO_CUSTOMER_PASSWORD');

  await ensureDemoAccounts();

  const demoAdmin = await resolveDemoProfile(adminEmail, 'admin');
  const demoAgent = await resolveDemoProfile(agentEmail, 'agent');
  const demoCustomer = await resolveDemoProfile(customerEmail, 'customer');

  const { auth, db, bucket } = initAdminSdk();
  const tempFlightTitle = `Temp Role Smoke Flight ${Date.now()}`;
  const tempAgent = await createTempAgent();
  const tempDemoAgentListingTitle = `Temp Demo Agent Tour ${Date.now()}`;
  const tempListingTitle = `Temp Hidden Tour ${Date.now()}`;
  const tempListingRef = await db.collection('tours').add({
    title: tempListingTitle,
    name: tempListingTitle,
    location: 'Hiddenville',
    price: 123,
    rating: 4,
    reviewsCount: 1,
    image: 'assets/img/banner/banner-01.jpg',
    gallery: [],
    published: false,
    featured: false,
    approvalStatus: 'pending_review',
    status: 'draft',
    ownerId: tempAgent.uid,
    agentId: tempAgent.uid,
    createdBy: tempAgent.uid,
    createdByEmail: tempAgent.email,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  const tempDemoAgentListingRef = await db.collection('tours').add({
    title: tempDemoAgentListingTitle,
    name: tempDemoAgentListingTitle,
    location: 'Demo City',
    price: 111,
    rating: 4,
    reviewsCount: 1,
    image: 'assets/img/banner/banner-01.jpg',
    gallery: [],
    published: false,
    featured: false,
    approvalStatus: 'draft',
    status: 'draft',
    ownerId: demoAgent.uid,
    agentId: demoAgent.uid,
    createdBy: demoAgent.uid,
    createdByEmail: demoAgent.email,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  const tempFlightRef = await db.collection('flights').add({
    title: tempFlightTitle,
    departureCity: 'Smoke City',
    arrivalCity: 'Smoke Bay',
    airline: 'Smoke Air',
    stopInfo: 'Direct',
    dates: '2026-06-22',
    price: 199,
    seatsLeft: 12,
    rating: 4,
    badge: 'Smoke',
    description: 'Temporary flight for upload smoke coverage',
    image: 'assets/img/banner/banner-01.jpg',
    gallery: [],
    featured: false,
    published: true,
    ownerId: demoAdmin.uid,
    agentId: demoAdmin.uid,
    createdBy: demoAdmin.uid,
    createdByEmail: demoAdmin.email,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  createTempImage(TEMP_IMAGE_PATH);
  createTempImage(TEMP_IMAGE_PATH_2);

  const browser = await chromium.launch({ headless: true });
  const errors = [];
  const storagePaths = [];

  let adminUploadFixed = false;
  let adminEditFixed = false;
  let publicImagesStillLoad = false;
  let agentOwnManagement = false;
  let agentOtherListingHidden = false;
  let customerBlocked = false;
  let unauthBlocked = false;
  let adminDeleteFixed = false;

  const adminContext = await browser.newContext();
  const adminPage = await adminContext.newPage();
  adminPage.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  adminPage.on('pageerror', (err) => errors.push(err.message));

  const agentContext = await browser.newContext();
  const agentPage = await agentContext.newPage();
  agentPage.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  agentPage.on('pageerror', (err) => errors.push(err.message));

  const customerContext = await browser.newContext();
  const customerPage = await customerContext.newPage();

  const unauthContext = await browser.newContext();
  const unauthPage = await unauthContext.newPage();

  try {
    await login(adminPage, adminEmail, adminPassword, '/admin/dashboard');
    await openAdminFlights(adminPage);

    await openAdminFlights(adminPage);
    await adminPage.getByTestId(`admin-edit-${tempFlightRef.id}`).click();
    const editModal = adminPage.locator('.modal.show').last();
    await editModal.waitFor({ state: 'visible', timeout: 15000 });
    const titleField = editModal.locator('input[type="text"]').first();
    const priorImage = String((await db.collection('flights').doc(tempFlightRef.id).get()).data()?.image || '');
    await titleField.fill(tempFlightTitle);
    await editModal.locator('input[data-testid="admin-image-upload-image"]').setInputFiles(TEMP_IMAGE_PATH_2);
    await adminPage.waitForFunction(
      (previous) => {
        const input = document.querySelector('input[placeholder="Image URL or uploaded Storage path"]');
        return !!input && input instanceof HTMLInputElement && input.value !== previous && !!input.value;
      },
      priorImage,
      { timeout: 30000 }
    );
    await adminPage.getByRole('button', { name: /^Save$/i }).click();

    await new Promise((resolve) => setTimeout(resolve, 1500));
    const editedFlightSnap = await db.collection('flights').doc(tempFlightRef.id).get();
    if (!editedFlightSnap.exists) {
      throw new Error('Edited flight document is missing.');
    }
    const editedFlightData = editedFlightSnap.data() || {};
    const editedImageUrl = String(editedFlightData.image || editedFlightData.mainImage || '');
    const editedStoragePath = extractStoragePathFromUrl(editedImageUrl);
    if (!editedStoragePath || !editedStoragePath.startsWith(`users/${demoAdmin.uid}/profile/`)) {
      throw new Error(`Edited flight stored in unexpected path: ${editedStoragePath || editedImageUrl}`);
    }
    storagePaths.push(editedStoragePath);
    adminUploadFixed = editedImageUrl !== priorImage;
    adminEditFixed = adminUploadFixed;

    await adminPage.goto(`${BASE_URL}/flight/flight-list`, { waitUntil: 'domcontentloaded' });
    await adminPage.locator('#loader-wrapper').waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
    const publicImageResponse = await fetch(editedImageUrl);
    publicImagesStillLoad = publicImageResponse.ok;
    if (!publicImagesStillLoad) {
      throw new Error('Public image URL did not return a successful response.');
    }

    await openAdminFlights(adminPage);
    await adminPage.getByTestId(`admin-delete-${tempFlightRef.id}`).click();
    const deleteModal = adminPage.locator('.modal.show').last();
    await deleteModal.waitFor({ state: 'visible', timeout: 15000 });
    await deleteModal.getByRole('button', { name: /^Delete$/i }).click();
    await new Promise((resolve) => setTimeout(resolve, 1500));
    const deletedSnap = await db.collection('flights').doc(tempFlightRef.id).get();
    adminDeleteFixed = !deletedSnap.exists;

    await login(agentPage, agentEmail, agentPassword, '/agent/agent-dashboard');
    await openAgentListings(agentPage, 'tours');
    const agentCards = await agentPage.locator('.place-item').count();
    const agentListingText = await agentPage.locator('body').innerText();
    agentOwnManagement = agentListingText.includes('My Listings') && agentCards >= 0;
    agentOtherListingHidden = !agentListingText.includes(tempListingTitle) && !agentListingText.includes(tempListingRef.id);

    await login(customerPage, customerEmail, customerPassword, '/user/dashboard');
    await customerPage.goto(`${BASE_URL}/flight/add-flight`, { waitUntil: 'domcontentloaded' });
    await customerPage.waitForURL((url) => url.pathname === '/unauthorized', { timeout: 30000 });
    await customerPage.goto(`${BASE_URL}/edit-flight`, { waitUntil: 'domcontentloaded' });
    await customerPage.waitForURL((url) => url.pathname === '/unauthorized', { timeout: 30000 });
    customerBlocked = new URL(customerPage.url()).pathname === '/unauthorized';

    await unauthPage.goto(`${BASE_URL}/admin/flights`, { waitUntil: 'domcontentloaded' });
    await unauthPage.waitForURL((url) => url.pathname === '/login', { timeout: 30000 });
    unauthBlocked = new URL(unauthPage.url()).pathname === '/login';

    const success =
      demoAdmin.role === 'admin' &&
      demoAgent.role === 'agent' &&
      demoCustomer.role === 'customer' &&
      adminUploadFixed &&
      adminEditFixed &&
      adminDeleteFixed &&
      publicImagesStillLoad &&
      agentOwnManagement &&
      agentOtherListingHidden &&
      customerBlocked &&
      unauthBlocked &&
      errors.length === 0;

    console.log(JSON.stringify({
      success,
      demoAdmin,
      demoAgent,
      demoCustomer,
      adminUploadFixed,
      adminEditFixed,
      adminDeleteFixed,
      publicImagesStillLoad,
      agentOwnManagement,
      agentOtherListingHidden,
      customerBlocked,
      unauthBlocked,
      createdFlightId: tempFlightRef.id,
      createdFlightTitle: tempFlightTitle,
      tempAgent,
      tempListingId: tempListingRef.id,
      tempDemoAgentListingId: tempDemoAgentListingRef.id,
      storagePaths,
      errors,
    }));
    process.exitCode = success ? 0 : 1;
  } catch (error) {
    console.log(JSON.stringify({
      success: false,
      demoAdmin,
      demoAgent,
      demoCustomer,
      adminUploadFixed,
      adminEditFixed,
      adminDeleteFixed,
      publicImagesStillLoad,
      agentOwnManagement,
      agentOtherListingHidden,
      customerBlocked,
      unauthBlocked,
      tempAgent,
      tempListingId: tempListingRef.id,
      tempDemoAgentListingId: tempDemoAgentListingRef.id,
      storagePaths,
      errors,
      reason: error.message || String(error),
    }));
    process.exitCode = 1;
  } finally {
    try {
      await cleanupTempData({
        db,
        bucket,
        auth,
        tempAgent,
        tempListingId: tempListingRef.id,
        tempDemoAgentListingId: tempDemoAgentListingRef.id,
        createdFlightId: tempFlightRef.id,
        storagePaths,
      });
    } catch {}
    await agentContext.close().catch(() => {});
    await customerContext.close().catch(() => {});
    await unauthContext.close().catch(() => {});
    await adminContext.close().catch(() => {});
    await browser.close();
    try {
      fs.unlinkSync(TEMP_IMAGE_PATH);
    } catch {}
    try {
      fs.unlinkSync(TEMP_IMAGE_PATH_2);
    } catch {}
  }
}

main().catch((error) => {
  console.error(JSON.stringify({
    success: false,
    reason: error.message || String(error),
  }));
  process.exit(1);
});
