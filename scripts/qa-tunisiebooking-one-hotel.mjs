import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const draftPath = path.join(root, 'tmp', 'tunisiebooking-one-hotel-draft.json');
const requestPath = path.join(root, 'tmp', 'tunisiebooking-one-hotel-booking-request-shape.json');
const analysisPath = path.join(root, 'tmp', 'tunisiebooking-one-hotel-analysis.md');
const debugPath = path.join(root, 'tmp', 'tunisiebooking-one-hotel-analysis.json');
const extractorPath = path.join(root, 'scripts', 'extract-tunisiebooking-one-hotel.mjs');

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, 'utf8'));
const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

assert(fs.existsSync(extractorPath), 'Extractor script exists');
assert(fs.existsSync(draftPath), 'Draft JSON exists');
assert(fs.existsSync(requestPath), 'Booking request JSON exists');
assert(fs.existsSync(analysisPath), 'Analysis markdown exists');
assert(fs.existsSync(debugPath), 'Debug JSON exists');

const extractor = fs.readFileSync(extractorPath, 'utf8');
assert(!/setDoc|addDoc|updateDoc|deleteDoc|writeBatch|bulkWriter|runTransaction/i.test(extractor), 'Extractor has no Firestore write code');
assert(!/firebase deploy|deploy:hosting|deploy:rules/i.test(extractor), 'Extractor has no deploy code');
assert(!/functions\/src\/index\.ts|firestore\.rules|storage\.rules|duffel/i.test(extractor), 'Extractor does not touch protected files');

const draft = readJson(draftPath);
const request = readJson(requestPath);
const debug = readJson(debugPath);

assert(draft.sourceName === 'TunisieBooking', 'sourceName is TunisieBooking');
assert(typeof draft.sourceListingUrl === 'string' && draft.sourceListingUrl.includes('/hotel-tunisie/'), 'sourceListingUrl points at TunisieBooking listing');
assert(typeof draft.sourceUrl === 'string' && draft.sourceUrl.includes('tunisiebooking.com/hotel-tunisie/'), 'sourceUrl is the TunisieBooking detail page');
assert(Array.isArray(draft.gallery), 'gallery is an array');
assert(Array.isArray(draft.amenities), 'amenities is an array');
assert(Array.isArray(draft.boardOptions), 'boardOptions is an array');
assert(Array.isArray(draft.roomTypes), 'roomTypes is an array');
assert(draft.published === false, 'published is false');
assert(draft.status === 'draft', 'status is draft');
assert(draft.bookingMode === 'request_only', 'bookingMode is request_only');
assert(draft.bookingEnabled === false, 'bookingEnabled is false');
assert(draft.priceStatus === 'source_reference', 'priceStatus is source_reference');
assert(draft.pricingDiscovery && typeof draft.pricingDiscovery === 'object', 'pricingDiscovery exists');
assert(Array.isArray(draft.gallery) && draft.gallery.length > 0, 'gallery has extracted images');
assert(typeof draft.image === 'string' && draft.image.length > 0, 'image is present');
assert(draft.pricingDiscovery.apiObserved === true, 'pricingDiscovery says apiObserved true');
assert(Array.isArray(draft.pricingDiscovery.variableFactors), 'pricingDiscovery variableFactors exists');
for (const field of ['checkIn', 'checkOut', 'rooms', 'adults', 'children', 'childAges', 'boardType', 'roomType']) {
  assert(draft.pricingDiscovery.variableFactors.includes(field), `pricingDiscovery includes ${field}`);
}
assert(request.quoteStatus === 'estimate_only', 'request quoteStatus is estimate_only');
assert(request.finalConfirmationRequired === true, 'request requires final confirmation');
assert(request.sourceName === 'TunisieBooking', 'request sourceName is TunisieBooking');
assert(typeof request.sourceUrl === 'string' && request.sourceUrl === draft.sourceUrl, 'request sourceUrl matches draft');
assert(draft.importedAt && typeof draft.importedAt === 'string', 'importedAt exists');
assert(debug.selectedHotelName === draft.hotelName, 'debug JSON matches selected hotel');
assert(debug.priceFrom === draft.priceFrom, 'debug JSON tracks priceFrom');

const analysis = fs.readFileSync(analysisPath, 'utf8');
assert(analysis.includes('TunisieBooking One Hotel Analysis'), 'analysis markdown has title');
assert(analysis.includes('Pricing Discovery'), 'analysis markdown includes pricing section');
assert(analysis.includes('request-only'), 'analysis markdown describes request-only model');

console.log(
  JSON.stringify(
    {
      selectedHotelName: draft.hotelName,
      galleryCount: draft.gallery.length,
      amenityCount: draft.amenities.length,
      boardOptions: draft.boardOptions.length,
      roomTypes: draft.roomTypes.length,
      priceFrom: draft.priceFrom,
      priceCurrency: draft.priceCurrency,
      priceDate: draft.priceDate,
      apiObserved: draft.pricingDiscovery.apiObserved,
      requestStatus: request.quoteStatus,
    },
    null,
    2,
  ),
);
