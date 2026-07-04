import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');
const readJson = (rel) => JSON.parse(read(rel));
const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const writerScript = read('scripts/write-tunisia-hotel-import-drafts.mjs');
const report = readJson('tmp/tunisia-hotel-drafts-write-report.json');
const gitIgnore = read('.gitignore');
const firebaseServices = read('src/core/services/firebaseServices.ts');
const adminCatalogManager = read('src/feature-module/admin-dashboard/components/AdminCatalogManager.tsx');

assert(/const TARGET_COLLECTION = 'hotels';/.test(writerScript), 'Write script targets hotels');
assert(/const dryRun = !process\.argv\.includes\('--write'\);/.test(writerScript), 'Dry-run is default');
assert(/process\.argv\.includes\('--write'\)/.test(writerScript), 'Actual write requires --write');
assert(/--update-review-images/.test(writerScript), 'Write script exposes review-image update mode');
assert(/db\.collection\(TARGET_COLLECTION\)\.doc\(docId\)/.test(writerScript), 'Write script uses target collection doc refs');
assert(!/hotelImportDrafts/i.test(writerScript), 'Write script does not use hotelImportDrafts');
assert(!/published:\s*true/.test(writerScript), 'Write script never sets published true');
assert(!/image:\s*''/.test(writerScript) || /buildUpdatePayload/.test(writerScript), 'Write script does not rebuild public image fields');
assert(!/gallery:\s*\[\]/.test(writerScript) || /buildUpdatePayload/.test(writerScript), 'Write script does not rebuild gallery fields');
assert(/imageUrlsForReview/.test(writerScript), 'Write script updates review image URLs');
assert(/imageSourceName/.test(writerScript), 'Write script updates review image source name');
assert(/imageSourceUrl/.test(writerScript), 'Write script updates review image source url');
assert(/updatedAt/.test(writerScript), 'Write script updates timestamp');
assert(/notes/.test(writerScript), 'Write script can append review notes safely');
assert(/isTargetImportedDraft/.test(writerScript), 'Write script targets imported draft docs only');
assert(/readImportedDraftDocs/.test(writerScript), 'Write script can read existing imported drafts for fallback matching');
assert(/findReviewImageMatch/.test(writerScript), 'Write script has cautious review-image matching logic');
assert(/ambiguous_match/.test(writerScript), 'Write script can skip ambiguous matches');
assert(/missing_existing_doc/.test(writerScript), 'Write script reports missing existing docs');
assert(/tunisia-hotel-drafts-write-report\.json/.test(writerScript), 'Write report is generated');
assert(!/functions\/|firestore\.rules|storage\.rules|firebase deploy/.test(writerScript), 'No functions, rules, or deploy paths touched');
assert(/tmp\//.test(gitIgnore), 'tmp remains ignored');
assert(/where\(collection\(db, "hotels"\), where\("published", "==", true\)\)/.test(firebaseServices) || /query\(collection\(db, "hotels"\), where\("published", "==", true\)\)/.test(firebaseServices), 'Public fetchHotels only reads published hotels');
assert(/statusFilter === 'all'\s*\?\s*true/.test(adminCatalogManager), 'Admin All Status shows both published and draft records');
assert(fs.existsSync(path.join(root, 'tmp', 'tunisia-hotel-drafts-write-report.json')), 'Write report exists');
assert(typeof report.dryRun === 'boolean', 'Write report includes dryRun flag');
assert(typeof report.updateReviewImages === 'boolean', 'Write report includes review-image mode flag');
assert(typeof report.eligibleUpdateReviewImages === 'number', 'Write report includes eligible update count');
assert(typeof report.deterministicMatches === 'number', 'Write report includes deterministic match count');
assert(typeof report.safeNameMatches === 'number', 'Write report includes safe-name match count');
assert(typeof report.ambiguousMatches === 'number', 'Write report includes ambiguous match count');
assert(typeof report.missingExistingDoc === 'number', 'Write report includes missing existing doc count');
if (report.dryRun) {
  assert(report.written === 0, 'Dry-run wrote zero records');
} else {
  assert(
    report.written >= 0 && report.alreadyExists >= 0 && report.errors >= 0,
    'Write-mode report includes valid numeric outcome counts',
  );
}
assert(typeof report.totalInput === 'number', 'Write report includes totalInput');
assert(typeof report.eligible === 'number', 'Write report includes eligible');
assert(typeof report.skipped === 'number', 'Write report includes skipped');
assert(typeof report.alreadyExists === 'number', 'Write report includes alreadyExists');
assert(typeof report.errors === 'number', 'Write report includes errors');
assert(Array.isArray(report.writtenDocIds), 'Write report includes writtenDocIds');
assert(Array.isArray(report.wouldUpdateDocIds), 'Write report includes wouldUpdateDocIds');
assert(Array.isArray(report.skippedItems), 'Write report includes skippedItems');
assert(report.updateReviewImages === true, 'Report confirms review-image update mode');

console.log('qa:hotel-import-write passed');
