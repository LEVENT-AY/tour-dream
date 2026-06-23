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

async function createHotelDoc(db, stamp, suffix, overrides = {}) {
  const title = `QA Item Hotel ${suffix} ${stamp}`;
  const location = `QA Item City ${suffix}`;
  const image = `${BASE_URL}/assets/img/hotels/hotel-large-0${suffix}.jpg?qa=${stamp}-${suffix}`;
  const ref = db.collection('hotels').doc();

  await ref.set({
    title,
    name: title,
    type: 'Suite',
    location,
    price: suffix === '1' ? 411 : 522,
    rating: suffix === '1' ? 4.2 : 4.8,
    reviewsCount: suffix === '1' ? 12 : 34,
    badge: `QA Badge ${suffix}`,
    description: `QA hotel description ${suffix} for item-specific hotel detail smoke.`,
    image,
    gallery: [
      image,
      `${BASE_URL}/assets/img/hotels/hotel-large-03.jpg?qa=${stamp}-${suffix}`,
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
    const hotelOne = await createHotelDoc(db, stamp, '1');
    const hotelTwo = await createHotelDoc(db, stamp, '2');
    createdIds.push(hotelOne.id, hotelTwo.id);

    await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
    await waitForApp(page);
    await page.getByText('Trending Listings & Best Sellers', { exact: false }).waitFor({ state: 'visible', timeout: 15000 });
    await page.locator('.trending-list .nav-link[data-bs-target="#tab-2"]').click();
    await page.waitForTimeout(1200);

    const homepageHrefOne = await findCardHrefByTitle(page, '#tab-2 .trending-list-item', hotelOne.title);
    const homepageHrefTwo = await findCardHrefByTitle(page, '#tab-2 .trending-list-item', hotelTwo.title);

    await page.goto(`${BASE_URL}/hotel/hotel-grid`, { waitUntil: 'domcontentloaded' });
    await waitForApp(page);
    const gridHrefOne = await findCardHrefByTitle(page, '.place-item', hotelOne.title);
    const gridHrefTwo = await findCardHrefByTitle(page, '.place-item', hotelTwo.title);

    await page.goto(`${BASE_URL}/hotel/hotel-list`, { waitUntil: 'domcontentloaded' });
    await waitForApp(page);
    const listHrefOne = await findCardHrefByTitle(page, '.hotel-list .place-item', hotelOne.title);
    const listHrefTwo = await findCardHrefByTitle(page, '.hotel-list .place-item', hotelTwo.title);

    await page.goto(`${BASE_URL}/hotel/hotel-map`, { waitUntil: 'domcontentloaded' });
    await waitForApp(page);
    await page.waitForTimeout(1200);
    const mapHrefOne = await findCardHrefByTitle(page, '.hotel-list .place-item', hotelOne.title);
    const mapHrefTwo = await findCardHrefByTitle(page, '.hotel-list .place-item', hotelTwo.title);

    const firstDetail = await openAndReadDetail(page, listHrefOne);
    const secondDetail = await openAndReadDetail(page, listHrefTwo);

    await page.goto(`${BASE_URL}/hotel/hotel-details`, { waitUntil: 'domcontentloaded' });
    await waitForApp(page);
    await page.waitForTimeout(800);
    const fallbackBody = (await page.textContent('body')) || '';

    await page.goto(`${BASE_URL}/hotel/hotel-details?id=missing-${stamp}`, { waitUntil: 'domcontentloaded' });
    await waitForApp(page);
    await page.waitForTimeout(800);
    const invalidBody = (await page.textContent('body')) || '';

    const expectedOne = `/hotel/hotel-details?id=${hotelOne.id}`;
    const expectedTwo = `/hotel/hotel-details?id=${hotelTwo.id}`;
    const hrefChecks = {
      homepageHrefOne,
      homepageHrefTwo,
      gridHrefOne,
      gridHrefTwo,
      listHrefOne,
      listHrefTwo,
      mapHrefOne,
      mapHrefTwo,
    };

    const allSpecificLinks = Object.values(hrefChecks).every((href) => href && href.startsWith('/hotel/hotel-details?id='));
    const homepageOk = homepageHrefOne === expectedOne && homepageHrefTwo === expectedTwo;
    const gridOk = gridHrefOne === expectedOne && gridHrefTwo === expectedTwo;
    const listOk = listHrefOne === expectedOne && listHrefTwo === expectedTwo;
    const mapOk = mapHrefOne === expectedOne && mapHrefTwo === expectedTwo;
    const twoDifferentIds = expectedOne !== expectedTwo && listHrefOne !== listHrefTwo;
    const firstDetailMatches = firstDetail.body.includes(hotelOne.title) && firstDetail.body.includes(hotelOne.location) && firstDetail.body.includes('$411');
    const secondDetailMatches = secondDetail.body.includes(hotelTwo.title) && secondDetail.body.includes(hotelTwo.location) && secondDetail.body.includes('$522');
    const detailsDiffer = firstDetail.body.includes(hotelOne.title) && !firstDetail.body.includes(hotelTwo.title) && secondDetail.body.includes(hotelTwo.title) && !secondDetail.body.includes(hotelOne.title);
    const noFallbackRouteLoads = fallbackBody.includes('Hotel Plaza Athenee') || fallbackBody.includes('Hotel Details');
    const invalidIdHandled = invalidBody.length > 0 && !invalidBody.toLowerCase().includes('error');

    const success =
      allSpecificLinks &&
      homepageOk &&
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
      hotelOneId: hotelOne.id,
      hotelTwoId: hotelTwo.id,
      hrefChecks,
      allSpecificLinks,
      homepageOk,
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
      await Promise.all(createdIds.map((id) => db.collection('hotels').doc(id).delete()));
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
