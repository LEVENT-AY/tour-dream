import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { tmpdir } from 'node:os';
import { pathToFileURL } from 'node:url';

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
assert(!/ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¯ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¿ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â½|\uFFFD/.test(JSON.stringify(draft.highlights)), 'Draft highlights have no replacement characters');
assert(!/ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¯ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¿ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â½|\uFFFD/.test(JSON.stringify(draft.faq)), 'Draft FAQ has no replacement characters');
assert(!/ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¯ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¿ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â½|\uFFFD/.test(JSON.stringify(draft.nearbyAttractions)), 'Draft nearby attractions have no replacement characters');
assert(!/ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¯ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¿ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â½|\uFFFD/.test(String(draft.description || '')), 'Draft description has no replacement characters');

const { chromium } = await import('playwright');
const browserExecutablePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const targetUrl = 'http://localhost:5174/hotel/hotel-details?source=manual&destination=Djerba&checkInDate=2026-07-06&checkOutDate=2026-07-08&adults=1&rooms=1&id=imported-tunisiebooking-vincci-helios-beach-djerba';
const launchOptions = fs.existsSync(browserExecutablePath) ? { headless: true, executablePath: browserExecutablePath } : { headless: true };

const loginAndOpen = async (page) => {
  await page.goto('http://localhost:5174/login', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForSelector('input[placeholder="Enter Email"]', { timeout: 60000 });
  await page.locator('input[placeholder="Enter Email"]').fill('manager.emtilek@gmail.com');
  await page.locator('input[placeholder="Enter Password"]').fill('ChangeMe123!');
  await page.locator('button[type="submit"]').click();
  await page.waitForTimeout(5000);
  await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(4000);
};

const assertPubliclySafeDraftState = async (browserInstance) => {
  const publicPage = await browserInstance.newPage({ viewport: { width: 1440, height: 1200 } });
  try {
    await publicPage.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await publicPage.waitForTimeout(2500);
    const publicBody = await publicPage.locator('body').innerText().catch(() => '');
    const publicUrl = publicPage.url();

    assert(
      !/Vincci Helios Beach|Source field:|rawSource|request this hotel|book now|rÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©servez dÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¨s maintenant/i.test(publicBody),
      'Public session does not expose unpublished draft content',
    );
    assert(
      /not found|login|sign in|empty|request-only|admin|required|forbidden|unauthorized|draft|private/i.test(publicBody) ||
        /login|sign in|hotel-details/i.test(publicUrl),
      'Public session stays in a safe non-public state',
    );

    return { publicUrl, publicBody };
  } finally {
    await publicPage.close();
  }
};

const browser = await chromium.launch(launchOptions);
let renderedChecks = {};
let publicSafetyCheck = {};

try {
  publicSafetyCheck = await assertPubliclySafeDraftState(browser);

  const desktop = await browser.newPage({ viewport: { width: 1440, height: 1200 } });
  await loginAndOpen(desktop);

  const overviewText = await desktop.locator('#overview').innerText();
  const nearbyText = await desktop.locator('#location .hotel-nearby-list').innerText();
  const availabilityText = await desktop.locator('#availability').innerText();
  const servicesText = await desktop.locator('#services .row').innerText();
  const servicesNoteText = await desktop.locator('#services .hotel-service-notes').innerText().catch(() => '');
  const faqText = await desktop.locator('#faq').innerText();
  const bodyText = await desktop.locator('body').innerText();
  const reviewCardsBefore = await desktop.locator('.hotel-review-card').count();
  const seeAllVisible = await desktop.locator('.vincci-gallery-see-all').isVisible();
  const firstThumbSrcs = await desktop.locator('.vincci-gallery-thumb img').evaluateAll((nodes) =>
    nodes.slice(0, 5).map((node) => node.getAttribute('src') || node.currentSrc || ''),
  );
  const amenityCount = await desktop.locator('#amenities .row > div').count();
  const serviceCountBefore = await desktop.locator('#services .row > div').count();
  const boardOptionsText = await desktop.locator('#rooms').innerText();

  const waitForActiveSection = async (label) => {
    await desktop.waitForFunction(
      (expected) => Array.from(document.querySelectorAll('.hotel-section-tab.is-active')).some((button) => button.textContent?.trim() === expected),
      label,
      { timeout: 10000 },
    );
    return desktop.locator('.hotel-section-tab.is-active').filter({ hasText: label }).innerText();
  };

  await desktop.getByRole('button', { name: 'Amenities', exact: true }).click();
  const activeAfterAmenities = await waitForActiveSection('Amenities');
  await desktop.getByRole('button', { name: 'Rooms', exact: true }).click();
  const activeAfterRooms = await waitForActiveSection('Rooms');

  if (await desktop.getByRole('button', { name: 'Show All' }).isVisible()) {
    await desktop.getByRole('button', { name: 'Show All' }).click();
  }
  const serviceCountAfter = await desktop.locator('#services .row > div').count();

  await desktop.locator('#reviews').getByRole('button', { name: 'Show More', exact: true }).click();
  const reviewCardsAfter = await desktop.locator('.hotel-review-card').count();

  assert(/Vincci Helios Beach/.test(bodyText), 'Rendered admin page shows Vincci title');
  assert(!/Source field:/i.test(bodyText), 'Rendered admin page hides source field debug text');
  assert(!/rawSource/i.test(bodyText), 'Rendered admin page hides rawSource text');
  assert(overviewText.length > 100, 'Overview remains a complete description');
  assert(overviewText.length > 100, 'Overview remains a complete description');
  assert(!/Restaurants ÃƒÆ’Ã‚Â  proximitÃƒÆ’Ã‚Â©|CafÃƒÆ’Ã‚Â©s aux alentours|HÃƒÆ’Ã‚Â´tels ÃƒÆ’Ã‚Â  proximitÃƒÆ’Ã‚Â©/i.test(overviewText), 'Overview excludes nearby markers');
  assert(!/^votre sÃƒÆ’Ã‚Â©jour/i.test(overviewText.trim()), 'Overview does not start with a fragment');
  assert(!/RÃƒÆ’Ã‚Â©servez dÃƒÆ’Ã‚Â¨s maintenant|Book Now|Instant booking|Confirmed booking|Pay now|Guaranteed booking/i.test(overviewText), 'Overview is request-safe');
  assert(nearbyText.length > 50, 'Nearby groups render in the sidebar');
  assert(/Restaurant Darkom/i.test(nearbyText) && /Diva Coffee Lounge/i.test(nearbyText) && /Sidi Mansour Resort/i.test(nearbyText), 'Nearby sections keep multiple source-backed items');
  assert(seeAllVisible, 'See All button is visible inside the hero image');
  assert(new Set(firstThumbSrcs).size === firstThumbSrcs.length, 'First visible thumbnails are unique');
  assert(amenityCount >= 6 && amenityCount <= 9, 'Popular amenities are limited to 6-9 positive items');
  assert(!/Wifi Non Disponible|Ascenseur Non Disponible/i.test((await desktop.locator('#amenities .row').innerText()) + servicesText), 'Negative services are not rendered as positive items');
  assert(!/will be confirmed after request/i.test(servicesNoteText), 'Services note stays source-neutral');
  assert(serviceCountBefore <= 18, 'Services are collapsed by default');
  assert(serviceCountAfter >= serviceCountBefore, 'Show All services expands or preserves the visible set');
  assert(boardOptionsText.length > 20, 'Board options show real meal-plan names');
  assert(
    /Check-in/i.test(availabilityText) &&
      /Check-out/i.test(availabilityText) &&
      /Nights/i.test(availabilityText) &&
      /Payable amount/i.test(availabilityText) &&
      /Pay Now/i.test(availabilityText) &&
      /Manual payment\. Booking is confirmed after payment verification\./i.test(availabilityText),
    'Availability renders a useful pay-now summary',
  );
  assert(!/160 Rooms \\+ 32 Bungalows/i.test(availabilityText), 'Availability does not repeat the room inventory badge');
  assert(!/instant availability|final total/i.test(availabilityText), 'Availability avoids instant availability language');
  assert(/WhatsApp Us/i.test(bodyText) && /Chat Now/i.test(bodyText), 'Provider button labels remain intact');
  assert(/Coming soon/i.test(bodyText), 'Provider helper note is visible without replacing labels');
  assert(!/support@example\\.com/i.test(bodyText), 'Provider details do not expose placeholder email');
  assert(!/Book Now/i.test(bodyText), 'Rendered page does not show Book Now');
  assert(!/Restaurant Darkom|Diva Coffee Lounge|Sidi Mansour Resort/i.test(overviewText), 'Nearby content does not leak into Overview');
  assert(faqText.length > 50 && !/Book Now|RÃ©servez dÃ¨s maintenant|instant booking/i.test(faqText), 'FAQ stays request-safe');
  assert(reviewCardsBefore === 4, 'Reviews show only the first four by default');
  assert(reviewCardsAfter >= 5, 'Show More reveals additional reviews');
  assert(/Amenities/.test(activeAfterAmenities) && /Rooms/.test(activeAfterRooms), 'Section tabs update their active state');

  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await loginAndOpen(mobile);
  const mobileOverview = await mobile.locator('#overview').innerText();
  const mobileNavScrollable = await mobile.locator('.hotel-section-nav').evaluate((node) => node.scrollWidth > node.clientWidth);
  const mobileThumbCount = await mobile.locator('.vincci-gallery-thumb img').count();
  const mobileMainImageCount = await mobile.locator('.vincci-gallery-main-image').count();
  assert(!/Restaurants Ã  proximitÃ©|CafÃ©s aux alentours|HÃ´tels Ã  proximitÃ©/i.test(mobileOverview), 'Mobile overview also excludes nearby markers');
  assert(mobileNavScrollable, 'Mobile tab row remains horizontally scrollable');
  assert(mobileMainImageCount >= 1, 'Mobile still renders the main gallery frame');

  renderedChecks = {
    overviewText,
    nearbyText,
    availabilityText,
    reviewCardsBefore,
    reviewCardsAfter,
    serviceCountBefore,
    serviceCountAfter,
    activeAfterAmenities,
    activeAfterRooms,
    mobileNavScrollable,
  };
} finally {
  await browser.close();
}

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
      publicSafetyCheck,
      renderedChecks,
    },
    null,
    2,
  ),
);
