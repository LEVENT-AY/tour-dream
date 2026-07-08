import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const root = process.cwd();
const BASE_URL = process.env.BASE_URL || 'http://localhost:5174';
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');
const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};
const normalizeText = (value) => value.replace(/\s+/g, ' ').trim().toLowerCase();
const FLIGHT_SEARCH_PARAMS = {
  origin: 'MIR',
  destination: 'MAD',
  departureDate: '2026-07-16',
  adults: 1,
  cabinClass: 'economy',
};

const fetchRealFlightOffer = async () => {
  const endpoints = [
    `${BASE_URL}/api/flight-offers/search`,
    'https://us-central1-tour-tunisi.cloudfunctions.net/flightOffersSearch',
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(FLIGHT_SEARCH_PARAMS),
      });
      if (!response.ok) continue;
      const data = await response.json();
      if (Array.isArray(data?.offers) && data.offers.length > 0) {
        return data.offers[0];
      }
    } catch {
      // Try the next real endpoint
    }
  }

  throw new Error('Unable to fetch a real flight offer from the existing flight API endpoints.');
};

const staticFiles = {
  checkout: read('src/feature-module/checkout/UnifiedCheckoutPage.tsx'),
  buyer: read('src/feature-module/checkout/components/BuyerInfoForm.tsx'),
  methods: read('src/feature-module/checkout/components/PaymentMethods.tsx'),
  summary: read('src/feature-module/checkout/components/ProductSummary.tsx'),
  hotelRoute: read('src/feature-module/hotel/hotel-request/hotelRequest.tsx'),
  flightRoute: read('src/feature-module/flight/flight-booking/flightBooking.tsx'),
  flightSearch: read('src/feature-module/flight/flightSearch.tsx'),
};

assert(/UnifiedCheckoutPage/.test(staticFiles.hotelRoute) && /mode="hotel"/.test(staticFiles.hotelRoute), 'Hotel checkout route uses the unified checkout page');
assert(/UnifiedCheckoutPage/.test(staticFiles.flightRoute) && /mode="flight"/.test(staticFiles.flightRoute), 'Flight checkout route uses the unified checkout page');
assert(/Product Information/i.test(staticFiles.summary), 'Shared product summary component exists');
assert(/Buyer Information/i.test(staticFiles.buyer), 'Shared buyer form component exists');
assert(/Wafa Cash/.test(staticFiles.methods) && /Bank Transfer/.test(staticFiles.methods), 'Shared payment methods render Wafa Cash and Bank Transfer');
assert(/Card Payment/.test(staticFiles.methods) && /Coming soon/.test(staticFiles.methods), 'Shared payment methods keep Card Payment disabled as coming soon');
assert(/Submit Payment for Verification/.test(staticFiles.checkout), 'Unified checkout uses the final payment CTA');
assert(/Payment pending verification/.test(staticFiles.checkout), 'Unified checkout uses payment verification wording');
assert(!/Request this Flight|Send a Flight Request|Request this hotel|Send Request|Enquiry|Inquiry/i.test(staticFiles.checkout), 'Unified checkout source avoids request wording');
assert(/Pay Now/.test(staticFiles.flightSearch), 'Flight results CTA now uses Pay Now');
assert(!/Request this flight/.test(staticFiles.flightSearch), 'Flight results no longer use request wording');

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 1200 } });
const realFlightOffer = await fetchRealFlightOffer();

const hotelPage = await context.newPage();
await hotelPage.addInitScript((selection) => {
  sessionStorage.setItem('manualHotelSelection', JSON.stringify(selection));
}, {
  id: 'imported-tunisiebooking-vincci-helios-beach-djerba',
  title: 'Vincci Helios Beach Djerba',
  city: 'Djerba',
  location: 'Djerba',
  image: 'https://example.com/hotel.jpg',
  price: 36,
  priceFrom: 36,
  priceCurrency: 'EUR',
  priceUnit: 'night',
  bookingMode: 'pay_now',
  sourceName: 'TunisieBooking',
});
await hotelPage.goto(
  `${BASE_URL}/hotel/hotel-request?provider=manual&source=manual&bookingMode=pay_now&paymentMode=manual_payment&hotelId=imported-tunisiebooking-vincci-helios-beach-djerba&hotelName=Vincci%20Helios%20Beach%20Djerba&destination=Djerba&checkInDate=2026-07-06&checkOutDate=2026-07-08&adults=1&rooms=1&children=0&priceFrom=36&priceCurrency=EUR&priceUnit=night&sourceName=TunisieBooking`,
  { waitUntil: 'domcontentloaded', timeout: 60000 },
);
const hotelText = await hotelPage.locator('body').innerText();
const normalizedHotelText = normalizeText(hotelText);
assert(/Hotel Checkout/.test(hotelText), 'Hotel checkout page loads in hotel mode');
assert(normalizedHotelText.includes('product information'), 'Hotel checkout shows product information');
assert(normalizedHotelText.includes('buyer information'), 'Hotel checkout shows buyer information');
assert(normalizedHotelText.includes('payment method'), 'Hotel checkout shows payment methods');
assert(/Wafa Cash/.test(hotelText), 'Hotel checkout shows Wafa Cash');
assert(/Bank Transfer/.test(hotelText), 'Hotel checkout shows Bank Transfer');
assert(/Card Payment/.test(hotelText) && /Coming soon/.test(hotelText), 'Hotel checkout shows Card Payment as coming soon');
assert(/Vincci Helios Beach Djerba/.test(hotelText), 'Hotel checkout shows the real hotel name');
assert(/EUR/.test(hotelText), 'Hotel checkout shows hotel currency');
assert(!/Request this hotel|Send request|Final price confirmed after request|Book Now/i.test(hotelText), 'Hotel checkout avoids request-only wording');

const flightPage = await context.newPage();
await flightPage.addInitScript((offer) => {
  sessionStorage.setItem('duffelOffer', JSON.stringify(offer));
}, realFlightOffer);
await flightPage.goto(`${BASE_URL}/flight/flight-booking`, {
  waitUntil: 'domcontentloaded',
  timeout: 60000,
});
const flightCheckoutText = await flightPage.locator('body').innerText();
const normalizedFlightCheckoutText = normalizeText(flightCheckoutText);
assert(/Flight Checkout/.test(flightCheckoutText), 'Flight checkout page loads in flight mode');
assert(normalizedFlightCheckoutText.includes('product information'), 'Flight checkout shows product information');
assert(normalizedFlightCheckoutText.includes('buyer information'), 'Flight checkout shows buyer information');
assert(normalizedFlightCheckoutText.includes('payment method'), 'Flight checkout shows payment methods');
assert(/Wafa Cash/.test(flightCheckoutText), 'Flight checkout shows Wafa Cash');
assert(/Bank Transfer/.test(flightCheckoutText), 'Flight checkout shows Bank Transfer');
assert(/Card Payment/.test(flightCheckoutText) && /Coming soon/.test(flightCheckoutText), 'Flight checkout shows Card Payment as coming soon');
assert(/Flight fare is subject to availability until payment is verified\./.test(flightCheckoutText), 'Flight checkout shows the fare-expiry note');
assert(new RegExp(`${FLIGHT_SEARCH_PARAMS.origin}|${FLIGHT_SEARCH_PARAMS.destination}|Monastir|Madrid`).test(flightCheckoutText), 'Flight checkout shows real route data');
assert(new RegExp(`\\b${realFlightOffer.totalCurrency}\\b`).test(flightCheckoutText), 'Flight checkout shows real currency data');
assert(flightCheckoutText.includes(realFlightOffer.airline), 'Flight checkout shows the real airline');
assert(!/Request this flight|Send a Flight Request|Request booking|Enquiry|Inquiry|Book Now/i.test(flightCheckoutText), 'Flight checkout avoids request-only wording');

const mobilePage = await context.newPage();
await mobilePage.setViewportSize({ width: 390, height: 844 });
await mobilePage.addInitScript((selection) => {
  sessionStorage.setItem('manualHotelSelection', JSON.stringify(selection));
}, {
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
});
await mobilePage.goto(
  `${BASE_URL}/hotel/hotel-request?provider=manual&source=manual&bookingMode=pay_now&paymentMode=manual_payment&hotelId=imported-tunisiebooking-vincci-helios-beach-djerba&hotelName=Vincci%20Helios%20Beach%20Djerba&destination=Djerba&checkInDate=2026-07-06&checkOutDate=2026-07-08&adults=1&rooms=1&children=0&priceFrom=36&priceCurrency=EUR&priceUnit=night&sourceName=TunisieBooking`,
  { waitUntil: 'domcontentloaded', timeout: 60000 },
);
const mobileMetrics = await mobilePage.evaluate(() => ({
  scrollWidth: document.documentElement.scrollWidth,
  innerWidth: window.innerWidth,
  normalizedBody: document.body.innerText.replace(/\s+/g, ' ').trim().toLowerCase(),
}));
assert(
  mobileMetrics.normalizedBody.includes('product information')
    && mobileMetrics.normalizedBody.includes('buyer information')
    && mobileMetrics.normalizedBody.includes('payment method'),
  'Mobile checkout keeps all three sections visible',
);
assert(mobileMetrics.scrollWidth <= mobileMetrics.innerWidth + 2, 'Mobile checkout does not introduce horizontal overflow');

await browser.close();

console.log(JSON.stringify({
  success: true,
  hotelModeChecked: true,
  flightModeChecked: true,
  flightOfferVerified: {
    airline: realFlightOffer.airline,
    origin: realFlightOffer.slices?.[0]?.origin,
    destination: realFlightOffer.slices?.[0]?.destination,
    totalCurrency: realFlightOffer.totalCurrency,
    totalAmount: realFlightOffer.totalAmount,
  },
  mobileChecked: true,
}, null, 2));
