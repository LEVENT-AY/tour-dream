import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const root = process.cwd();
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');
const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const staticFiles = {
  sticky: read('src/feature-module/hotel/hotel-details/stickyContent.tsx'),
  request: read('src/feature-module/hotel/hotel-request/hotelRequest.tsx'),
  grid: read('src/feature-module/hotel/hotel-grid/hotelGrid.tsx'),
  list: read('src/feature-module/hotel/hotel-list/hotelList.tsx'),
  map: read('src/feature-module/hotel/hotel-map/hotelMap.tsx'),
  results: read('src/feature-module/hotel/components/PublicHotelResults.tsx'),
  services: read('src/core/services/firebaseServices.ts'),
  planner: read('scripts/plan-tunisiebooking-hotels-pay-now.mjs'),
};

assert(/Pay Now/.test(staticFiles.sticky), 'Sticky content has Pay Now CTA');
assert(/Price not configured yet/.test(staticFiles.sticky), 'Sticky content shows missing-price copy');
assert(/Price required before payment/.test(staticFiles.sticky), 'Sticky content blocks payment when price is missing');
assert(/bookingMode === 'pay_now'/.test(staticFiles.sticky) && /manual_payment/.test(staticFiles.sticky), 'Sticky content passes manual payment mode');
assert(/Manual payment\. Booking is confirmed after payment verification\./.test(staticFiles.grid), 'Hotel grid shows manual-payment copy for pay-now cards');
assert(/Manual payment\. Booking is confirmed after payment verification\./.test(staticFiles.results), 'Shared hotel map/list cards show manual-payment copy for pay-now cards');
assert(/PublicHotelResults/.test(staticFiles.list) && /mode="list"/.test(staticFiles.list), 'Hotel list routes through the shared public results surface');
assert(/PublicHotelResults/.test(staticFiles.map) && /mode="map"/.test(staticFiles.map), 'Hotel map routes through the shared public results surface');
assert(/Hotel Payment/.test(staticFiles.request), 'Hotel payment page title exists');
assert(/Price not configured yet/.test(staticFiles.request), 'Payment page shows missing-price state');
assert(/Admin must add a price before payment/.test(staticFiles.request), 'Payment page blocks missing-price submissions');
assert(/submitted/.test(staticFiles.request), 'Pay-now payment status is submitted');
assert(/pending_admin_confirmation/.test(staticFiles.request), 'Pay-now booking status is pending admin confirmation');
assert(/I understand my booking will be confirmed after DreamsTour verifies the payment/.test(staticFiles.request), 'Consent copy exists');
assert(/Card/.test(staticFiles.request) && /Coming soon/.test(staticFiles.request), 'Card is disabled with coming-soon copy');
assert(/Pay Now/.test(staticFiles.grid), 'Hotel grid can label pay-now hotels');
assert(/Price required before payment/.test(staticFiles.grid), 'Hotel grid blocks pay-now hotels with missing price');
assert(/HotelBookingMode = "request_only" \| "pay_now"/.test(staticFiles.services), 'Shared request schema supports pay-now booking mode');
assert(/payNowModeCount/.test(staticFiles.planner) && /paymentReadyCount/.test(staticFiles.planner), 'Planner tracks pay-now and payment-ready counts');
assert(!/Book Now/.test(staticFiles.sticky) && !/Book Now/.test(staticFiles.request) && !/Book Now/.test(staticFiles.grid), 'Template Book Now copy is removed from pay-now surfaces');
assert(!/support@example\.com/.test(staticFiles.sticky) && !/support@example\.com/.test(staticFiles.request) && !/support@example\.com/.test(staticFiles.grid), 'Placeholder support email is removed from pay-now surfaces');
assert(!/bookingStatus:\s*'confirmed'/.test(staticFiles.request), 'Pay-now flow does not auto-confirm bookings');

const planJson = JSON.parse(execFileSync('node', ['scripts/plan-tunisiebooking-hotels-pay-now.mjs'], {
  cwd: root,
  encoding: 'utf8',
}));

assert(planJson.totalImported === 36, 'Planner reports 36 imported hotels');
assert(planJson.publishedCount === 36, 'Planner reports 36 published hotels');
assert(planJson.payNowModeCount === 36, 'Planner reports all 36 as pay_now');
assert(planJson.proposedPayNowCount === 36, 'Planner proposed pay_now count is 36');
assert(planJson.withPriceCount === 36, 'Planner reports 36 hotels with priceFrom');
assert(planJson.withoutPriceCount === 0, 'Planner reports 0 hotels missing priceFrom');
assert(planJson.paymentReadyCount === 36, 'Planner reports 36 payment-ready hotels');
assert(planJson.needsAdminPriceCount === 0, 'Planner reports 0 hotels needing admin price');
assert(planJson.wouldUpdate === 36, 'Planner reports 36 would-update items');
assert(Array.isArray(planJson.proposedUpdates) && planJson.proposedUpdates.length === 36, 'Planner includes 36 proposed updates');
assert(planJson.proposedUpdates.every((item) => item.bookingMode === 'pay_now' && item.paymentMode === 'manual_payment' && typeof item.priceCurrency === 'string'), 'All proposed updates use pay_now/manual_payment with currency');
assert(planJson.paymentReadyHotels.every((item) => item.priceCurrency), 'All payment-ready hotels have a currency');
assert(planJson.paymentReadyHotels.length === 36, 'Planner lists 36 payment-ready hotels');
assert(planJson.needsAdminPriceHotels.length === 0, 'Planner lists 0 hotels needing admin price');

const { chromium } = await import('playwright');
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext();

const pricedSelection = {
  id: 'imported-tunisiebooking-vincci-helios-beach-djerba',
  title: 'Vincci Helios Beach Djerba',
  city: 'Djerba',
  location: 'Djerba',
  price: 36,
  priceFrom: 36,
  priceCurrency: 'EUR',
  priceUnit: 'night',
  bookingMode: 'pay_now',
  sourceName: 'TunisieBooking',
};

const missingPriceSelection = {
  ...pricedSelection,
  price: 0,
  priceFrom: 0,
  priceCurrency: 'EUR',
};

const payPage = await context.newPage();
await payPage.addInitScript((selection) => {
  sessionStorage.setItem('manualHotelSelection', JSON.stringify(selection));
}, pricedSelection);
await payPage.goto('http://localhost:5174/hotel/hotel-request?provider=manual&source=manual&bookingMode=pay_now&paymentMode=manual_payment&hotelName=Vincci%20Helios%20Beach%20Djerba&destination=Djerba&checkInDate=2026-07-06&checkOutDate=2026-07-08&adults=1&rooms=1&children=0&priceFrom=36&priceCurrency=EUR&priceUnit=night&sourceName=TunisieBooking', { waitUntil: 'domcontentloaded', timeout: 60000 });

const payText = await payPage.locator('body').innerText();
assert(/Hotel Payment/.test(payText), 'Pay-now page title is Hotel Payment');
assert(/Payment Summary/.test(payText), 'Pay-now summary renders');
assert(/Payable amount/.test(payText), 'Pay-now payable amount is shown');
assert(/Submit Payment/.test(payText), 'Pay-now submit button is labeled Submit Payment');
assert(/Phone \/ WhatsApp/.test(payText), 'Pay-now form requires phone / WhatsApp');
assert(/I understand my booking will be confirmed after DreamsTour verifies the payment/.test(payText), 'Consent checkbox copy is visible');
assert(/Manual payment verification/.test(payText), 'Pay-now page shows manual-payment verification copy');
assert(/Pay now using Wafa Cash or Bank Transfer\. DreamsTour will verify the payment and confirm your booking after manual review\./.test(payText), 'Pay-now page shows the manual review guidance');
assert(!/Final price confirmed after request/.test(payText), 'Pay-now page no longer shows request-only price copy');
assert(/Coming soon/.test(payText), 'Card is shown as coming soon');
assert(!/Hotel ID:/.test(payText) && !/Source:/.test(payText), 'Internal hotel fields stay hidden on the pay-now page');

const gridPage = await context.newPage();
await gridPage.goto('http://localhost:5174/hotel/hotel-grid?source=manual&destination=Djerba&checkInDate=2026-07-06&checkOutDate=2026-07-08&adults=1&rooms=1', { waitUntil: 'domcontentloaded', timeout: 60000 });
await gridPage.waitForFunction(() => document.querySelectorAll('.place-item').length > 0, { timeout: 20000 }).catch(() => {});
const payNowCard = gridPage.locator('.place-item').filter({ hasText: 'Vincci Helios Beach' }).first();
await payNowCard.waitFor({ state: 'visible', timeout: 15000 });
const payNowCardText = await payNowCard.innerText();
assert(/Pay Now/.test(payNowCardText), 'Hotel grid labels pay-now hotels correctly');
assert(/Manual payment\. Booking is confirmed after payment verification\./.test(payNowCardText), 'Hotel grid shows manual-payment verification copy');
assert(!/Final price confirmed after request/.test(payNowCardText), 'Hotel grid no longer shows request-only price copy');

const missingPage = await context.newPage();
await missingPage.addInitScript((selection) => {
  sessionStorage.setItem('manualHotelSelection', JSON.stringify(selection));
}, missingPriceSelection);
await missingPage.goto('http://localhost:5174/hotel/hotel-request?provider=manual&source=manual&bookingMode=pay_now&paymentMode=manual_payment&hotelName=Vincci%20Helios%20Beach%20Djerba&destination=Djerba&checkInDate=2026-07-06&checkOutDate=2026-07-08&adults=1&rooms=1&children=0&priceCurrency=EUR&priceUnit=night&sourceName=TunisieBooking', { waitUntil: 'domcontentloaded', timeout: 60000 });

const missingText = await missingPage.locator('body').innerText();
assert(/Price not configured yet/.test(missingText), 'Missing-price page shows price not configured');
assert(/Admin must add a price before payment/.test(missingText), 'Missing-price page explains admin action');
assert(/Price required before payment/.test(missingText), 'Missing-price page blocks payment');
assert(!/Submit Payment/.test(missingText), 'Missing-price page does not show submit payment CTA');
assert(!/Upload receipt/.test(missingText), 'Missing-price page does not ask for a receipt');
const disabledPayButton = missingPage.getByRole('button', { name: 'Pay Now' });
assert(await disabledPayButton.isDisabled(), 'Missing-price Pay Now button is disabled');

const requestPage = await context.newPage();
await requestPage.goto('http://localhost:5174/hotel/hotel-request?provider=manual&source=manual&hotelName=Al%20Jazira%20Beach%20et%20Spa&destination=Djerba&checkInDate=2026-07-06&checkOutDate=2026-07-08&adults=1&rooms=1&children=0&priceFrom=36&priceCurrency=EUR&priceUnit=night&sourceName=TunisieBooking', { waitUntil: 'domcontentloaded', timeout: 60000 });

const requestText = await requestPage.locator('body').innerText();
assert(/Review Hotel Request/.test(requestText), 'Request-only page keeps its old title');
assert(/Send Request/.test(requestText), 'Request-only page keeps its old submit label');
assert(/Manual payment after confirmation/.test(requestText), 'Request-only guidance remains intact');
assert(!/Submit Payment/.test(requestText), 'Request-only page does not show pay-now CTA');

const payNowTitle = await payPage.title();
const payNowUrl = payPage.url();
const requestOnlyTitle = await requestPage.title();
const requestOnlyUrl = requestPage.url();
const missingTitle = await missingPage.title();
const missingUrl = missingPage.url();

await browser.close();

console.log(JSON.stringify({
  planCounts: {
    totalImported: planJson.totalImported,
    publishedCount: planJson.publishedCount,
    payNowModeCount: planJson.payNowModeCount,
    proposedPayNowCount: planJson.proposedPayNowCount,
    withPriceCount: planJson.withPriceCount,
    withoutPriceCount: planJson.withoutPriceCount,
    paymentReadyCount: planJson.paymentReadyCount,
    needsAdminPriceCount: planJson.needsAdminPriceCount,
    wouldUpdate: planJson.wouldUpdate,
  },
  payNowPage: {
    title: payNowTitle,
    url: payNowUrl,
  },
  missingPricePage: {
    title: missingTitle,
    url: missingUrl,
  },
  requestOnlyPage: {
    title: requestOnlyTitle,
    url: requestOnlyUrl,
  },
  checks: 'passed',
}, null, 2));
