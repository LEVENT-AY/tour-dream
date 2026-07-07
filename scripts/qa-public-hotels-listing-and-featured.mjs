import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { chromium } from 'playwright';
import { normalizeHotelImageUrlList } from './tunisiebooking-image-utils.mjs';

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
const isKnownGoogleMapsWarning = (message) =>
  /Maps Demo Key limit reached|OVER_QUERY_LIMIT|ApiProjectMapError|This page can’t load Google Maps correctly|This page can't load Google Maps correctly|You must provide either an anchor/i.test(
    String(message ?? ''),
  );

const getHotelTitle = (hotel) => normalizeText(hotel.title || hotel.name || hotel.hotelName || '');

const getHotelLocation = (hotel) => normalizeText(hotel.city || hotel.region || hotel.location || hotel.address || '');

const isFeaturedHotel = (hotel) => hotel.featured === true || hotel.isFeatured === true;

async function waitForApp(page) {
  await page.locator('#loader-wrapper').waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
}

async function waitForHotelCards(page) {
  await page.waitForFunction(
    () => document.querySelectorAll('[data-testid="public-hotel-card"]').length > 0,
    { timeout: 45000 },
  );
}

async function main() {
  const db = initAdminSdk();
  const snapshot = await db.collection('hotels').get();
  const hotels = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  const publishedHotels = hotels.filter((hotel) => hotel.published === true);
  const featuredHotels = publishedHotels.filter(isFeaturedHotel);
  const draftHotels = hotels.filter((hotel) => hotel.published === false);
  const djerbaHotel = publishedHotels.find((hotel) => /djerba/i.test(getHotelLocation(hotel))) || null;

  assert(publishedHotels.length > 0, 'At least one published hotel exists');
  assert(featuredHotels.length > 0, 'At least one featured published hotel exists');

  const featuredHotel = featuredHotels[0];
  const nonFeaturedHotel = publishedHotels.find((hotel) => !isFeaturedHotel(hotel)) || null;
  const draftHotel = draftHotels[0] || null;
  const destinationHotel = djerbaHotel || publishedHotels.find((hotel) => getHotelLocation(hotel)) || null;
  const destination = djerbaHotel ? 'Djerba' : destinationHotel ? getHotelLocation(destinationHotel) : '';

  const helperSample = normalizeHotelImageUrlList([
    'https://EXAMPLE.com/images/Hotel-01.jpg?cache=1#hero',
    'https://example.com/images/logo.svg',
    'https://example.com/images/location-marker.png',
    'https://example.com/images/Hotel-01.jpg?cache=2',
    'data:image/png;base64,AAAA',
    'https://example.com/images/Hotel-02_120x120.jpg',
  ], { baseUrl: BASE_URL });
  assert(helperSample.length === 1, 'Image helper removes bad assets and duplicates');
  assert(helperSample[0] === 'https://example.com/images/Hotel-01.jpg', 'Image helper normalizes the image URL');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1400 } });
  const page = await context.newPage();
  const errors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (err) => errors.push(err.message));

  const summary = {};

  try {
    await page.goto(`${BASE_URL}/hotel/hotel-map`, { waitUntil: 'domcontentloaded' });
    await waitForApp(page);
    await waitForHotelCards(page);

    const defaultCount = await page.locator('[data-testid="public-hotel-card"]').count();
    const defaultHeadline = normalizeText(await page.locator('[data-testid="public-hotel-count-label"]').textContent());
    summary.defaultGridCount = defaultCount;
    summary.defaultHeadline = defaultHeadline;
    assert(defaultCount > 0, 'Default hotel map shows published hotels');
    assert(defaultHeadline.includes(String(publishedHotels.length)), 'Default hotel map headline matches the published total');
    assert(!(await page.locator('body').textContent() || '').includes('No published hotels match the current search.'), 'Default hotel map does not show the empty state');
    const defaultFirstTitle = normalizeText(await page.locator('[data-testid="public-hotel-card"] .place-content h5 a').first().textContent());
    assert(defaultFirstTitle.length > 0, 'Default hotel map shows a visible hotel title');

    await page.goto(`${BASE_URL}/hotel/hotel-map?destination=Select`, { waitUntil: 'domcontentloaded' });
    await waitForApp(page);
    await waitForHotelCards(page);
    const selectCount = await page.locator('[data-testid="public-hotel-card"]').count();
    const selectHeadline = normalizeText(await page.locator('[data-testid="public-hotel-count-label"]').textContent());
    summary.selectGridCount = selectCount;
    summary.selectHeadline = selectHeadline;
    assert(selectCount === defaultCount, 'destination=Select behaves like the default map');
    assert(selectHeadline === defaultHeadline, 'destination=Select keeps the same headline as the default map');
    const selectFirstTitle = normalizeText(await page.locator('[data-testid="public-hotel-card"] .place-content h5 a').first().textContent());
    assert(selectFirstTitle === defaultFirstTitle, 'destination=Select keeps the same first visible hotel');

    await page.goto(`${BASE_URL}/hotel/hotel-map`, { waitUntil: 'domcontentloaded' });
    await waitForApp(page);
    await waitForHotelCards(page);
    const hotelNameInput = page.locator('input[placeholder="Search by Hotel Name"]').first();
    await hotelNameInput.waitFor({ state: 'visible', timeout: 15000 });
    await hotelNameInput.fill(defaultFirstTitle);
    await page.waitForTimeout(700);
    const searchedCount = await page.locator('[data-testid="public-hotel-card"]').count();
    summary.searchedCount = searchedCount;
    assert(searchedCount >= 1, 'Hotel name search still returns results');
    assert((await page.locator('[data-testid="public-hotel-card"] .place-content h5 a').first().textContent())?.includes(defaultFirstTitle) ?? false, 'Hotel name search can surface a matching hotel');

    if (destinationHotel && destination) {
      const destinationQuery = new URLSearchParams({
        source: 'manual',
        destination,
        checkInDate: '2026-07-06',
        checkOutDate: '2026-07-08',
        adults: '1',
        rooms: '1',
      }).toString();

      await page.goto(`${BASE_URL}/hotel/hotel-map?${destinationQuery}`, { waitUntil: 'domcontentloaded' });
      await waitForApp(page);
      await waitForHotelCards(page);
      const destinationBody = (await page.textContent('body')) || '';
      const destinationHeadline = normalizeText(await page.locator('[data-testid="public-hotel-count-label"]').textContent());
      summary.destination = destination;
      summary.destinationCount = await page.locator('[data-testid="public-hotel-card"]').count();
      summary.destinationHeadline = destinationHeadline;
      assert(destinationBody.includes(getHotelTitle(destinationHotel)), `Destination filter shows the selected destination hotel (${destination})`);
      assert(destinationHeadline.startsWith(String(summary.destinationCount)), 'Destination headline matches the filtered card count');
    }

    await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
    await waitForApp(page);
    await page.getByText('Trending Listings & Best Sellers', { exact: false }).waitFor({ state: 'visible', timeout: 15000 });
    await page.locator('.trending-list .nav-link[data-bs-target="#tab-2"]').click();
    await page.waitForTimeout(1200);

    const featuredTab = page.locator('#tab-2');
    await featuredTab.waitFor({ state: 'visible', timeout: 15000 });
    const featuredBody = (await featuredTab.textContent()) || '';
    summary.featuredHotel = getHotelTitle(featuredHotel);
    assert(featuredBody.includes(getHotelTitle(featuredHotel)), 'Homepage featured Hotels tab shows a real featured hotel');
    if (nonFeaturedHotel) {
      assert(!featuredBody.includes(getHotelTitle(nonFeaturedHotel)), 'Homepage featured Hotels tab excludes non-featured hotels');
    }
      assert(!featuredBody.includes('Hotel Plaza Athenee'), 'Homepage featured Hotels tab does not show template hotel cards');
    assert(!featuredBody.includes('The Luxe Haven'), 'Homepage featured Hotels tab does not show template hotel cards');
    assert(!featuredBody.includes('The Urban Retreat'), 'Homepage featured Hotels tab does not show template hotel cards');
    assert(!featuredBody.includes('Hotel Evergreen'), 'Homepage featured Hotels tab does not show template hotel cards');
    assert(!featuredBody.includes('$0 / Night'), 'Homepage featured Hotels tab does not show zero-price template copy');
    assert(!featuredBody.includes('Beth Will') && !featuredBody.includes('Andrews') && !featuredBody.includes('Robert'), 'Homepage featured Hotels tab does not show fake owners');

    const featuredCard = featuredTab.locator('.trending-list-item').filter({ hasText: getHotelTitle(featuredHotel) }).first();
    await featuredCard.waitFor({ state: 'visible', timeout: 15000 });
    const featuredHref = await featuredCard.locator('a').first().getAttribute('href');
    assert(Boolean(featuredHref && featuredHref.includes('/hotel/hotel-details?id=')), 'Featured hotel card links to hotel details');

    if (draftHotel) {
      const draftTitle = getHotelTitle(draftHotel);
      assert(!destinationBody.includes(draftTitle), 'Draft hotels do not appear on the public hotel results');
      assert(!featuredBody.includes(draftTitle), 'Draft hotels do not appear in the homepage Hotels tab');
    }

    const unexpectedErrors = errors.filter((message) => !isKnownGoogleMapsWarning(message));
    const success = unexpectedErrors.length === 0;
    assert(success, `Browser console was clean: ${errors.join(' | ')}`);

    console.log(JSON.stringify({
      success,
      defaultCount,
      selectCount,
      searchedCount,
      destination,
      destinationCount: summary.destinationCount,
      featuredHotel: getHotelTitle(featuredHotel),
      publicHotel: defaultFirstTitle,
      nonFeaturedHotel: nonFeaturedHotel ? getHotelTitle(nonFeaturedHotel) : null,
      draftHotel: draftHotel ? getHotelTitle(draftHotel) : null,
      mapWarnings: errors.filter(isKnownGoogleMapsWarning),
      errors: unexpectedErrors,
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
