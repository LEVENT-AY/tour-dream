import fs from 'node:fs';
import path from 'node:path';
import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { normalizeHotelImageUrlList, normalizeAbsoluteImageUrl } from './tunisiebooking-image-utils.mjs';

const PROJECT_ID = 'tour-tunisi';
const INPUT_PATH = path.join(process.cwd(), 'tmp', 'tunisiebooking-35-hotels-dry-run.json');
const REPORT_JSON_PATH = path.join(process.cwd(), 'tmp', 'tunisiebooking-35-hotels-write-report.json');
const REPORT_MD_PATH = path.join(process.cwd(), 'tmp', 'tunisiebooking-35-hotels-write-report.md');
const TARGET_COLLECTION = 'hotels';
const SOURCE_NAME = 'TunisieBooking';
const IMPORT_SOURCE = 'tunisiebooking';

const SOURCE_BACKED_FIELDS = [
  'sourceName',
  'importSource',
  'sourceListingUrl',
  'sourceUrl',
  'sourceRegion',
  'sourceCity',
  'city',
  'region',
  'country',
  'address',
  'title',
  'hotelName',
  'slug',
  'image',
  'gallery',
  'latitude',
  'longitude',
  'mapSource',
  'nearbyAttractions',
  'nearbySections',
  'nearbyLandmarks',
  'description',
  'highlights',
  'highlightChips',
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
  'qualityStatus',
  'qualityWarnings',
  'quality',
  'reviewSummaryForAdmin',
  'adminReview',
  'reviewStatus',
  'bookingMode',
  'bookingEnabled',
  'published',
  'status',
  'importedAt',
  'updatedAt',
  'writtenAt',
];

const PROTECTED_FIELDS = ['published', 'status', 'bookingEnabled', 'bookingMode', 'reviewStatus', 'adminReview.status'];

const cleanText = (value) =>
  String(value ?? '')
    .normalize('NFKC')
    .replace(/\uFFFD+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const hasMojibake = (value) => /ÃƒÆ’|Ãƒâ€š|ÃƒÂ¢Ã¢â€šÂ¬|ÃƒÂ¯Ã‚Â¿Ã‚Â½|Ã¯Â¿Â½/.test(String(value || ''));

const repairMojibake = (value) => {
  const text = cleanText(value);
  if (!text || !hasMojibake(text)) return text;

  try {
    const bytes = Uint8Array.from(text, (char) => char.charCodeAt(0) & 0xff);
    const repaired = new TextDecoder('utf-8').decode(bytes).replace(/\u0000/g, '').trim();
    return repaired || text;
  } catch {
    return text;
  }
};

const normalizeText = (value) => repairMojibake(cleanText(value));

const normalizeUrl = (value) => normalizeAbsoluteImageUrl(normalizeText(value));

const uniqueStrings = (value) =>
  [...new Set((Array.isArray(value) ? value : []).map((entry) => normalizeText(entry)).filter(Boolean))];

const normalizeObject = (value) => {
  if (Array.isArray(value)) {
    return value.map((entry) => normalizeObject(entry)).filter((entry) => entry !== null);
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .map(([key, entry]) => [key, normalizeObject(entry)])
        .filter(([, entry]) => entry !== undefined),
    );
  }
  if (typeof value === 'string') return normalizeText(value);
  if (typeof value === 'number' || typeof value === 'boolean' || value === null) return value;
  return undefined;
};

const normalizeNearbySections = (value) =>
  Array.isArray(value)
    ? value
        .map((section) => {
          if (!section || typeof section !== 'object') return null;
          const title = normalizeText(section.title || '');
          const items = uniqueStrings(section.items || section.entries || []);
          if (!title && !items.length) return null;
          return { title, items };
        })
        .filter(Boolean)
    : [];

const slugify = (value) =>
  normalizeText(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-');

const docIdForHotel = (hotel) => {
  const titleSlug = slugify(hotel.title || hotel.hotelName || 'hotel');
  const citySlug = slugify(hotel.city || hotel.sourceCity || hotel.region || hotel.sourceRegion || 'unknown-city');
  return `imported-tunisiebooking-${titleSlug}-${citySlug}`.slice(0, 180);
};

const canonicalSourceUrl = (value) => normalizeUrl(value);

const buildReviewSummaryForAdmin = (hotel) => {
  const qualityStatus = String(hotel.qualityStatus || hotel.quality?.qualityStatus || '').trim();
  if (qualityStatus === 'ready_for_draft') return 'Ready for draft review';

  const reasons = [];
  const missingFields = uniqueStrings(hotel.missingFields);
  const warnings = uniqueStrings(hotel.qualityWarnings || hotel.quality?.warnings);

  if (!Number.isFinite(Number(hotel.latitude)) || !Number.isFinite(Number(hotel.longitude))) {
    reasons.push('no coordinates');
  }
  if (hotel.priceFrom == null) {
    reasons.push('no price reference');
  }
  if (warnings.some((warning) => /weak gallery|gallery/i.test(warning))) {
    reasons.push('weak gallery');
  }
  if (Array.isArray(hotel.roomTypes) && hotel.roomTypes.length === 0) {
    reasons.push('missing room types');
  }
  if (Array.isArray(hotel.services) && hotel.services.length === 0) {
    reasons.push('unavailable services');
  }
  if (missingFields.length > 0 && reasons.length === 0) {
    reasons.push('missing source fields');
  }

  return `Needs manual review: ${reasons.length ? reasons.join(', ') : 'source completeness review'}`;
};

const buildAdminReview = (hotel, importedAt) => ({
  status: 'pending',
  source: SOURCE_NAME,
  qualityStatus: String(hotel.qualityStatus || hotel.quality?.qualityStatus || 'needs_manual_review'),
  missingFields: uniqueStrings(hotel.missingFields),
  warnings: uniqueStrings(hotel.qualityWarnings || hotel.quality?.warnings),
  notes: '',
  importedAt,
});

const buildMissingFields = (hotel) => {
  const missingFields = new Set(uniqueStrings(hotel.missingFields));
  if (!Number.isFinite(Number(hotel.latitude)) || !Number.isFinite(Number(hotel.longitude))) {
    missingFields.add('coordinates');
  }
  if (hotel.priceFrom == null) {
    missingFields.add('priceReference');
  }
  return [...missingFields];
};

const buildHotelDoc = (hotel, importedAt) => {
  const sourceRegion = normalizeText(hotel.sourceRegion || hotel.region || '');
  const city = normalizeText(hotel.city || '');
  const sourceCity = normalizeText(hotel.sourceCity || city);
  const title = normalizeText(hotel.title || hotel.hotelName || '');
  const roomTypes = uniqueStrings(hotel.roomTypes);
  const services = uniqueStrings(hotel.services);
  const amenities = uniqueStrings(hotel.amenities);
  const nearbySections = normalizeNearbySections(hotel.nearbySections);
  const nearbyAttractions = uniqueStrings(hotel.nearbyAttractions);
  const highlights = uniqueStrings(hotel.highlights);
  const highlightChips = uniqueStrings(hotel.highlightChips);
  const boardOptions = normalizeObject(hotel.boardOptions);
  const faq = normalizeObject(hotel.faq);
  const reviews = normalizeObject(hotel.reviews);
  const gallery = normalizeHotelImageUrlList(hotel.gallery, { baseUrl: hotel.sourceUrl || hotel.sourceListingUrl || '', excludeUrl: hotel.image || '' });
  const qualityStatus = String(hotel.qualityStatus || hotel.quality?.qualityStatus || 'needs_manual_review');
  const qualityWarnings = uniqueStrings(hotel.qualityWarnings || hotel.quality?.warnings);
  const reviewSummaryForAdmin = buildReviewSummaryForAdmin(hotel);
  const adminReview = buildAdminReview(hotel, importedAt);
  const missingFields = buildMissingFields(hotel);
  const document = {
    sourceName: SOURCE_NAME,
    importSource: IMPORT_SOURCE,
    sourceListingUrl: normalizeUrl(hotel.sourceListingUrl || ''),
    sourceUrl: normalizeUrl(hotel.sourceUrl || ''),
    sourceRegion,
    sourceCity,
    country: normalizeText(hotel.country || 'Tunisia'),
    city,
    region: normalizeText(hotel.region || sourceRegion || ''),
    address: normalizeText(hotel.address || ''),
    title,
    hotelName: normalizeText(hotel.hotelName || title),
    slug: slugify(`${title}-${city || sourceRegion || 'hotel'}`),
    image: normalizeHotelImageUrlList([hotel.image], { baseUrl: hotel.sourceUrl || hotel.sourceListingUrl || '' })[0] || '',
    gallery,
    latitude: Number.isFinite(Number(hotel.latitude)) ? Number(hotel.latitude) : null,
    longitude: Number.isFinite(Number(hotel.longitude)) ? Number(hotel.longitude) : null,
    mapSource: normalizeText(hotel.mapSource || ''),
    nearbyAttractions,
    nearbySections,
    description: normalizeText(hotel.description || ''),
    highlights,
    highlightChips,
    amenities,
    services,
    roomTypes,
    boardOptions,
    faq,
    reviews,
    roomInventoryText: normalizeText(hotel.roomInventoryText || ''),
    roomCount: Number.isFinite(Number(hotel.roomCount)) ? Number(hotel.roomCount) : null,
    checkInTime: normalizeText(hotel.checkInTime || ''),
    checkOutTime: normalizeText(hotel.checkOutTime || ''),
    policySource: normalizeText(hotel.policySource || 'TunisieBooking'),
    cancellationPolicy: hotel.cancellationPolicy ?? null,
    childrenPolicy: hotel.childrenPolicy ?? null,
    paymentPolicy: hotel.paymentPolicy ?? null,
    lateCheckoutPolicy: hotel.lateCheckoutPolicy ?? null,
    priceFrom: Number.isFinite(Number(hotel.priceFrom)) ? Number(hotel.priceFrom) : null,
    priceCurrency: normalizeText(hotel.priceCurrency || ''),
    priceUnit: normalizeText(hotel.priceUnit || ''),
    priceDate: normalizeText(hotel.priceDate || ''),
    priceNote: normalizeText(hotel.priceNote || ''),
    priceStatus: normalizeText(hotel.priceStatus || (hotel.priceFrom == null ? 'price_on_request' : 'source_reference')),
    pricingDiscovery: normalizeObject(hotel.pricingDiscovery) || null,
    dynamicPricingStatus: normalizeText(hotel.dynamicPricingStatus || ''),
    apiObserved: hotel.apiObserved === true,
    apiEndpoint: normalizeText(hotel.apiEndpoint || ''),
    apiNotes: normalizeText(hotel.apiNotes || ''),
    missingFields,
    completeness: normalizeObject(hotel.completeness) || null,
    qualityStatus,
    qualityWarnings,
    quality: normalizeObject(hotel.quality) || null,
    reviewSummaryForAdmin,
    adminReview,
    reviewStatus: 'needs_admin_review',
    bookingMode: 'request_only',
    bookingEnabled: false,
    published: false,
    status: 'draft',
    importedAt: normalizeText(hotel.importedAt || importedAt),
    updatedAt: importedAt,
    writtenAt: importedAt,
  };

  return document;
};

const buildMergePayload = (doc) =>
  Object.fromEntries(SOURCE_BACKED_FIELDS.filter((field) => field in doc).map((field) => [field, doc[field]]));

const initDb = () => {
  if (admin.getApps().length === 0) {
    admin.initializeApp({ projectId: PROJECT_ID });
  }
  return getFirestore();
};

const ensureInputExists = () => {
  if (!fs.existsSync(INPUT_PATH)) {
    throw new Error(`Missing input draft JSON at ${INPUT_PATH}. Run: node scripts/extract-tunisiebooking-35-hotels-dry-run.mjs`);
  }
};

const readExistingHotels = async (db) => {
  const snapshot = await db.collection(TARGET_COLLECTION).get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

const isManualOrPublishedConflict = (data) =>
  data && (data.published !== false || String(data.status || '').toLowerCase() !== 'draft' || String(data.importSource || '').toLowerCase() !== IMPORT_SOURCE);

const chooseExistingMatch = (hotel, existingHotels) => {
  const docId = docIdForHotel(hotel);
  const sourceUrl = canonicalSourceUrl(hotel.sourceUrl);
  const title = normalizeText(hotel.title || hotel.hotelName || '');
  const cityOrRegion = normalizeText(hotel.city || hotel.sourceCity || hotel.region || hotel.sourceRegion || '');

  const byDocId = existingHotels.filter((item) => item.id === docId);
  if (byDocId.length > 1) {
    return { kind: 'conflict', reason: 'duplicate_doc_id', docIds: byDocId.map((item) => item.id) };
  }
  if (byDocId.length === 1) {
    return { kind: 'existing', matchType: 'doc_id', doc: byDocId[0], targetDocId: byDocId[0].id };
  }

  const bySourceUrl = sourceUrl
    ? existingHotels.filter((item) => canonicalSourceUrl(item.sourceUrl) === sourceUrl)
    : [];
  if (bySourceUrl.length > 1) {
    return { kind: 'conflict', reason: 'duplicate_source_url', docIds: bySourceUrl.map((item) => item.id) };
  }
  if (bySourceUrl.length === 1) {
    return { kind: 'existing', matchType: 'source_url', doc: bySourceUrl[0], targetDocId: bySourceUrl[0].id };
  }

  const byTitleCity = existingHotels.filter((item) => {
    if (String(item.importSource || '').toLowerCase() !== IMPORT_SOURCE) return false;
    return normalizeText(item.title || item.hotelName || '') === title
      && normalizeText(item.city || item.sourceCity || item.region || item.sourceRegion || '') === cityOrRegion;
  });
  if (byTitleCity.length > 1) {
    return { kind: 'conflict', reason: 'duplicate_title_city_import_source', docIds: byTitleCity.map((item) => item.id) };
  }
  if (byTitleCity.length === 1) {
    return { kind: 'existing', matchType: 'title_city_import_source', doc: byTitleCity[0], targetDocId: byTitleCity[0].id };
  }

  return { kind: 'new', targetDocId: docId };
};

const markdownSection = (title, items) =>
  `## ${title}\n${items.length ? items.map((item) => `- ${item}`).join('\n') : '- None'}\n`;

const buildMarkdownReport = (summary) => {
  const planned = summary.plannedWrites.map((entry) => `- ${entry.action.toUpperCase()} ${entry.docId} | ${entry.title} | ${entry.region}`);
  const conflicts = summary.duplicateConflictItems.map((entry) => `- ${entry.docId} | ${entry.reason}`);
  const manual = summary.manualReviewItems.map((item) => `- ${item.title} (${item.region}) - ${item.reviewSummaryForAdmin}`);
  return `# TunisieBooking 35 Hotel Draft Write Report\n\n## Summary\n- Dry run: ${summary.dryRun}\n- Firestore write attempted: ${summary.firestoreWriteAttempted}\n- Total input: ${summary.totalInput}\n- Ready for draft write: ${summary.readyForDraftWrite}\n- Needs manual review: ${summary.needsManualReview}\n- Would create: ${summary.wouldCreate}\n- Would update: ${summary.wouldUpdate}\n- Would skip: ${summary.wouldSkip}\n- Duplicate conflicts: ${summary.duplicateConflicts.length}\n- Created: ${summary.created}\n- Updated: ${summary.updated}\n- Skipped: ${summary.skipped}\n- Conflicts: ${summary.conflicts}\n- Errors: ${summary.errors}\n\n${markdownSection('Planned Writes', planned)}${markdownSection('Duplicate Conflicts', conflicts)}${markdownSection('Manual Review Hotels', manual)}\n## Protected Fields\n${PROTECTED_FIELDS.map((field) => `- ${field}`).join('\n')}\n`;
};

const main = async () => {
  const args = process.argv.slice(2);
  const dryRun = !args.includes('--write');
  const importedAt = new Date().toISOString();

  ensureInputExists();
  const input = JSON.parse(fs.readFileSync(INPUT_PATH, 'utf8'));
  const hotels = Array.isArray(input.hotels) ? input.hotels : [];
  if (hotels.length !== 35) {
    throw new Error(`Expected 35 hotels in input, found ${hotels.length}.`);
  }

  const db = initDb();
  const existingHotels = await readExistingHotels(db);
  const readyForDraftWrite = hotels.filter((hotel) => String(hotel.quality?.qualityStatus || hotel.qualityStatus || '') === 'ready_for_draft').length;
  const needsManualReview = hotels.filter((hotel) => String(hotel.quality?.qualityStatus || hotel.qualityStatus || '') === 'needs_manual_review').length;

  const plannedWrites = [];
  const duplicateConflicts = [];
  const createDocIds = [];
  const updateDocIds = [];
  const skipDocIds = [];
  const createPlans = [];
  const updatePlans = [];
  const skipItems = [];
  let created = 0;
  let updated = 0;
  let conflicts = 0;
  let errors = 0;

  for (const hotel of hotels) {
    const doc = buildHotelDoc(hotel, importedAt);
    const target = chooseExistingMatch(hotel, existingHotels);
    const isSourceDraft = target.kind === 'existing' && target.doc && !isManualOrPublishedConflict(target.doc);
    const title = doc.title || hotel.title || '';
    const region = doc.sourceRegion || doc.region || '';

    if (target.kind === 'conflict') {
      conflicts += 1;
      duplicateConflicts.push({
        docId: target.docIds[0] || docIdForHotel(hotel),
        reason: target.reason,
        docIds: target.docIds,
        title,
        region,
        sourceUrl: doc.sourceUrl,
      });
      skipItems.push({
        docId: target.docIds[0] || docIdForHotel(hotel),
        reason: target.reason,
        title,
        region,
      });
      continue;
    }

    if (target.kind === 'existing' && !isSourceDraft) {
      conflicts += 1;
      duplicateConflicts.push({
        docId: target.targetDocId,
        reason: 'existing_published_or_manual_conflict',
        title,
        region,
        sourceUrl: doc.sourceUrl,
      });
      skipItems.push({
        docId: target.targetDocId,
        reason: 'existing_published_or_manual_conflict',
        title,
        region,
      });
      continue;
    }

    if (target.kind === 'existing') {
      const existingData = target.doc || {};
      const mergePayload = buildMergePayload(doc);
      plannedWrites.push({
        action: 'update',
        docId: target.targetDocId,
        title,
        region,
        sourceUrl: doc.sourceUrl,
        qualityStatus: doc.qualityStatus,
      });
      updateDocIds.push(target.targetDocId);
      updatePlans.push({ docId: target.targetDocId, mergePayload });

      if (dryRun) {
        continue;
      }

      try {
        await db.collection(TARGET_COLLECTION).doc(target.targetDocId).set(mergePayload, { merge: true });
        updated += 1;
      } catch (error) {
        errors += 1;
        skipItems.push({
          docId: target.targetDocId,
          reason: 'error',
          title,
          region,
          message: error?.message || String(error),
        });
      }
      continue;
    }

    plannedWrites.push({
      action: 'create',
      docId: target.targetDocId,
      title,
      region,
      sourceUrl: doc.sourceUrl,
      qualityStatus: doc.qualityStatus,
    });
    createDocIds.push(target.targetDocId);
    createPlans.push({ docId: target.targetDocId, doc });

    if (dryRun) {
      continue;
    }

    try {
      await db.collection(TARGET_COLLECTION).doc(target.targetDocId).set(doc, { merge: false });
      created += 1;
    } catch (error) {
      errors += 1;
      skipItems.push({
        docId: target.targetDocId,
        reason: 'error',
        title,
        region,
        message: error?.message || String(error),
      });
    }
  }

  const wouldCreate = createDocIds.length;
  const wouldUpdate = updateDocIds.length;
  const wouldSkip = duplicateConflicts.length;
  const dryRunHoldbackCount = dryRun ? wouldCreate + wouldUpdate : 0;
  const skipped = skipItems.length;
  const summary = {
    generatedAt: importedAt,
    dryRun,
    firestoreWriteAttempted: dryRun ? false : true,
    targetCollection: TARGET_COLLECTION,
    sourceName: SOURCE_NAME,
    importSource: IMPORT_SOURCE,
    totalInput: hotels.length,
    readyForDraftWrite,
    needsManualReview,
    wouldCreate,
    wouldUpdate,
    wouldSkip,
    dryRunHoldbackCount,
    duplicateConflicts: duplicateConflicts.length,
    created,
    updated,
    skipped,
    conflicts,
    errors,
    protectedFields: PROTECTED_FIELDS,
    docIds: plannedWrites.map((entry) => entry.docId),
    createDocIds,
    updateDocIds,
    skipDocIds: skipItems.map((item) => item.docId),
    plannedWrites,
    duplicateConflictItems: duplicateConflicts,
    manualReviewItems: hotels
      .filter((hotel) => String(hotel.quality?.qualityStatus || hotel.qualityStatus || '') === 'needs_manual_review')
      .map((hotel) => ({
        title: normalizeText(hotel.title || ''),
        region: normalizeText(hotel.sourceRegion || hotel.region || ''),
        reviewSummaryForAdmin: buildReviewSummaryForAdmin(hotel),
        missingFields: buildMissingFields(hotel),
        warnings: uniqueStrings(hotel.qualityWarnings || hotel.quality?.warnings),
      })),
    writeMode: dryRun ? 'dry_run' : 'write',
    createPlans,
    updatePlans,
    skipItems,
  };

  fs.mkdirSync(path.dirname(REPORT_JSON_PATH), { recursive: true });
  fs.writeFileSync(REPORT_JSON_PATH, JSON.stringify(summary, null, 2));
  fs.writeFileSync(REPORT_MD_PATH, buildMarkdownReport(summary));

  console.log(
    JSON.stringify(
      {
        dryRun,
        firestoreWriteAttempted: summary.firestoreWriteAttempted,
        totalInput: summary.totalInput,
        readyForDraftWrite: summary.readyForDraftWrite,
        needsManualReview: summary.needsManualReview,
        wouldCreate: summary.wouldCreate,
        wouldUpdate: summary.wouldUpdate,
        wouldSkip: summary.wouldSkip,
        dryRunHoldbackCount: summary.dryRunHoldbackCount,
        duplicateConflicts: summary.duplicateConflicts,
        created: summary.created,
        updated: summary.updated,
        skipped: summary.skipped,
        conflicts: summary.conflicts,
        errors: summary.errors,
        docIds: summary.docIds,
        protectedFields: summary.protectedFields,
        reportJsonPath: REPORT_JSON_PATH,
        reportMdPath: REPORT_MD_PATH,
      },
      null,
      2,
    ),
  );
};

main().catch((error) => {
  console.error(error?.stack || error?.message || error);
  process.exit(1);
});
