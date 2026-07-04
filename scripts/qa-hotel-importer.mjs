import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');
const readJson = (rel) => JSON.parse(read(rel));
const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const importer = read('scripts/import-tunisia-hotels-drafts.mjs');
const hotelGrid = read('src/feature-module/hotel/hotel-grid/hotelGrid.tsx');
const hotelDirectoryQa = read('scripts/qa-hotel-directory.mjs');
const preview = readJson('tmp/tunisia-hotel-import-preview.json');
const qualityReport = readJson('tmp/tunisia-hotel-import-quality-report.json');

const hasMojibake = (value) => /Ã|Â|â€|ï¿½|�/.test(String(value || ''));
const normalizeDigits = (value) => String(value || '').replace(/[^\d+]/g, '');
const hasSuspiciousPhone = (value) => {
  const digits = normalizeDigits(value);
  return Boolean(digits) && (digits.length > 12 || digits.length < 8);
};
const isValidNormalizedWebsite = (value) => /^https:\/\/[a-z0-9.-]+\.[a-z]{2,}$/i.test(String(value || ''));

assert(/const MAX_TOTAL_HOTELS = 35;/.test(importer), 'Importer max total is 35');
assert(/const MAX_PER_ZONE = 5;/.test(importer), 'Importer max per zone is 5');
assert(/const TARGET_ZONES = \[/.test(importer), 'Importer defines target zones');
assert((importer.match(/tourismZoneLabel:/g) || []).length === 7, 'Importer defines exactly 7 target zones');
assert(/REQUEST_DELAY_MS = 10_000/.test(importer), 'Importer has rate limit matching robots crawl delay');
assert(/discovertunisia\.com/.test(importer), 'Importer uses Discover Tunisia source');
assert(!/https?:\/\/(?:www\.)?(booking|tripadvisor|agoda|expedia)\./i.test(importer), 'Importer does not fetch OTA domains');
assert(/booking|tripadvisor|agoda|expedia/i.test(importer), 'Importer keeps an OTA denylist for review images');
assert(!/put\(|uploadBytes|getStorage|storageBucket|firebase deploy|hotelImportDrafts/i.test(importer), 'Importer does not upload images, deploy Firebase, or write Firestore drafts in preview mode');
assert(/published: false/.test(importer), 'Drafts default to published false');
assert(/status: 'draft'/.test(importer), 'Drafts default to draft status');
assert(/duplicate_review/.test(importer), 'Duplicate review status exists');
assert(/sourceUrl/.test(importer), 'Drafts require sourceUrl');
assert(/findExistingHotelMatch/.test(importer), 'Existing hotel dedupe logic exists');
assert(/dedupeDrafts/.test(importer), 'Preview dedupe logic exists');
assert(/repairMojibake/.test(importer), 'Importer defines repairMojibake helper');
assert(/cleanText/.test(importer), 'Importer defines cleanText helper');
assert(/normalizePhone/.test(importer), 'Importer defines normalizePhone helper');
assert(/normalizeEmail/.test(importer), 'Importer defines normalizeEmail helper');
assert(/normalizeWebsite/.test(importer), 'Importer defines normalizeWebsite helper');
assert(/hasMojibake/.test(importer), 'Importer defines hasMojibake helper');
assert(/hasSuspiciousPhone/.test(importer), 'Importer defines hasSuspiciousPhone helper');
assert(/QUALITY_REPORT_PATH/.test(importer), 'Importer writes a quality report');
assert(/compareExistingHotels \? \[\] : \[\]/.test(importer), 'No Firestore write/read code runs by default');
assert(/matchesTunisiaHotelDestination/.test(hotelGrid), 'Manual hotel directory destination matcher remains in place');
assert(/Tunis does not match Sousse/.test(hotelDirectoryQa), 'Hotel directory QA still protects Tunis vs Sousse regression');

assert(preview.summary.totalDrafts <= 35, 'Preview total drafts stay within 35');
assert(Object.keys(preview.summary.countsByZone).length === 7, 'Preview output has exactly 7 target zones');
assert(Object.values(preview.summary.countsByZone).every((count) => count <= 5), 'Preview output respects max 5 per zone');
assert(Array.isArray(preview.metadata.testedUrls) && preview.metadata.testedUrls.length > 0, 'Preview output includes tested URLs');
assert(preview.metadata.testedUrls.every((url) => url.includes('discovertunisia.com')), 'Preview tested URLs stay on Discover Tunisia');
assert(preview.metadata.testedUrls.every((url) => !/booking\.com|tripadvisor|agoda|expedia/i.test(url)), 'Preview tested URLs exclude OTA domains');
assert(preview.drafts.every((draft) => draft.published === false), 'All preview drafts are unpublished');
assert(preview.drafts.every((draft) => ['draft', 'duplicate_review'].includes(draft.status)), 'All preview draft statuses are allowed');
assert(preview.drafts.every((draft) => Boolean(draft.sourceUrl)), 'All preview drafts include sourceUrl');
assert(preview.drafts.every((draft) => !draft.image), 'Preview drafts do not promote public image fields');
assert(preview.drafts.every((draft) => !Array.isArray(draft.gallery) || draft.gallery.length === 0), 'Preview drafts keep gallery empty');
assert(preview.drafts.every((draft) => Array.isArray(draft.imageUrlsForReview)), 'Preview drafts expose review image arrays');
assert(
  preview.drafts.every((draft) => {
    const urls = Array.isArray(draft.imageUrlsForReview) ? draft.imageUrlsForReview : [];
    return urls.every((url) => /^https?:\/\//i.test(String(url)) && !/booking\.com|tripadvisor|agoda|expedia/i.test(String(url)));
  }),
  'Preview review image URLs stay on allowed absolute HTTP(S) sources',
);
assert(
  preview.drafts.every(
    (draft) =>
      !(Array.isArray(draft.imageUrlsForReview) && draft.imageUrlsForReview.length > 0) ||
      (draft.imageSourceName && draft.imageSourceUrl),
  ),
  'Preview review images include source metadata when present',
);
assert(
  preview.drafts.every(
    (draft) =>
      !draft.website ||
      (isValidNormalizedWebsite(draft.website) && !draft.website.includes('_')),
  ),
  'Preview drafts only promote valid normalized website URLs',
);
assert(
  preview.drafts.every(
    (draft) =>
      !draft.rawSource?.websiteRaw ||
      draft.website ||
      /Website looked invalid in source; kept only in rawSource\./.test(draft.notes),
  ),
  'Invalid source websites stay in rawSource with an explanatory note',
);
assert(
  preview.drafts.every(
    (draft) => ![draft.hotelName, draft.title, draft.address, draft.category].some(hasMojibake),
  ),
  'Preview drafts have no obvious mojibake in key text fields',
);
assert(
  preview.drafts.every(
    (draft) =>
      !hasSuspiciousPhone(draft.phone) ||
      /suspicious|multiple numbers/i.test(draft.notes) ||
      qualityReport.sampleWarnings.some((warning) => warning.sourceUrl === draft.sourceUrl && warning.hotelName === draft.hotelName),
  ),
  'Suspicious phone values are fixed or surfaced in warnings',
);
assert(fs.existsSync(path.join(root, 'tmp', 'tunisia-hotel-import-quality-report.json')), 'Quality report exists after importer run');
assert(qualityReport.totalDrafts === preview.summary.totalDrafts, 'Quality report total matches preview total');
assert(typeof qualityReport.countWithMojibake === 'number', 'Quality report includes mojibake count');
assert(typeof qualityReport.countWithSuspiciousPhone === 'number', 'Quality report includes suspicious phone count');
assert(typeof qualityReport.countMissingContact === 'number', 'Quality report includes missing contact count');
assert(typeof qualityReport.countMissingWebsite === 'number', 'Quality report includes missing website count');
assert(Object.keys(qualityReport.countPerZone).length === 7, 'Quality report includes 7 zone counts');

console.log('qa:hotel-importer passed');
