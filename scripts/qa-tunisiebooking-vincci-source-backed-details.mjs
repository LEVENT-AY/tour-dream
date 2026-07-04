import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const detailsPath = path.join(root, 'src', 'feature-module', 'hotel', 'hotel-details', 'hotelDetails.tsx');
const stickyPath = path.join(root, 'src', 'feature-module', 'hotel', 'hotel-details', 'stickyContent.tsx');
const draftPath = path.join(root, 'tmp', 'tunisiebooking-one-hotel-draft.json');

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

assert(fs.existsSync(detailsPath), 'hotelDetails.tsx exists');
assert(fs.existsSync(stickyPath), 'stickyContent.tsx exists');
assert(fs.existsSync(draftPath), 'draft JSON exists');

const details = fs.readFileSync(detailsPath, 'utf8');
const sticky = fs.readFileSync(stickyPath, 'utf8');
const draft = JSON.parse(fs.readFileSync(draftPath, 'utf8'));

assert(!/support@example\.com/i.test(details + sticky), 'No support@example.com placeholder remains');
assert(!/Wheelchair accessible|Visual alarms in hallways|Braille\/raised signage|Wheelchair-accessible concierge desk/i.test(details), 'No static accessibility template services remain');
assert(!/A valid credit card will be required upon booking/i.test(details), 'No fake credit-card policy remains');
assert(!/Hotel Plaza Athenee|Barcelona|Yellowstone National Park/i.test(details), 'No fallback hotel template text remains in details page');
assert(!/assets\/img\/hotels\/hotel-thumb-|assets\/img\/hotels\/hotel-large-/i.test(details), 'No template gallery image fallback remains in details page');
assert(/Request this hotel/.test(sticky), 'Request-only CTA is present');
assert(!/\$0\s*\/\s*Night/i.test(details + sticky), 'No $0 / Night claim remains');
assert(!/Book Now/.test(sticky), 'No Book Now CTA remains for request-only flow');
assert(/Detailed hotel policies are confirmed after request\./.test(details), 'Honest policy fallback message is present');
assert(/DreamsTour will confirm availability and price after request\./.test(details + sticky), 'Honest provider fallback message is present');
assert(/Location map unavailable/.test(sticky), 'Map fallback text remains honest');
assert(!/logo|icon|favicon|preloader|loader|spinner|tracking|pixel|sprite|placeholder|facebook\.com\/tr/i.test(JSON.stringify([draft.image, ...(draft.gallery || [])])), 'Source-backed image set excludes tracking or placeholder assets');
assert(new Set([draft.image, ...(draft.gallery || [])].filter(Boolean)).size === [draft.image, ...(draft.gallery || [])].filter(Boolean).length, 'Source-backed image set is unique');
assert(!/�/.test(draft.description), 'Draft description has no replacement characters');
assert(!draft.highlights.some((item) => /�/.test(item)), 'Draft highlights have no replacement characters');
assert(!draft.faq.some((item) => /�/.test(JSON.stringify(item))), 'Draft FAQ has no replacement characters');
assert(!draft.nearbyAttractions.some((item) => /�/.test(item)), 'Draft nearby attractions have no replacement characters');

console.log(
  JSON.stringify(
    {
      checkedFiles: [detailsPath, stickyPath],
      requestOnlyCta: true,
      noTemplateGalleryFallback: true,
      noFakePolicies: true,
      noProviderPlaceholder: true,
      draftGalleryCount: Array.isArray(draft.gallery) ? draft.gallery.length : 0,
      cleanFrenchText: true,
    },
    null,
    2,
  ),
);
