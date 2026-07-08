import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const root = process.cwd();
const BASE_URL = process.env.BASE_URL || 'http://localhost:5174';
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');
const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};
const normalizeText = (value) => value.replace(/\s+/g, ' ').trim().toLowerCase();

const staticFiles = {
  sticky: read('src/feature-module/hotel/hotel-details/stickyContent.tsx'),
  request: read('src/feature-module/hotel/hotel-request/hotelRequest.tsx'),
  checkout: read('src/feature-module/checkout/UnifiedCheckoutPage.tsx'),
  buyer: read('src/feature-module/checkout/components/BuyerInfoForm.tsx'),
  methods: read('src/feature-module/checkout/components/PaymentMethods.tsx'),
  summary: read('src/feature-module/checkout/components/ProductSummary.tsx'),
  grid: read('src/feature-module/hotel/hotel-grid/hotelGrid.tsx'),
  list: read('src/feature-module/hotel/hotel-list/hotelList.tsx'),
  map: read('src/feature-module/hotel/hotel-map/hotelMap.tsx'),
  results: read('src/feature-module/hotel/components/PublicHotelResults.tsx'),
  services: read('src/core/services/firebaseServices.ts'),
  planner: read('scripts/plan-tunisiebooking-hotels-pay-now.mjs'),
};

assert(/Pay Now/.test(staticFiles.sticky), 'Sticky content has Pay Now CTA');
assert(/paymentMode', 'manual_payment'/.test(staticFiles.sticky), 'Sticky content passes manual payment mode');
assert(/UnifiedCheckoutPage/.test(staticFiles.request), 'Hotel request route uses the shared checkout page');
assert(/mode="hotel"/.test(staticFiles.request), 'Hotel route renders the unified checkout in hotel mode');
assert(/Product Information/i.test(staticFiles.summary), 'Shared product summary exists');
assert(/Buyer Information/i.test(staticFiles.buyer), 'Shared buyer form exists');
assert(/Wafa Cash/.test(staticFiles.methods) && /Bank Transfer/.test(staticFiles.methods), 'Shared payment methods include Wafa Cash and Bank Transfer');
assert(/Card Payment/.test(staticFiles.methods) && /Coming soon/.test(staticFiles.methods), 'Card payment is disabled as coming soon');
assert(/Submit Payment for Verification/.test(staticFiles.checkout), 'Unified checkout uses the final payment CTA');
assert(/payment_submitted/.test(staticFiles.checkout), 'Unified checkout stores payment_submitted status');
assert(/pending_admin_confirmation/.test(staticFiles.checkout), 'Hotel checkout keeps pending admin confirmation');
assert(/Manual payment verification/i.test(staticFiles.checkout), 'Unified checkout shows manual payment verification copy');
assert(/public-results-full-width/.test(staticFiles.grid), 'Hotel grid keeps the public full-width shell');
assert(/Navigate/.test(staticFiles.grid) && /hotelMap/.test(staticFiles.grid), 'Hotel grid redirects to the hotel-map default flow');
assert(/PublicHotelResults/.test(staticFiles.list) && /mode="list"/.test(staticFiles.list), 'Hotel list routes through the shared public results surface');
assert(/PublicHotelResults/.test(staticFiles.map) && /mode="map"/.test(staticFiles.map), 'Hotel map routes through the shared public results surface');
assert(/Manual payment\. Booking is confirmed after payment verification\./.test(staticFiles.results), 'Shared hotel cards keep pay-now copy');
assert(!/Request this hotel/.test(staticFiles.checkout), 'Unified hotel checkout does not use request wording');
assert(!/Final price confirmed after request/.test(staticFiles.checkout), 'Unified hotel checkout removes request-only price copy');
assert(!/support@example\.com/.test(staticFiles.checkout), 'Unified hotel checkout removes placeholder support email');
assert(!/bookingStatus:\s*'confirmed'/.test(staticFiles.checkout), 'Hotel checkout does not auto-confirm bookings');

const planJson = JSON.parse(execFileSync('node', ['scripts/plan-tunisiebooking-hotels-pay-now.mjs'], {
  cwd: root,
  encoding: 'utf8',
}));

assert(planJson.totalImported === 36, 'Planner reports 36 imported hotels');
assert(planJson.payNowModeCount === 36, 'Planner reports all 36 as pay_now');
assert(planJson.withPriceCount === 36, 'Planner reports 36 hotels with priceFrom');
assert(planJson.withoutPriceCount === 0, 'Planner reports 0 hotels missing priceFrom');
assert(planJson.paymentReadyCount === 36, 'Planner reports 36 payment-ready hotels');
assert(planJson.needsAdminPriceCount === 0, 'Planner reports 0 hotels needing admin price');

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
await payPage.goto(
  `${BASE_URL}/hotel/hotel-request?provider=manual&source=manual&bookingMode=pay_now&paymentMode=manual_payment&hotelName=Vincci%20Helios%20Beach%20Djerba&destination=Djerba&checkInDate=2026-07-06&checkOutDate=2026-07-08&adults=1&rooms=1&children=0&priceFrom=36&priceCurrency=EUR&priceUnit=night&sourceName=TunisieBooking`,
  { waitUntil: 'domcontentloaded', timeout: 60000 },
);

const payText = await payPage.locator('body').innerText();
const normalizedPayText = normalizeText(payText);
assert(/Hotel Checkout/.test(payText), 'Hotel mode uses the unified hotel checkout title');
assert(normalizedPayText.includes('product information'), 'Hotel checkout renders product information');
assert(normalizedPayText.includes('buyer information'), 'Hotel checkout renders buyer information');
assert(normalizedPayText.includes('payment method'), 'Hotel checkout renders payment methods');
assert(normalizedPayText.includes('total due'), 'Hotel checkout shows a total due summary');
assert(/Submit Payment for Verification/.test(payText), 'Hotel checkout shows the final payment CTA');
assert(/Wafa Cash/.test(payText) && /Bank Transfer/.test(payText), 'Hotel checkout shows the supported payment methods');
assert(/Card Payment/.test(payText) && /Coming soon/.test(payText), 'Hotel checkout shows disabled card payment');
assert(/Booking is confirmed after payment verification\./.test(payText), 'Hotel checkout shows verification copy');
assert(!/Request this hotel|Send Request|Request booking|Final price confirmed after request|Enquiry/i.test(payText), 'Hotel checkout does not show request-only wording');

const missingPage = await context.newPage();
await missingPage.addInitScript((selection) => {
  sessionStorage.setItem('manualHotelSelection', JSON.stringify(selection));
}, missingPriceSelection);
await missingPage.goto(
  `${BASE_URL}/hotel/hotel-request?provider=manual&source=manual&bookingMode=pay_now&paymentMode=manual_payment&hotelName=Vincci%20Helios%20Beach%20Djerba&destination=Djerba&checkInDate=2026-07-06&checkOutDate=2026-07-08&adults=1&rooms=1&children=0&priceCurrency=EUR&priceUnit=night&sourceName=TunisieBooking`,
  { waitUntil: 'domcontentloaded', timeout: 60000 },
);

const missingText = await missingPage.locator('body').innerText();
const normalizedMissingText = normalizeText(missingText);
assert(normalizedMissingText.includes('price required before payment'), 'Missing-price hotel checkout blocks payment');
assert(!/Request this hotel|Send Request/.test(missingText), 'Missing-price hotel checkout still avoids request wording');
const disabledButton = missingPage.getByRole('button', { name: 'Submit Payment for Verification' });
assert(await disabledButton.isDisabled(), 'Missing-price hotel checkout disables the final payment CTA');

const gridPage = await context.newPage();
await gridPage.goto(`${BASE_URL}/hotel/hotel-grid?source=manual&destination=Djerba&checkInDate=2026-07-06&checkOutDate=2026-07-08&adults=1&rooms=1`, {
  waitUntil: 'domcontentloaded',
  timeout: 60000,
});
await gridPage.waitForURL(`${BASE_URL}/hotel/hotel-map?source=manual&destination=Djerba&checkInDate=2026-07-06&checkOutDate=2026-07-08&adults=1&rooms=1`, {
  timeout: 60000,
});
await gridPage.waitForSelector('[data-testid="public-hotel-card"]', { timeout: 20000 });
const payNowCard = gridPage.locator('[data-testid="public-hotel-card"]').filter({ hasText: 'Vincci Helios Beach' }).first();
await payNowCard.waitFor({ state: 'visible', timeout: 15000 });
const payNowCardText = await payNowCard.innerText();
assert(/Pay Now/.test(payNowCardText), 'Hotel cards keep the Pay Now CTA');
assert(/Manual payment\. Booking is confirmed after payment verification\./.test(payNowCardText), 'Hotel cards keep the pay-now verification copy');
assert(!/Request this hotel|Final price confirmed after request/.test(payNowCardText), 'Hotel cards do not show request-only hotel copy');

await browser.close();

console.log(JSON.stringify({
  success: true,
  totalImported: planJson.totalImported,
  payNowModeCount: planJson.payNowModeCount,
  withPriceCount: planJson.withPriceCount,
  paymentReadyCount: planJson.paymentReadyCount,
  checks: 'passed',
}, null, 2));
