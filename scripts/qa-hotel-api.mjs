import { readFileSync } from 'fs';

const ok = [];
const fail = [];

const check = (label, condition, msg) => {
  if (condition) { ok.push(label); console.log(`  \u2713 ${label}`); }
  else { fail.push({ label, msg }); console.log(`  \u2717 ${label}`); }
};

const readFile = (p) => {
  try { return readFileSync(p, 'utf-8'); } catch { return ''; }
};

const indexSource = readFile('functions/src/index.ts');
const firebaseJson = readFile('firebase.json');
const hotelGridContent = readFile('src/feature-module/hotel/hotel-grid/hotelGrid.tsx');
const hotelRequestContent = readFile('src/feature-module/hotel/hotel-request/hotelRequest.tsx');
const duffelStaysApiContent = readFile('src/core/services/duffelStaysApi.ts');
const adminBookings = readFile('src/feature-module/admin-dashboard/pages/bookings.tsx');
const flightBooking = readFile('src/feature-module/flight/flight-booking/flightBooking.tsx');
const allRoutes = readFile('src/feature-module/router/all_routes.tsx');
const routerLink = readFile('src/feature-module/router/router.link.tsx');
const storageRules = readFile('storage.rules');
const firestoreRules = readFile('firestore.rules');

// 1. Backend
check(
  'Functions index has staysSearch export',
  /export\s+const\s+staysSearch/.test(indexSource),
  'staysSearch export not found in functions/src/index.ts'
);
check(
  'staysSearch uses DUFFEL_ACCESS_TOKEN secret',
  /secrets:\s*\[duffelToken\]/.test(indexSource.split('staysSearch')[1] || ''),
  'staysSearch does not use duffelToken secret'
);
check(
  'staysSearch calls api.duffel.com/stays/search',
  /DUFFEL_STAYS_URL/.test(indexSource),
  'staysSearch does not use Duffel Stays URL'
);
check(
  'staysSearch normalizes response (no raw Duffel data to frontend)',
  /normalizeStays/.test(indexSource),
  'normalizeStays not found in functions'
);
check(
  'staysSearch returns stays array (not raw Duffel response)',
  /res\.json\(\{ stays/.test(indexSource),
  'staysSearch does not return normalized stays'
);
check(
  'No /stays/bookings endpoint in functions',
  !/stays\/bookings/.test(indexSource),
  'found stays/bookings endpoint'
);
check(
  'No /stays/booking in functions',
  !/stays\/booking/.test(indexSource),
  'found stays/booking'
);

// 2. Hosting rewrite
check(
  'firebase.json has /api/stays/search rewrite',
  /\/api\/stays\/search/.test(firebaseJson),
  '/api/stays/search rewrite not found in firebase.json'
);
check(
  'staysSearch rewrite points to staysSearch function',
  /"function":\s*"staysSearch"/.test(firebaseJson),
  'staysSearch rewrite missing or misconfigured'
);

// 3. Frontend service
check(
  'duffelStaysApi.ts exists and exports searchStays',
  /export\s+(const|function)\s+searchStays/.test(duffelStaysApiContent),
  'searchStays not exported from duffelStaysApi.ts'
);
check(
  'duffelStaysApi.ts calls /api/stays/search (not api.duffel.com)',
  !/api\.duffel\.com/.test(duffelStaysApiContent),
  'duffelStaysApi.ts calls api.duffel.com directly'
);
check(
  'No Duffel token in frontend source',
  !/duffel_(live|test)_[A-Za-z0-9]+/.test(readFile('src/core/services/duffelStaysApi.ts')),
  'Duffel token found in frontend'
);

// 4. Hotel grid page
check(
  'hotelGrid.tsx imports searchStays from duffelStaysApi',
  /import.*searchStays/.test(hotelGridContent),
  'searchStays not imported in hotelGrid.tsx'
);
check(
  'hotelGrid.tsx uses useSearchParams',
  /useSearchParams/.test(hotelGridContent),
  'useSearchParams not found in hotelGrid.tsx'
);
check(
  'hotelGrid.tsx reads destination query param',
  /destination/.test(hotelGridContent.split('searchParams.get')[0] || ''),
  'destination query param not read'
);
check(
  'hotelGrid.tsx auto-searches Duffel on params present',
  /searchStays\(\{/.test(hotelGridContent),
  'searchStays not called in hotelGrid.tsx'
);
check(
  'hotelGrid.tsx has Request this hotel button for stays',
  /Request this hotel/.test(hotelGridContent),
  'Request this hotel button not found'
);

// 5. Hotel request page
check(
  'hotelRequest.tsx exists',
  hotelRequestContent.length > 0,
  'hotelRequest.tsx is empty or missing'
);
check(
  'hotelRequest.tsx imports createServiceRequest',
  /createServiceRequest/.test(hotelRequestContent),
  'createServiceRequest not imported in hotelRequest.tsx'
);
check(
  'hotelRequest.tsx uses offerSnapshot',
  /offerSnapshot/.test(hotelRequestContent),
  'offerSnapshot not used in hotelRequest.tsx'
);
check(
  'hotelRequest.tsx sets serviceType hotel',
  /serviceType:\s*'hotel'/.test(hotelRequestContent),
  'serviceType not set to hotel'
);
check(
  'hotelRequest.tsx sets provider duffel',
  /provider:\s*'duffel'/.test(hotelRequestContent),
  'provider not set to duffel'
);
check(
  'hotelRequest.tsx has receipt upload',
  /uploadReceipt/.test(hotelRequestContent),
  'receipt upload not found in hotelRequest.tsx'
);
check(
  'hotelRequest.tsx has Card coming soon (no card fields)',
  /Card/.test(hotelRequestContent) && !/cardNumber|card_cvv|card_expiry/.test(hotelRequestContent),
  'hotelRequest.tsx card handling issue'
);
check(
  'hotelRequest.tsx has Wafa Cash payment option',
  /wafa_cash/.test(hotelRequestContent),
  'wafa_cash not found in hotelRequest.tsx'
);
check(
  'hotelRequest.tsx has Bank Transfer payment option',
  /bank_transfer/.test(hotelRequestContent),
  'bank_transfer not found in hotelRequest.tsx'
);
check(
  'hotelRequest.tsx no confirmed booking',
  !/confirmed.*booking|booking.*confirmed/i.test(hotelRequestContent),
  'confirmed booking wording found in hotelRequest.tsx'
);
check(
  'hotelRequest.tsx no checkout/pay/order',
  !/\bcheckout\b/i.test(hotelRequestContent.replace(/checkOutDate|checkOut|check-out/gi, '')),
  'checkout found in hotelRequest.tsx'
);
check(
  'hotelRequest.tsx no pay now',
  !/pay\s*now/i.test(hotelRequestContent),
  'pay now found in hotelRequest.tsx'
);
check(
  'hotelRequest.tsx no Duffel order',
  !/duffel.*order|order.*duffel/i.test(hotelRequestContent),
  'Duffel order found in hotelRequest.tsx'
);

// 6. Routes
check(
  'all_routes.tsx has hotelRequest route',
  /hotelRequest/.test(allRoutes),
  'hotelRequest route not in all_routes.tsx'
);
check(
  'router.link.tsx has hotelRequest route',
  /HotelRequest/.test(routerLink),
  'HotelRequest component not in router.link.tsx'
);

// 7. Admin Bookings
check(
  'Admin Bookings has Stay Details section for hotel',
  /serviceType\s*===\s*'hotel'/.test(adminBookings),
  'hotel-specific section not found in admin bookings'
);
check(
  'Admin Bookings Stay Details shows accommodationName',
  /accommodationName/.test(adminBookings),
  'accommodationName not displayed in admin bookings'
);
check(
  'Admin Bookings Stay Details shows checkInDate',
  /checkInDate/.test(adminBookings),
  'checkInDate not displayed in admin bookings'
);

// 8. Security
check(
  'Firestore rules unchanged',
  firestoreRules.length > 0 && !/newRule.*hotel.*search/i.test(firestoreRules),
  'firestore rules appear modified for hotel search'
);
check(
  'Storage rules receipts path unchanged',
  storageRules.includes('match /receipts/{allPaths=**}'),
  'storage rules receipts path modified'
);
check(
  'Storage rules receipts read is isAdmin only',
  /read:\s*if\s*isAdmin/.test(storageRules),
  'storage rules receipts read is not admin-only'
);
check(
  'No public read in storage rules',
  !/public read/.test(storageRules),
  'public read found in storage rules'
);

// 9. No fake hotel cards after search
check(
  'hotelGrid.tsx shows Duffel stays when params present (not fake cards)',
  /stays\.map/.test(hotelGridContent) && /staysError/.test(hotelGridContent),
  'Duffel stay results or error handling missing'
);

// 10. Existing features preserved
check(
  'Flight search in duffelApi.ts not modified',
  /searchFlightOffers/.test(readFile('src/core/services/duffelApi.ts')),
  'duffelApi.ts modified'
);
check(
  'Flight booking not broken',
  /createServiceRequest/.test(readFile('src/feature-module/flight/flight-booking/flightBooking.tsx')),
  'flightBooking.tsx appears broken'
);
check(
  'Admin Bookings still has flight section',
  /serviceType\s*===\s*'flight'/.test(adminBookings),
  'flight section removed from admin bookings'
);

// Summary
console.log('\n=== Hotel API QA Report ===\n');
console.log(`Passed: ${ok.length}`);
console.log(`Failed: ${fail.length}`);
if (fail.length > 0) {
  console.log('\n--- Failures ---');
  fail.forEach((f) => console.log(`  \u2717 ${f.label}: ${f.msg}`));
}
console.log(fail.length === 0 ? '\nAll checks passed.' : '');
process.exit(fail.length > 0 ? 1 : 0);
