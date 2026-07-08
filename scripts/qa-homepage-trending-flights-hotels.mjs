import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { chromium } from 'playwright';

const PROJECT_ID = 'tour-tunisi';
const BASE_URL = process.env.BASE_URL || 'http://localhost:5174';

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

function initAdminSdk() {
  if (admin.getApps().length === 0) {
    admin.initializeApp({ projectId: PROJECT_ID });
  }
  return getFirestore();
}

const normalizeText = (value) => String(value ?? '').trim().replace(/\s+/g, ' ');

const isTemplateFlightText = (text) =>
  /QA Badge|Seats Left|AstraFlight|Cloudrider|Aether Express|Silverwing|Nimbus|Book Now|Request this hotel/i.test(
    normalizeText(text),
  );

const isTemplateHotelText = (text) =>
  /Hotel Plaza Athenee|The Luxe Haven|The Urban Retreat|Hotel Evergreen|Book Now|Request this hotel|support@example.com/i.test(
    normalizeText(text),
  );

const hasBrokenHotelCopy = (text) => /�|Ã.|Â|â€|ï¿½/.test(normalizeText(text));

const isPublishedHotel = (hotel) => hotel.published === true;
const isFeaturedHotel = (hotel) => hotel.featured === true || hotel.isFeatured === true;

const sortHomepageHotels = (items) =>
  [...items].sort((left, right) => {
    const leftFeatured = isFeaturedHotel(left) ? 1 : 0;
    const rightFeatured = isFeaturedHotel(right) ? 1 : 0;
    if (leftFeatured !== rightFeatured) return rightFeatured - leftFeatured;

    const leftPayNow = String(left.bookingMode || '').toLowerCase() === 'pay_now' ? 1 : 0;
    const rightPayNow = String(right.bookingMode || '').toLowerCase() === 'pay_now' ? 1 : 0;
    if (leftPayNow !== rightPayNow) return rightPayNow - leftPayNow;

    const leftUpdated = new Date(left.updatedAt || left.createdAt || 0).getTime();
    const rightUpdated = new Date(right.updatedAt || right.createdAt || 0).getTime();
    if (leftUpdated !== rightUpdated) return rightUpdated - leftUpdated;

    const leftRating = Number(left.rating || left.starRating || 0);
    const rightRating = Number(right.rating || right.starRating || 0);
    return rightRating - leftRating;
  });

async function waitForApp(page) {
  await page.locator('#loader-wrapper').waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
}

async function collectCardData(page, selector) {
  const cards = page.locator(selector);
  const count = await cards.count();
  const items = [];

  for (let index = 0; index < count; index += 1) {
    const card = cards.nth(index);
    const text = normalizeText(await card.textContent());
    const links = await card.locator('a').evaluateAll((nodes) => nodes.map((node) => node.getAttribute('href') || '').filter(Boolean));
    const title = normalizeText(await card.locator('h3 a, h5 a').first().textContent().catch(() => ''));
    items.push({
      text,
      links,
      title,
    });
  }

  return items;
}

async function assertCardImagesLoaded(page, selector) {
  const cards = page.locator(selector);
  const count = await cards.count();
  for (let index = 0; index < count; index += 1) {
    const img = cards.nth(index).locator('img').first();
    await img.waitFor({ state: 'visible', timeout: 15000 });
    const natural = await img.evaluate((node) => ({
      complete: node.complete,
      naturalWidth: node.naturalWidth,
      naturalHeight: node.naturalHeight,
      currentSrc: node.currentSrc,
    }));
    assert(natural.complete, 'Card image finished loading');
    assert(natural.naturalWidth > 0 && natural.naturalHeight > 0, `Card image loaded a real asset: ${natural.currentSrc}`);
    assert(!/1284 x 600/i.test(natural.currentSrc), 'Card image does not use the gray placeholder image');
  }
}

async function assertNoFlightImageSlot(page) {
  const cards = page.locator('[data-testid="trending-flight-card"]');
  const count = await cards.count();
  for (let index = 0; index < count; index += 1) {
    const card = cards.nth(index);
    const imageCount = await card.locator('img').count();
    assert(imageCount === 0, 'Flight cards render as data cards without image placeholders');
  }
}

async function main() {
  const db = initAdminSdk();
  const snapshot = await db.collection('hotels').get();
  const hotels = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  const publishedHotels = sortHomepageHotels(hotels.filter(isPublishedHotel)).slice(0, 4);
  assert(publishedHotels.length === 4, 'At least 4 published hotels are available for the homepage trending section');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1400 } });
  const page = await context.newPage();
  const errors = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error' || msg.type() === 'warning') {
      errors.push(msg.text());
    }
  });
  page.on('pageerror', (err) => errors.push(err.message));

  const summary = {};

  try {
    await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
    await waitForApp(page);
    await page.getByText('Trending Listings & Best Sellers', { exact: false }).waitFor({ state: 'visible', timeout: 15000 });

    const tabSelectors = [
      '[data-testid="trending-tab-flights"]',
      '[data-testid="trending-tab-hotels"]',
      '[data-testid="trending-tab-cars"]',
      '[data-testid="trending-tab-cruise"]',
      '[data-testid="trending-tab-tour"]',
      '[data-testid="trending-tab-activity"]',
      '[data-testid="trending-tab-visa"]',
    ];
    for (const selector of tabSelectors) {
      await page.locator(selector).waitFor({ state: 'visible', timeout: 15000 });
    }

    await page.locator('[data-testid="trending-tab-flights"]').click();
    await page.waitForTimeout(12000);

    const flightCards = await collectCardData(page, '[data-testid="trending-flight-card"]');
    assert(flightCards.length === 4, `Flights tab shows exactly 4 cards, found ${flightCards.length}`);
    summary.flightTitles = flightCards.map((card) => card.title);
    await assertNoFlightImageSlot(page);

    for (const card of flightCards) {
      assert(card.title.length > 0, 'Each flight card shows a title');
      assert(card.text.includes('->'), 'Each flight card shows an origin to destination route');
      assert(!isTemplateFlightText(card.text), `Flight card does not contain fake template content: ${card.text}`);
      assert(card.links.some((href) => href.includes('/flight/flight-grid?')), 'Each flight card links to the flight search flow');
      assert(card.links.some((href) => href.includes('origin=') && href.includes('destination=') && href.includes('departureDate=')), 'Each flight card route preserves real search params');
      assert(/\b[A-Z]{3}\b/.test(card.text), 'Each flight card shows a currency or airport-style code');
      assert(/\d/.test(card.text), 'Each flight card shows real numeric flight data');
      assert(card.text.includes('Search Flights'), 'Each flight card shows the flight CTA');
    }

    await page.locator('[data-testid="trending-tab-hotels"]').click();
    await page.waitForTimeout(6000);

    const hotelCards = await collectCardData(page, '[data-testid="trending-hotel-card"]');
    assert(hotelCards.length === 4, `Hotels tab shows exactly 4 cards, found ${hotelCards.length}`);
    summary.hotelTitles = hotelCards.map((card) => card.title);
    await assertCardImagesLoaded(page, '[data-testid="trending-hotel-card"]');

    const expectedHotelTitles = publishedHotels.map((hotel) => normalizeText(hotel.title || hotel.name));
    assert(
      hotelCards.every((card) => expectedHotelTitles.includes(card.title)),
      `Homepage hotel cards are backed by published Firestore hotels: ${hotelCards.map((card) => card.title).join(', ')}`,
    );

    hotelCards.forEach((card) => {
      assert(card.text.includes('View Details'), 'Each homepage hotel card exposes a View Details CTA');
      assert(!isTemplateHotelText(card.text), `Hotel card does not contain fake template content: ${card.text}`);
      assert(card.text.includes('Starts From') || card.text.includes('Price available soon'), 'Hotel cards show real price copy');
      assert(!hasBrokenHotelCopy(card.text), `Hotel card does not contain broken encoding: ${card.text}`);
    });

    const payNowPublishedHotels = publishedHotels.filter((hotel) => String(hotel.bookingMode || '').toLowerCase() === 'pay_now');
    if (payNowPublishedHotels.length > 0) {
      const payNowVisible = hotelCards.some((card) => card.text.includes('Pay Now'));
      assert(payNowVisible, 'At least one pay_now hotel card shows a Pay Now CTA');
    }

    const bodyText = normalizeText(await page.locator('body').textContent());
    assert(!bodyText.includes('Hotel Plaza Athenee'), 'Homepage does not show template hotel cards');
    assert(!bodyText.includes('AstraFlight'), 'Homepage does not show fake flight cards');
    assert(!bodyText.includes('Nimbus'), 'Homepage does not show fake flight cards');
    assert(!bodyText.includes('Cloudrider'), 'Homepage does not show fake flight cards');
    assert(!bodyText.includes('Aether Express'), 'Homepage does not show fake flight cards');

    const trendingBox = await page.locator('.trending-list').boundingBox();
    const supportBox = await page.locator('.support-sec-outer').boundingBox();
    if (trendingBox && supportBox) {
      assert(
        supportBox.y >= trendingBox.y + trendingBox.height - 8,
        `Trending section is not overlapped by the support banner (trending bottom ${trendingBox.y + trendingBox.height}, support top ${supportBox.y})`,
      );
    }

    console.log(JSON.stringify({
      success: true,
      flightCount: flightCards.length,
      hotelCount: hotelCards.length,
      flightTitles: summary.flightTitles,
      hotelTitles: summary.hotelTitles,
    }, null, 2));
    process.exitCode = 0;
  } catch (error) {
    console.log(JSON.stringify({
      success: false,
      summary,
      reason: error.message || String(error),
      errors,
    }, null, 2));
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
