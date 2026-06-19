import fs from 'node:fs';
import path from 'node:path';
import admin from 'firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { Storage } from '@google-cloud/storage';
import { chromium } from 'playwright';

const PROJECT_ID = 'tour-tunisi';
const APP_URL = 'http://localhost:5174';
const FIREBASE_API_KEY = 'AIzaSyA53UvUPYNbs5sBK7Y8dS1-GnidLbmXO3g';
const STORAGE_BUCKET = 'tour-tunisi.firebasestorage.app';
const TEMP_DIR = 'C:/Users/bilal/AppData/Local/Temp/opencode';
const TEMP_IMAGE_PATH = path.join(TEMP_DIR, 'temp-chalet-upload.png');

function initAdminSdk() {
  if (admin.getApps().length === 0) {
    admin.initializeApp({ projectId: PROJECT_ID });
  }
  return {
    auth: getAuth(),
    db: getFirestore(),
    storage: new Storage({ projectId: PROJECT_ID }).bucket(STORAGE_BUCKET),
  };
}

function randomStamp() {
  return Date.now().toString();
}

function createTempImage() {
  if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
  }
  const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO7+G5sAAAAASUVORK5CYII=';
  fs.writeFileSync(TEMP_IMAGE_PATH, Buffer.from(pngBase64, 'base64'));
  return TEMP_IMAGE_PATH;
}

async function createTempUser({ role, displayName, emailPrefix, password, agentApproved = false }) {
  const { auth, db } = initAdminSdk();
  const stamp = randomStamp();
  const email = `${emailPrefix}.${stamp}@example.com`;
  const user = await auth.createUser({ email, password, displayName });
  const claims = { role };
  await auth.setCustomUserClaims(user.uid, claims);

  const now = new Date().toISOString();
  const profile = {
    uid: user.uid,
    email,
    displayName,
    role,
    createdAt: now,
    updatedAt: now,
  };

  if (role === 'agent') {
    profile.agentStatus = agentApproved ? 'approved' : 'pending';
    profile.approved = !!agentApproved;
    profile.suspended = false;
    if (agentApproved) profile.approvedAt = now;
  }

  await db.collection('users').doc(user.uid).set(profile, { merge: true });
  return { uid: user.uid, email, password, role };
}

export async function createTemporaryApprovedAgent() {
  return createTempUser({
    role: 'agent',
    displayName: 'Temp Chalet Agent',
    emailPrefix: 'temp.agent',
    password: 'TempAgent123!',
    agentApproved: true,
  });
}

async function createTemporaryAdmin() {
  return createTempUser({
    role: 'admin',
    displayName: 'Temp Chalet Admin',
    emailPrefix: 'temp.admin',
    password: 'TempAdmin123!',
  });
}

async function createTemporaryCustomer() {
  return createTempUser({
    role: 'customer',
    displayName: 'Temp Chalet Customer',
    emailPrefix: 'temp.customer',
    password: 'TempCustomer123!',
  });
}

export async function loginAsAgent(page, creds) {
  await page.goto(`${APP_URL}/login`, { waitUntil: 'domcontentloaded' });
  await page.getByPlaceholder('Enter Email').fill(creds.email);
  await page.getByPlaceholder('Enter Password').fill(creds.password);
  await page.getByRole('button', { name: 'Login' }).click();
  await page.waitForTimeout(8000);
}

export async function loginAsAdmin(page, creds) {
  await page.goto(`${APP_URL}/login`, { waitUntil: 'domcontentloaded' });
  await page.getByPlaceholder('Enter Email').fill(creds.email);
  await page.getByPlaceholder('Enter Password').fill(creds.password);
  await page.getByRole('button', { name: 'Login' }).click();
  await page.waitForTimeout(8000);
}

const COLLECTION_FIELDS = {
  chalets: {
    name: 'name',
    description: 'description',
    location: 'location',
    price: 'pricePerNight',
    image: 'mainImage',
  },
  resorts: {
    name: 'name',
    description: 'description',
    location: 'location',
    price: 'startingPrice',
    image: 'mainImage',
  },
};

function getFieldMap(collection) {
  return COLLECTION_FIELDS[collection] || COLLECTION_FIELDS.chalets;
}

async function findListingByName(collection, name) {
  const { db } = initAdminSdk();
  const snap = await db.collection(collection).where('name', '==', name).get();
  if (!snap.empty) return { id: snap.docs[0].id, data: snap.docs[0].data() };
  const titleSnap = await db.collection(collection).where('title', '==', name).get();
  if (!titleSnap.empty) return { id: titleSnap.docs[0].id, data: titleSnap.docs[0].data() };
  throw new Error(`Listing not found for ${collection}: ${name}`);
}

export async function createDraftListing(page, collection, listing) {
  const fieldMap = getFieldMap(collection);
  await page.goto(`${APP_URL}/agent/agent-listings?collection=${collection}`, { waitUntil: 'load' });
  await page.getByTestId('agent-add-listing').click();
  await page.waitForTimeout(1000);

  const uniqueName = listing.name || `${collection.slice(0, -1)} ${randomStamp()}`;
  await page.getByTestId(`agent-field-${fieldMap.name}`).fill(uniqueName);
  if (listing.description) {
    await page.getByTestId(`agent-field-${fieldMap.description}`).fill(listing.description);
  }
  if (listing.location) {
    await page.getByTestId(`agent-field-${fieldMap.location}`).fill(listing.location);
  }
  if (listing.price !== undefined) {
    await page.getByTestId(`agent-field-${fieldMap.price}`).fill(String(listing.price));
  }
  if (listing.imagePath) {
    await page.getByTestId(`agent-field-${fieldMap.image}`).setInputFiles(listing.imagePath);
    await page.waitForTimeout(2000);
  }

  await page.getByTestId('agent-save-draft').click();
  await page.waitForTimeout(7000);

  const listingRef = await findListingByName(collection, uniqueName);
  return { id: listingRef.id, name: uniqueName, data: listingRef.data };
}

export async function submitListingForReview(page, collection, listingId) {
  await page.goto(`${APP_URL}/agent/agent-listings?collection=${collection}`, { waitUntil: 'load' });
  await page.getByTestId(`agent-submit-for-review-${listingId}`).click();
  await page.waitForTimeout(6000);
}

export async function approveListingFromAdmin(page, collection, listingId) {
  await page.goto(`${APP_URL}/admin/${collection}`, { waitUntil: 'load' });
  await page.getByTestId(`admin-approve-${listingId}`).click();
  await page.waitForTimeout(6000);
}

export async function verifyFirestoreFields(collection, listingId, expected = {}) {
  const { db } = initAdminSdk();
  const snap = await db.collection(collection).doc(listingId).get();
  if (!snap.exists) {
    throw new Error(`Missing Firestore document: ${collection}/${listingId}`);
  }
  const data = snap.data();
  for (const [key, value] of Object.entries(expected)) {
    if (data[key] !== value) {
      throw new Error(`Field mismatch for ${key}: expected ${value}, got ${data[key]}`);
    }
  }
  return data;
}

async function directFirestoreReadStatus(page, collection, listingId) {
  return page.evaluate(async ({ apiKey, projectId, collectionName, docId }) => {
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${collectionName}/${docId}?key=${apiKey}`;
    const res = await fetch(url);
    return { status: res.status, text: await res.text() };
  }, { apiKey: FIREBASE_API_KEY, projectId: PROJECT_ID, collectionName: collection, docId: listingId });
}

export async function cleanupTemporaryListingAndUser({
  listing,
  agent,
  adminUser,
  customer,
  storagePaths = [],
}) {
  const { auth, db, storage } = initAdminSdk();

  if (listing?.id) {
    try { await db.collection('chalets').doc(listing.id).delete(); } catch {}
  }

  for (const filePath of storagePaths) {
    try { await storage.deleteFiles({ prefix: filePath }); } catch {}
  }

  for (const user of [agent, adminUser, customer].filter(Boolean)) {
    try { await auth.deleteUser(user.uid); } catch {}
    try { await db.collection('users').doc(user.uid).delete(); } catch {}
  }

  try { fs.unlinkSync(TEMP_IMAGE_PATH); } catch {}
}

export async function runChaletVerification() {
  const agent = await createTemporaryApprovedAgent();
  const adminUser = await createTemporaryAdmin();
  const customer = await createTemporaryCustomer();
  const imagePath = createTempImage();
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  let listing;
  try {
    await loginAsAgent(page, agent);
    listing = await createDraftListing(page, 'chalets', {
      name: `Temp Chalet ${randomStamp()}`,
      description: 'Temporary chalet for chalets verification',
      location: 'Testville',
      price: 250,
      imagePath,
    });

    await page.goto(`${APP_URL}/agent/agent-listings?collection=chalets`, { waitUntil: 'load' });
    await page.getByTestId(`agent-edit-${listing.id}`).click();
    await page.waitForTimeout(1000);
    const resolved = await Promise.all([
      page.getByTestId('agent-field-ownerId').count(),
      page.getByTestId('agent-field-agentId').count(),
      page.getByTestId('agent-field-createdBy').count(),
    ]);
    if (resolved.some((count) => count !== 0)) {
      throw new Error('Ownership fields should not be editable in the agent UI.');
    }

    await page.getByRole('button', { name: 'Cancel' }).last().click();

    await submitListingForReview(page, 'chalets', listing.id);

    const pendingRead = await directFirestoreReadStatus(page, 'chalets', listing.id);
    if (pendingRead.status !== 403) {
      throw new Error(`Pending chalet should not be publicly readable, got ${pendingRead.status}`);
    }

    await loginAsAdmin(page, adminUser);
    await approveListingFromAdmin(page, 'chalets', listing.id);

    const approved = await verifyFirestoreFields('chalets', listing.id, {
      approvalStatus: 'approved',
      published: true,
      ownerId: agent.uid,
      agentId: agent.uid,
    });

    const publicRead = await directFirestoreReadStatus(page, 'chalets', listing.id);
    if (publicRead.status !== 200) {
      throw new Error(`Approved chalet should be publicly readable, got ${publicRead.status}`);
    }

    await loginAsAgent(page, customer);
    await page.goto(`${APP_URL}/agent/agent-listings?collection=chalets`, { waitUntil: 'load' });
    await page.waitForTimeout(4000);
    if (!page.url().includes('/unauthorized')) {
      throw new Error('Customer should not access Agent Chalets.');
    }

    return {
      listingId: listing.id,
      listingName: listing.name,
      approved,
      publicRead,
      pendingRead,
    };
  } finally {
    await browser.close();
    await cleanupTemporaryListingAndUser({
      listing,
      agent,
      adminUser,
      customer,
      storagePaths: [
        `agents/${agent.uid}/listings/chalets/temp`,
      ],
    });
  }
}

if (process.argv[1] && process.argv[1].endsWith('agentListingVerification.mjs')) {
  const mode = process.argv[2] || 'chalets';
  if (mode !== 'chalets') {
    console.error('Only chalet verification is wired in this helper.');
    process.exit(1);
  }

  runChaletVerification()
    .then((result) => {
      console.log(JSON.stringify(result, null, 2));
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
