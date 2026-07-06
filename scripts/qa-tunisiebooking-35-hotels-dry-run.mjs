import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const root = process.cwd();
const readJson = (rel) => JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8'));
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');
const exists = (rel) => fs.existsSync(path.join(root, rel));
const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const scriptPath = path.join(root, 'scripts', 'extract-tunisiebooking-35-hotels-dry-run.mjs');
const dryRunPath = path.join(root, 'tmp', 'tunisiebooking-35-hotels-dry-run.json');
const dryRunMdPath = path.join(root, 'tmp', 'tunisiebooking-35-hotels-dry-run.md');
const qualityJsonPath = path.join(root, 'tmp', 'tunisiebooking-35-hotels-quality-report.json');
const qualityMdPath = path.join(root, 'tmp', 'tunisiebooking-35-hotels-quality-report.md');

assert(exists('scripts/extract-tunisiebooking-35-hotels-dry-run.mjs'), 'Dry-run extractor exists');
assert(exists('scripts/qa-tunisiebooking-35-hotels-dry-run.mjs'), 'Dry-run QA exists');
assert(exists('tmp/tunisiebooking-35-hotels-dry-run.json'), 'Dry-run JSON exists');
assert(exists('tmp/tunisiebooking-35-hotels-dry-run.md'), 'Dry-run markdown exists');
assert(exists('tmp/tunisiebooking-35-hotels-quality-report.json'), 'Quality JSON exists');
assert(exists('tmp/tunisiebooking-35-hotels-quality-report.md'), 'Quality markdown exists');

const script = read('scripts/extract-tunisiebooking-35-hotels-dry-run.mjs');
assert(!/setDoc|addDoc|updateDoc|deleteDoc|writeBatch|bulkWriter|runTransaction/i.test(script), 'Extractor has no Firestore write code');
assert(!/firebase deploy|deploy:hosting|deploy:rules/i.test(script), 'Extractor has no deploy code');
assert(!/functions\/src\/index\.ts|firestore\.rules|storage\.rules|duffel/i.test(script), 'Extractor does not touch protected files');

const dryRun = readJson('tmp/tunisiebooking-35-hotels-dry-run.json');
const quality = readJson('tmp/tunisiebooking-35-hotels-quality-report.json');
const gitStatus = execSync('git status --short', { cwd: root, encoding: 'utf8' });
const gitDiffNames = execSync('git diff --name-only', { cwd: root, encoding: 'utf8' });

const nearbyLeak = /Restaurants\s+à\s+proximité|Cafés\s+aux\s+alentours|Hôtels\s+à\s+proximité|Lieux\s+à\s+proximité|Attractions\s+à\s+proximité/i;

assert(dryRun.metadata.dryRun === true, 'Dry-run metadata is true');
assert(dryRun.metadata.firestoreWriteAttempted === false, 'Dry-run metadata says no Firestore write was attempted');
assert(Array.isArray(dryRun.metadata.targetRegions) && dryRun.metadata.targetRegions.length === 7, 'Exactly 7 target regions are present');
assert(dryRun.summary.totalSelected === 35, 'Total selected hotels is 35');
assert(dryRun.summary.finalExtractedHotels === 35, 'Final extracted hotels is 35');
assert(dryRun.summary.candidateAttemptFailures >= 0, 'Candidate attempt failures is reported');
assert(dryRun.summary.finalSelectedHotelFailures === 0, 'Final selected hotel failures is 0');
assert(Object.keys(dryRun.summary.countsByRegion).length === 7, 'Counts by region includes 7 regions');
assert(Object.values(dryRun.summary.countsByRegion).every((count) => count === 5), 'Each region selected exactly 5 hotels');
assert(Object.values(dryRun.summary.shortfallsByRegion).every((count) => count === 0), 'No region shortfall is reported');
assert(dryRun.hotels.length === 35, 'Dry-run hotel array has 35 entries');
assert(quality.hotels.length === 35, 'Quality report hotel array has 35 entries');
assert(quality.summary.totalSelected === 35, 'Quality summary totalSelected is 35');
assert(quality.summary.readyForDraftWrite + quality.summary.needsManualReview + quality.summary.rejectForNow === 35, 'Quality status counts add up to 35');
assert(!/functions\/src\/index\.ts|firestore\.rules|storage\.rules|duffel/i.test(gitStatus), 'git status does not include protected files');
assert(!/functions\/src\/index\.ts|firestore\.rules|storage\.rules|duffel/i.test(gitDiffNames), 'git diff does not include protected files');

for (const hotel of dryRun.hotels) {
  const images = [hotel.image, ...(Array.isArray(hotel.gallery) ? hotel.gallery : [])].filter(Boolean);
  const normalizedImages = images.map((value) => {
    try {
      const parsed = new URL(String(value).trim());
      parsed.hash = '';
      parsed.search = '';
      parsed.hostname = parsed.hostname.toLowerCase();
      return parsed.toString();
    } catch {
      return '';
    }
  }).filter(Boolean);

  assert(hotel.sourceName === 'TunisieBooking', 'sourceName is TunisieBooking');
  assert(typeof hotel.sourceUrl === 'string' && hotel.sourceUrl.includes('tunisiebooking.com/hotel-tunisie/'), 'sourceUrl points at a TunisieBooking detail page');
  assert(typeof hotel.sourceListingUrl === 'string' && hotel.sourceListingUrl.includes('tunisiebooking.com/'), 'sourceListingUrl exists');
  assert(typeof hotel.region === 'string' && hotel.region.length > 0, 'region is present');
  assert(typeof hotel.title === 'string' && hotel.title.length > 0, 'title is present');
  assert(hotel.bookingMode === 'request_only', 'bookingMode is request_only');
  assert(hotel.published === false, 'published is false');
  assert(hotel.status === 'draft', 'status is draft');
  assert(hotel.bookingEnabled === false, 'bookingEnabled is false');
  assert(hotel.descriptionClean === true, 'descriptionClean is true');
  const publicReadyText = [
    hotel.title,
    hotel.description,
    hotel.priceNote,
    hotel.sourceRegion,
    hotel.city,
    hotel.region,
    ...(Array.isArray(hotel.nearbySections)
      ? hotel.nearbySections.flatMap((section) => [section.title, ...(Array.isArray(section.items) ? section.items : [])])
      : []),
  ].join(' ');
  assert(!nearbyLeak.test(hotel.description || ''), 'Description has no nearby leak');
  assert(!/Ã¯Â¿Â½/.test(publicReadyText), 'No replacement character remains');
  assert(!/support@example\\.com/i.test(publicReadyText), 'No support@example.com is present');
  assert(!/support@example\.com/i.test(publicReadyText), 'No support@example.com is present');
  assert(!/Hotel Plaza Athenee|Barcelona|\$500/i.test(publicReadyText), 'No fake template data is present');
  assert(!/Book Now|R\u00e9servez d\u00e8s maintenant|Instant booking|Confirmed booking|Pay now|Guaranteed booking|final total|fake credit-card policy/i.test(publicReadyText), 'No forbidden public-ready text is present');
  assert(Array.isArray(hotel.quality?.warnings), 'quality warnings are present');
  assert(['ready_for_draft', 'needs_manual_review', 'reject_for_now'].includes(hotel.quality?.qualityStatus), 'qualityStatus is allowed');
  assert(new Set(normalizedImages).size === normalizedImages.length, 'Normalized image URLs are unique');
  assert(hotel.displayImages.length >= 1, 'displayImages is present');
  assert(hotel.quality?.warnings.every((warning) => typeof warning === 'string'), 'Warnings are strings');
}

console.log(
  JSON.stringify(
    {
      totalSelected: dryRun.summary.totalSelected,
      countsByRegion: dryRun.summary.countsByRegion,
      shortfallsByRegion: dryRun.summary.shortfallsByRegion,
      finalExtractedHotels: dryRun.summary.finalExtractedHotels,
      candidateAttemptFailures: dryRun.summary.candidateAttemptFailures,
      finalSelectedHotelFailures: dryRun.summary.finalSelectedHotelFailures,
      readyForDraftWrite: dryRun.summary.readyForDraftWrite,
      needsManualReview: dryRun.summary.needsManualReview,
      rejectForNow: dryRun.summary.rejectForNow,
    },
    null,
    2,
  ),
);
