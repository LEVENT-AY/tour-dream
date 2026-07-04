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
assert(
  script.includes("const dryRun = !process.argv.includes('--write')") ||
    script.includes('const dryRun = !process.argv.includes("--write")'),
  'Dry-run is default in the script',
);
assert(/process\.argv\.includes\('--write'\)/.test(script), 'Write only occurs with --write');
assert(/if \(dryRun\)/.test(script), 'Dry-run logic exists');
assert(/docRef\.set\(doc, \{ merge: false \}\)/.test(script), 'Script writes a single hotel doc when approved');
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
assert(draft.pricingDiscovery && typeof draft.pricingDiscovery === 'object', 'pricingDiscovery exists');
assert(Array.isArray(draft.gallery), 'gallery exists');
assert(draft.gallery.length > 0, 'gallery has images');
assert(typeof draft.image === 'string' && draft.image.length > 0, 'image exists');
assert(Array.isArray(draft.amenities), 'amenities exists');
assert(Array.isArray(draft.boardOptions), 'boardOptions exists');
assert(Array.isArray(draft.roomTypes), 'roomTypes exists');

assert(report.targetCollection === 'hotels', 'Report targetCollection is hotels');
assert(report.targetDocId === 'imported-tunisiebooking-vincci-helios-beach-djerba', 'Report doc ID matches expected');
assert(report.written === 0, 'Dry-run wrote zero records');
assert(report.errors === 0, 'Dry-run had no errors');
assert(report.alreadyExists === 0 || report.alreadyExists === 1, 'Report alreadyExists is present');
assert(report.priceFrom === draft.priceFrom, 'Report priceFrom matches draft');
assert(report.priceCurrency === draft.priceCurrency, 'Report currency matches draft');
assert(report.priceUnit === draft.priceUnit, 'Report unit matches draft');
assert(report.priceDate === draft.priceDate, 'Report priceDate matches draft');
assert(report.imageCount >= 1, 'Report records images');
assert(report.amenitiesCount === draft.amenities.length, 'Report records amenities count');
assert(report.boardOptionsCount === draft.boardOptions.length, 'Report records board options count');
assert(report.roomTypesCount === draft.roomTypes.length, 'Report records room types count');

console.log(
  JSON.stringify(
    {
      targetDocId: report.targetDocId,
      dryRun: report.dryRun,
      written: report.written,
      alreadyExists: report.alreadyExists,
      imageCount: report.imageCount,
      amenitiesCount: report.amenitiesCount,
      boardOptionsCount: report.boardOptionsCount,
      roomTypesCount: report.roomTypesCount,
      priceFrom: report.priceFrom,
      priceCurrency: report.priceCurrency,
      priceUnit: report.priceUnit,
      priceDate: report.priceDate,
    },
    null,
    2,
  ),
);
