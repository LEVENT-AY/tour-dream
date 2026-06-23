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

async function createFlightDoc(db, payload) {
  const ref = db.collection('flights').doc();
  await ref.set({
    ...payload,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  return ref.id;
}

async function main() {
  const { db } = initAdminSdk();
  const stampValue = Date.now();
  const featuredTitle = `QA Featured Flight ${stampValue}`;
  const featuredImage = `${BASE_URL}/assets/img/flight/flight-large-02.jpg?qa=${stampValue}`;
  const featuredDescription = `QA flight details smoke ${stampValue}`;

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
    const featuredId = await createFlightDoc(db, {
      title: featuredTitle,
      flightName: featuredTitle,
      airline: 'QA Airline',
      departureCity: 'QA Departure',
      arrivalCity: 'QA Arrival',
      stopInfo: 'QA Stop',
      seatsLeft: 17,
      price: 987,
      rating: 4.8,
      reviewsCount: 41,
      badge: 'QA Badge',
      image: featuredImage,
      gallery: [featuredImage],
      description: featuredDescription,
      featured: true,
      published: true,
    });
    createdIds.push(featuredId);

    await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
    await page.locator('#loader-wrapper').waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});

    const section = page.locator('.trending-list').first();
    await section.waitFor({ state: 'visible', timeout: 15000 });
    await page.getByText('Trending Listings & Best Sellers', { exact: false }).waitFor({ state: 'visible', timeout: 15000 });
    const targetCard = page.locator('#tab-1 .trending-list-item').filter({ hasText: featuredTitle }).first();
    await targetCard.waitFor({ state: 'visible', timeout: 30000 });
    await page.waitForFunction((title) => document.body.innerText.includes(title), featuredTitle, { timeout: 30000 });

    const firstLink = targetCard.getByRole('link').first();
    const href = await firstLink.getAttribute('href');
    if (!href || !href.includes(`id=${featuredId}`)) {
      throw new Error('Trending flight card link did not include the Firestore document id.');
    }

    await firstLink.click();
    await page.waitForURL((url) => url.pathname === '/flight/flight-details' && url.searchParams.get('id') === featuredId, { timeout: 30000 });
    await page.waitForFunction((title) => document.body.innerText.includes(title), featuredTitle, { timeout: 30000 });
    await page.waitForFunction(() => document.body.innerText.includes('QA Airline'), null, { timeout: 30000 });
    await page.waitForFunction(() => document.body.innerText.includes('QA Departure'), null, { timeout: 30000 });
    await page.waitForFunction(() => document.body.innerText.includes('QA Arrival'), null, { timeout: 30000 });
    await page.waitForFunction(() => document.body.innerText.includes('$987'), null, { timeout: 30000 });
    await page.waitForFunction(
      () => {
        const img = document.querySelector('.service-wrap.slider-wrap-five .service-img img');
        const src = img?.getAttribute('src') || '';
        return src.includes('flight-large-02.jpg');
      },
      null,
      { timeout: 30000 }
    );

    const detailImageSrc = await page.locator('.service-wrap .service-img img').first().getAttribute('src');
    const detailText = (await page.locator('body').textContent()) || '';
    const detailSuccess =
      detailText.includes(featuredTitle) &&
      detailText.includes('QA Badge') &&
      detailText.includes('QA Departure') &&
      detailText.includes('QA Arrival') &&
      detailText.includes('17 Seats Left') &&
      detailText.includes('$987') &&
      detailImageSrc === featuredImage &&
      errors.length === 0;

    await page.goto(`${BASE_URL}/flight/flight-details`, { waitUntil: 'domcontentloaded' });
    await page.locator('#loader-wrapper').waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
    await page.getByText('Antonov An-32', { exact: false }).waitFor({ state: 'visible', timeout: 30000 });

    await page.goto(`${BASE_URL}/flight/flight-details?id=missing-flight-id`, { waitUntil: 'domcontentloaded' });
    await page.locator('#loader-wrapper').waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
    await page.getByText('Antonov An-32', { exact: false }).waitFor({ state: 'visible', timeout: 30000 });

    console.log(JSON.stringify({
      success: detailSuccess,
      featuredId,
      href,
      detailImageSrc,
      errors,
    }));
    process.exitCode = detailSuccess ? 0 : 1;
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
      await Promise.all(createdIds.map((id) => db.collection('flights').doc(id).delete()));
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
