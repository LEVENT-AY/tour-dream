import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');
const readJson = (rel) => JSON.parse(read(rel));
const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const compareScript = read('scripts/compare-tunisia-hotel-import-drafts.mjs');
const qaHotelImporter = read('scripts/qa-hotel-importer.mjs');
const duplicateReport = readJson('tmp/tunisia-hotel-duplicate-report.json');
const gitIgnore = read('.gitignore');

assert(/tunisia-hotel-import-preview\.json/.test(compareScript), 'Compare script reads preview JSON');
assert(/tunisia-hotel-duplicate-report\.json/.test(compareScript), 'Compare script writes duplicate report JSON');
assert(/db\.collection\('hotels'\)\.get\(\)/.test(compareScript), 'Compare script reads Firestore hotels collection');
assert(
  !/db\.collection\(.+?\)\.doc\(.+?\)\.set\(|db\.collection\(.+?\)\.add\(|db\.collection\(.+?\)\.doc\(.+?\)\.update\(|db\.collection\(.+?\)\.doc\(.+?\)\.delete\(|batch\.set\(|hotelImportDrafts/i.test(compareScript),
  'Compare script has no Firestore writes',
);
assert(!/functions\/|firestore\.rules|storage\.rules/.test(compareScript), 'Compare script does not touch functions or rules');
assert(/matchStatus/.test(compareScript), 'Compare script includes matchStatus');
assert(/recommendedAction/.test(compareScript), 'Compare script includes recommendedAction');
assert(/matchedReasons/.test(compareScript), 'Compare script includes matchedReasons');
assert(/score/.test(compareScript), 'Compare script includes score');
assert(/tmp\//.test(gitIgnore), 'tmp output is ignored');
assert(/qa:hotel-importer/.test(read('package.json')), 'Existing importer QA script remains present');
assert(fs.existsSync(path.join(root, 'tmp', 'tunisia-hotel-duplicate-report.json')), 'Duplicate report exists after compare script run');

assert(typeof duplicateReport.generatedAt === 'string', 'Duplicate report includes generatedAt');
assert(typeof duplicateReport.totalImported === 'number', 'Duplicate report includes totalImported');
assert(typeof duplicateReport.totalExistingHotelsRead === 'number', 'Duplicate report includes totalExistingHotelsRead');
assert(typeof duplicateReport.newCandidates === 'number', 'Duplicate report includes newCandidates');
assert(typeof duplicateReport.possibleDuplicates === 'number', 'Duplicate report includes possibleDuplicates');
assert(typeof duplicateReport.strongDuplicates === 'number', 'Duplicate report includes strongDuplicates');
assert(duplicateReport.byZone && typeof duplicateReport.byZone === 'object', 'Duplicate report includes byZone summary');
assert(Array.isArray(duplicateReport.items), 'Duplicate report includes items array');
assert(
  duplicateReport.items.every((item) => ['new_candidate', 'possible_duplicate', 'strong_duplicate'].includes(item.matchStatus)),
  'Report matchStatus values are allowed',
);
assert(
  duplicateReport.items.every((item) => ['create_draft', 'review_duplicate', 'skip_existing'].includes(item.recommendedAction)),
  'Report recommendedAction values are allowed',
);
assert(
  duplicateReport.items.every((item) => Array.isArray(item.matchedReasons)),
  'Report items include matchedReasons arrays',
);
assert(
  duplicateReport.items.every((item) => typeof item.score === 'number'),
  'Report items include numeric scores',
);
assert(
  !/serviceAccount.*json|GOOGLE_APPLICATION_CREDENTIALS=.*\.json/i.test(compareScript),
  'Compare script does not commit secrets or hardcode service account paths',
);
assert(/hotel-import-preview/.test(qaHotelImporter) || /tunisia-hotel-import-preview/.test(compareScript), 'Importer/compare flow stays aligned on local preview files');

console.log('qa:hotel-import-dedupe passed');
