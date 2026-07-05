import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const detailsPath = path.join(root, 'src', 'feature-module', 'hotel', 'hotel-details', 'hotelDetails.tsx');
const stickyPath = path.join(root, 'src', 'feature-module', 'hotel', 'hotel-details', 'stickyContent.tsx');
const stylesPath = path.join(root, 'src', 'assets', 'style', 'scss', 'pages', '_hotel-details.scss');
const draftPath = path.join(root, 'tmp', 'tunisiebooking-one-hotel-draft.json');

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const normalizeImageUrl = (value) => {
  if (typeof value !== 'string' || !value.trim()) return '';
  try {
    const parsed = new URL(value.trim());
    parsed.hash = '';
    parsed.search = '';
    parsed.hostname = parsed.hostname.toLowerCase();
    return parsed.toString();
  } catch {
    return '';
  }
};

assert(fs.existsSync(detailsPath), 'hotelDetails.tsx exists');
assert(fs.existsSync(stickyPath), 'stickyContent.tsx exists');
assert(fs.existsSync(stylesPath), '_hotel-details.scss exists');
assert(fs.existsSync(draftPath), 'draft JSON exists');

const details = fs.readFileSync(detailsPath, 'utf8');
const sticky = fs.readFileSync(stickyPath, 'utf8');
const styles = fs.readFileSync(stylesPath, 'utf8');
const draft = JSON.parse(fs.readFileSync(draftPath, 'utf8'));

const combinedImages = [draft.image, ...(Array.isArray(draft.gallery) ? draft.gallery : [])].filter(Boolean);
const normalizedImages = combinedImages.map((item) => normalizeImageUrl(item));

assert(/buildDescriptionText/.test(details), 'Description uses a sanitized builder');
assert(/trimAtNearbyMarkers/.test(details), 'Description is trimmed before nearby sections');
assert(/sanitizeRequestOnlyCopy/.test(details), 'Description strips direct-booking copy');
assert(!/descriptionSourceField|Source field:/.test(details), 'Source field debug text is removed');
assert(/allowDirectDraftPreview/.test(details), 'Draft preview path is explicitly handled');
assert(/source === "manual"/.test(details), 'Draft preview is scoped to manual source requests');
assert(/isAdmin/.test(details), 'Draft preview is gated to admin auth state');
assert(/auth\.authStateReady/.test(details), 'Draft preview waits for Firebase auth readiness');
assert(/normalizeImageUrl/.test(details), 'Gallery normalization strips query/hash before dedupe');
assert(/TEMPLATE_IMAGE_PATTERN/.test(details), 'Gallery excludes template and placeholder images');
assert(/vincci-gallery-main/.test(details) && /vincci-gallery-thumb-track/.test(details), 'Custom Vincci gallery structure is present');
assert(/hotel-section-nav/.test(details) && /Overview/.test(details) && /Amenities/.test(details) && /Policies/.test(details), 'Section tabs are rendered under the gallery');
assert(/updateActiveImage/.test(details), 'Main gallery arrows update the active image');
assert(/setOpenGallery\(true\)/.test(details), 'See All opens the lightbox from the hero image');
assert(/Show More/.test(details) && /Show Less/.test(details), 'Description preview toggle is present');
assert(/View Location/.test(details) && /scrollToSection\("location"\)/.test(details), 'View Location scrolls to the map section');
assert(/160 Rooms \+ 32 Bungalows/.test(details) || /Rooms \+ .*Bungalows/.test(details), 'Room inventory badge formatting is supported');
assert(/hotel-room-chip/.test(details) && /board options/i.test(details), 'Room chips and request-only board options are present');
assert(/visibleAmenities/.test(details) && /slice\(0, 9\)/.test(details), 'Popular amenities stay capped to positive items');
assert(/showAllServices/.test(details) && /Show All/.test(details), 'Services can expand from the collapsed default');
assert(/Confirm(ed)? after request/.test(details), 'Policies surface unknown values as confirmed after request');
assert(/faq-toggle-icon/.test(details), 'FAQ uses a non-eye toggle icon');
assert(/visibleReviews/.test(details) && /Show More/.test(details), 'Reviews collapse by default with a show-more toggle');
assert(/Coming soon/.test(sticky) && /aria-disabled/.test(sticky), 'Provider actions are safe when no contact target exists');
assert(!/Hotel Plaza Athenee|Barcelona|\$500|support@example\.com|Total 48 Rooms|400 Views/i.test(details + sticky), 'No fake template content remains in details UI');
assert(/Request this hotel/.test(sticky), 'Request-only CTA is present');
assert(/Request-only hotel/.test(sticky), 'Request-only badge text is present');
assert(/View on Map/.test(sticky), 'Map CTA is present');
assert(/Nearby Landmarks & Visits/.test(sticky), 'Nearby section title is present');
assert(/hotel-date-helper/.test(sticky), 'Weekday helper text is rendered under dates');
assert(/hotel-sidebar-price/.test(sticky), 'Sidebar price block has the polished class');
assert(/vincci-gallery-main-image/.test(styles), 'Hero gallery image styling exists');
assert(/vincci-gallery-thumb/.test(styles), 'Thumbnail rail styling exists');
assert(/hotel-sidebar-price/.test(styles), 'Sidebar price styling exists');
assert(/hotel-nearby-list/.test(styles), 'Nearby formatting styling exists');
assert(!combinedImages.some((src) => /assets\/img\/hotels|hotel-large-|hotel-thumb-|logo|icon|favicon|preloader|loader|spinner|tracking|pixel|sprite|placeholder|facebook\.com\/tr/i.test(src)), 'Source-backed image set excludes template and tracking assets');
assert(new Set(normalizedImages).size === normalizedImages.length, 'Gallery normalized URLs are unique');
assert(typeof draft.priceFrom === 'number' && draft.priceFrom === 36, 'Draft price reference is 36 EUR');
assert(draft.priceCurrency === 'EUR', 'Draft currency is EUR');
assert(draft.priceUnit === 'night', 'Draft price unit is night');
assert(draft.bookingMode === 'request_only', 'Draft bookingMode stays request_only');
assert(draft.bookingEnabled === false, 'Draft bookingEnabled stays false');
assert(draft.published === false, 'Draft published stays false');
assert(draft.status === 'draft', 'Draft status stays draft');
assert(draft.roomInventoryText.toLowerCase().includes('160 rooms + 32 bungalows'), 'Draft room inventory text is source-backed');
assert(typeof draft.latitude === 'number' && draft.latitude > 30 && draft.latitude < 38, 'Latitude is in Tunisia range');
assert(typeof draft.longitude === 'number' && draft.longitude > 7 && draft.longitude < 12.5, 'Longitude is in Tunisia range');
assert(Array.isArray(draft.gallery) && draft.gallery.length >= 5, 'Draft gallery has enough real images for the hero rail');
assert(Array.isArray(draft.highlights) && draft.highlights.length >= 3, 'Draft highlights are present');
assert(Array.isArray(draft.faq) && draft.faq.length >= 5, 'Draft FAQ is present');
assert(Array.isArray(draft.nearbyAttractions) && draft.nearbyAttractions.length >= 1, 'Draft nearby attractions are present');
assert(Array.isArray(draft.boardOptions) || typeof draft.selectedBoardType === 'string', 'Draft board options are handled safely');
assert(!JSON.stringify(draft).includes('Hotel Plaza Athenee'), 'Draft data contains no fake hotel name');
assert(!JSON.stringify(draft).includes('Barcelona'), 'Draft data contains no Barcelona fallback');
assert(!JSON.stringify(draft).includes('$500'), 'Draft data contains no fake price');
assert(!JSON.stringify(draft).includes('support@example.com'), 'Draft data contains no provider placeholder');
assert(!/ï¿½|\uFFFD/.test(JSON.stringify(draft.highlights)), 'Draft highlights have no replacement characters');
assert(!/ï¿½|\uFFFD/.test(JSON.stringify(draft.faq)), 'Draft FAQ has no replacement characters');
assert(!/ï¿½|\uFFFD/.test(JSON.stringify(draft.nearbyAttractions)), 'Draft nearby attractions have no replacement characters');
assert(!/ï¿½|\uFFFD/.test(String(draft.description || '')), 'Draft description has no replacement characters');

console.log(
  JSON.stringify(
    {
      checkedFiles: [detailsPath, stickyPath, stylesPath],
      descriptionFieldSelectedByUi: 'description',
      requestOnlyModePreserved: true,
      uniqueNormalizedGalleryUrls: new Set(normalizedImages).size,
      galleryCount: combinedImages.length,
      roomInventoryText: draft.roomInventoryText,
      priceHeadline: `Starts From ${draft.priceFrom} ${draft.priceCurrency} / ${draft.priceUnit}`,
      mapCoordinates: [draft.latitude, draft.longitude],
    },
    null,
    2,
  ),
);
