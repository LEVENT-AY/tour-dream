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

// 1. ServiceRequestForm exists
check(
  'ServiceRequestForm component exists',
  fileExists('src/core/common/service-request/ServiceRequestForm.tsx'),
  'src/core/common/service-request/ServiceRequestForm.tsx not found'
);

// 2. createServiceRequest exported
const firebaseServices = readFile('src/core/services/firebaseServices.ts');
check(
  'createServiceRequest exported',
  /export\s+(const|function)\s+createServiceRequest\s*=?\s*(async\s*)?\(/.test(firebaseServices),
  'export const createServiceRequest not found in firebaseServices.ts'
);

// 3. Four Firestore details components import ServiceRequestForm
const cruiseContent = readFile('src/feature-module/curise/curise-details/FirestoreCruiseDetails.tsx');
const busContent = readFile('src/feature-module/bus/bus-details/FirestoreBusDetails.tsx');
const visaContent = readFile('src/feature-module/visa/visa-details/FirestoreVisaDetails.tsx');
const guideContent = readFile('src/feature-module/guide/guide-Details/FirestoreGuideDetails.tsx');

const srImportPattern = /import\s+ServiceRequestForm/;

check(
  'FirestoreCruiseDetails imports ServiceRequestForm',
  srImportPattern.test(cruiseContent),
  'missing import in FirestoreCruiseDetails'
);
check(
  'FirestoreCruiseDetails renders ServiceRequestForm',
  /<ServiceRequestForm/.test(cruiseContent),
  'missing <ServiceRequestForm in FirestoreCruiseDetails'
);

check(
  'FirestoreBusDetails imports ServiceRequestForm',
  srImportPattern.test(busContent),
  'missing import in FirestoreBusDetails'
);
check(
  'FirestoreBusDetails renders ServiceRequestForm',
  /<ServiceRequestForm/.test(busContent),
  'missing <ServiceRequestForm in FirestoreBusDetails'
);

check(
  'FirestoreVisaDetails imports ServiceRequestForm',
  srImportPattern.test(visaContent),
  'missing import in FirestoreVisaDetails'
);
check(
  'FirestoreVisaDetails renders ServiceRequestForm',
  /<ServiceRequestForm/.test(visaContent),
  'missing <ServiceRequestForm in FirestoreVisaDetails'
);

check(
  'FirestoreGuideDetails imports ServiceRequestForm',
  srImportPattern.test(guideContent),
  'missing import in FirestoreGuideDetails'
);
check(
  'FirestoreGuideDetails renders ServiceRequestForm',
  /<ServiceRequestForm/.test(guideContent),
  'missing <ServiceRequestForm in FirestoreGuideDetails'
);

// 4. Admin Bookings imports/uses fetchServiceRequests
const bookingsContent = readFile('src/feature-module/admin-dashboard/pages/bookings.tsx');
check(
  'Admin Bookings imports fetchServiceRequests',
  /fetchServiceRequests/.test(bookingsContent),
  'fetchServiceRequests not found in bookings.tsx'
);
check(
  'Admin Bookings calls fetchServiceRequests',
  /fetchServiceRequests\s*\(/.test(bookingsContent),
  'fetchServiceRequests() call not found in bookings.tsx'
);

// 5. Old serviceRequests.tsx admin page does not exist
check(
  'Old serviceRequests.tsx admin page removed',
  !fileExists('src/feature-module/admin-dashboard/pages/serviceRequests.tsx'),
  'serviceRequests.tsx still exists'
);

// 6. Sidebar does not contain "Service Requests" link
const sidebarContent = readFile('src/feature-module/admin-dashboard/sidebar/AdminSidebar.tsx');
check(
  'Sidebar has no "Service Requests" link',
  !sidebarContent.includes('Service Requests'),
  'found "Service Requests" in AdminSidebar.tsx'
);

// 7. Router does not expose /admin/service-requests
const routesContent = readFile('src/feature-module/router/all_routes.tsx');
const routerContent = readFile('src/feature-module/router/router.link.tsx');
check(
  'all_routes.tsx has no adminServiceRequests',
  !routesContent.includes('adminServiceRequests'),
  'adminServiceRequests found in all_routes.tsx'
);
check(
  'router.link.tsx has no adminServiceRequests',
  !routerContent.includes('adminServiceRequests'),
  'adminServiceRequests found in router.link.tsx'
);

// Summary
console.log('\n=== QA: Service Requests Flow ===\n');
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
