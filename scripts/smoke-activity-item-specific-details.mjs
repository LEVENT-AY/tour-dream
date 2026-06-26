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

async function createActivityDoc(db, stamp, suffix, overrides = {}) {
  const title = `QA Item Activity ${suffix} ${stamp}`;
  const location = `QA Item City ${suffix}`;
  const image = `${BASE_URL}/assets/img/activities/activity-0${suffix}.jpg?qa=${stamp}-${suffix}`;
  const ref = db.collection('activities').doc();

  await ref.set({
    title,
    name: title,
    category: suffix === '1' ? 'Adventure' : 'Water Sports',
    location,
    price: suffix === '1' ? 333 : 444,
    currency: 'USD',
    oldPrice: suffix === '1' ? 500 : 600,
    rating: suffix === '1' ? 4.2 : 4.8,
    reviewsCount: suffix === '1' ? 12 : 34,
    badge: suffix === '1' ? 'QA Badge 1' : 'QA Badge 2',
    description: `QA activity description ${suffix} for item-specific activity detail smoke.`,
    duration: suffix === '1' ? '4 Hrs' : '6 Hrs',
    image,
    gallery: [
      image,
      `${BASE_URL}/assets/img/activities/activity-03.jpg?qa=${stamp}-${suffix}`,
    ],
    published: true,
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
    const activityOne = await createActivityDoc(db, stamp, '1');
    const activityTwo = await createActivityDoc(db, stamp, '2');
    createdIds.push(activityOne.id, activityTwo.id);

    await page.goto(`${BASE_URL}/activity/activity-grid`, { waitUntil: 'domcontentloaded' });
    await waitForApp(page);
    const gridHrefOne = await findCardHrefByTitle(page, '.place-item', activityOne.title);
    const gridHrefTwo = await findCardHrefByTitle(page, '.place-item', activityTwo.title);

    await page.goto(`${BASE_URL}/activity/activity-list`, { waitUntil: 'domcontentloaded' });
    await waitForApp(page);
    const listHrefOne = await findCardHrefByTitle(page, '.hotel-list .place-item', activityOne.title);
    const listHrefTwo = await findCardHrefByTitle(page, '.hotel-list .place-item', activityTwo.title);

    await page.goto(`${BASE_URL}/activity/activity-map`, { waitUntil: 'domcontentloaded' });
    await waitForApp(page);
    await page.waitForTimeout(1200);
    const mapHrefOne = await findCardHrefByTitle(page, '.hotel-list .place-item', activityOne.title);
    const mapHrefTwo = await findCardHrefByTitle(page, '.hotel-list .place-item', activityTwo.title);

    const firstDetail = await openAndReadDetail(page, listHrefOne);
    const secondDetail = await openAndReadDetail(page, listHrefTwo);

    await page.goto(`${BASE_URL}/activity/activity-details`, { waitUntil: 'domcontentloaded' });
    await waitForApp(page);
    await page.waitForTimeout(800);
    const fallbackBody = (await page.textContent('body')) || '';

    await page.goto(`${BASE_URL}/activity/activity-details?id=missing-${stamp}`, { waitUntil: 'domcontentloaded' });
    await waitForApp(page);
    await page.waitForTimeout(800);
    const invalidBody = (await page.textContent('body')) || '';

    const expectedOne = `/activity/activity-details?id=${activityOne.id}`;
    const expectedTwo = `/activity/activity-details?id=${activityTwo.id}`;
    const hrefChecks = {
      gridHrefOne,
      gridHrefTwo,
      listHrefOne,
      listHrefTwo,
      mapHrefOne,
      mapHrefTwo,
    };

    const allSpecificLinks = Object.values(hrefChecks).every((href) => href && href.startsWith('/activity/activity-details?id='));
    const gridOk = gridHrefOne === expectedOne && gridHrefTwo === expectedTwo;
    const listOk = listHrefOne === expectedOne && listHrefTwo === expectedTwo;
    const mapOk = mapHrefOne === expectedOne && mapHrefTwo === expectedTwo;
    const twoDifferentIds = expectedOne !== expectedTwo && listHrefOne !== listHrefTwo;
    const firstDetailMatches = firstDetail.body.includes(activityOne.title) && firstDetail.body.includes(activityOne.location) && firstDetail.body.includes('$333');
    const secondDetailMatches = secondDetail.body.includes(activityTwo.title) && secondDetail.body.includes(activityTwo.location) && secondDetail.body.includes('$444');
    const detailsDiffer = firstDetail.body.includes(activityOne.title) && !firstDetail.body.includes(activityTwo.title) && secondDetail.body.includes(activityTwo.title) && !secondDetail.body.includes(activityOne.title);
    const noFallbackRouteLoads = fallbackBody.includes('DreamsTour') || fallbackBody.includes('Activity');
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
      activityOneId: activityOne.id,
      activityTwoId: activityTwo.id,
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
      await Promise.all(createdIds.map((id) => db.collection('activities').doc(id).delete()));
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