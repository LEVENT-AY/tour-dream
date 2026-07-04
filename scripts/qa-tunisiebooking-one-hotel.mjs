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

const normalizeImageUrl = (value) => {
  if (typeof value !== 'string' || !value.trim()) return '';
  try {
    const parsed = new URL(value.trim());
    parsed.hash = '';
    parsed.search = '';
    parsed.hostname = parsed.hostname.toLowerCase();
    return parsed.toString();
  } catch {
    return '';
  }
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
const combinedImages = [draft.image, ...(Array.isArray(draft.gallery) ? draft.gallery : [])].filter(Boolean);
const normalizedImages = combinedImages.map((item) => normalizeImageUrl(item));

assert(draft.sourceName === 'TunisieBooking', 'sourceName is TunisieBooking');
assert(typeof draft.sourceListingUrl === 'string' && draft.sourceListingUrl.includes('/hotel-tunisie/'), 'sourceListingUrl points at TunisieBooking listing');
assert(typeof draft.sourceUrl === 'string' && draft.sourceUrl.includes('tunisiebooking.com/hotel-tunisie/'), 'sourceUrl is the TunisieBooking detail page');
assert(draft.published === false, 'published is false');
assert(draft.status === 'draft', 'status is draft');
assert(draft.bookingMode === 'request_only', 'bookingMode is request_only');
assert(draft.bookingEnabled === false, 'bookingEnabled is false');
assert(draft.priceStatus === 'source_reference', 'priceStatus is source_reference');
assert(draft.dynamicPricingStatus === 'api_observed_but_not_integrated', 'dynamicPricingStatus is source-backed and honest');
assert(draft.apiObserved === true, 'apiObserved is true');
assert(draft.apiEndpoint === 'https://www.tunisiebooking.com/theme/traitement_detailv4resp2_fr_new.php', 'apiEndpoint matches observed detail endpoint');
assert(draft.pricingDiscovery && typeof draft.pricingDiscovery === 'object', 'pricingDiscovery exists');
assert(Array.isArray(draft.gallery), 'gallery is an array');
assert(draft.gallery.length > 3, 'gallery has more than 3 source-backed images');
assert(typeof draft.image === 'string' && draft.image.length > 0, 'image is present');
assert(Array.isArray(draft.amenities) && draft.amenities.length > 20, 'amenities are extracted');
assert(Array.isArray(draft.services) && draft.services.length === draft.amenities.length, 'services mirror source-backed amenities');
assert(Array.isArray(draft.boardOptions) && draft.boardOptions.length >= 3, 'boardOptions are extracted');
assert(Array.isArray(draft.roomTypes) && draft.roomTypes.length >= 3, 'roomTypes are extracted');
assert(Array.isArray(draft.faq) && draft.faq.length >= 5, 'FAQ entries are extracted');
assert(Array.isArray(draft.reviews) && draft.reviews.length >= 5, 'reviews are extracted');
assert(Array.isArray(draft.nearbyAttractions) && draft.nearbyAttractions.length >= 1, 'nearby attractions are extracted');
assert(typeof draft.latitude === 'number' && draft.latitude > 30 && draft.latitude < 38, 'latitude is a Tunisia coordinate');
assert(typeof draft.longitude === 'number' && draft.longitude > 7 && draft.longitude < 12.5, 'longitude is a Tunisia coordinate');
assert(draft.mapSource === 'TunisieBooking', 'mapSource is TunisieBooking');
assert(typeof draft.checkInTime === 'string' && draft.checkInTime.length > 0, 'checkInTime is extracted');
assert(typeof draft.checkOutTime === 'string' && draft.checkOutTime.length > 0, 'checkOutTime is extracted');
assert(Array.isArray(draft.missingFields), 'missingFields is an array');

for (const field of ['cancellationPolicy', 'childrenPolicy', 'paymentPolicy', 'lateCheckoutPolicy', 'officialWebsite', 'directHotelEmail', 'directHotelPhone', 'finalRateTable']) {
  assert(draft.missingFields.includes(field), `missingFields includes ${field}`);
}

assert(draft.cancellationPolicy == null, 'cancellationPolicy remains null when missing');
assert(draft.childrenPolicy == null, 'childrenPolicy remains null when missing');
assert(draft.paymentPolicy == null, 'paymentPolicy remains null when missing');
assert(draft.lateCheckoutPolicy == null, 'lateCheckoutPolicy remains null when missing');
assert(!JSON.stringify(draft).includes('support@example.com'), 'no support@example.com in extracted draft');
assert(!JSON.stringify(draft).includes('credit card will be required upon booking'), 'no fake credit-card policy in extracted draft');
assert(!draft.gallery.some((src) => /assets\/img\/hotels|hotel-large-|hotel-thumb-/i.test(src)), 'gallery contains no template image URLs');
assert(!combinedImages.some((src) => /logo|icon|favicon|preloader|loader|spinner|tracking|pixel|sprite|placeholder|facebook\.com\/tr/i.test(src)), 'image set contains no tracking or placeholder assets');
assert(new Set(normalizedImages).size === normalizedImages.length, 'no duplicate normalized image URLs remain');
assert(!draft.gallery.includes(draft.image), 'main image is not duplicated inside gallery');
assert(!draft.services.some((item) => /Wheelchair accessible|Visual alarms in hallways|Braille\/raised signage|Wheelchair-accessible concierge desk/i.test(item)), 'no static accessibility template services mixed in');
assert(!/�/.test(draft.description), 'description has no replacement characters');
assert(!draft.highlights.some((item) => /�/.test(item)), 'highlights have no replacement characters');
assert(!draft.faq.some((item) => /�/.test(JSON.stringify(item))), 'FAQ has no replacement characters');
assert(!draft.nearbyAttractions.some((item) => /�/.test(item)), 'nearby attractions have no replacement characters');
assert(!/�/.test(draft.rawSource?.detail?.description || ''), 'rawSource detail description has no replacement characters');
assert(/[éèàô]/.test(draft.description), 'description keeps French accents');

assert(request.quoteStatus === 'estimate_only', 'request quoteStatus is estimate_only');
assert(request.finalConfirmationRequired === true, 'request requires final confirmation');
assert(request.sourceName === 'TunisieBooking', 'request sourceName is TunisieBooking');
assert(typeof request.sourceUrl === 'string' && request.sourceUrl === draft.sourceUrl, 'request sourceUrl matches draft');
assert(draft.importedAt && typeof draft.importedAt === 'string', 'importedAt exists');
assert(debug.selectedHotelName === draft.hotelName, 'debug JSON matches selected hotel');
assert(debug.priceFrom === draft.priceFrom, 'debug JSON tracks priceFrom');
assert(debug.galleryCount === draft.gallery.length, 'debug JSON tracks gallery count');
assert(debug.descriptionHasReplacementChar === false, 'debug JSON confirms clean description');
assert(debug.highlightHasReplacementChar === false, 'debug JSON confirms clean highlights');
assert(debug.faqHasReplacementChar === false, 'debug JSON confirms clean FAQ');
assert(debug.nearbyHasReplacementChar === false, 'debug JSON confirms clean nearby text');

const analysis = fs.readFileSync(analysisPath, 'utf8');
assert(analysis.includes('TunisieBooking One Hotel Analysis'), 'analysis markdown has title');
assert(analysis.includes('Missing Fields'), 'analysis markdown includes missing fields section');
assert(/estimate_only|finalConfirmationRequired|Dynamic pricing status/i.test(analysis), 'analysis markdown describes the request-only pricing model');

console.log(
  JSON.stringify(
    {
      selectedHotelName: draft.hotelName,
      mainImage: draft.image,
      galleryCount: draft.gallery.length,
      amenityCount: draft.amenities.length,
      boardOptions: draft.boardOptions.length,
      roomTypes: draft.roomTypes.length,
      faqCount: draft.faq.length,
      reviewsCount: draft.reviews.length,
      nearbyCount: draft.nearbyAttractions.length,
      latitude: draft.latitude,
      longitude: draft.longitude,
      checkInTime: draft.checkInTime,
      checkOutTime: draft.checkOutTime,
      hasReplacementCharacters: false,
      missingFields: draft.missingFields,
    },
    null,
    2,
  ),
);
