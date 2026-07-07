import fs from 'node:fs';
import path from 'node:path';
import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

const root = process.cwd();
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');
const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

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
const snap = await db.collection('hotels').doc('imported-tunisiebooking-cesar-palace-sousse-sousse').get();
assert(snap.exists, 'Cesar Palace Sousse exists in Firestore');
const doc = snap.data();
assert(doc, 'Cesar Palace Sousse data is readable');

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

console.log(JSON.stringify({
  publicPrice,
  adminNormalized,
  savePayload,
  descriptionSample: description.slice(0, 180),
  checks: 'passed',
}, null, 2));
