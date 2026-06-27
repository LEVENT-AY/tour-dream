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

// 2b. Admin fields exported (ServiceRequestPriority, priority, internalNotes, followUpDate)
check(
  'ServiceRequestPriority type exported',
  /export\s+type\s+ServiceRequestPriority/.test(firebaseServices),
  'ServiceRequestPriority type not found'
);
check(
  'ServiceRequest has priority field',
  /\bpriority\??:\s*ServiceRequestPriority/.test(firebaseServices),
  'priority field missing in ServiceRequest'
);
check(
  'ServiceRequest has internalNotes field',
  /\binternalNotes\??:\s*string/.test(firebaseServices),
  'internalNotes field missing in ServiceRequest'
);
check(
  'ServiceRequest has followUpDate field',
  /\bfollowUpDate\??:\s*string/.test(firebaseServices),
  'followUpDate field missing in ServiceRequest'
);
check(
  'ServiceRequest has lastContactedAt field',
  /\blastContactedAt\??:\s*string/.test(firebaseServices),
  'lastContactedAt field missing in ServiceRequest'
);

// 2c. Public form does NOT expose admin-only fields
const publicForm = readFile('src/core/common/service-request/ServiceRequestForm.tsx');
check(
  'Public form does not expose priority',
  !publicForm.includes('priority'),
  'priority found in ServiceRequestForm'
);
check(
  'Public form does not expose internalNotes',
  !publicForm.includes('internalNotes'),
  'internalNotes found in ServiceRequestForm'
);
check(
  'Public form does not expose assignedTo',
  !publicForm.includes('assignedTo'),
  'assignedTo found in ServiceRequestForm'
);
check(
  'Public form does not expose followUpDate',
  !publicForm.includes('followUpDate'),
  'followUpDate found in ServiceRequestForm'
);
check(
  'Public form has honeypot field',
  /_hp_name/.test(publicForm),
  'honeypot _hp_name not found in ServiceRequestForm'
);
check(
  'Public form shows success state reference',
  /success/.test(publicForm) && /alert-success/.test(publicForm),
  'success state not found in ServiceRequestForm'
);
check(
  'Public form shows error state reference',
  /error/.test(publicForm) && /alert-danger/.test(publicForm),
  'error state not found in ServiceRequestForm'
);
check(
  'Public form has loading state',
  /submitting/.test(publicForm),
  'submitting/loading state not found in ServiceRequestForm'
);

// 2d. CreateServiceRequestInput does NOT have admin fields
const createInputPattern = /interface\s+CreateServiceRequestInput[\s\S]*?\{[^}]*\}/;
const createInputMatch = firebaseServices.match(/interface\s+CreateServiceRequestInput[\s\S]*?\n\}/);
if (createInputMatch) {
  const inputBlock = createInputMatch[0];
  check(
    'CreateServiceRequestInput has no priority',
    !inputBlock.includes('priority'),
    'priority found in CreateServiceRequestInput'
  );
  check(
    'CreateServiceRequestInput has no internalNotes',
    !inputBlock.includes('internalNotes'),
    'internalNotes found in CreateServiceRequestInput'
  );
}

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

// 4b. Admin Bookings has CSV export and copy action
check(
  'Admin Bookings has CSV export reference',
  /exportCSV/.test(bookingsContent) || /csv/.test(bookingsContent),
  'CSV export not found in bookings.tsx'
);
check(
  'Admin Bookings has copy follow-up action',
  /copyFollowUp/.test(bookingsContent),
  'copyFollowUp not found in bookings.tsx'
);
check(
  'Admin Bookings has prefilled WhatsApp',
  /wa\.me.*text=/.test(bookingsContent),
  'prefilled WhatsApp text not found in bookings.tsx'
);

// 4c. Admin Bookings supports priority/internalNotes/followUpDate
check(
  'Admin Bookings references priority',
  /\bpriority\b/.test(bookingsContent),
  'priority not referenced in bookings.tsx'
);
check(
  'Admin Bookings references internalNotes',
  /\binternalNotes\b/.test(bookingsContent),
  'internalNotes not referenced in bookings.tsx'
);
check(
  'Admin Bookings references followUpDate',
  /\bfollowUpDate\b/.test(bookingsContent),
  'followUpDate not referenced in bookings.tsx'
);
check(
  'Admin Bookings has WhatsApp link',
  /wa\.me/.test(bookingsContent),
  'WhatsApp link not found in bookings.tsx'
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

// 8. Assignment workflow
check(
  'Admin Bookings imports fetchUsersByRole',
  /fetchUsersByRole/.test(bookingsContent),
  'fetchUsersByRole not found in bookings.tsx'
);
check(
  'Admin Bookings has assignment filter UI',
  /assignmentFilter/.test(bookingsContent),
  'assignmentFilter not found in bookings.tsx'
);
check(
  'Admin Bookings has My Requests filter',
  /mine/.test(bookingsContent) && /My Requests/.test(bookingsContent),
  'My Requests filter not found in bookings.tsx'
);
check(
  'Admin Bookings shows assigned column',
  /Assigned/.test(bookingsContent),
  'Assigned column not found in bookings.tsx'
);
check(
  'Admin Bookings modal has dropdown assignment',
  /select[\s\S]*?Assigned To/.test(bookingsContent),
  'assignment dropdown not found in bookings.tsx modal'
);

// 9. Dashboard assignment stats
const adminDashboardContent = readFile('src/feature-module/admin-dashboard/dashboard/AdminDashboard.tsx');
check(
  'Admin Dashboard imports getServiceRequestAssignmentStats',
  /getServiceRequestAssignmentStats/.test(adminDashboardContent),
  'getServiceRequestAssignmentStats not found in AdminDashboard.tsx'
);
check(
  'Admin Dashboard shows unassigned count',
  /unassignedServiceRequests/.test(adminDashboardContent),
  'unassignedServiceRequests not found in AdminDashboard.tsx'
);
check(
  'Admin Dashboard shows urgent unassigned count',
  /urgentUnassignedServiceRequests/.test(adminDashboardContent),
  'urgentUnassignedServiceRequests not found in AdminDashboard.tsx'
);
check(
  'Admin Dashboard shows follow-ups due today',
  /followUpDueTodayServiceRequests/.test(adminDashboardContent),
  'followUpDueTodayServiceRequests not found in AdminDashboard.tsx'
);

// 10. Admin dashboard services exports assignment stats
const adminDashServicesContent = readFile('src/core/services/adminDashboardServices.ts');
check(
  'adminDashboardServices exports getServiceRequestAssignmentStats',
  /export\s+(const|function)\s+getServiceRequestAssignmentStats/.test(adminDashServicesContent),
  'getServiceRequestAssignmentStats not exported from adminDashboardServices.ts'
);
check(
  'adminDashboardServices exports ServiceRequestAssignmentStats type',
  /export\s+(interface|type)\s+ServiceRequestAssignmentStats/.test(adminDashServicesContent),
  'ServiceRequestAssignmentStats not found in adminDashboardServices.ts'
);

// 11. Public marketplace list components exist
const fsCruiseList = readFile('src/feature-module/curise/cruise-list/FirestoreCruiseList.tsx');
const fsBusList = readFile('src/feature-module/bus/bus-list/FirestoreBusList.tsx');
const fsVisaList = readFile('src/feature-module/visa/visa-list/FirestoreVisaList.tsx');
const fsGuideList = readFile('src/feature-module/guide/guide-grid/FirestoreGuideList.tsx');

check(
  'FirestoreCruiseList exists and has onStatus',
  /onStatus/.test(fsCruiseList),
  'onStatus not found in FirestoreCruiseList'
);
check(
  'FirestoreBusList exists and has onStatus',
  /onStatus/.test(fsBusList),
  'onStatus not found in FirestoreBusList'
);
check(
  'FirestoreVisaList exists and has onStatus',
  /onStatus/.test(fsVisaList),
  'onStatus not found in FirestoreVisaList'
);
check(
  'FirestoreGuideList exists and has onStatus',
  /onStatus/.test(fsGuideList),
  'onStatus not found in FirestoreGuideList'
);

// 12. Marketplace headings
check(
  'Cruise list heading is "Available Cruises"',
  /Available Cruises/.test(fsCruiseList),
  'heading not found in FirestoreCruiseList'
);
check(
  'Bus list heading is "Available Bus Trips"',
  /Available Bus Trips/.test(fsBusList),
  'heading not found in FirestoreBusList'
);
check(
  'Visa list heading is "Visa Services"',
  /Visa Services/.test(fsVisaList),
  'heading not found in FirestoreVisaList'
);
check(
  'Guide list heading is "Local Guides"',
  /Local Guides/.test(fsGuideList),
  'heading not found in FirestoreGuideList'
);

// 13. List components link to details with ?id=
check(
  'CruiseList links to details with ?id=',
  /\?id=/.test(fsCruiseList),
  '?id= not found in FirestoreCruiseList'
);
check(
  'BusList links to details with ?id=',
  /\?id=/.test(fsBusList),
  '?id= not found in FirestoreBusList'
);
check(
  'VisaList links to details with ?id=',
  /\?id=/.test(fsVisaList),
  '?id= not found in FirestoreVisaList'
);
check(
  'GuideList links to details with ?id=',
  /\?id=/.test(fsGuideList),
  '?id= not found in FirestoreGuideList'
);

// 14. Parent pages conditionally hide static fallback when FS has data
const cruiseParent = readFile('src/feature-module/curise/cruise-list/cruiseList.tsx');
const busParent = readFile('src/feature-module/bus/bus-list/busList.tsx');
const visaParent = readFile('src/feature-module/visa/visa-list/visaList.tsx');
const guideParent = readFile('src/feature-module/guide/guide-grid/guideGrid.tsx');

check(
  'Cruise parent hides fallback when FS has data',
  /fsStatus\s*!==\s*'hasData'/.test(cruiseParent),
  'conditional fallback hiding not found in cruiseList.tsx'
);
check(
  'Bus parent hides fallback when FS has data',
  /fsStatus\s*!==\s*'hasData'/.test(busParent),
  'conditional fallback hiding not found in busList.tsx'
);
check(
  'Visa parent hides fallback when FS has data',
  /fsStatus\s*!==\s*'hasData'/.test(visaParent),
  'conditional fallback hiding not found in visaList.tsx'
);
check(
  'Guide parent hides fallback when FS has data',
  /fsStatus\s*!==\s*'hasData'/.test(guideParent),
  'conditional fallback hiding not found in guideGrid.tsx'
);

// 15. Detail components still have ServiceRequestForm
const fsCruiseDetails = readFile('src/feature-module/curise/curise-details/FirestoreCruiseDetails.tsx');
const fsBusDetails = readFile('src/feature-module/bus/bus-details/FirestoreBusDetails.tsx');
const fsVisaDetails = readFile('src/feature-module/visa/visa-details/FirestoreVisaDetails.tsx');
const fsGuideDetails = readFile('src/feature-module/guide/guide-Details/FirestoreGuideDetails.tsx');

check(
  'FirestoreCruiseDetails has ServiceRequestForm',
  /ServiceRequestForm/.test(fsCruiseDetails),
  'ServiceRequestForm not found in FirestoreCruiseDetails'
);
check(
  'FirestoreBusDetails has ServiceRequestForm',
  /ServiceRequestForm/.test(fsBusDetails),
  'ServiceRequestForm not found in FirestoreBusDetails'
);
check(
  'FirestoreVisaDetails has ServiceRequestForm',
  /ServiceRequestForm/.test(fsVisaDetails),
  'ServiceRequestForm not found in FirestoreVisaDetails'
);
check(
  'FirestoreGuideDetails has ServiceRequestForm',
  /ServiceRequestForm/.test(fsGuideDetails),
  'ServiceRequestForm not found in FirestoreGuideDetails'
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
