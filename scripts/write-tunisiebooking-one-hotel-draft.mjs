import fs from 'node:fs';
import path from 'node:path';
import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

const PROJECT_ID = 'tour-tunisi';
const INPUT_PATH = path.join(process.cwd(), 'tmp', 'tunisiebooking-one-hotel-draft.json');
const REPORT_PATH = path.join(process.cwd(), 'tmp', 'tunisiebooking-one-hotel-write-report.json');
const TARGET_COLLECTION = 'hotels';
const TARGET_DOC_ID = 'imported-tunisiebooking-vincci-helios-beach-djerba';
const MUTABLE_UPDATE_FIELDS = [
  'title',
  'hotelName',
  'slug',
  'country',
  'city',
  'region',
  'address',
  'starRating',
  'ratingValue',
  'ratingLabel',
  'reviewsCount',
  'reviewSummary',
  'image',
  'gallery',
  'latitude',
  'longitude',
  'mapSource',
  'nearbyAttractions',
  'description',
  'highlights',
  'amenities',
  'services',
  'roomTypes',
  'boardOptions',
  'faq',
  'reviews',
  'roomInventoryText',
  'roomCount',
  'checkInTime',
  'checkOutTime',
  'policySource',
  'cancellationPolicy',
  'childrenPolicy',
  'paymentPolicy',
  'lateCheckoutPolicy',
  'priceFrom',
  'priceCurrency',
  'priceUnit',
  'priceDate',
  'priceNote',
  'priceStatus',
  'pricingDiscovery',
  'dynamicPricingStatus',
  'apiObserved',
  'apiEndpoint',
  'apiNotes',
  'missingFields',
  'completeness',
  'sourceName',
  'sourceListingUrl',
  'sourceUrl',
  'rawSource',
  'importedDraftType',
];

const clean = (value) =>
  String(value ?? '')
    .normalize('NFKC')
    .replace(/\s+/g, ' ')
    .trim();

const uniqueStrings = (value) =>
  [...new Set((Array.isArray(value) ? value : []).map((entry) => clean(entry)).filter(Boolean))];

const normalizeObjectList = (value) =>
  Array.isArray(value)
    ? value.map((item) => {
        if (!item || typeof item !== 'object') return null;
        return Object.fromEntries(
          Object.entries(item)
            .map(([key, entry]) => [key, typeof entry === 'string' ? clean(entry) : entry])
            .filter(([, entry]) => entry !== '' && entry != null),
        );
      }).filter(Boolean)
    : [];

const initDb = () => {
  if (admin.getApps().length === 0) {
    admin.initializeApp({ projectId: PROJECT_ID });
  }
  return getFirestore();
};

const ensureInputExists = () => {
  if (!fs.existsSync(INPUT_PATH)) {
    throw new Error(`Missing input draft JSON at ${INPUT_PATH}. Run: node scripts/extract-tunisiebooking-one-hotel.mjs`);
  }
};

const buildHotelDoc = (draft) => ({
  sourceName: clean(draft.sourceName || 'TunisieBooking'),
  sourceListingUrl: clean(draft.sourceListingUrl || ''),
  sourceUrl: clean(draft.sourceUrl || ''),
  importedAt: clean(draft.importedAt || new Date().toISOString()),
  title: clean(draft.title || draft.hotelName || ''),
  hotelName: clean(draft.hotelName || draft.title || ''),
  slug: clean(draft.slug || ''),
  country: clean(draft.country || 'Tunisia'),
  city: clean(draft.city || ''),
  region: clean(draft.region || ''),
  address: clean(draft.address || ''),
  starRating: draft.starRating ?? null,
  ratingValue: draft.ratingValue ?? null,
  ratingLabel: clean(draft.ratingLabel || ''),
  reviewsCount: draft.reviewsCount ?? null,
  reviewSummary: clean(draft.reviewSummary || ''),
  image: clean(draft.image || ''),
  gallery: uniqueStrings(draft.gallery),
  latitude: draft.latitude ?? null,
  longitude: draft.longitude ?? null,
  mapSource: clean(draft.mapSource || ''),
  nearbyAttractions: uniqueStrings(draft.nearbyAttractions),
  description: clean(draft.description || ''),
  highlights: uniqueStrings(draft.highlights),
  amenities: uniqueStrings(draft.amenities),
  services: uniqueStrings(draft.services || draft.amenities),
  roomTypes: uniqueStrings(draft.roomTypes),
  boardOptions: normalizeObjectList(draft.boardOptions),
  faq: normalizeObjectList(draft.faq),
  reviews: normalizeObjectList(draft.reviews),
  roomInventoryText: clean(draft.roomInventoryText || ''),
  roomCount: draft.roomCount ?? null,
  checkInTime: clean(draft.checkInTime || ''),
  checkOutTime: clean(draft.checkOutTime || ''),
  policySource: clean(draft.policySource || 'TunisieBooking'),
  cancellationPolicy: draft.cancellationPolicy ?? null,
  childrenPolicy: draft.childrenPolicy ?? null,
  paymentPolicy: draft.paymentPolicy ?? null,
  lateCheckoutPolicy: draft.lateCheckoutPolicy ?? null,
  priceFrom: draft.priceFrom ?? null,
  priceCurrency: clean(draft.priceCurrency || ''),
  priceUnit: clean(draft.priceUnit || ''),
  priceDate: clean(draft.priceDate || ''),
  priceNote: clean(draft.priceNote || ''),
  priceStatus: clean(draft.priceStatus || ''),
  pricingDiscovery: draft.pricingDiscovery || null,
  dynamicPricingStatus: clean(draft.dynamicPricingStatus || ''),
  apiObserved: draft.apiObserved === true,
  apiEndpoint: clean(draft.apiEndpoint || ''),
  apiNotes: clean(draft.apiNotes || ''),
  missingFields: uniqueStrings(draft.missingFields),
  completeness: draft.completeness || null,
  bookingMode: 'request_only',
  bookingEnabled: false,
  published: false,
  status: 'draft',
  rawSource: draft.rawSource || {},
  importedDraftType: 'tunisiebooking-one-hotel',
  writtenAt: new Date().toISOString(),
});

const stringifyComparable = (value) => JSON.stringify(value ?? null);

const buildUpdatePayload = (doc) =>
  Object.fromEntries(MUTABLE_UPDATE_FIELDS.map((field) => [field, doc[field]]).concat([['writtenAt', doc.writtenAt]]));

async function main() {
  const args = process.argv.slice(2);
  const dryRun = !args.includes('--write');
  const updateExisting = args.includes('--update-existing');

  ensureInputExists();

  const draft = JSON.parse(fs.readFileSync(INPUT_PATH, 'utf8'));
  if (!draft || typeof draft !== 'object') {
    throw new Error('Input draft JSON is invalid.');
  }

  const doc = buildHotelDoc(draft);
  const db = initDb();
  const docRef = db.collection(TARGET_COLLECTION).doc(TARGET_DOC_ID);
  const existing = await docRef.get();
  const existingData = existing.exists ? existing.data() || {} : null;
  const updatePayload = buildUpdatePayload(doc);
  const changedFields = Object.keys(updatePayload).filter((field) => stringifyComparable(existingData?.[field]) !== stringifyComparable(updatePayload[field]));

  const summary = {
    generatedAt: new Date().toISOString(),
    dryRun,
    updateExisting,
    targetCollection: TARGET_COLLECTION,
    targetDocId: TARGET_DOC_ID,
    totalInput: 1,
    eligible: 1,
    written: 0,
    alreadyExists: existing.exists ? 1 : 0,
    skipped: 0,
    errors: 0,
    writeMode: dryRun ? 'dry_run' : 'write',
    fieldsToWrite: Object.keys(doc),
    fieldsToUpdate: changedFields,
    imageCount: (doc.image ? 1 : 0) + doc.gallery.length,
    amenitiesCount: doc.amenities.length,
    boardOptionsCount: doc.boardOptions.length,
    roomTypesCount: doc.roomTypes.length,
    faqCount: doc.faq.length,
    reviewsCount: doc.reviews.length,
    priceFrom: doc.priceFrom ?? null,
    priceCurrency: doc.priceCurrency || '',
    priceUnit: doc.priceUnit || '',
    priceDate: doc.priceDate || '',
    skippedItems: [],
  };

  if (updateExisting) {
    if (!existing.exists) {
      summary.skipped += 1;
      summary.skippedItems.push({
        docId: TARGET_DOC_ID,
        reason: 'missing_existing_doc_for_update',
      });
    } else if (dryRun) {
      summary.skipped += 1;
      summary.skippedItems.push({
        docId: TARGET_DOC_ID,
        reason: 'dry_run_update_existing',
        fields: changedFields,
      });
    } else {
      await docRef.set(
        {
          ...updatePayload,
          bookingMode: 'request_only',
          bookingEnabled: false,
          published: false,
          status: 'draft',
        },
        { merge: true },
      );
      summary.written = 1;
    }
  } else if (existing.exists) {
    summary.skipped += 1;
    summary.skippedItems.push({
      docId: TARGET_DOC_ID,
      reason: 'already_exists',
    });
  } else if (dryRun) {
    summary.skipped += 1;
    summary.skippedItems.push({
      docId: TARGET_DOC_ID,
      reason: 'dry_run',
    });
  } else {
    await docRef.set(doc, { merge: false });
    summary.written = 1;
  }

  fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
  fs.writeFileSync(REPORT_PATH, JSON.stringify(summary, null, 2));

  console.log(
    JSON.stringify(
      {
        dryRun,
        updateExisting,
        targetCollection: TARGET_COLLECTION,
        targetDocId: TARGET_DOC_ID,
        written: summary.written,
        alreadyExists: summary.alreadyExists,
        skipped: summary.skipped,
        errors: summary.errors,
        fieldsToUpdate: changedFields,
        imageCount: summary.imageCount,
        amenitiesCount: summary.amenitiesCount,
        boardOptionsCount: summary.boardOptionsCount,
        roomTypesCount: summary.roomTypesCount,
        faqCount: summary.faqCount,
        reviewsCount: summary.reviewsCount,
        priceFrom: summary.priceFrom,
        priceCurrency: summary.priceCurrency,
        priceUnit: summary.priceUnit,
        priceDate: summary.priceDate,
        reportPath: REPORT_PATH,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error?.stack || error?.message || error);
  process.exit(1);
});
