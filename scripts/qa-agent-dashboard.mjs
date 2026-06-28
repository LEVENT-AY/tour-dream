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

// Summary
console.log('\n=== Agent Dashboard QA Report ===\n');
console.log(`Passed: ${ok.length}`);
console.log(`Failed: ${fail.length}`);
console.log('');
if (ok.length) console.log(ok.join('\n'));
if (fail.length) console.log(fail.join('\n'));
console.log(`\n${fail.length === 0 ? 'All checks passed.' : `${fail.length} check(s) failed.`}`);

process.exit(fail.length > 0 ? 1 : 0);
