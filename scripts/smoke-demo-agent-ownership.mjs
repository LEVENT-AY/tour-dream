import admin from 'firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { chromium } from 'playwright';
import { ensureDemoAccounts } from './ensure-demo-accounts.mjs';

const PROJECT_ID = 'tour-tunisi';
const BASE_URL = process.env.BASE_URL || 'http://localhost:5174';
const LISTING_COLLECTIONS = ['tours', 'hotels', 'flights', 'cars', 'activities', 'resorts', 'chalets'];

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

async function resolveDemoAgent(email) {
  const { auth, db } = initAdminSdk();
  const user = await auth.getUserByEmail(email);
  const profileSnap = await db.collection('users').doc(user.uid).get();
  if (!profileSnap.exists) {
    throw new Error('Missing Firestore profile for demo agent.');
  }
  const profile = profileSnap.data() || {};
  if (profile.role !== 'agent' || user.customClaims?.role !== 'agent') {
    throw new Error('Demo agent role is invalid.');
  }
  if (profile.agentStatus !== 'approved' || profile.approved !== true || profile.suspended === true) {
    throw new Error('Demo agent is not approved.');
  }
  return {
    uid: user.uid,
    email: user.email || email,
    displayName: profile.displayName || user.displayName || '',
    role: profile.role,
    status: profile.agentStatus,
  };
}

function isOwnedByAgent(data, agentUid) {
  return (
    data.agentId === agentUid ||
    data.agentUid === agentUid ||
    data.ownerId === agentUid ||
    data.userId === agentUid ||
    data.createdBy === agentUid ||
    data.listingOwnerId === agentUid ||
    data.hostId === agentUid ||
    data.vendorId === agentUid ||
    data.companyId === agentUid
  );
}

async function verifyListingCollections(db, agentUid) {
  const summaries = [];

  for (const collectionName of LISTING_COLLECTIONS) {
    const snapshot = await db.collection(collectionName).get();
    const total = snapshot.size;
    const owned = snapshot.docs.filter((doc) => isOwnedByAgent(doc.data() || {}, agentUid)).length;
    summaries.push({
      collectionName,
      total,
      owned,
      allOwned: total > 0 ? owned === total : true,
    });
  }

  return summaries;
}

async function loginAsAgent(page, email, password) {
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
  await page.locator('#loader-wrapper').waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
  const loginCard = page.locator('.authentication-card');
  await loginCard.waitFor({ state: 'visible', timeout: 15000 });
  await loginCard.locator('input[placeholder="Enter Email"]').first().fill(email);
  await loginCard.locator('input[placeholder="Enter Password"]').first().fill(password);
  await loginCard.getByRole('button', { name: /login|signing in/i }).click();
  await page.waitForURL((url) => url.pathname === '/agent/agent-dashboard', { timeout: 30000 });
}

async function verifyPublicPageLoads(page, path) {
  await page.goto(`${BASE_URL}${path}`, { waitUntil: 'domcontentloaded' });
  await page.locator('#loader-wrapper').waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
  await page.locator('body').waitFor({ state: 'visible', timeout: 15000 });
  const text = await page.locator('body').innerText();
  return text.trim().length > 0;
}

async function main() {
  requireEnv('DEMO_ADMIN_EMAIL');
  requireEnv('DEMO_ADMIN_PASSWORD');
  const agentEmail = requireEnv('DEMO_AGENT_EMAIL');
  const agentPassword = requireEnv('DEMO_AGENT_PASSWORD');
  requireEnv('DEMO_CUSTOMER_EMAIL');
  requireEnv('DEMO_CUSTOMER_PASSWORD');

  await ensureDemoAccounts();
  const agent = await resolveDemoAgent(agentEmail);

  const { db } = initAdminSdk();
  const listingSummaries = await verifyListingCollections(db, agent.uid);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  const errors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (err) => errors.push(err.message));

  const publicPaths = [
    '/tour/tour-grid',
    '/hotel/hotel-grid',
    '/flight/flight-grid',
    '/car/car-grid',
    '/activity/activity-grid',
    '/resort/resort-grid',
    '/chalet/chalet-grid',
  ];

  try {
    await loginAsAgent(page, agentEmail, agentPassword);
    const dashboardVisible = new URL(page.url()).pathname === '/agent/agent-dashboard';

    await page.goto(`${BASE_URL}/agent/agent-listings?collection=tours`, { waitUntil: 'domcontentloaded' });
    await page.locator('#loader-wrapper').waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
    await page.locator('h5:has-text("My Listings")').waitFor({ state: 'visible', timeout: 15000 });
    await page.waitForFunction(() => document.querySelectorAll('.place-item').length > 0, null, { timeout: 30000 });
    const cardCount = await page.locator('.place-item').count();
    if (cardCount === 0) {
      throw new Error('Agent listings page did not render any assigned listings.');
    }

    const publicLoads = [];
    for (const path of publicPaths) {
      publicLoads.push({ path, loaded: await verifyPublicPageLoads(page, path) });
    }

    const success =
      listingSummaries.every((item) => item.allOwned) &&
      dashboardVisible &&
      publicLoads.every((item) => item.loaded) &&
      errors.length === 0;

    console.log(JSON.stringify({
      success,
      agent,
      listingSummaries,
      dashboardVisible,
      publicLoads,
      errors,
    }));
    process.exitCode = success ? 0 : 1;
  } catch (error) {
    console.log(JSON.stringify({
      success: false,
      agent,
      listingSummaries,
      errors,
      reason: error.message || String(error),
    }));
    process.exitCode = 1;
  } finally {
    await context.close();
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
