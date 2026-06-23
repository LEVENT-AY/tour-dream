import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { chromium } from 'playwright';

const PROJECT_ID = 'tour-tunisi';
const BASE_URL = process.env.BASE_URL || 'http://localhost:5174';

function initAdminSdk() {
  if (admin.getApps().length === 0) {
    admin.initializeApp({ projectId: PROJECT_ID });
  }
  return { db: getFirestore() };
}

async function createDoc(db, collectionName, payload) {
  const ref = db.collection(collectionName).doc();
  await ref.set({
    ...payload,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  return ref.id;
}

const createCar = (db, stamp) =>
  createDoc(db, 'cars', {
    title: `QA Firestore Car ${stamp}`,
    name: `QA Firestore Car ${stamp}`,
    type: 'SUV',
    location: 'QA Car City',
    fuel: 'Hybrid',
    gear: 'Auto',
    travelled: '120 KM',
    price: 311,
    rating: 4.6,
    reviewsCount: 19,
    badge: 'QA Car Badge',
    description: 'QA car description for Firestore detail smoke.',
    image: `https://placehold.co/1200x800/png?text=car-${stamp}`,
    gallery: [
      `https://placehold.co/1200x800/png?text=car-${stamp}-1`,
      `https://placehold.co/1200x800/png?text=car-${stamp}-2`,
      `https://placehold.co/1200x800/png?text=car-${stamp}-3`,
    ],
    featured: true,
    published: true,
  });

const createTour = (db, stamp) =>
  createDoc(db, 'tours', {
    title: `QA Firestore Tour ${stamp}`,
    name: `QA Firestore Tour ${stamp}`,
    category: 'Adventure',
    location: 'QA Tour City',
    duration: '5 Day, 4 Night',
    price: 722,
    rating: 4.8,
    reviewsCount: 24,
    badge: 'QA Tour Badge',
    description: 'QA tour description for Firestore detail smoke.',
    image: `https://placehold.co/1200x800/png?text=tour-${stamp}`,
    gallery: [
      `https://placehold.co/1200x800/png?text=tour-${stamp}-1`,
      `https://placehold.co/1200x800/png?text=tour-${stamp}-2`,
      `https://placehold.co/1200x800/png?text=tour-${stamp}-3`,
    ],
    featured: true,
    published: true,
  });

const createActivity = (db, stamp) =>
  createDoc(db, 'activities', {
    title: `QA Firestore Activity ${stamp}`,
    name: `QA Firestore Activity ${stamp}`,
    category: 'Water Sports',
    location: 'QA Activity Bay',
    duration: '04 hours',
    price: 188,
    rating: 4.9,
    reviewsCount: 31,
    badge: 'QA Activity Badge',
    description: 'QA activity description for Firestore detail smoke.',
    image: `https://placehold.co/1200x800/png?text=activity-${stamp}`,
    gallery: [
      `https://placehold.co/1200x800/png?text=activity-${stamp}-1`,
      `https://placehold.co/1200x800/png?text=activity-${stamp}-2`,
      `https://placehold.co/1200x800/png?text=activity-${stamp}-3`,
    ],
    featured: true,
    published: true,
  });

const createChalet = (db, stamp) =>
  createDoc(db, 'chalets', {
    name: `QA Firestore Chalet ${stamp}`,
    title: `QA Firestore Chalet ${stamp}`,
    description: 'QA chalet description for Firestore detail smoke.',
    location: 'QA Chalet Valley',
    capacity: 6,
    bedrooms: 3,
    bathrooms: 2,
    pricePerNight: 455,
    amenities: ['Fireplace', 'Mountain View'],
    mainImage: `https://placehold.co/1200x800/png?text=chalet-${stamp}`,
    gallery: [
      `https://placehold.co/1200x800/png?text=chalet-${stamp}-1`,
      `https://placehold.co/1200x800/png?text=chalet-${stamp}-2`,
    ],
    featured: true,
    published: true,
    approvalStatus: 'approved',
    status: 'approved',
    availability: true,
  });

const createResort = (db, stamp) =>
  createDoc(db, 'resorts', {
    name: `QA Firestore Resort ${stamp}`,
    title: `QA Firestore Resort ${stamp}`,
    description: 'QA resort description for Firestore detail smoke.',
    location: 'QA Resort Bay',
    rating: 4.7,
    startingPrice: 599,
    amenities: ['Spa', 'Pool'],
    mainImage: `https://placehold.co/1200x800/png?text=resort-${stamp}`,
    gallery: [
      `https://placehold.co/1200x800/png?text=resort-${stamp}-1`,
      `https://placehold.co/1200x800/png?text=resort-${stamp}-2`,
    ],
    featured: true,
    published: true,
    approvalStatus: 'approved',
    status: 'approved',
    availability: true,
  });

async function expectCardLink(page, tabSelector, title, expectedPath, expectedId) {
  const tab = page.locator(tabSelector);
  await tab.waitFor({ state: 'visible', timeout: 20000 });
  const card = tab.locator('.trending-list-item').filter({ hasText: title }).first();
  await card.waitFor({ state: 'visible', timeout: 20000 });
  const anchor = card.locator('a').first();
  const href = await anchor.getAttribute('href');
  const cardText = (await card.textContent()) || '';
  return {
    href,
    cardText,
    hrefMatches: Boolean(href && href.includes(`${expectedPath}?id=${expectedId}`)),
    titleMatches: cardText.includes(title),
  };
}

async function checkDetail(page, url, title, checks = []) {
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);
  const body = (await page.textContent('body')) || '';
  const results = {
    url: page.url(),
    titleMatches: body.includes(title),
    checks: checks.map((check) => ({ label: check.label, pass: body.includes(check.value) })),
    bodyPreview: body.slice(0, 400),
  };
  return results;
}

async function main() {
  const { db } = initAdminSdk();
  const stamp = Date.now();
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  const errors = [];
  const created = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (err) => errors.push(err.message));

  try {
    const [carId, tourId, activityId, chaletId, resortId] = await Promise.all([
      createCar(db, stamp),
      createTour(db, stamp),
      createActivity(db, stamp),
      createChalet(db, stamp),
      createResort(db, stamp),
    ]);
    created.push(
      { collection: 'cars', id: carId },
      { collection: 'tours', id: tourId },
      { collection: 'activities', id: activityId },
      { collection: 'chalets', id: chaletId },
      { collection: 'resorts', id: resortId }
    );

    await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
    await page.locator('#loader-wrapper').waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
    await page.getByText('Trending Listings & Best Sellers', { exact: false }).waitFor({ state: 'visible', timeout: 15000 });

    await page.locator('.trending-list .nav-link[data-bs-target="#tab-3"]').click();
    await page.waitForTimeout(1000);
    const carCard = await expectCardLink(page, '#tab-3', `QA Firestore Car ${stamp}`, '/car/car-details', carId);

    await page.locator('.trending-list .nav-link[data-bs-target="#tab-5"]').click();
    await page.waitForTimeout(1000);
    const tourCard = await expectCardLink(page, '#tab-5', `QA Firestore Tour ${stamp}`, '/tour/tour-details', tourId);

    await page.locator('.trending-list .nav-link[data-bs-target="#tab-6"]').click();
    await page.waitForTimeout(1000);
    const activityCard = await expectCardLink(page, '#tab-6', `QA Firestore Activity ${stamp}`, '/activity/activity-details', activityId);

    const carDetail = await checkDetail(page, `${BASE_URL}/car/car-details?id=${carId}`, `QA Firestore Car ${stamp}`, [
      { label: 'location', value: 'QA Car City' },
      { label: 'price', value: '$311' },
      { label: 'rating', value: '4.6' },
      { label: 'description', value: 'QA car description for Firestore detail smoke.' },
    ]);

    const tourDetail = await checkDetail(page, `${BASE_URL}/tour/tour-details?id=${tourId}`, `QA Firestore Tour ${stamp}`, [
      { label: 'location', value: 'QA Tour City' },
      { label: 'price', value: '$722' },
      { label: 'duration', value: '5 Day, 4 Night' },
      { label: 'description', value: 'QA tour description for Firestore detail smoke.' },
    ]);

    const activityDetail = await checkDetail(page, `${BASE_URL}/activity/activity-details?id=${activityId}`, `QA Firestore Activity ${stamp}`, [
      { label: 'location', value: 'QA Activity Bay' },
      { label: 'price', value: '$188' },
      { label: 'duration', value: '04 hours' },
      { label: 'description', value: 'QA activity description for Firestore detail smoke.' },
    ]);

    const chaletDetail = await checkDetail(page, `${BASE_URL}/chalet/chalet-details?id=${chaletId}`, `QA Firestore Chalet ${stamp}`, [
      { label: 'location', value: 'QA Chalet Valley' },
      { label: 'price', value: '$455' },
      { label: 'description', value: 'QA chalet description for Firestore detail smoke.' },
    ]);

    const resortDetail = await checkDetail(page, `${BASE_URL}/resort/resort-details?id=${resortId}`, `QA Firestore Resort ${stamp}`, [
      { label: 'location', value: 'QA Resort Bay' },
      { label: 'price', value: '$599' },
      { label: 'description', value: 'QA resort description for Firestore detail smoke.' },
    ]);

    await page.goto(`${BASE_URL}/tour/tour-details`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    const fallbackTourBody = (await page.textContent('body')) || '';
    const noIdFallbackPreserved = fallbackTourBody.includes('DreamsTour');

    await page.goto(`${BASE_URL}/car/car-details?id=missing-${stamp}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    const invalidCarBody = (await page.textContent('body')) || '';
    const invalidIdHandled = invalidCarBody.includes('could not be found') || invalidCarBody.includes('not published yet');

    const success =
      carCard.hrefMatches &&
      carCard.titleMatches &&
      tourCard.hrefMatches &&
      tourCard.titleMatches &&
      activityCard.hrefMatches &&
      activityCard.titleMatches &&
      carDetail.titleMatches &&
      carDetail.checks.every((item) => item.pass) &&
      tourDetail.titleMatches &&
      tourDetail.checks.every((item) => item.pass) &&
      activityDetail.titleMatches &&
      activityDetail.checks.every((item) => item.pass) &&
      chaletDetail.titleMatches &&
      chaletDetail.checks.every((item) => item.pass) &&
      resortDetail.titleMatches &&
      resortDetail.checks.every((item) => item.pass) &&
      noIdFallbackPreserved &&
      invalidIdHandled &&
      errors.length === 0;

    console.log(JSON.stringify({
      success,
      stamp,
      carId,
      tourId,
      activityId,
      chaletId,
      resortId,
      carCard,
      tourCard,
      activityCard,
      carDetail,
      tourDetail,
      activityDetail,
      chaletDetail,
      resortDetail,
      noIdFallbackPreserved,
      invalidIdHandled,
      errors,
    }));
    process.exitCode = success ? 0 : 1;
  } catch (error) {
    console.log(JSON.stringify({
      success: false,
      created,
      errors,
      reason: error.message || String(error),
    }));
    process.exitCode = 1;
  } finally {
    try {
      await Promise.all(created.map((item) => db.collection(item.collection).doc(item.id).delete()));
    } catch {}
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
