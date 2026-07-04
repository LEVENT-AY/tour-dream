import fs from 'node:fs';
import path from 'node:path';
import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

const PROJECT_ID = 'tour-tunisi';
const INPUT_PATH = path.join(process.cwd(), 'tmp', 'tunisiebooking-one-hotel-draft.json');
const REPORT_PATH = path.join(process.cwd(), 'tmp', 'tunisiebooking-one-hotel-write-report.json');
const TARGET_COLLECTION = 'hotels';
const TARGET_DOC_ID = 'imported-tunisiebooking-vincci-helios-beach-djerba';

const clean = (value) =>
  String(value ?? '')
    .normalize('NFKC')
    .replace(/\s+/g, ' ')
    .trim();

const normalizeUrlList = (value) =>
  [...new Set((Array.isArray(value) ? value : []).map((entry) => clean(entry)).filter(Boolean))];

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
  image: clean(draft.image || ''),
  gallery: normalizeUrlList(draft.gallery),
  ratingValue: draft.ratingValue ?? null,
  ratingLabel: clean(draft.ratingLabel || ''),
  starRating: draft.starRating ?? null,
  description: clean(draft.description || ''),
  amenities: Array.isArray(draft.amenities) ? draft.amenities.map(clean).filter(Boolean) : [],
  boardOptions: Array.isArray(draft.boardOptions)
    ? draft.boardOptions.map((item) => ({
        code: clean(item?.code || ''),
        label: clean(item?.label || ''),
      }))
    : [],
  roomTypes: Array.isArray(draft.roomTypes) ? draft.roomTypes.map(clean).filter(Boolean) : [],
  priceFrom: draft.priceFrom ?? null,
  priceCurrency: clean(draft.priceCurrency || ''),
  priceUnit: clean(draft.priceUnit || ''),
  priceDate: clean(draft.priceDate || ''),
  priceNote: clean(draft.priceNote || ''),
  priceStatus: clean(draft.priceStatus || ''),
  pricingDiscovery: draft.pricingDiscovery || null,
  bookingMode: 'request_only',
  bookingEnabled: false,
  published: false,
  status: 'draft',
  rawSource: draft.rawSource || {},
  importedDraftType: 'tunisiebooking-one-hotel',
  writtenAt: new Date().toISOString(),
});

async function main() {
  const dryRun = !process.argv.includes('--write');
  ensureInputExists();

  const draft = JSON.parse(fs.readFileSync(INPUT_PATH, 'utf8'));
  const docIds = [TARGET_DOC_ID];
  if (!draft || typeof draft !== 'object') {
    throw new Error('Input draft JSON is invalid.');
  }

  const doc = buildHotelDoc(draft);
  const db = initDb();
  const docRef = db.collection(TARGET_COLLECTION).doc(TARGET_DOC_ID);
  const existing = await docRef.get();

  const summary = {
    generatedAt: new Date().toISOString(),
    dryRun,
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
    imageCount: Array.isArray(doc.gallery) ? doc.gallery.length + (doc.image ? 1 : 0) : doc.image ? 1 : 0,
    amenitiesCount: Array.isArray(doc.amenities) ? doc.amenities.length : 0,
    boardOptionsCount: Array.isArray(doc.boardOptions) ? doc.boardOptions.length : 0,
    roomTypesCount: Array.isArray(doc.roomTypes) ? doc.roomTypes.length : 0,
    priceFrom: doc.priceFrom ?? null,
    priceCurrency: doc.priceCurrency || '',
    priceUnit: doc.priceUnit || '',
    priceDate: doc.priceDate || '',
    skippedItems: [],
  };

  if (existing.exists) {
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
        targetCollection: TARGET_COLLECTION,
        targetDocId: TARGET_DOC_ID,
        written: summary.written,
        alreadyExists: summary.alreadyExists,
        skipped: summary.skipped,
        errors: summary.errors,
        imageCount: summary.imageCount,
        amenitiesCount: summary.amenitiesCount,
        boardOptionsCount: summary.boardOptionsCount,
        roomTypesCount: summary.roomTypesCount,
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
  console.error(error?.message || error);
  process.exit(1);
});
