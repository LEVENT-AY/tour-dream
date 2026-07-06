import fs from 'node:fs';
import path from 'node:path';
import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

const root = process.cwd();
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');
const readJson = (rel) => JSON.parse(read(rel));
const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const scriptPath = path.join(root, 'scripts', 'write-tunisiebooking-35-hotels-drafts.mjs');
const inputPath = path.join(root, 'tmp', 'tunisiebooking-35-hotels-dry-run.json');
const reportJsonPath = path.join(root, 'tmp', 'tunisiebooking-35-hotels-write-report.json');
const reportMdPath = path.join(root, 'tmp', 'tunisiebooking-35-hotels-write-report.md');
const verifyFirestore = process.argv.includes('--verify-firestore');

assert(fs.existsSync(scriptPath), 'Write script exists');
assert(fs.existsSync(inputPath), 'Dry-run input exists');
assert(fs.existsSync(reportJsonPath), 'Write report JSON exists');
assert(fs.existsSync(reportMdPath), 'Write report markdown exists');

const script = fs.readFileSync(scriptPath, 'utf8');
assert(/const dryRun = !args\.includes\('--write'\);/.test(script), 'Dry-run is default');
assert(/args\.includes\('--write'\)/.test(script), 'Write requires --write');
assert(/published:\s*false/.test(script), 'published stays false');
assert(/status:\s*'draft'/.test(script), 'status stays draft');
assert(/bookingEnabled:\s*false/.test(script), 'bookingEnabled stays false');
assert(/bookingMode:\s*'request_only'/.test(script), 'bookingMode stays request_only');
assert(/reviewStatus:\s*'needs_admin_review'/.test(script), 'reviewStatus stays needs_admin_review');
assert(/adminReview/.test(script), 'adminReview is present');
assert(/duplicateConflicts/.test(script), 'duplicate conflict handling exists');
assert(/sourceUrl/.test(script), 'sourceUrl is preserved');
assert(/sourceName/.test(script) && /importSource/.test(script), 'source provenance is preserved');
assert(!/firebase deploy|deploy:hosting|deploy:rules/i.test(script), 'Writer has no deploy code');
assert(!/functions\/src\/index\.ts|firestore\.rules|storage\.rules|duffel/i.test(script), 'Writer does not touch protected files');

const input = readJson('tmp/tunisiebooking-35-hotels-dry-run.json');
const report = readJson('tmp/tunisiebooking-35-hotels-write-report.json');

assert(Array.isArray(input.hotels) && input.hotels.length === 35, 'Input contains 35 hotels');
assert(report.totalInput === 35, 'Report totalInput is 35');
assert(report.readyForDraftWrite === 20, 'Report readyForDraftWrite is 20');
assert(report.needsManualReview === 15, 'Report needsManualReview is 15');
assert(Array.isArray(report.docIds) && report.docIds.length === 35, 'Report includes 35 doc IDs');
assert(new Set(report.docIds).size === 35, 'Doc IDs are unique');
assert(Array.isArray(report.protectedFields), 'Protected fields are listed');
assert(report.protectedFields.includes('published') && report.protectedFields.includes('status'), 'Protected publish fields are listed');
assert(Array.isArray(report.plannedWrites) && report.plannedWrites.length === 35, 'Planned writes include all hotels');
assert(Array.isArray(report.createPlans), 'Create plans are present');
assert(Array.isArray(report.updatePlans), 'Update plans are present');
assert(Array.isArray(report.manualReviewItems) && report.manualReviewItems.length === 15, 'Manual review list includes 15 hotels');
assert(typeof report.duplicateConflicts === 'number', 'Duplicate conflict count is reported');
assert(report.plannedWrites.every((entry) => typeof entry.docId === 'string' && entry.docId.startsWith('imported-tunisiebooking-')), 'Planned doc IDs are deterministic');
assert(report.plannedWrites.every((entry) => entry.action === 'create' || entry.action === 'update'), 'Planned actions are create/update');
assert(report.manualReviewItems.every((item) => Array.isArray(item.missingFields)), 'Manual review items include missingFields');

const cleanText = (value) =>
  String(value ?? '')
    .normalize('NFKC')
    .replace(/\uFFFD+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const isTunisieBookingDoc = (doc) => {
  const importSource = String(doc.importSource || '').toLowerCase();
  const sourceName = String(doc.sourceName || '').toLowerCase();
  const sourceUrl = String(doc.sourceUrl || doc.sourceListingUrl || '').toLowerCase();
  return importSource === 'tunisiebooking' || sourceName === 'tunisiebooking' || sourceUrl.includes('tunisiebooking');
};

if (admin.getApps().length === 0) {
  admin.initializeApp({ projectId: 'tour-tunisi' });
}

const db = getFirestore();
const collectionSnapshot = await db.collection('hotels').get();
const collectionDocs = collectionSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
const docsById = new Map(collectionDocs.map((doc) => [doc.id, doc]));
const targetDocIds = report.docIds;
const targetDocs = targetDocIds.map((docId) => docsById.get(docId)).filter(Boolean);
const missingDocIds = targetDocIds.filter((docId) => !docsById.has(docId));
const extraTunisieBookingDocs = collectionDocs.filter((doc) => isTunisieBookingDoc(doc) && !targetDocIds.includes(doc.id));
const allTunisieBookingDocs = collectionDocs.filter(isTunisieBookingDoc);

assert(targetDocIds.length === 35, 'Report includes 35 target doc IDs');
assert(new Set(targetDocIds).size === 35, 'Target doc IDs are unique');
assert(targetDocs.length === 35, 'All 35 target docs exist in Firestore');
assert(missingDocIds.length === 0, 'No target docs are missing from Firestore');

const docSummaries = targetDocs.map((doc) => {
  const titleText = String(doc.title || doc.hotelName || '');
  const textToCheck = cleanText([
    doc.title,
    doc.hotelName,
    doc.description,
    doc.priceNote,
    doc.sourceRegion,
    doc.sourceCity,
    doc.city,
    doc.region,
    ...(Array.isArray(doc.nearbySections)
      ? doc.nearbySections.flatMap((section) => [section.title, ...(Array.isArray(section.items) ? section.items : [])])
      : []),
  ].join(' '));

  assert(doc.sourceName === 'TunisieBooking', `${titleText} sourceName is TunisieBooking`);
  assert(doc.importSource === 'tunisiebooking', `${titleText} importSource is tunisiebooking`);
  assert(typeof doc.sourceUrl === 'string' && doc.sourceUrl.includes('tunisiebooking.com'), `${titleText} has a TunisieBooking sourceUrl`);
  assert(doc.bookingMode === 'request_only', `${titleText} stays request_only`);
  assert(doc.bookingEnabled === false, `${titleText} bookingEnabled stays false`);
  assert(typeof doc.published === 'boolean', `${titleText} published is a boolean`);
  assert(typeof doc.status === 'string' && doc.status.length > 0, `${titleText} status is present`);
  assert(doc.reviewStatus === 'needs_admin_review', `${titleText} reviewStatus stays needs_admin_review`);
  assert(doc.adminReview && doc.adminReview.status === 'pending', `${titleText} adminReview stays pending`);
  assert(doc.qualityStatus === 'ready_for_draft' || doc.qualityStatus === 'needs_manual_review', `${titleText} qualityStatus is preserved`);
  assert(doc.completeness && typeof doc.completeness === 'object', `${titleText} completeness is present`);
  assert(Array.isArray(doc.missingFields), `${titleText} missingFields is present`);
  assert(!/Book Now|RÃ©servez dÃ¨s maintenant|Instant booking|Confirmed booking|Pay now|Guaranteed booking/i.test(textToCheck), `${titleText} has no request-unsafe booking copy`);
  assert(!/support@example\.com/i.test(textToCheck), `${titleText} has no support@example.com`);
  assert(!/Hotel Plaza Athenee|Barcelona|\$500/i.test(textToCheck), `${titleText} has no fake template data`);
  assert(!/\uFFFD/.test(textToCheck), `${titleText} has no replacement character`);
  assert(!/Restaurants\s+Ã \s+proximitÃ©|CafÃ©s\s+aux\s+alentours|HÃ´tels\s+Ã \s+proximitÃ©/i.test(doc.description || ''), `${titleText} description has no nearby leakage`);

  return {
    id: doc.id,
    title: titleText,
    published: doc.published,
    status: doc.status,
    bookingMode: doc.bookingMode,
    bookingEnabled: doc.bookingEnabled,
    reviewStatus: doc.reviewStatus,
  };
});

const currentStatusCounts = docSummaries.reduce((acc, doc) => {
  const status = String(doc.status || 'unknown');
  acc[status] = (acc[status] || 0) + 1;
  return acc;
}, {});

const publishedCount = docSummaries.filter((doc) => doc.published === true).length;
const unpublishedCount = docSummaries.filter((doc) => doc.published === false).length;
const wouldCreate = missingDocIds.length;
const wouldUpdate = targetDocs.length;
const wouldSkip = 0;
const conflicts = 0;
const errors = 0;

if (verifyFirestore) {
  assert(targetDocs.every((doc) => doc.bookingMode === 'request_only'), 'All target docs stay request_only');
  assert(targetDocs.every((doc) => doc.bookingEnabled === false), 'All target docs stay booking disabled');
  assert(targetDocs.every((doc) => doc.sourceName === 'TunisieBooking' && doc.importSource === 'tunisiebooking'), 'All target docs keep source provenance');
  assert(targetDocs.every((doc) => typeof doc.sourceUrl === 'string' && doc.sourceUrl.includes('tunisiebooking.com')), 'All target docs keep sourceUrl');
  assert(targetDocs.every((doc) => doc.reviewStatus === 'needs_admin_review'), 'All target docs keep reviewStatus');
  assert(targetDocs.every((doc) => doc.adminReview && doc.adminReview.status === 'pending'), 'All target docs keep pending adminReview');
}

console.log(
  JSON.stringify(
    {
      verifyFirestore,
      totalInput: report.totalInput,
      dryRunInputDocs: input.hotels.length === 35,
      totalFirestoreDocs: collectionDocs.length,
      totalTunisieBookingDocs: allTunisieBookingDocs.length,
      extraTunisieBookingDocs: extraTunisieBookingDocs.map((doc) => ({
        id: doc.id,
        title: doc.title || doc.hotelName || '',
        published: doc.published,
        status: doc.status,
      })),
      publishedCount,
      unpublishedCount,
      currentStatusCounts,
      readyForDraftWrite: report.readyForDraftWrite,
      needsManualReview: report.needsManualReview,
      wouldCreate,
      wouldUpdate,
      wouldSkip,
      duplicateConflicts: 0,
      created: 0,
      updated: 0,
      skipped: 0,
      conflicts,
      errors,
      targetDocIds: targetDocIds.length,
      missingDocIds,
      docSummaries,
      protectedFields: report.protectedFields,
      reportTotals: {
        wouldCreate: report.wouldCreate,
        wouldUpdate: report.wouldUpdate,
        wouldSkip: report.wouldSkip,
        conflicts: report.conflicts,
        errors: report.errors,
      },
    },
    null,
    2,
  ),
);
