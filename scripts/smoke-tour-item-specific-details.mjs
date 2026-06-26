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

async function createTourDoc(db, stamp, suffix, overrides = {}) {
  const title = `QA Item Tour ${suffix} ${stamp}`;
  const location = `QA Item City ${suffix}`;
  const image = `${BASE_URL}/assets/img/tours/tours-0${suffix}.jpg?qa=${stamp}-${suffix}`;
  const ref = db.collection('tours').doc();

  await ref.set({
    title,
    name: title,
    type: suffix === '1' ? 'Adventure' : 'Ecotourism',
    category: suffix === '1' ? 'Adventure' : 'Ecotourism',
    listingCategory: 'tour',
    location,
    price: suffix === '1' ? 333 : 444,
    currency: 'USD',
    oldPrice: suffix === '1' ? 500 : 600,
    rating: suffix === '1' ? 4.2 : 4.8,
    reviewsCount: suffix === '1' ? 12 : 34,
    badge: suffix === '1' ? 'QA Badge 1' : 'QA Badge 2',
    description: `QA tour description ${suffix} for item-specific tour detail smoke.`,
    duration: suffix === '1' ? '4 Day, 3 Night' : '5 Day, 4 Night',
    guests: suffix === '1' ? 14 : 16,
    groupSize: suffix === '1' ? 14 : 16,
    image,
    gallery: [
      image,
      `${BASE_URL}/assets/img/tours/tours-03.jpg?qa=${stamp}-${suffix}`,
    ],
    featured: true,
    published: true,
    approvalStatus: 'approved',
    status: 'approved',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  });

  return { id: ref.id, title, location, image };
}

async function waitForApp(page) {
  await page.locator('#loader-wrapper').waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
}

async function findCardHrefByTitle(page, containerSelector, title) {
  const card = page.locator(containerSelector).filter({ hasText: title }).first();
  await card.waitFor({ state: 'visible', timeout: 30000 });
  return card.locator('a').first().getAttribute('href');
}

async function openAndReadDetail(page, href) {
  await page.goto(`${BASE_URL}${href}`, { waitUntil: 'domcontentloaded' });
  await waitForApp(page);
  await page.waitForTimeout(1200);
  const body = (await page.textContent('body')) || '';
  return {
    url: page.url(),
    body,
  };
}

async function main() {
  const { db } = initAdminSdk();
  const stamp = Date.now();
  const createdIds = [];
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  const errors = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (err) => errors.push(err.message));

  try {
    const tourOne = await createTourDoc(db, stamp, '1');
    const tourTwo = await createTourDoc(db, stamp, '2');
    createdIds.push(tourOne.id, tourTwo.id);

    await page.goto(`${BASE_URL}/tour/tour-grid`, { waitUntil: 'domcontentloaded' });
    await waitForApp(page);
    const gridHrefOne = await findCardHrefByTitle(page, '.place-item', tourOne.title);
    const gridHrefTwo = await findCardHrefByTitle(page, '.place-item', tourTwo.title);

    await page.goto(`${BASE_URL}/tour/tour-list`, { waitUntil: 'domcontentloaded' });
    await waitForApp(page);
    const listHrefOne = await findCardHrefByTitle(page, '.hotel-list .place-item', tourOne.title);
    const listHrefTwo = await findCardHrefByTitle(page, '.hotel-list .place-item', tourTwo.title);

    await page.goto(`${BASE_URL}/tour/tour-map`, { waitUntil: 'domcontentloaded' });
    await waitForApp(page);
    await page.waitForTimeout(1200);
    const mapHrefOne = await findCardHrefByTitle(page, '.hotel-list .place-item', tourOne.title);
    const mapHrefTwo = await findCardHrefByTitle(page, '.hotel-list .place-item', tourTwo.title);

    const firstDetail = await openAndReadDetail(page, listHrefOne);
    const secondDetail = await openAndReadDetail(page, listHrefTwo);

    await page.goto(`${BASE_URL}/tour/tour-details`, { waitUntil: 'domcontentloaded' });
    await waitForApp(page);
    await page.waitForTimeout(800);
    const fallbackBody = (await page.textContent('body')) || '';

    await page.goto(`${BASE_URL}/tour/tour-details?id=missing-${stamp}`, { waitUntil: 'domcontentloaded' });
    await waitForApp(page);
    await page.waitForTimeout(800);
    const invalidBody = (await page.textContent('body')) || '';

    const expectedOne = `/tour/tour-details?id=${tourOne.id}`;
    const expectedTwo = `/tour/tour-details?id=${tourTwo.id}`;
    const hrefChecks = {
      gridHrefOne,
      gridHrefTwo,
      listHrefOne,
      listHrefTwo,
      mapHrefOne,
      mapHrefTwo,
    };

    const allSpecificLinks = Object.values(hrefChecks).every((href) => href && href.startsWith('/tour/tour-details?id='));
    const gridOk = gridHrefOne === expectedOne && gridHrefTwo === expectedTwo;
    const listOk = listHrefOne === expectedOne && listHrefTwo === expectedTwo;
    const mapOk = mapHrefOne === expectedOne && mapHrefTwo === expectedTwo;
    const twoDifferentIds = expectedOne !== expectedTwo && listHrefOne !== listHrefTwo;
    const firstDetailMatches = firstDetail.body.includes(tourOne.title) && firstDetail.body.includes(tourOne.location) && firstDetail.body.includes('$333');
    const secondDetailMatches = secondDetail.body.includes(tourTwo.title) && secondDetail.body.includes(tourTwo.location) && secondDetail.body.includes('$444');
    const detailsDiffer = firstDetail.body.includes(tourOne.title) && !firstDetail.body.includes(tourTwo.title) && secondDetail.body.includes(tourTwo.title) && !secondDetail.body.includes(tourOne.title);
    const noFallbackRouteLoads = fallbackBody.includes('DreamsTour') || fallbackBody.includes('Tour Details');
    const invalidIdHandled = invalidBody.length > 0 && !invalidBody.toLowerCase().includes('error');

    const success =
      allSpecificLinks &&
      gridOk &&
      listOk &&
      mapOk &&
      twoDifferentIds &&
      firstDetailMatches &&
      secondDetailMatches &&
      detailsDiffer &&
      noFallbackRouteLoads &&
      invalidIdHandled &&
      errors.length === 0;

    console.log(JSON.stringify({
      success,
      tourOneId: tourOne.id,
      tourTwoId: tourTwo.id,
      hrefChecks,
      allSpecificLinks,
      gridOk,
      listOk,
      mapOk,
      twoDifferentIds,
      firstDetailUrl: firstDetail.url,
      secondDetailUrl: secondDetail.url,
      firstDetailMatches,
      secondDetailMatches,
      detailsDiffer,
      noFallbackRouteLoads,
      invalidIdHandled,
      errors,
    }));
    process.exitCode = success ? 0 : 1;
  } catch (error) {
    console.log(JSON.stringify({
      success: false,
      createdIds,
      errors,
      reason: error.message || String(error),
    }));
    process.exitCode = 1;
  } finally {
    try {
      await Promise.all(createdIds.map((id) => db.collection('tours').doc(id).delete()));
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