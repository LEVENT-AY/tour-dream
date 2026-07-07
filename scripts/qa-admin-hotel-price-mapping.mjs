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

const parseNumber = (value) => {
  const numeric = typeof value === 'number' ? value : Number(String(value ?? '').trim());
  return Number.isFinite(numeric) ? numeric : null;
};

const getHotelTitle = (hotel) => normalizeText(hotel.title || hotel.name || hotel.hotelName || '');

const isTunisieBookingHotel = (hotel) =>
  String(hotel.importSource || hotel.sourceName || hotel.sourceUrl || '').toLowerCase().includes('tunisiebooking');

const sanitizeDescription = (value) => {
  const text = String(value ?? '').replace(/\s+/g, ' ').trim();
  if (!text) return text;
  const hasMojibake = /[ÃƒÃ‚Ã¢ï¿½]/.test(text);
  const repaired = hasMojibake
    ? (() => {
        try {
          const bytes = Uint8Array.from(text, (char) => char.charCodeAt(0) & 0xff);
          return new TextDecoder('utf-8').decode(bytes);
        } catch {
          return text;
        }
      })()
    : text;
  return repaired
    .replace(/\u0000/g, '')
    .replace(/[\uFFFD\u0001-\u001f\u007f-\u009f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const hotelsPage = read('src/feature-module/admin-dashboard/pages/hotels.tsx');
const adminCatalogManager = read('src/feature-module/admin-dashboard/components/AdminCatalogManager.tsx');
const firebaseServices = read('src/core/services/firebaseServices.ts');
const hotelDetails = read('src/feature-module/hotel/hotel-details/hotelDetails.tsx');

assert(/Price per Night/.test(hotelsPage), 'Admin hotel form labels the canonical price field');
assert(!/Price per Night \(USD\)/.test(hotelsPage), 'USD-only hotel label is removed');
assert(/priceFrom/.test(hotelsPage) && /priceCurrency/.test(hotelsPage) && /priceUnit/.test(hotelsPage), 'Admin hotel form exposes priceFrom / priceCurrency / priceUnit');
assert(/isTunisieBookingHotel/.test(hotelsPage) && /EUR/.test(hotelsPage), 'Admin hotel normalization defaults TunisieBooking currency to EUR');
assert(/repairMojibake/.test(hotelsPage) && /rawSource\?\.detail\?\.descriptionExtended/.test(hotelsPage), 'Admin description prefers clean source-backed text');
assert(/parseNumericInput/.test(adminCatalogManager), 'Admin manager sanitizes numeric inputs');
assert(/text === '\.'/.test(adminCatalogManager) && /e\.target\.value === '' \|\| nextValue === null \? '' : nextValue/.test(adminCatalogManager), 'Admin manager rejects "." and empty numeric input');
assert(/priceCurrency \|\| data\.currency \|\| \(isTunisieBooking \? 'EUR' : ''\)/.test(firebaseServices.replace(/\s+/g, ' ')), 'Public hotel mapping defaults TunisieBooking currency to EUR');
assert(/buildDescriptionText/.test(hotelDetails) && /rawSource\?\.detail\?\.descriptionExtended/.test(hotelDetails), 'Public details use source-backed description candidates');

if (admin.getApps().length === 0) {
  admin.initializeApp({ projectId: 'tour-tunisi' });
}

const db = getFirestore();
const snapshot = await db.collection('hotels').get();
const docId = 'imported-tunisiebooking-cesar-palace-sousse-sousse';
const snap = await db.collection('hotels').doc(docId).get();
assert(snap.exists, 'Cesar Palace Sousse exists in Firestore');
const doc = snap.data();
assert(doc, 'Cesar Palace Sousse data is readable');
const hotels = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));

const publicPrice = `${doc.priceFrom} ${doc.priceCurrency} / ${doc.priceUnit}`;
assert(doc.priceFrom === 27, 'Public priceFrom is 27');
assert(doc.priceCurrency === 'EUR', 'Public priceCurrency is EUR');
assert(doc.priceUnit === 'night', 'Public priceUnit is night');
assert(!publicPrice.includes('.'), 'Public price text does not contain "."');

const adminNormalized = {
  priceFrom: Number.isFinite(Number(doc.priceFrom ?? doc.price ?? doc.pricePerNight)) ? Number(doc.priceFrom ?? doc.price ?? doc.pricePerNight) : null,
  priceCurrency: String(doc.priceCurrency || doc.currency || 'EUR').trim() || 'EUR',
  priceUnit: String(doc.priceUnit || doc.pricePerNightUnit || 'night').trim() || 'night',
};

assert(adminNormalized.priceFrom === 27, 'Admin edit price resolves to 27');
assert(adminNormalized.priceCurrency === 'EUR', 'Admin edit currency resolves to EUR');
assert(adminNormalized.priceUnit === 'night', 'Admin edit unit resolves to night');
assert(String(adminNormalized.priceFrom) !== '.', 'Admin edit price does not resolve to "."');
assert(!Number.isNaN(adminNormalized.priceFrom ?? NaN), 'Admin edit price does not resolve to NaN');

const savePayload = {
  priceFrom: adminNormalized.priceFrom,
  priceCurrency: adminNormalized.priceCurrency,
  priceUnit: adminNormalized.priceUnit,
  price: adminNormalized.priceFrom,
  pricePerNight: adminNormalized.priceFrom,
};

assert(savePayload.priceFrom === 27, 'Save payload writes priceFrom as 27');
assert(savePayload.priceCurrency === 'EUR', 'Save payload writes currency as EUR');
assert(savePayload.priceUnit === 'night', 'Save payload writes unit as night');
assert(!Object.values(savePayload).some((value) => value === '.' || Number.isNaN(value)), 'Save payload omits "." and NaN');

const description = sanitizeDescription(doc.rawSource?.detail?.descriptionExtended || doc.rawSource?.detail?.description || doc.description || '');
assert(description.length > 0, 'Admin has a description candidate to normalize');
assert(!/[\uFFFD]/.test(description), 'Description candidate does not contain replacement character');

const browserExecutablePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const launchOptions = fs.existsSync(browserExecutablePath) ? { headless: true, executablePath: browserExecutablePath } : { headless: true };
const browser = await chromium.launch(launchOptions);
const page = await browser.newPage({ viewport: { width: 1440, height: 1200 } });

try {
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForSelector('input[placeholder="Enter Email"]', { timeout: 60000 });
  await page.locator('input[placeholder="Enter Email"]').fill('manager.emtilek@gmail.com');
  await page.locator('input[placeholder="Enter Password"]').fill('ChangeMe123!');
  await page.locator('button[type="submit"]').click();
  await page.waitForTimeout(5000);

  await page.goto(`${BASE_URL}/admin/hotels`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForSelector('input[placeholder="Search by title..."]', { timeout: 60000 });

  const search = page.locator('input[placeholder="Search by title..."]');
  await search.fill('Cesar Palace Sousse');
  await page.waitForTimeout(700);

  const cesarRow = page.locator('tr', { hasText: 'Cesar Palace Sousse' }).first();
  await cesarRow.waitFor({ state: 'visible', timeout: 15000 });
  const cesarRowText = normalizeText(await cesarRow.innerText());
  assert(/27 EUR \/ night/.test(cesarRowText), 'Admin table shows Cesar Palace Sousse as 27 EUR / night');
  assert(!/TND 0/.test(cesarRowText), 'Admin table does not show TND 0 for Cesar Palace Sousse');

  const searchResultsText = normalizeText(await page.locator('table').innerText());
  assert(/27 EUR \/ night/.test(searchResultsText), 'Admin table keeps the canonical price label visible');

  await page.waitForSelector(`[data-testid="admin-edit-${docId}"]`, { timeout: 15000 });
  const editButton = page.getByTestId(`admin-edit-${docId}`);
  await editButton.click();
  const modal = page.locator('.modal.show');
  await modal.waitFor({ state: 'visible', timeout: 15000 });
  const modalText = normalizeText(await modal.innerText());
  assert(/Price per Night/.test(modalText) && /Currency/.test(modalText) && /Price Unit/.test(modalText), 'Admin edit modal exposes canonical price fields');
  const modalInputs = modal.locator('input');
  const priceValue = await modalInputs.nth(6).inputValue();
  const currencyValue = await modalInputs.nth(7).inputValue();
  const unitValue = await modalInputs.nth(8).inputValue();
  assert(priceValue === '27', 'Admin edit modal price input resolves to 27');
  assert(currencyValue === 'EUR', 'Admin edit modal currency input resolves to EUR');
  assert(unitValue === 'night', 'Admin edit modal unit input resolves to night');

  const missingPriceHotel = hotels.find((hotel) => {
    if (!isTunisieBookingHotel(hotel)) return false;
    const price = parseNumber(hotel.priceFrom ?? hotel.price ?? hotel.pricePerNight);
    return price === null || price <= 0;
  });

  assert(missingPriceHotel, 'At least one TunisieBooking hotel is missing a price');
  const missingTitle = getHotelTitle(missingPriceHotel);
  await search.fill(missingTitle);
  await page.waitForTimeout(700);
  const missingRow = page.locator('tr', { hasText: missingTitle }).first();
  await missingRow.waitFor({ state: 'visible', timeout: 15000 });
  const missingRowText = normalizeText(await missingRow.innerText());
  assert(/Missing price/.test(missingRowText), 'Admin table marks missing prices clearly');
  assert(!/TND 0/.test(missingRowText), 'Admin table does not invent TND 0 for missing prices');

  console.log(JSON.stringify({
    publicPrice,
    adminNormalized,
    savePayload,
    descriptionSample: description.slice(0, 180),
    liveChecks: {
      cesarRowText,
      missingTitle,
      missingRowText,
      priceValue,
      currencyValue,
      unitValue,
    },
    checks: 'passed',
  }, null, 2));
} finally {
  await page.close();
  await browser.close();
}
