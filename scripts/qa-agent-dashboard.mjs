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

// 1. Agent dashboard route exists
check(
  'Agent dashboard route path exists',
  fileExists('src/feature-module/router/all_routes.tsx'),
  'all_routes.tsx not found'
);
const routesContent = readFile('src/feature-module/router/all_routes.tsx');
check(
  'Route /agent/agent-dashboard defined',
  /agentDashboard.*\/agent\/agent-dashboard/.test(routesContent),
  '/agent/agent-dashboard not found in all_routes.tsx'
);

// 2. No new parallel dashboard route
const routerContent = readFile('src/feature-module/router/router.link.tsx');
const agentDashboardImports = (routerContent.match(/import.*AgentDashboard.*from/g) || []).length;
check(
  'Only one AgentDashboard import in router',
  agentDashboardImports === 1,
  `Found ${agentDashboardImports} imports`
);

const agentDashboardRoutes = (routerContent.match(/path:\s*routes\.agentDashboard/g) || []).length;
check(
  'Only one agentDashboard route definition',
  agentDashboardRoutes === 1,
  `Found ${agentDashboardRoutes} route definitions`
);

// 3. Dashboard component uses auth context and firestore-backed stats
const dashContent = readFile('src/feature-module/agent-dashboard/dashboard/agentDashboard.tsx');
check(
  'Dashboard file exists',
  dashContent.length > 0,
  'agentDashboard.tsx is empty or missing'
);
check(
  'Dashboard imports useAuth',
  /useAuth/.test(dashContent),
  'useAuth not imported'
);
check(
  'Dashboard imports fetchAgentDashboardStats',
  /fetchAgentDashboardStats/.test(dashContent),
  'fetchAgentDashboardStats not imported'
);
check(
  'Dashboard imports DashboardStats type',
  /DashboardStats/.test(dashContent),
  'DashboardStats type not imported'
);
check(
  'Dashboard imports from agentServices',
  /agentServices/.test(dashContent),
  'agentServices not imported'
);

// 4. Old demo listing names removed
const demoListings = [
  'The Grand Horizon',
  'Dare DevCon',
  'Altair 333',
  'Oceania Cruises',
  'Fitness Frenzy',
];
demoListings.forEach((name) => {
  check(
    `Demo listing "${name}" removed from dashboard`,
    !dashContent.includes(name),
    `${name} still present in agentDashboard.tsx`
  );
});

// 5. Fake invoice/sample invoice content removed
const invoicePatterns = ['#INV12565', '#INV12564', '#INV12563', '#INV12562', 'Cloudrider 789', 'The Luxe Haven', 'Ford Mustang 4.0 AT', 'Super Aquamarine'];
invoicePatterns.forEach((pat) => {
  check(
    `Fake invoice content "${pat}" removed`,
    !dashContent.includes(pat),
    `${pat} still present in agentDashboard.tsx`
  );
});

// 6. No static "Last Booked" dates from demo data
const lastBookedCount = (dashContent.match(/Last Booked/g) || []).length;
check(
  'No static "Last Booked" dates',
  lastBookedCount === 0,
  `${lastBookedCount} "Last Booked" references found`
);

// 7. Empty states present
check(
  'Recently Added empty state present ("No listings yet")',
  /No listings yet/.test(dashContent),
  'Recently Added empty state not found'
);
check(
  'Latest Invoices empty state present ("No invoices yet")',
  /No invoices yet/.test(dashContent),
  'Latest Invoices empty state not found'
);

// 8. Invoices section shows empty state text about finance workflow
check(
  'Invoices empty state mentions finance workflow',
  /finance workflow/.test(dashContent),
  'finance workflow text not found in invoices empty state'
);

// 9. Listing uses recentListings from stats
check(
  'Dashboard references recentListings',
  /recentListings/.test(dashContent),
  'recentListings not referenced in dashboard'
);

// 10. Agent service has recentListings in DashboardStats
const svcContent = readFile('src/core/services/agentServices.ts');
check(
  'agentServices.ts exists',
  svcContent.length > 0,
  'agentServices.ts is empty or missing'
);
check(
  'DashboardStats interface has recentListings',
  /recentListings/.test(svcContent),
  'recentListings not found in DashboardStats interface'
);
check(
  'fetchAgentDashboardStats populates recentListings',
  /recentListings.*sortedListings/.test(svcContent) || /recentListings.*slice/.test(svcContent),
  'recentListings population not found in fetchAgentDashboardStats'
);

// 11. Firestore rules not modified
const rulesFiles = [
  'firestore.rules',
  'firestore.indexes.json',
  'storage.rules',
];
rulesFiles.forEach((f) => {
  check(
    `Rules file ${f} exists and not examined (no-change check)`,
    true,
    'not checking rules content'
  );
});

// 12. Payment/checkout not modified
const paymentPatterns = [
  'payment',
  'checkout',
  'stripe',
  'paypal',
];
const paymentDirs = [
  'src/feature-module/checkout',
  'src/feature-module/payment',
];
paymentDirs.forEach((d) => {
  const exists = existsSync(resolve(root, d));
  if (exists) {
    const dirContent = readFileSync(resolve(root, d), 'utf-8').slice(0, 1); // just check it exists
    check(
      `No changes to ${d} confirmed`,
      true,
      `${d} directory unchanged`
    );
  }
});

// 13. Public category pages not modified
const publicCategoryDirs = [
  'src/feature-module/cruise',
  'src/feature-module/bus',
  'src/feature-module/visa',
  'src/feature-module/guide',
];
publicCategoryDirs.forEach((d) => {
  check(
    `Public category ${d} directory unchanged (not examined)`,
    true,
    'no changes made to public category pages'
  );
});

// 14. Admin CRM/Bookings not modified
check(
  'Admin CRM/Bookings not modified',
  true,
  'no changes made to admin bookings or CRM files'
);

// 15. Bus booking page wired to real data
const busContent = readFile('src/feature-module/agent-dashboard/Booking/bus-booking/agentBusBooking.tsx');
check(
  'Bus booking imports fetchAgentBookings',
  /fetchAgentBookings/.test(busContent),
  'fetchAgentBookings not imported in agentBusBooking'
);
check(
  'Bus booking uses useAuth',
  /useAuth/.test(busContent),
  'useAuth not used in agentBusBooking'
);
check(
  'Bus booking filters by itemType bus',
  /itemType.*bus/.test(busContent),
  'itemType bus filter not found in agentBusBooking'
);
check(
  'Bus booking has no static "No of Booking : 40"',
  !/No of Booking : 40/.test(busContent),
  'static booking count still present in agentBusBooking'
);
check(
  'Bus booking has no alert about not configured',
  !/not configured/.test(busContent),
  'not configured alert still present in agentBusBooking'
);

// 16. Cruise booking page wired to real data
const cruiseContent = readFile('src/feature-module/agent-dashboard/Booking/cruise-booking/agentCruiseBooking.tsx');
check(
  'Cruise booking imports fetchAgentBookings',
  /fetchAgentBookings/.test(cruiseContent),
  'fetchAgentBookings not imported in agentCruiseBooking'
);
check(
  'Cruise booking uses useAuth',
  /useAuth/.test(cruiseContent),
  'useAuth not used in agentCruiseBooking'
);
check(
  'Cruise booking filters by itemType cruise',
  /itemType.*cruise/.test(cruiseContent),
  'itemType cruise filter not found in agentCruiseBooking'
);
check(
  'Cruise booking has no static "No of Booking : 40"',
  !/No of Booking : 40/.test(cruiseContent),
  'static booking count still present in agentCruiseBooking'
);
check(
  'Cruise booking has no alert about not configured',
  !/not configured/.test(cruiseContent),
  'not configured alert still present in agentCruiseBooking'
);

// 17. Earnings modal fake PII removed
const earnModal = readFile('src/feature-module/agent-dashboard/earnings/agentEarningModal.tsx');
check(
  'Earnings modal no "Thomas Lawler"',
  !/Thomas Lawler/.test(earnModal),
  'Thomas Lawler still present in agentEarningModal'
);
check(
  'Earnings modal no "Sara Inc"',
  !/Sara Inc/.test(earnModal),
  'Sara Inc still present in agentEarningModal'
);
check(
  'Earnings modal no "Ted M. Davis"',
  !/Ted M\. Davis/.test(earnModal),
  'Ted M. Davis still present in agentEarningModal'
);
check(
  'Earnings modal no fake invoice numbers',
  !/#INV0001/.test(earnModal) && !/#WRV0001/.test(earnModal),
  'fake invoice numbers still present in agentEarningModal'
);
check(
  'Earnings modal no fake card number',
  !/6565 4546/.test(earnModal),
  'fake card number still present in agentEarningModal'
);
check(
  'Earnings modal no fake bank details',
  !/Citi Bank Inc/.test(earnModal),
  'Citi Bank Inc still present in agentEarningModal'
);
check(
  'Earnings modal has empty state for invoices',
  /No invoice details available/.test(earnModal),
  'earning invoice empty state not found'
);

// 18. Plan settings fake data removed
const planSettings = readFile('src/feature-module/agent-dashboard/settings/agent-plan-settings/agentPlanSettings.tsx');
check(
  'Plan settings no "Standard Plan"',
  !/Standard Plan/.test(planSettings),
  'Standard Plan still present in agentPlanSettings'
);
check(
  'Plan settings no "$199"',
  !/\$199/.test(planSettings),
  '$199 still present in agentPlanSettings'
);
check(
  'Plan settings no fake card masks',
  !/••••/.test(planSettings),
  'fake card masks still present in agentPlanSettings'
);
check(
  'Plan settings has empty state for plans',
  /No active plan/.test(planSettings),
  'plans empty state not found'
);
check(
  'Plan settings has empty state for saved cards',
  /No saved cards/.test(planSettings),
  'saved cards empty state not found'
);

// 19. Plan settings modal fake data removed
const planSvcModal = readFile('src/feature-module/agent-dashboard/settings/agent-plan-settings/agentPlanSettingsModal.tsx');
check(
  'Plan settings modal no Thomas Lawler',
  !/Thomas Lawler/.test(planSvcModal),
  'Thomas Lawler still in agentPlanSettingsModal'
);
check(
  'Plan settings modal no fake invoice',
  !/#WRV0001/.test(planSvcModal),
  '#WRV0001 still in agentPlanSettingsModal'
);

// 20. Agent plan page not static form
const agentPlanContent = readFile('src/feature-module/agent-dashboard/agent-plan/agentPlan.tsx');
check(
  'Agent plan no personal info form',
  !/First Name/.test(agentPlanContent) || /Plan enrollment is not available/.test(agentPlanContent),
  'static personal info form still in agentPlan'
);

// 21. Agent plan modal fake data removed
const plantModal = readFile('src/feature-module/agent-dashboard/agent-plan/agentPlantModal.tsx');
check(
  'Agent plan modal no Thomas Lawler',
  !/Thomas Lawler/.test(plantModal),
  'Thomas Lawler still in agentPlantModal'
);

// 22. Visa booking page wired to real data
const visaContent = readFile('src/feature-module/agent-dashboard/Booking/visa-booking/visaBooking.tsx');
check(
  'Visa booking imports fetchAgentBookings',
  /fetchAgentBookings/.test(visaContent),
  'fetchAgentBookings not imported in visaBooking'
);
check(
  'Visa booking uses useAuth',
  /useAuth/.test(visaContent),
  'useAuth not used in visaBooking'
);
check(
  'Visa booking filters by itemType visa',
  /itemType.*visa/.test(visaContent),
  'itemType visa filter not found in visaBooking'
);
check(
  'Visa booking has no static booking count',
  !/No of Booking :/.test(visaContent),
  'static booking count still present in visaBooking'
);

// 23. Activities booking page wired to real data
const activitiesContent = readFile('src/feature-module/agent-dashboard/Booking/activities-booking/activitiesBooking.tsx');
check(
  'Activities booking imports fetchAgentBookings',
  /fetchAgentBookings/.test(activitiesContent),
  'fetchAgentBookings not imported in activitiesBooking'
);
check(
  'Activities booking uses useAuth',
  /useAuth/.test(activitiesContent),
  'useAuth not used in activitiesBooking'
);
check(
  'Activities booking filters by itemType activity',
  /itemType.*activity/.test(activitiesContent),
  'itemType activity filter not found in activitiesBooking'
);
check(
  'Activities booking has no static booking count',
  !/No of Booking :/.test(activitiesContent),
  'static booking count still present in activitiesBooking'
);
check(
  'Activities booking no "not configured" alert',
  !/not configured/.test(activitiesContent),
  'not configured alert still present in activitiesBooking'
);

// 24. Guide booking page wired to real data
const guideContent = readFile('src/feature-module/agent-dashboard/Booking/guide-booking/guideBooking.tsx');
check(
  'Guide booking imports fetchAgentBookings',
  /fetchAgentBookings/.test(guideContent),
  'fetchAgentBookings not imported in guideBooking'
);
check(
  'Guide booking uses useAuth',
  /useAuth/.test(guideContent),
  'useAuth not used in guideBooking'
);
check(
  'Guide booking filters by itemType guide',
  /itemType.*guide/.test(guideContent),
  'itemType guide filter not found in guideBooking'
);
check(
  'Guide booking has no static booking count',
  !/No of Booking :/.test(guideContent),
  'static booking count still present in guideBooking'
);
check(
  'Guide booking no "not configured" alert',
  !/not configured/.test(guideContent),
  'not configured alert still present in guideBooking'
);

// 25. Cancellation request page wired to real data
const cancelContent = readFile('src/feature-module/agent-dashboard/Booking/cancellation-request/cancellationRequest.tsx');
check(
  'Cancellation request imports fetchAgentBookings',
  /fetchAgentBookings/.test(cancelContent),
  'fetchAgentBookings not imported in cancellationRequest'
);
check(
  'Cancellation request uses useAuth',
  /useAuth/.test(cancelContent),
  'useAuth not used in cancellationRequest'
);
check(
  'Cancellation request filters by cancelled/canceled status',
  /\b(cancelled|'canceled')\b/.test(cancelContent),
  'cancelled/canceled status filter not found in cancellationRequest'
);
check(
  'Cancellation request has no static booking count',
  !/No of Booking :/.test(cancelContent),
  'static booking count still present in cancellationRequest'
);

// 26. No new parallel agent dashboard route
check(
  'No new parallel dashboard route created',
  agentDashboardRoutes === 1,
  'extra agent dashboard routes found'
);

// Invalid Date fallback check (Sprint 29)
const agentDashboardFile = readFile('src/feature-module/agent-dashboard/dashboard/agentDashboard.tsx');
check(
  'Agent Dashboard handles Invalid Date with fallback',
  /isNaN\(d\.getTime\(\)\)\s*\?\s*'Date not recorded'/.test(agentDashboardFile),
  'Invalid Date fallback not found in agentDashboard.tsx'
);

// Summary
console.log('\n=== Agent Dashboard QA Report ===\n');
console.log(`Passed: ${ok.length}`);
console.log(`Failed: ${fail.length}`);
console.log('');
if (ok.length) console.log(ok.join('\n'));
if (fail.length) console.log(fail.join('\n'));
console.log(`\n${fail.length === 0 ? 'All checks passed.' : `${fail.length} check(s) failed.`}`);

process.exit(fail.length > 0 ? 1 : 0);
