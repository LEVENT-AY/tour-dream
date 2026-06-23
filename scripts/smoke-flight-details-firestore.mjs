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
  const featuredRouteLabel = 'QA Departure - QA Arrival';
  const featuredImage = `${BASE_URL}/assets/img/flight/flight-large-02.jpg?qa=${stampValue}`;
  const featuredDescription = `QA flight details smoke ${stampValue}`;

  const createdIds = [];
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  const errors = [];
  let stage = 'init';

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
      dates: 'QA Flight Date',
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

    stage = 'homepage';
    await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
    await page.locator('#loader-wrapper').waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});

    const section = page.locator('.trending-list').first();
    await section.waitFor({ state: 'visible', timeout: 15000 });
    await page.getByText('Trending Listings & Best Sellers', { exact: false }).waitFor({ state: 'visible', timeout: 15000 });
    stage = 'homepage-card-text';
    await page.waitForFunction((title) => document.body.innerText.includes(title), featuredTitle, { timeout: 30000 });

    stage = 'homepage-link';
    const firstLink = page.locator(`a[href*="id=${featuredId}"]`).first();
    await firstLink.waitFor({ state: 'visible', timeout: 30000 });
    const href = await firstLink.getAttribute('href');
    if (!href || !href.includes(`id=${featuredId}`)) {
      throw new Error('Trending flight card link did not include the Firestore document id.');
    }

    stage = 'detail-url';
    await firstLink.click();
    await page.waitForURL((url) => url.pathname === '/flight/flight-details' && url.searchParams.get('id') === featuredId, { timeout: 30000 });
    stage = 'detail-title';
    await page.waitForFunction((title) => document.body.innerText.includes(title), featuredTitle, { timeout: 30000 });
    stage = 'detail-fields';
    await page.waitForFunction(() => document.body.innerText.includes('QA Airline'), null, { timeout: 30000 });
    await page.waitForFunction(() => document.body.innerText.includes('QA Departure'), null, { timeout: 30000 });
    await page.waitForFunction(() => document.body.innerText.includes('QA Arrival'), null, { timeout: 30000 });
    await page.waitForFunction(() => document.body.innerText.includes('QA Flight Date'), null, { timeout: 30000 });
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
    const sidebarRouteText = await page.locator('.col-xl-4 .d-flex.align-items-center.mb-4').first().innerText();
    const mapSrc = await page.locator('#location iframe').first().getAttribute('src');
    const detailText = (await page.locator('body').innerText()) || '';
    const detailChecks = {
      title: detailText.includes(featuredTitle),
      badge: detailText.includes('QA Badge'),
      departure: detailText.includes('QA Departure'),
      arrival: detailText.includes('QA Arrival'),
      route: detailText.includes(featuredRouteLabel),
      date: detailText.includes('QA Flight Date'),
      seats: detailText.includes('17 Seats Left'),
      price: detailText.includes('$987'),
      reviews: detailText.includes('(41 Reviews)'),
      faqRemoved: !detailText.includes('How old do I need to be to rent a car?'),
      providerRemoved: !detailText.includes('Provider Details'),
      availabilityRemoved: !detailText.includes('Available Seats'),
      sidebarRouteClean: sidebarRouteText.includes('QA Departure') && sidebarRouteText.includes('QA Arrival') && !sidebarRouteText.includes('Las Vegas') && !sidebarRouteText.includes('Newyork'),
      airportLabelsRemoved: !detailText.includes('Ken International Airport') && !detailText.includes('Martini International Airport'),
      mapRouteBound: typeof mapSrc === 'string' && mapSrc.includes(encodeURIComponent(featuredRouteLabel)),
      imageMatches: detailImageSrc === featuredImage,
      noErrors: errors.length === 0,
    };
    const detailSuccess = Object.values(detailChecks).every(Boolean);
    stage = 'fallback-detail';

    await page.goto(`${BASE_URL}/flight/flight-details`, { waitUntil: 'domcontentloaded' });
    await page.locator('#loader-wrapper').waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
    await page.getByText('Antonov An-32', { exact: false }).waitFor({ state: 'visible', timeout: 30000 });

    stage = 'invalid-detail';
    await page.goto(`${BASE_URL}/flight/flight-details?id=missing-flight-id`, { waitUntil: 'domcontentloaded' });
    await page.locator('#loader-wrapper').waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
    await page.getByText('Antonov An-32', { exact: false }).waitFor({ state: 'visible', timeout: 30000 });

    console.log(JSON.stringify({
      success: detailSuccess,
      featuredId,
      href,
      detailImageSrc,
      detailChecks,
      errors,
      stage,
    }));
    process.exitCode = detailSuccess ? 0 : 1;
  } catch (error) {
    console.log(JSON.stringify({
      success: false,
      createdIds,
      errors,
      detailChecks: typeof detailChecks === 'undefined' ? null : detailChecks,
      stage,
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
