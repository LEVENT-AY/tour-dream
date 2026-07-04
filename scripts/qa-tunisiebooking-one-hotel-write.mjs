import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const scriptPath = path.join(root, 'scripts', 'write-tunisiebooking-one-hotel-draft.mjs');
const draftPath = path.join(root, 'tmp', 'tunisiebooking-one-hotel-draft.json');
const reportPath = path.join(root, 'tmp', 'tunisiebooking-one-hotel-write-report.json');

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

assert(fs.existsSync(scriptPath), 'Write script exists');
assert(fs.existsSync(draftPath), 'Draft JSON exists');
assert(fs.existsSync(reportPath), 'Write report exists after dry-run');

const script = fs.readFileSync(scriptPath, 'utf8');
assert(/TARGET_COLLECTION\s*=\s*'hotels'/.test(script), 'Target collection is hotels');
assert(/TARGET_DOC_ID\s*=\s*'imported-tunisiebooking-vincci-helios-beach-djerba'/.test(script), 'Deterministic doc ID exists');
assert(script.includes("const dryRun = !args.includes('--write');"), 'Dry-run is default in the script');
assert(/args\.includes\('--write'\)/.test(script), 'Write only occurs with --write');
assert(/const updateExisting = args\.includes\('--update-existing'\);/.test(script), 'Update-existing mode exists');
assert(/if \(updateExisting\)/.test(script), 'Update-existing branch exists');
assert(/bookingMode: 'request_only'/.test(script), 'bookingMode stays request_only');
assert(/bookingEnabled: false/.test(script), 'bookingEnabled stays false');
assert(/published: false/.test(script), 'published stays false');
assert(/status: 'draft'/.test(script), 'status stays draft');
assert(!/hotelImportDrafts/.test(script), 'No hotelImportDrafts writes');
assert(!/firebase deploy|deploy:hosting|deploy:rules/.test(script), 'Write script has no deploy code');
assert(!/functions\/src\/index\.ts|firestore\.rules|storage\.rules|duffel/i.test(script), 'Write script does not touch protected files');

const draft = JSON.parse(fs.readFileSync(draftPath, 'utf8'));
const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));

assert(draft.sourceName === 'TunisieBooking', 'sourceName is TunisieBooking');
assert(draft.published === false, 'published is false');
assert(draft.status === 'draft', 'status is draft');
assert(draft.bookingEnabled === false, 'bookingEnabled is false');
assert(draft.bookingMode === 'request_only', 'bookingMode is request_only');
assert(draft.priceStatus === 'source_reference', 'priceStatus is source_reference');
assert(Array.isArray(draft.gallery) && draft.gallery.length > 3, 'gallery has source-backed images');
assert(Array.isArray(draft.faq) && draft.faq.length > 0, 'faq exists');
assert(Array.isArray(draft.reviews) && draft.reviews.length > 0, 'reviews exist');

assert(report.targetCollection === 'hotels', 'Report targetCollection is hotels');
assert(report.targetDocId === 'imported-tunisiebooking-vincci-helios-beach-djerba', 'Report doc ID matches expected');
assert(typeof report.dryRun === 'boolean', 'Report records dryRun state');
assert(report.updateExisting === true, 'Current report is update-existing mode');
if (report.dryRun) {
  assert(report.written === 0, 'Dry-run wrote zero records');
  assert(Array.isArray(report.skippedItems), 'Dry-run report has skippedItems');
  assert(report.skippedItems.some((item) => item.reason === 'dry_run_update_existing'), 'Dry-run update-existing summary is present');
} else {
  assert(report.written === 1 || report.alreadyExists === 1, 'Real write report reflects one-doc update or idempotent skip');
}
assert(report.errors === 0, 'Dry-run had no errors');
assert(Array.isArray(report.fieldsToUpdate), 'Report lists fieldsToUpdate');
assert(report.priceFrom === draft.priceFrom, 'Report priceFrom matches draft');
assert(report.priceCurrency === draft.priceCurrency, 'Report currency matches draft');
assert(report.priceUnit === draft.priceUnit, 'Report unit matches draft');
assert(report.priceDate === draft.priceDate, 'Report priceDate matches draft');
assert(report.imageCount >= 4, 'Report records expanded image count');
assert(report.amenitiesCount === draft.amenities.length, 'Report records amenities count');
assert(report.boardOptionsCount === draft.boardOptions.length, 'Report records board options count');
assert(report.roomTypesCount === draft.roomTypes.length, 'Report records room types count');
assert(report.faqCount === draft.faq.length, 'Report records faq count');
assert(report.reviewsCount === draft.reviews.length, 'Report records reviews count');
assert(Array.isArray(report.skippedItems), 'Report has skippedItems');

console.log(
  JSON.stringify(
    {
      targetDocId: report.targetDocId,
      dryRun: report.dryRun,
      updateExisting: report.updateExisting,
      written: report.written,
      alreadyExists: report.alreadyExists,
      imageCount: report.imageCount,
      amenitiesCount: report.amenitiesCount,
      boardOptionsCount: report.boardOptionsCount,
      roomTypesCount: report.roomTypesCount,
      faqCount: report.faqCount,
      reviewsCount: report.reviewsCount,
      fieldsToUpdate: report.fieldsToUpdate,
    },
    null,
    2,
  ),
);
