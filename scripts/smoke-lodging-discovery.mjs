import admin from 'firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { chromium } from 'playwright';
import { createTemporaryApprovedAgent } from './agentListingVerification.mjs';

const PROJECT_ID = 'tour-tunisi';
const BASE_URL = process.env.BASE_URL || 'http://localhost:5174';

function initAdminSdk() {
  if (admin.getApps().length === 0) {
    admin.initializeApp({ projectId: PROJECT_ID });
  }
  return { auth: getAuth(), db: getFirestore() };
}

async function createPublishedLodging(db, agentUid, collectionName, listingType, title, image, location, priceField, priceValue) {
  const docRef = await db.collection(collectionName).add({
    agentId: agentUid,
    ownerId: agentUid,
    createdBy: agentUid,
    listingCategory: 'lodging',
    propertyType: listingType,
    title,
    name: title,
    description: `Temporary ${listingType} for discovery smoke`,
    mainImage: image,
    image,
    gallery: [image],
    location,
    [priceField]: priceValue,
    price: priceValue,
    published: true,
    approvalStatus: 'approved',
    status: 'approved',
    amenities: ['Pool', 'WiFi'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  return docRef.id;
}

async function verifyListingCard(page, listRoute, detailRoute, listingType, listingId, title) {
  await page.goto(`${BASE_URL}${listRoute}`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(4000);

  const href = await page.getAttribute(`[data-testid="${listingType}-card-link-${listingId}"]`, 'href');
  const titleVisible = await page.locator(`[data-testid="${listingType}-title-link-${listingId}"]`).isVisible();
  const body = (await page.textContent('body')) || '';

  const cardLoaded = titleVisible && body.includes(title);
  const linkMatches = href === `${detailRoute}?id=${listingId}`;

  if (titleVisible) {
    await page.locator(`[data-testid="${listingType}-title-link-${listingId}"]`).first().click();
    await page.waitForURL((url) => url.toString().includes(`${detailRoute}?id=${listingId}`), { timeout: 30000 });
    await page.waitForTimeout(3000);
  }

  const detailBody = (await page.textContent('body')) || '';
  const detailLoaded = page.url().includes(`${detailRoute}?id=${listingId}`) && detailBody.includes(title);

  return {
    cardLoaded,
    linkMatches,
    detailLoaded,
    href,
    pageUrl: page.url(),
  };
}

async function main() {
  const { auth, db } = initAdminSdk();
  const agent = await createTemporaryApprovedAgent();
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const errors = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (err) => errors.push(err.message));

  let chaletId = '';
  let resortId = '';

  try {
    chaletId = await createPublishedLodging(
      db,
      agent.uid,
      'chalets',
      'chalet',
      `Temp Discovery Chalet ${Date.now()}`,
      'assets/img/hotels/hotel-large-02.jpg',
      'Discovery Chalet Valley',
      'pricePerNight',
      432,
    );

    resortId = await createPublishedLodging(
      db,
      agent.uid,
      'resorts',
      'resort',
      `Temp Discovery Resort ${Date.now()}`,
      'assets/img/hotels/hotel-large-01.jpg',
      'Discovery Resort Bay',
      'startingPrice',
      654,
    );

    const chaletTitle = (await db.collection('chalets').doc(chaletId).get()).data()?.title;
    const resortTitle = (await db.collection('resorts').doc(resortId).get()).data()?.title;

    const chalet = await verifyListingCard(page, '/chalet/chalet-grid', '/chalet/chalet-details', 'chalet', chaletId, chaletTitle);
    const resort = await verifyListingCard(page, '/resort/resort-grid', '/resort/resort-details', 'resort', resortId, resortTitle);

    const success = chalet.cardLoaded && chalet.linkMatches && chalet.detailLoaded && resort.cardLoaded && resort.linkMatches && resort.detailLoaded;

    console.log(JSON.stringify({
      chaletId,
      resortId,
      chalet,
      resort,
      errors,
    }));
    process.exitCode = success ? 0 : 1;
  } catch (err) {
    console.log(JSON.stringify({
      chaletId,
      resortId,
      errors,
      reason: err.message || String(err),
    }));
    process.exitCode = 1;
  } finally {
    try {
      if (chaletId) {
        await db.collection('chalets').doc(chaletId).delete();
      }
      if (resortId) {
        await db.collection('resorts').doc(resortId).delete();
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
