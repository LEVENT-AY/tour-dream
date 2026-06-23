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
  const publishedTitle = `QA Published Flight ${stampValue}`;
  const hiddenTitle = `QA Hidden Flight ${stampValue}`;
  const featuredImage = `${BASE_URL}/assets/img/flight/flight-large-02.jpg?qa=${stampValue}`;
  const publishedImage = `${BASE_URL}/assets/img/flight/flight-large-03.jpg?qa=${stampValue}`;
  const hiddenImage = `${BASE_URL}/assets/img/flight/flight-large-04.jpg?qa=${stampValue}`;

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
      featured: true,
      published: true,
    });
    createdIds.push(featuredId);

    const publishedId = await createFlightDoc(db, {
      title: publishedTitle,
      flightName: publishedTitle,
      airline: 'QA Airline',
      departureCity: 'QA Departure 2',
      arrivalCity: 'QA Arrival 2',
      stopInfo: 'QA Stop 2',
      seatsLeft: 11,
      price: 654,
      rating: 4.4,
      reviewsCount: 12,
      badge: 'Published Badge',
      image: publishedImage,
      gallery: [publishedImage],
      featured: false,
      published: true,
    });
    createdIds.push(publishedId);

    const hiddenId = await createFlightDoc(db, {
      title: hiddenTitle,
      flightName: hiddenTitle,
      airline: 'QA Hidden Airline',
      departureCity: 'Hidden Departure',
      arrivalCity: 'Hidden Arrival',
      stopInfo: 'Hidden Stop',
      seatsLeft: 99,
      price: 111,
      rating: 1,
      reviewsCount: 1,
      badge: 'Hidden Badge',
      image: hiddenImage,
      gallery: [hiddenImage],
      featured: true,
      published: false,
    });
    createdIds.push(hiddenId);

    await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
    await page.locator('#loader-wrapper').waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});

    const section = page.locator('.trending-list').first();
    await section.waitFor({ state: 'visible', timeout: 15000 });
    await page.getByText('Trending Listings & Best Sellers', { exact: false }).waitFor({ state: 'visible', timeout: 15000 });
    await page.getByText(featuredTitle, { exact: false }).waitFor({ state: 'visible', timeout: 30000 });

    const activeFlightsTab = page.locator('#tab-1');
    const firstCard = activeFlightsTab.locator('.trending-list-item').first();
    const firstCardText = (await firstCard.textContent()) || '';
    const cardImageSrc = await firstCard.locator('img').first().getAttribute('src');
    const tabText = (await activeFlightsTab.textContent()) || '';

    const success =
      firstCardText.includes(featuredTitle) &&
      firstCardText.includes('QA Badge') &&
      firstCardText.includes('QA Departure') &&
      firstCardText.includes('QA Arrival') &&
      firstCardText.includes('$987') &&
      firstCardText.includes('17 Seats Left') &&
      cardImageSrc === featuredImage &&
      !tabText.includes(hiddenTitle) &&
      errors.length === 0;

    console.log(JSON.stringify({
      success,
      featuredId,
      publishedId,
      hiddenId,
      firstCardText,
      cardImageSrc,
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
