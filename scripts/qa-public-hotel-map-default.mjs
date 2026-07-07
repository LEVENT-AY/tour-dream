import fs from 'node:fs';
import path from 'node:path';
import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { chromium } from 'playwright';

const root = process.cwd();
const BASE_URL = process.env.BASE_URL || 'http://localhost:5174';
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');
const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const normalizeText = (value) => String(value ?? '').trim().replace(/\s+/g, ' ');
const hasValidTunisiaCoordinates = (hotel) => {
  const lat = Number(hotel.lat ?? hotel.latitude);
  const lng = Number(hotel.lng ?? hotel.longitude);
  return Number.isFinite(lat) && Number.isFinite(lng) && lat >= 30 && lat <= 38.8 && lng >= 7 && lng <= 12.5;
};
const matchesDestination = (hotel, destination) => {
  const normalizedDestination = normalizeText(destination).toLowerCase();
  const haystack = [
    hotel.city,
    hotel.location,
    hotel.address,
    hotel.region,
    hotel.country,
  ]
    .map((item) => normalizeText(item).toLowerCase())
    .join(' ');
  return haystack.includes(normalizedDestination);
};

const staticFiles = {
  header: read('src/core/common/header/header.tsx'),
  home: read('src/feature-module/home-service-one/HomeServiceOne.tsx'),
  search: read('src/feature-module/hotel/components/HotelSearchPanel.tsx'),
  map: read('src/feature-module/hotel/hotel-map/hotelMap.tsx'),
  list: read('src/feature-module/hotel/hotel-list/hotelList.tsx'),
  results: read('src/feature-module/hotel/components/PublicHotelResults.tsx'),
  styles: read('src/assets/style/scss/pages/_hotel-map.scss'),
};

assert(/publicHeaderNavigation\s*=\s*\[[\s\S]*\{\s*label:\s*"Hotel",\s*url:\s*routes\.hotelMap\s*\}/.test(staticFiles.header), 'Primary hotel nav points to hotel-map');
assert(!/publicHeaderNavigation[\s\S]*\{\s*label:\s*"Hotel",\s*url:\s*routes\.hotelGrid\s*\}/.test(staticFiles.header), 'Primary hotel nav no longer points to hotel-grid');
assert(/navigate\(`\/hotel\/hotel-map\?/.test(staticFiles.home), 'Homepage hotel search routes to hotel-map');
assert(/navigate\(`\$\{routes\.hotelMap\}\?/.test(staticFiles.search), 'Hotel search panel routes to hotel-map');
assert(/Link to=\{routes\.hotelMap\}/.test(staticFiles.search), 'Standalone hotel tabs make map the active hotel entry');
assert(/public-results-full-width/.test(staticFiles.results) && /public-results-shell/.test(staticFiles.results), 'Public hotel results use the scoped full-width shell');
assert(!/53\.470692/.test(staticFiles.results) && !/-2\.220328/.test(staticFiles.results), 'Hotel map no longer uses the Manchester fallback center');
assert(/Map location unavailable/.test(staticFiles.results), 'Hotels without coordinates are handled safely in the list');
assert(/Manual payment\. Booking is confirmed after payment verification\./.test(staticFiles.results), 'Pay-now card copy is consistent on map/list results');
assert(/PublicHotelResults/.test(staticFiles.map) && /mode="map"/.test(staticFiles.map), 'Hotel map page uses the shared public results surface');
assert(/PublicHotelResults/.test(staticFiles.list) && /mode="list"/.test(staticFiles.list), 'Hotel list page uses the shared public results surface');
assert(/public-hotel-map-popup/.test(staticFiles.styles), 'Hotel map popup styling is customized');

if (admin.getApps().length === 0) {
  admin.initializeApp({ projectId: 'tour-tunisi' });
}

const db = getFirestore();
const snapshot = await db.collection('hotels').get();
const hotels = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
const publishedHotels = hotels.filter((hotel) => hotel.published === true);
const draftHotel = hotels.find((hotel) => hotel.published === false) || null;
const sousseHotels = publishedHotels.filter((hotel) => matchesDestination(hotel, 'Sousse'));
const allMarkerCount = publishedHotels.filter(hasValidTunisiaCoordinates).length;
const allMissingMapCount = publishedHotels.length - allMarkerCount;
const noCoordinateHotel = publishedHotels.find((hotel) => !hasValidTunisiaCoordinates(hotel)) || null;

assert(publishedHotels.length > 0, 'At least one published hotel exists for map QA');

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 1300 } });
const page = await context.newPage();
const errors = [];

page.on('console', (msg) => {
  if (msg.type() === 'error') errors.push(msg.text());
});
page.on('pageerror', (error) => errors.push(error.message));

const waitForApp = async () => {
  await page.locator('#loader-wrapper').waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
};

const waitForResults = async () => {
  await page.waitForFunction(() => {
    const label = document.querySelector('[data-testid="public-hotel-count-label"]');
    return Boolean(label && !String(label.textContent || '').includes('Loading hotels'));
  }, { timeout: 20000 });
};

const summary = {};

try {
  await page.goto(`${BASE_URL}/hotel/hotel-map`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await waitForApp();
  await waitForResults();
  await page.waitForSelector('[data-testid="public-hotel-card"]', { timeout: 20000 });

  const defaultHeadline = normalizeText(await page.locator('[data-testid="public-hotel-count-label"]').textContent());
  const defaultSummary = normalizeText(await page.locator('[data-testid="public-hotel-map-summary"]').textContent());
  const defaultVisibleCards = await page.locator('[data-testid="public-hotel-card"]').count();
  const defaultGridActiveCount = await page.locator('a[aria-label="Grid view"].active').count();
  const defaultMapActiveCount = await page.locator('a[aria-label="Map view"].active').count();
  const defaultBody = normalizeText(await page.locator('body').innerText());
  summary.defaultHeadline = defaultHeadline;
  summary.defaultSummary = defaultSummary;
  summary.defaultVisibleCards = defaultVisibleCards;

  assert(defaultHeadline.includes(String(publishedHotels.length)), 'Default hotel map headline matches the published total');
  assert(defaultVisibleCards > 0, 'Default hotel map shows visible hotel cards');
  assert(defaultSummary.includes(`${allMarkerCount} shown on map`), 'Default hotel map summary matches hotels with coordinates');
  assert(defaultSummary.includes(`${allMissingMapCount} without map location`), 'Default hotel map summary matches hotels without coordinates');
  assert(defaultGridActiveCount === 0, 'Grid view is not active by default');
  assert(defaultMapActiveCount === 1, 'Map view is active by default');
  assert(!defaultBody.includes('Condos 216 Hotels'), 'Fake category counts are removed from hotel map');
  assert(!defaultBody.includes('Apartments 569 Hotels'), 'Fake category counts are removed from hotel map');
  assert(!defaultBody.includes('5 Star Hotels 600 Hotels'), 'Fake category counts are removed from hotel map');
  assert(!defaultBody.includes('Book Now'), 'Hotel map cards do not show Book Now');
  assert(!defaultBody.includes('Request this hotel'), 'Pay-now hotel map cards do not show request-only CTA copy');
  assert(!defaultBody.includes('Request-only hotel'), 'Pay-now hotel map cards do not show request-only copy');
  assert(!defaultBody.includes('support@example.com'), 'Hotel map cards do not show placeholder support email');
  assert(!defaultBody.includes('Agent'), 'Hotel map cards do not show fake agent labels');
  assert(!defaultBody.includes('Hotel Plaza Athenee'), 'Template hotel titles are removed from hotel map');
  assert(!defaultBody.includes('0 / (0)'), 'Hotel map cards do not show fake zero ratings');

  if (draftHotel) {
    const draftTitle = normalizeText(draftHotel.title || draftHotel.name || '');
    if (draftTitle) {
      assert(!defaultBody.includes(draftTitle), 'Draft hotels do not appear on the public hotel map');
    }
  }

  if (noCoordinateHotel) {
    const missingTitle = normalizeText(noCoordinateHotel.title || noCoordinateHotel.name || '');
    assert(defaultBody.includes(missingTitle), 'A published hotel without coordinates still appears in the list');
    assert(defaultBody.includes('Map location unavailable'), 'Hotels without coordinates show a safe map-unavailable note');
  }

  await page.goto(`${BASE_URL}/hotel/hotel-map?destination=Select`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await waitForApp();
  await waitForResults();
  await page.waitForSelector('[data-testid="public-hotel-card"]', { timeout: 20000 });
  const selectHeadline = normalizeText(await page.locator('[data-testid="public-hotel-count-label"]').textContent());
  const selectSummary = normalizeText(await page.locator('[data-testid="public-hotel-map-summary"]').textContent());
  const selectVisibleCards = await page.locator('[data-testid="public-hotel-card"]').count();
  summary.selectHeadline = selectHeadline;
  summary.selectSummary = selectSummary;
  summary.selectVisibleCards = selectVisibleCards;
  assert(selectHeadline === defaultHeadline, 'destination=Select behaves like the default hotel map');
  assert(selectSummary === defaultSummary, 'destination=Select keeps the same map summary');
  assert(selectVisibleCards === defaultVisibleCards, 'destination=Select keeps the same visible cards');

  await page.goto(`${BASE_URL}/hotel/hotel-map?source=manual&destination=Sousse&checkInDate=2026-07-06&checkOutDate=2026-07-08&adults=1&rooms=1`, {
    waitUntil: 'domcontentloaded',
    timeout: 60000,
  });
  await waitForApp();
  await waitForResults();
  const sousseHeadline = normalizeText(await page.locator('[data-testid="public-hotel-count-label"]').textContent());
  const sousseSummary = normalizeText(await page.locator('[data-testid="public-hotel-map-summary"]').textContent());
  const sousseVisibleCards = await page.locator('[data-testid="public-hotel-card"]').count();
  const sousseBody = normalizeText(await page.locator('body').innerText());
  summary.sousseHeadline = sousseHeadline;
  summary.sousseSummary = sousseSummary;
  summary.sousseVisibleCards = sousseVisibleCards;
  assert(sousseVisibleCards > 0, 'Sousse hotel map returns visible hotels');
  assert(sousseHeadline.startsWith(String(sousseVisibleCards)), 'Sousse hotel map headline matches the visible filtered total');
  assert(sousseSummary.includes('shown on map'), 'Sousse hotel map summary remains visible');
  if (sousseHotels[0]) {
    const sousseTitle = normalizeText(sousseHotels[0].title || sousseHotels[0].name || '');
    assert(sousseBody.includes(sousseTitle), 'Sousse filter shows Sousse hotels');
  }

  await page.goto(`${BASE_URL}/hotel/hotel-grid`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForURL(`${BASE_URL}/hotel/hotel-map`, { timeoutMs: 20000, waitUntil: 'load' });
  const redirectedGridUrl = await page.url();
  assert(redirectedGridUrl === `${BASE_URL}/hotel/hotel-map`, 'Direct /hotel/hotel-grid redirects to the map default');

  await page.goto(`${BASE_URL}/hotel/hotel-grid?destination=Sousse&checkInDate=2026-07-06&checkOutDate=2026-07-08&adults=1&rooms=1`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForURL(`${BASE_URL}/hotel/hotel-map?destination=Sousse&checkInDate=2026-07-06&checkOutDate=2026-07-08&adults=1&rooms=1`, { timeoutMs: 20000, waitUntil: 'load' });
  const redirectedQueryUrl = await page.url();
  assert(redirectedQueryUrl === `${BASE_URL}/hotel/hotel-map?destination=Sousse&checkInDate=2026-07-06&checkOutDate=2026-07-08&adults=1&rooms=1`, 'Direct /hotel/hotel-grid preserves query params while redirecting to map');

  await page.waitForSelector('[data-testid="public-hotel-map-popup"]', { timeout: 20000 });
  const popupText = normalizeText(await page.locator('[data-testid="public-hotel-map-popup"]').innerText());
  summary.popupText = popupText;
  assert(/Pay Now|Request/.test(popupText), 'Map popup shows a primary action');
  assert(/View Details/.test(popupText), 'Map popup includes a view-details action');

  const mobilePage = await context.newPage();
  await mobilePage.setViewportSize({ width: 390, height: 844 });
  await mobilePage.goto(`${BASE_URL}/hotel/hotel-map`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await mobilePage.locator('#loader-wrapper').waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
  await mobilePage.waitForFunction(() => {
    const label = document.querySelector('[data-testid="public-hotel-count-label"]');
    return Boolean(label && !String(label.textContent || '').includes('Loading hotels'));
  }, { timeout: 20000 });
  const mobileBody = normalizeText(await mobilePage.locator('body').innerText());
  summary.mobileChecked = true;
  assert(mobileBody.includes('shown on map'), 'Mobile hotel map keeps the results summary visible');
  await mobilePage.close();

  assert(errors.length === 0, `Browser console was clean: ${errors.join(' | ')}`);

  console.log(JSON.stringify({
    success: true,
    publishedHotels: publishedHotels.length,
    allMarkerCount,
    allMissingMapCount,
    sousseHotels: sousseHotels.length,
    defaultVisibleCards,
    popupText,
  }, null, 2));
} catch (error) {
  console.log(JSON.stringify({
    success: false,
    summary,
    errors,
    reason: error.message || String(error),
  }, null, 2));
  process.exitCode = 1;
} finally {
  await context.close();
  await browser.close();
}
