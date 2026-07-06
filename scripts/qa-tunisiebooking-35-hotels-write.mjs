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
assert(report.wouldCreate === 35, 'All 35 are planned as creates in dry-run when collection is empty');
assert(report.wouldUpdate === 0, 'No updates are planned in dry-run');
assert(report.wouldSkip === 0, 'No duplicate conflicts are planned in dry-run');
assert(typeof report.duplicateConflicts === 'number', 'Duplicate conflict count is reported');

assert(report.plannedWrites.every((entry) => typeof entry.docId === 'string' && entry.docId.startsWith('imported-tunisiebooking-')), 'Planned doc IDs are deterministic');
assert(report.plannedWrites.every((entry) => entry.action === 'create' || entry.action === 'update'), 'Planned actions are create/update');
assert(report.manualReviewItems.every((item) => Array.isArray(item.missingFields)), 'Manual review items include missingFields');

const plannedDocs = [
  ...report.createPlans.map((plan) => plan.doc),
  ...report.updatePlans.map((plan) => plan.mergePayload),
];

for (const doc of plannedDocs) {
  const titleText = String(doc.title || doc.hotelName || '');
  const textToCheck = [
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
  ].join(' ');

  assert(doc.sourceName === 'TunisieBooking', `${titleText} sourceName is TunisieBooking`);
  assert(doc.importSource === 'tunisiebooking', `${titleText} importSource is tunisiebooking`);
  assert(/tunisiebooking/i.test(String(doc.sourceUrl || '')), `${titleText} has a TunisieBooking sourceUrl`);
  assert(doc.bookingMode === 'request_only', `${titleText} stays request_only`);
  assert(doc.bookingEnabled === false, `${titleText} bookingEnabled stays false`);
  assert(doc.published === false, `${titleText} published stays false`);
  assert(doc.status === 'draft', `${titleText} status stays draft`);
  assert(doc.reviewStatus === 'needs_admin_review', `${titleText} reviewStatus stays needs_admin_review`);
  assert(doc.adminReview && doc.adminReview.status === 'pending', `${titleText} adminReview stays pending`);
  assert(doc.qualityStatus === 'ready_for_draft' || doc.qualityStatus === 'needs_manual_review', `${titleText} qualityStatus is preserved`);
  assert(doc.completeness && typeof doc.completeness === 'object', `${titleText} completeness is present`);
  assert(Array.isArray(doc.missingFields), `${titleText} missingFields is present`);
  assert(!/Book Now|Réservez dès maintenant|Instant booking|Confirmed booking|Pay now|Guaranteed booking/i.test(textToCheck), `${titleText} has no request-unsafe booking copy`);
  assert(!/support@example\.com/i.test(textToCheck), `${titleText} has no support@example.com`);
  assert(!/Hotel Plaza Athenee|Barcelona|\$500/i.test(textToCheck), `${titleText} has no fake template data`);
  assert(!/ÃƒÂ¯Ã‚Â¿Ã‚Â½|\uFFFD/.test(JSON.stringify(doc)), `${titleText} has no replacement character`);
  assert(!/Restaurants\s+à\s+proximité|Cafés\s+aux\s+alentours|Hôtels\s+à\s+proximité/i.test(doc.description || ''), `${titleText} description has no nearby leakage`);
}

const shouldVerifyFirestore = verifyFirestore;
if (shouldVerifyFirestore) {
  if (admin.getApps().length === 0) {
    admin.initializeApp({ projectId: 'tour-tunisi' });
  }
  const db = getFirestore();
  const snapshots = await Promise.all(report.docIds.map((docId) => db.collection('hotels').doc(docId).get()));

  assert(snapshots.length === 35, 'Verified 35 Firestore docs');
  assert(snapshots.every((snap) => snap.exists), 'All Firestore docs exist');

  const docs = snapshots.map((snap) => ({ id: snap.id, ...snap.data() }));
  assert(new Set(docs.map((doc) => doc.id)).size === 35, 'Firestore doc IDs are unique');
  assert(docs.every((doc) => doc.published === false), 'All docs are unpublished');
  assert(docs.every((doc) => doc.status === 'draft'), 'All docs are draft');
  assert(docs.every((doc) => doc.bookingEnabled === false), 'All docs are booking disabled');
  assert(docs.every((doc) => doc.bookingMode === 'request_only'), 'All docs are request-only');
  assert(docs.every((doc) => doc.reviewStatus === 'needs_admin_review'), 'All docs have reviewStatus needs_admin_review');
  assert(docs.every((doc) => doc.adminReview && doc.adminReview.status === 'pending'), 'All docs have pending adminReview');
  assert(docs.every((doc) => doc.sourceName === 'TunisieBooking' && doc.importSource === 'tunisiebooking'), 'All docs keep source provenance');
  assert(docs.every((doc) => typeof doc.sourceUrl === 'string' && doc.sourceUrl.includes('tunisiebooking.com')), 'All docs keep sourceUrl');
  assert(docs.every((doc) => doc.qualityStatus === 'ready_for_draft' || doc.qualityStatus === 'needs_manual_review'), 'All docs keep qualityStatus');
  assert(docs.every((doc) => Array.isArray(doc.missingFields)), 'All docs keep missingFields');
  assert(docs.every((doc) => doc.completeness && typeof doc.completeness === 'object'), 'All docs keep completeness');
  assert(docs.every((doc) => !/Book Now|Réservez dès maintenant|support@example\.com|Hotel Plaza Athenee|Barcelona|\$500/i.test(JSON.stringify(doc))), 'Firestore docs are free of forbidden template content');
}

console.log(
  JSON.stringify(
    {
      verifyFirestore,
      totalInput: report.totalInput,
      readyForDraftWrite: report.readyForDraftWrite,
      needsManualReview: report.needsManualReview,
      wouldCreate: report.wouldCreate,
      wouldUpdate: report.wouldUpdate,
      wouldSkip: report.wouldSkip,
      duplicateConflicts: report.duplicateConflicts,
      created: report.created,
      updated: report.updated,
      skipped: report.skipped,
      conflicts: report.conflicts,
      errors: report.errors,
    },
    null,
    2,
  ),
);
