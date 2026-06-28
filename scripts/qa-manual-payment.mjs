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

// 1. ServiceRequestForm still exists
check(
  'ServiceRequestForm component exists',
  fileExists('src/core/common/service-request/ServiceRequestForm.tsx'),
  'ServiceRequestForm.tsx not found'
);
const srf = readFile('src/core/common/service-request/ServiceRequestForm.tsx');

// 2. Existing submit flow still writes to serviceRequests
check(
  'ServiceRequestForm imports createServiceRequest',
  /createServiceRequest/.test(srf),
  'createServiceRequest not imported'
);
check(
  'ServiceRequestForm calls createServiceRequest on submit',
  /await createServiceRequest\(/.test(srf),
  'createServiceRequest not called in submit handler'
);

// 3. Honeypot behavior remains
check(
  'Honeypot field present (_hp_name)',
  /_hp_name/.test(srf),
  'honeypot field missing'
);
check(
  'Honeypot blocks submission when filled',
  /if \(honeypot\) return/.test(srf),
  'honeypot check missing'
);

// 4. Loading/success/error states remain
check(
  'Form has submitting/loading state',
  /setSubmitting\(true\)/.test(srf),
  'loading state missing'
);
check(
  'Form has success state',
  /setSuccess/.test(srf),
  'success state missing'
);
check(
  'Form has error state',
  /setError/.test(srf),
  'error state missing'
);
check(
  'Form displays spinner when submitting',
  /spinner-border/.test(srf),
  'loading spinner display missing'
);

// 5. Public form does not include card fields
check(
  'Form has no "card number" input',
  !/card number/i.test(srf),
  'card number field found'
);
check(
  'Form has no "cvv" input',
  !/cvv/i.test(srf),
  'cvv field found'
);
check(
  'Form has no "expiry" input',
  !/expir/i.test(srf),
  'expiry field found'
);

// 6. Public form does not include Stripe/checkout/pay-now wording
check(
  'Form has no "Stripe" reference',
  !/Stripe/i.test(srf),
  'Stripe reference found'
);
check(
  'Form has no "pay now" button',
  !/Pay Now/i.test(srf),
  '"Pay Now" found'
);
check(
  'Form has no "checkout" reference',
  !/checkout/i.test(srf),
  'checkout reference found'
);
check(
  'Form has no card input fields suggesting online payment',
  !/type="text".*card/i.test(srf) && !/card.*input/i.test(srf),
  'card input field found suggesting online payment'
);

// 7. Manual payment copy exists
check(
  'Form has "Manual payment after confirmation" heading',
  /Manual payment after confirmation/.test(srf),
  'manual payment heading not found'
);
check(
  'Form has "Wafa Cash" reference',
  /Wafa Cash/.test(srf),
  'Wafa Cash not mentioned'
);
check(
  'Form has "bank transfer" reference',
  /bank transfer/.test(srf),
  'bank transfer not mentioned'
);
check(
  'Form has "No card payment is collected on the website"',
  /No card payment is collected on the website/.test(srf),
  'no-card-payment disclaimer not found'
);

// 8. Wafa Cash / bank transfer copy exists where intended
check(
  'Form mentions Wafa Cash in payment guidance',
  /Wafa Cash/.test(srf),
  'Wafa Cash not found anywhere in form'
);
check(
  'Form mentions bank transfer in payment guidance',
  /bank transfer/.test(srf),
  'bank transfer not found anywhere in form'
);

// 9. preferredPaymentMethod is optional
check(
  'Form has preferredPaymentMethod select',
  /preferredPaymentMethod/.test(srf),
  'preferredPaymentMethod not found in form'
);
check(
  'Preferred payment method is labelled optional',
  /optional/.test(srf),
  'optional label not found'
);
check(
  'No validation blocks submission without payment method',
  !/preferredPaymentMethod.*required/.test(srf) && !/preferredPaymentMethod.*must/.test(srf),
  'validation appears to require payment method'
);

// 10. No receipt file upload was added
check(
  'Form has no file upload input',
  !/type="file"/.test(srf),
  'file upload input found'
);
check(
  'Form has no "upload" text',
  !/upload/i.test(srf),
  'upload reference found'
);

// 11. Firestore rules were not modified
const rulesContent = readFile('firestore.rules');
check(
  'Firestore rules file exists',
  rulesContent.length > 0,
  'firestore.rules not found'
);
check(
  'Firestore rules has no "preferredPaymentMethod" reference',
  !/preferredPaymentMethod/.test(rulesContent),
  'rules were modified to add payment fields'
);
check(
  'Firestore rules has no "paymentFlow" reference',
  !/paymentFlow/.test(rulesContent),
  'rules were modified to add payment fields'
);
// Extract only the serviceRequests section of the rules
const srMatch = rulesContent.match(/\/\/ ---------- Service Requests ----------[\s\S]*?(?=\/\/ ----------|match \/)/);
const srRules = srMatch ? srMatch[0] : '';
check(
  'Firestore rules serviceRequests section has no "paymentStatus" reference',
  !/paymentStatus/.test(srRules),
  'rules serviceRequests section was modified to add paymentStatus'
);

// 12. Storage rules were not modified
const storageRules = readFile('storage.rules');
check(
  'Storage rules file exists',
  existsSync(resolve(root, 'storage.rules')),
  'storage.rules not found'
);
const storageStr = readFile('storage.rules');
check(
  'Storage rules unchanged (no receipt/upload references)',
  !/receipt/i.test(storageStr) && !/payment/i.test(storageStr),
  'storage rules appear to reference payment/receipt'
);

// 13. Payment/checkout gateway files were not added
const paymentDirs = [
  'src/feature-module/checkout',
  'src/feature-module/payment',
  'src/feature-module/payment-gateway',
  'src/feature-module/stripe',
];
paymentDirs.forEach((d) => {
  check(
    `Payment directory "${d}" does not exist`,
    !existsSync(resolve(root, d)),
    `${d} directory was created`
  );
});

// 14. Existing marketplace discovery still uses fetchCruises/fetchBuses/fetchVisas/fetchGuides
const featuredSvc = readFile('src/feature-module/home/components/FeaturedServices.tsx');
if (featuredSvc) {
  check(
    'FeaturedServices imports fetchCruises',
    /fetchCruises/.test(featuredSvc),
    'fetchCruises import missing'
  );
  check(
    'FeaturedServices imports fetchBuses',
    /fetchBuses/.test(featuredSvc),
    'fetchBuses import missing'
  );
  check(
    'FeaturedServices imports fetchVisas',
    /fetchVisas/.test(featuredSvc),
    'fetchVisas import missing'
  );
  check(
    'FeaturedServices imports fetchGuides',
    /fetchGuides/.test(featuredSvc),
    'fetchGuides import missing'
  );
}

// 15. Public detail links still use ?id=
const cruiseDetails = readFile('src/feature-module/curise/curise-details/FirestoreCruiseDetails.tsx');
if (cruiseDetails) {
  check(
    'Cruise details uses ?id= in URL search params',
    /searchParams/.test(cruiseDetails) || /\?id=/.test(cruiseDetails),
    'Cruise details does not use ?id='
  );
}

// 16. Admin Bookings/CRM core behavior was not redesigned
const adminBookings = readFile('src/feature-module/admin-dashboard/pages/bookings.tsx');
check(
  'Admin Bookings still imports fetchServiceRequests',
  /fetchServiceRequests/.test(adminBookings),
  'fetchServiceRequests import missing from Admin Bookings'
);
check(
  'Admin Bookings still has status tabs',
  /STATUS_OPTIONS/.test(adminBookings),
  'status tabs missing from Admin Bookings'
);
check(
  'Admin Bookings still has assignment filter',
  /assignmentFilter/.test(adminBookings),
  'assignment filter missing from Admin Bookings'
);
check(
  'Admin Bookings still has detail modal',
  /selectedRequest/.test(adminBookings),
  'detail modal state missing'
);
check(
  'Admin Bookings still has delete functionality',
  /deleteServiceRequest/.test(adminBookings),
  'delete function missing'
);
check(
  'Admin Bookings still has CSV export',
  /exportCSV/.test(adminBookings),
  'CSV export missing'
);

// 17. Agent Dashboard routes still exist
const routesContent = readFile('src/feature-module/router/all_routes.tsx');
check(
  'Agent dashboard route still exists',
  /agentDashboard/.test(routesContent),
  'agentDashboard route missing'
);

// 18. Payment info shown in admin modal (read-only) if fields present
check(
  'Admin modal has Payment Info section for paymentFlow',
  /paymentFlow/.test(adminBookings),
  'paymentFlow display not found in admin modal'
);
check(
  'Admin modal has Payment Info section for preferredPaymentMethod',
  /preferredPaymentMethod/.test(adminBookings),
  'preferredPaymentMethod display not found in admin modal'
);
check(
  'Admin modal Payment Info is read-only (no inputs)',
  !/modal.*paymentMethod.*form-select/.test(adminBookings) && !/modal.*paymentFlow.*input/.test(adminBookings),
  'payment info appears editable'
);

// 19. ServiceRequest type has new fields
const svcContent = readFile('src/core/services/firebaseServices.ts');
check(
  'ServiceRequest type has paymentFlow',
  /paymentFlow\?.*:.*"manual"/.test(svcContent),
  'paymentFlow field not found in ServiceRequest type'
);
check(
  'ServiceRequest type has paymentStatus',
  /paymentStatus\?.*:.*ManualPaymentStatus/.test(svcContent),
  'paymentStatus field not found in ServiceRequest type'
);
check(
  'ServiceRequest type has preferredPaymentMethod',
  /preferredPaymentMethod\?.*:.*PreferredPaymentMethod/.test(svcContent),
  'preferredPaymentMethod field not found in ServiceRequest type'
);
check(
  'PreferredPaymentMethod type includes wafa_cash',
  /wafa_cash/.test(svcContent),
  'wafa_cash not in PreferredPaymentMethod type'
);
check(
  'PreferredPaymentMethod type includes bank_transfer',
  /bank_transfer/.test(svcContent),
  'bank_transfer not in PreferredPaymentMethod type'
);

// 20. createServiceRequest populates payment fields
check(
  'createServiceRequest sets paymentFlow to "manual"',
  /paymentFlow.*manual/.test(svcContent),
  'paymentFlow not set in createServiceRequest'
);
check(
  'createServiceRequest sets paymentStatus to "not_requested"',
  /paymentStatus.*not_requested/.test(svcContent),
  'paymentStatus not set in createServiceRequest'
);

// Summary
console.log('\n=== Manual Payment QA Report ===\n');
console.log(`Passed: ${ok.length}`);
console.log(`Failed: ${fail.length}`);
console.log('');
if (ok.length) console.log(ok.join('\n'));
if (fail.length) console.log(fail.join('\n'));
console.log(`\n${fail.length === 0 ? 'All checks passed.' : `${fail.length} check(s) failed.`}`);

process.exit(fail.length > 0 ? 1 : 0);
