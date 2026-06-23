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

async function createHotelDoc(db, stamp) {
  const title = `QA Featured Hotel ${stamp}`;
  const image = `${BASE_URL}/assets/img/hotels/hotel-large-02.jpg?qa=${stamp}`;
  const gallery = [
    `${BASE_URL}/assets/img/hotels/hotel-large-02.jpg?qa=${stamp}`,
    `${BASE_URL}/assets/img/hotels/hotel-large-03.jpg?qa=${stamp}`,
  ];

  const ref = db.collection('hotels').doc();
  await ref.set({
    title,
    name: title,
    type: 'Suite',
    location: 'QA Hotel City',
    price: 789,
    rating: 4.7,
    reviewsCount: 28,
    badge: 'QA Hotel Badge',
    description: 'QA hotel description for Firestore detail smoke.',
    image,
    gallery,
    amenities: ['Pool', 'WiFi', 'Airport transfer'],
    featured: true,
    published: true,
    approvalStatus: 'approved',
    status: 'approved',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  return { hotelId: ref.id, title, image, gallery };
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
    if (msg.type() === 'error') {
      const text = msg.text();
      if (!text.includes('Could not reach Cloud Firestore backend')) {
        errors.push(text);
      }
    }
  });
  page.on('pageerror', (err) => errors.push(err.message));

  let hotelId = '';
  let title = '';
  let homepageLinkHasId = false;
  let cardImageMatches = false;
  let openedRealDetails = false;
  let titleMatches = false;
  let priceMatches = false;
  let locationMatches = false;
  let ratingMatches = false;
  let imageMatches = false;
  let galleryMatches = false;
  let noFallbackRouteLoads = false;
  let invalidIdHandled = false;
  let pageUrl = '';
  let bodyPreview = '';

  try {
    const created = await createHotelDoc(db, stamp);
    hotelId = created.hotelId;
    title = created.title;
    createdIds.push(hotelId);

    await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
    await page.locator('#loader-wrapper').waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
    await page.getByText('Trending Listings & Best Sellers', { exact: false }).waitFor({ state: 'visible', timeout: 15000 });
    await page.locator('.trending-list .nav-link[data-bs-target="#tab-2"]').click();
    await page.waitForTimeout(1200);

    const hotelTab = page.locator('#tab-2');
    await hotelTab.waitFor({ state: 'visible', timeout: 15000 });
    await page.getByText(title, { exact: false }).waitFor({ state: 'visible', timeout: 30000 });

    const hotelCard = hotelTab.locator('.trending-list-item').filter({ hasText: title }).first();
    const cardAnchor = hotelCard.locator('a').first();
    const href = await cardAnchor.getAttribute('href');
    homepageLinkHasId = Boolean(href && href.includes(`/hotel/hotel-details?id=${hotelId}`));
    const cardText = (await hotelCard.textContent()) || '';
    const cardImage = await hotelCard.locator('img').first().getAttribute('src');
    cardImageMatches = cardText.includes(title) && cardText.includes('QA Hotel Badge') && cardImage === created.image;

    await page.goto(`${BASE_URL}/hotel/hotel-details?id=${hotelId}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(4000);
    const body = (await page.textContent('body')) || '';
    pageUrl = page.url();
    bodyPreview = body.slice(0, 500);
    openedRealDetails = body.includes(title) && body.includes('QA Hotel City') && body.includes('QA Hotel Badge');
    titleMatches = body.includes(title);
    priceMatches = body.includes('$789');
    locationMatches = body.includes('QA Hotel City') && !body.includes('Barcelona') && !body.includes('Adri Street');
    ratingMatches = body.includes('4.7') && body.includes('(28 Reviews)');

    const heroImage = await page.locator('.service-carousel img').first().getAttribute('src').catch(() => null);
    imageMatches = Boolean(heroImage && heroImage.includes(`qa=${stamp}`) && !heroImage.includes('hotel-large-01.jpg'));
    const galleryImages = await page.locator('.galley-wrap img').evaluateAll((imgs) => imgs.map((img) => img.getAttribute('src') || ''));
    galleryMatches = galleryImages.length >= 2 && galleryImages.every((src) => src.includes(`qa=${stamp}`));

    await page.goto(`${BASE_URL}/hotel/hotel-details`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1200);
    const fallbackBody = (await page.textContent('body')) || '';
    noFallbackRouteLoads = fallbackBody.includes('Hotel Plaza Athenee') || fallbackBody.includes('Hotel Details');

    await page.goto(`${BASE_URL}/hotel/hotel-details?id=missing-${stamp}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1200);
    const invalidBody = (await page.textContent('body')) || '';
    invalidIdHandled = invalidBody.length > 0 && !invalidBody.toLowerCase().includes('error');

    const success =
      homepageLinkHasId &&
      cardImageMatches &&
      openedRealDetails &&
      titleMatches &&
      priceMatches &&
      locationMatches &&
      ratingMatches &&
      imageMatches &&
      galleryMatches &&
      noFallbackRouteLoads &&
      invalidIdHandled &&
      errors.length === 0;

    console.log(JSON.stringify({
      hotelId,
      title,
      homepageLinkHasId,
      cardImageMatches,
      openedRealDetails,
      titleMatches,
      priceMatches,
      locationMatches,
      ratingMatches,
      imageMatches,
      galleryMatches,
      noFallbackRouteLoads,
      invalidIdHandled,
      pageUrl,
      bodyPreview,
      errors,
    }));
    process.exitCode = success ? 0 : 1;
  } catch (error) {
    console.log(JSON.stringify({
      hotelId,
      title,
      homepageLinkHasId,
      cardImageMatches,
      openedRealDetails,
      titleMatches,
      priceMatches,
      locationMatches,
      ratingMatches,
      imageMatches,
      galleryMatches,
      noFallbackRouteLoads,
      invalidIdHandled,
      pageUrl,
      bodyPreview,
      errors,
      reason: error.message || String(error),
    }));
    process.exitCode = 1;
  } finally {
    try {
      for (const id of createdIds) {
        await db.collection('hotels').doc(id).delete();
      }
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
