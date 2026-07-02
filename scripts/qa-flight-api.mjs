import { existsSync, readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const ok = [];
const fail = [];

const check = (label, pass, detail = '') => {
  if (pass) {
    ok.push(`  \u2713 ${label}`);
  } else {
    fail.push(`  \u2717 ${label}${detail ? `  (${detail})` : ''}`);
  }
};

const readFile = (rel) => {
  const p = resolve(root, rel);
  if (!existsSync(p)) return '';
  return readFileSync(p, 'utf-8');
};

const fileExists = (rel) => existsSync(resolve(root, rel));

// ===== Firebase Functions =====
check('functions folder exists', fileExists('functions'));
check('functions/package.json exists', fileExists('functions/package.json'));
check('functions/tsconfig.json exists', fileExists('functions/tsconfig.json'));
check('functions/src/index.ts exists', fileExists('functions/src/index.ts'));

const fnIndex = readFile('functions/src/index.ts');
check('Function uses defineSecret for token', fnIndex.includes('defineSecret'));
check('Function uses DUFFEL_ACCESS_TOKEN secret', fnIndex.includes("DUFFEL_ACCESS_TOKEN"));
check('Function uses duffelToken.value()', fnIndex.includes('duffelToken.value()'));
check('No hardcoded Duffel token in function', !/duffel_(test|live)_/.test(fnIndex));
check('Function calls Duffel API server-side', fnIndex.includes('api.duffel.com'));
check('Function uses fetch for Duffel call', fnIndex.includes('fetch('));
check('No /air/orders in function', !fnIndex.includes('/air/orders'));
check('No /air/payments in function', !fnIndex.includes('/air/payments'));
check('No order_ creation in function', !fnIndex.includes("'order_'") && !fnIndex.includes('"order_"'));
check('Function is POST-only with 405 check', fnIndex.includes("req.method !== 'POST'") && fnIndex.includes('405'));
check('Function validates required fields', fnIndex.includes('origin') && fnIndex.includes('departureDate'));
check('Function returns normalized offers', fnIndex.includes('normalizeOffers'));
check('Function returns 502 on Duffel error', fnIndex.includes('502'));
check('Function does not expose raw token in response', !fnIndex.includes('Authorization') || fnIndex.includes('`Bearer ${duffelToken.value()}`'));
check('Function has secrets config', fnIndex.includes('secrets: [duffelToken]'));
check('Function has CORS config', fnIndex.includes('cors:'));

// ===== firebase.json =====
const fbJson = readFile('firebase.json');
check('firebase.json has function rewrite for flight-offers', fbJson.includes('flightOffersSearch'));
check('firebase.json still has SPA catch-all rewrite', fbJson.includes('"source": "**"'));
check('firebase.json function rewrite comes before SPA', fbJson.indexOf('flightOffersSearch') < fbJson.indexOf('"source": "**"'));

// ===== Local proxy script (optional, preserved) =====
check('Duffel proxy script exists (local dev)', fileExists('scripts/duffel-proxy.mjs'));

const proxyContent = readFile('scripts/duffel-proxy.mjs');
check('Proxy reads token from env only', !/duffel_test_/.test(proxyContent) && proxyContent.includes('process.env.DUFFEL_ACCESS_TOKEN'));
check('No /air/orders in proxy', !proxyContent.includes('/air/orders'));
check('No /air/payments in proxy', !proxyContent.includes('/air/payments'));

// ===== Frontend =====
const frontendFiles = [
  'src/feature-module/flight/flightSearch.tsx',
  'src/feature-module/flight/flight-booking/flightBooking.tsx',
  'src/feature-module/flight/flight-booking-confirmation/flightBookingConfirmation.tsx',
  'src/core/services/duffelApi.ts',
  'src/core/services/firebaseServices.ts',
];
frontendFiles.forEach((f) => {
  const content = readFile(f);
  check(`No Duffel token in ${f}`, !/duffel_(test|live)_/.test(content));
});

const duffelApiContent = readFile('src/core/services/duffelApi.ts');
check('duffelApi.ts exists', fileExists('src/core/services/duffelApi.ts'));
check('Frontend does NOT call api.duffel.com directly', !duffelApiContent.includes('api.duffel.com'));
check('Frontend uses relative /api/flight-offers/search', duffelApiContent.includes('/api/flight-offers/search'));

const envExample = readFile('.env.example');
check('.env.example exists', fileExists('.env.example'));
check('.env.example has no real Duffel token', !/duffel_(test|live)_[A-Za-z0-9]+/.test(envExample));
check('.env.example documents DUFFEL_ACCESS_TOKEN', envExample.includes('DUFFEL_ACCESS_TOKEN'));
check('.env is gitignored', !fileExists('.env'));

const fbServices = readFile('src/core/services/firebaseServices.ts');
check('ServiceRequest has provider field', fbServices.includes('provider?: string'));
check('ServiceRequest has offerSnapshot field', fbServices.includes('offerSnapshot?: Record'));
check('createServiceRequest passes provider', fbServices.includes('if (input.provider) payload.provider'));
check('createServiceRequest passes offerSnapshot', fbServices.includes('if (input.offerSnapshot) payload.offerSnapshot'));

const fsSearch = readFile('src/feature-module/flight/flightSearch.tsx');
check('flightSearch imports searchFlightOffers', fsSearch.includes("from '../../core/services/duffelApi'"));
check('flightSearch Search button triggers handleSearch', fsSearch.includes('handleSearch'));

const fbBooking = readFile('src/feature-module/flight/flight-booking/flightBooking.tsx');
check('flightBooking reads duffelOffer from sessionStorage', fbBooking.includes("sessionStorage.getItem('duffelOffer')"));
check('flightBooking passes provider: duffel', fbBooking.includes("payload.provider = 'duffel'"));
check('flightBooking passes offerSnapshot', fbBooking.includes('payload.offerSnapshot'));
check('No Pay Now wording in booking', !fbBooking.includes('Pay Now'));

const adminBookings = readFile('src/feature-module/admin-dashboard/pages/bookings.tsx');
check('Admin bookings shows provider field', adminBookings.includes('selectedRequest.provider'));
check('Admin bookings shows offerSnapshot', adminBookings.includes('selectedRequest.offerSnapshot'));

const viteConfig = readFile('vite.config.ts');
check('Vite proxy configured for /api (local dev)', viteConfig.includes("'/api'"));

// ===== No regressions =====
const firestoreRules = readFile('firestore.rules');
check('Firestore rules unchanged', firestoreRules.includes('rules_version =') && firestoreRules.includes('service cloud.firestore'));

const storageRules = readFile('storage.rules');
check('Storage rules unchanged', storageRules.includes('service firebase.storage'));

const homepage = readFile('src/feature-module/home-service-one/HomeServiceOne.tsx');
check('Homepage design unchanged', homepage.includes('HomeServiceOne'));

const userFlightData = readFile('src/core/common/data/json/userFlightBookingData.tsx');
check('userFlightBookingData unchanged', userFlightData.includes('Flight Request'));
const agentFlightData = readFile('src/core/common/data/json/agentFlightBookingData.tsx');
check('agentFlightBookingData unchanged', agentFlightData.includes('Flight Request'));

console.log('\n=== QA: Flight API (Firebase Functions) ===\n');
if (ok.length) {
  console.log(`Passed (${ok.length}):`);
  console.log(ok.join('\n'));
}
if (fail.length) {
  console.log(`\nFailed (${fail.length}):`);
  console.log(fail.join('\n'));
  process.exit(1);
} else {
  console.log('\nAll checks passed.');
}
