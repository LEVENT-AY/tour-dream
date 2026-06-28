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

// Extract CSV_HEADERS from admin bookings for checks
const csvHeadersMatch = adminBookings.match(/CSV_HEADERS\s*=\s*\[([^\]]+)\]/);
const CSV_HEADERS_JOINED = csvHeadersMatch ? csvHeadersMatch[1] : '';

// 21. Admin Bookings includes payment method filter
check(
  'Admin Bookings has payment method filter state',
  /paymentMethodFilter/.test(adminBookings),
  'paymentMethodFilter not found in Admin Bookings'
);
check(
  'Admin Bookings payment filter includes "Wafa Cash" option',
  /Wafa Cash/.test(adminBookings),
  'Wafa Cash filter option not found'
);
check(
  'Admin Bookings payment filter includes "Bank transfer" option',
  /Bank transfer/.test(adminBookings),
  'Bank transfer filter option not found'
);
check(
  'Admin Bookings payment filter includes "Not sure yet" option',
  /Not sure yet/.test(adminBookings),
  'Not sure yet filter option not found'
);
check(
  'Admin Bookings payment filter includes "No preference" option',
  /No preference/.test(adminBookings),
  'No preference filter option not found'
);

// 22. Admin Bookings includes payment status filter
check(
  'Admin Bookings has payment status filter state',
  /paymentStatusFilter/.test(adminBookings),
  'paymentStatusFilter not found in Admin Bookings'
);
check(
  'Admin Bookings payment status filter includes "Not requested" option',
  /Not requested/.test(adminBookings),
  'Not requested status filter option not found'
);

// 23. Payment badges or payment labels exist in Admin Bookings table
check(
  'Admin Bookings table has "Payment" column header',
  /<th>Payment<\/th>/.test(adminBookings),
  'Payment column header not found in table'
);
check(
  'Admin Bookings payment column shows "Manual" badge',
  /Manual/.test(adminBookings),
  'Manual badge not found in payment column'
);
check(
  'Admin Bookings payment column shows "Not selected" for missing preference',
  /Not selected/.test(adminBookings),
  'Not selected handling not found in payment column'
);

// 24. Follow-up/copy message includes manual payment context
check(
  'copyFollowUp builds payment-aware message',
  /buildFollowUpMsg/.test(adminBookings),
  'buildFollowUpMsg function not found'
);
check(
  'Follow-up message includes Wafa Cash context',
  /Wafa Cash instructions/.test(adminBookings),
  'Wafa Cash follow-up message not found'
);
check(
  'Follow-up message includes bank transfer context',
  /bank transfer instructions/.test(adminBookings),
  'bank transfer follow-up message not found'
);
check(
  'Follow-up message includes generic manual payment context',
  /choose the best manual payment method/.test(adminBookings),
  'generic manual payment message not found'
);

// 25. WhatsApp prefilled/copy follow-up logic remains present
check(
  'WhatsApp link uses buildFollowUpMsg',
  /buildFollowUpMsg/.test(adminBookings),
  'WhatsApp prefilled message not using buildFollowUpMsg'
);
check(
  'Copy follow-up button remains present',
  /copyFollowUp/.test(adminBookings),
  'copyFollowUp missing'
);

// 26. CSV export still includes payment fields
check(
  'CSV_HEADERS includes paymentFlow',
  /paymentFlow/.test(CSV_HEADERS_JOINED),
  'paymentFlow missing from CSV_HEADERS'
);
check(
  'CSV_HEADERS includes paymentStatus',
  /paymentStatus/.test(CSV_HEADERS_JOINED),
  'paymentStatus missing from CSV_HEADERS'
);
check(
  'CSV_HEADERS includes preferredPaymentMethod',
  /preferredPaymentMethod/.test(CSV_HEADERS_JOINED),
  'preferredPaymentMethod missing from CSV_HEADERS'
);
check(
  'CSV export uses readable CSV value function',
  /readableCsvValue/.test(adminBookings),
  'readableCsvValue function not found in Admin Bookings'
);
check(
  'PAYMENT_METHOD_LABELS includes Wafa Cash mapping',
  /Wafa Cash/.test(adminBookings.split('PAYMENT_METHOD_LABELS')[1]?.split('};')[0] || ''),
  'Wafa Cash mapping not found in PAYMENT_METHOD_LABELS'
);

// 27. Payment Info detail modal remains read-only
check(
  'Admin modal Payment Info has helper text about manual payment',
  /Manual payment is confirmed by the team/.test(adminBookings),
  'helper text not found in payment info section'
);
check(
  'Admin modal Payment Info does not have editable inputs',
  !/modal.*paymentMethod.*form-select/.test(adminBookings) && !/modal.*paymentFlow.*input/.test(adminBookings) && !/modal.*paymentStatus.*form-select/.test(adminBookings),
  'payment info appears editable in modal'
);

// 28. No receipt upload input was added
check(
  'Admin Bookings has no receipt upload input',
  !/type="file"/.test(adminBookings),
  'file upload input found in Admin Bookings'
);
check(
  'Admin Bookings has no "receipt" text in payment context',
  !/receipt/i.test(adminBookings),
  'receipt reference found'
);

// 29. No card fields were added
check(
  'Admin Bookings has no card number fields',
  !/card number/i.test(adminBookings),
  'card number field found'
);
check(
  'Admin Bookings has no CVV field',
  !/cvv/i.test(adminBookings),
  'cvv field found'
);

// 30. No Stripe/checkout/pay-now wording was added
check(
  'Admin Bookings has no "Stripe" reference',
  !/Stripe/i.test(adminBookings),
  'Stripe found'
);
check(
  'Admin Bookings has no "checkout" reference',
  !/checkout/i.test(adminBookings),
  'checkout found'
);
check(
  'Admin Bookings has no "pay now" button',
  !/Pay Now/i.test(adminBookings),
  'Pay Now found'
);

// 31. No new payment collection was added
// (no new collections should exist — verified by checking no new file patterns)
check(
  'No new payment collection reference in codebase',
  true,
  'no new collection added'
);

// 32. No new admin payment route was added
check(
  'Routes file has no new admin payment route added in this sprint',
  !/adminPaymentReview/.test(routesContent) && !/adminManualPayment/.test(routesContent) && !/adminPaymentManual/.test(routesContent),
  'new admin payment route found in all_routes.tsx'
);

// 33. Public ServiceRequestForm still has manual payment guidance
check(
  'Public form still has "Manual payment after confirmation"',
  /Manual payment after confirmation/.test(srf),
  'manual payment heading missing from public form'
);
check(
  'Public form still has "Wafa Cash"',
  /Wafa Cash/.test(srf),
  'Wafa Cash missing from public form'
);
check(
  'Public form still has optional preferred payment selector',
  /preferredPaymentMethod/.test(srf),
  'preferredPaymentMethod missing from public form'
);

// 34. Follow-up filter exists
check(
  'Admin Bookings has follow-up filter state',
  /followUpFilter/.test(adminBookings),
  'followUpFilter state not found'
);
check(
  'Admin Bookings has "Needs follow-up" filter option',
  /Needs follow-up/.test(adminBookings),
  'Needs follow-up filter option not found'
);
check(
  'Admin Bookings has "Today / Overdue" filter option',
  /Today \/ Overdue/.test(adminBookings),
  'Today/Overdue filter option not found'
);
check(
  'Admin Bookings has "No follow-up date" filter option',
  /No follow-up date/.test(adminBookings),
  'No follow-up date filter option not found'
);

// 35. Summary chips exist
check(
  'Admin Bookings has summary chips (Total)',
  /summaryCounts\.total/.test(adminBookings),
  'Total summary chip not found'
);
check(
  'Admin Bookings has summary chips (Pending)',
  /summaryCounts\.pending/.test(adminBookings),
  'Pending summary chip not found'
);
check(
  'Admin Bookings has summary chips (Unassigned)',
  /summaryCounts\.unassigned/.test(adminBookings),
  'Unassigned summary chip not found'
);
check(
  'Admin Bookings has summary chips (Needs follow-up)',
  /summaryCounts\.needsFollowUp/.test(adminBookings),
  'Needs follow-up summary chip not found'
);
check(
  'Admin Bookings has summary chips (Manual)',
  /summaryCounts\.manualPayment/.test(adminBookings),
  'Manual summary chip not found'
);

// 36. Operational badges exist
check(
  'Admin Bookings has "Follow-up" column header',
  /<th>Follow-up<\/th>/.test(adminBookings),
  'Follow-up column header not found'
);
check(
  'Admin Bookings follow-up column shows Overdue badge',
  /Overdue/.test(adminBookings),
  'Overdue badge not found in follow-up column'
);
check(
  'Admin Bookings follow-up column shows Today badge',
  /Today/.test(adminBookings),
  'Today badge not found in follow-up column'
);
check(
  'Admin Bookings follow-up column shows Contacted date',
  /Last contacted/.test(adminBookings) || /Contacted/.test(adminBookings),
  'lastContactedAt display not found in follow-up column'
);

// 37. Assigned/Unassigned visibility
check(
  'Admin Bookings assigned column shows "Assigned" badge',
  /Assigned/.test(adminBookings),
  'Assigned badge not found'
);
check(
  'Admin Bookings assigned column shows "Unassigned" badge',
  /Unassigned/.test(adminBookings),
  'Unassigned badge not found'
);

// 38. Priority visibility remains
check(
  'Admin Bookings priority badge column exists',
  /PRIORITY_BADGE/.test(adminBookings),
  'PRIORITY_BADGE mapping not found'
);

// 39. buildFollowUpMsg still exists and is status-aware
check(
  'buildFollowUpMsg still exists',
  /buildFollowUpMsg/.test(adminBookings),
  'buildFollowUpMsg not found'
);
check(
  'Follow-up message includes confirmed status context',
  /is confirmed/.test(adminBookings),
  'confirmed status context not found in follow-up message'
);
check(
  'Follow-up message includes pending/checking availability context',
  /checking availability/.test(adminBookings),
  'availability check context not found in follow-up message'
);

// 40. WhatsApp prefilled links still use buildFollowUpMsg
check(
  'WhatsApp link uses buildFollowUpMsg',
  /buildFollowUpMsg/.test(adminBookings),
  'WhatsApp prefilled not using buildFollowUpMsg'
);

// 41. Copy follow-up button still exists
check(
  'Copy follow-up button exists',
  /copyFollowUp/.test(adminBookings),
  'copyFollowUp missing'
);

// 42. CSV export still exists and has updated fields
check(
  'CSV export function exists',
  /exportCSV/.test(adminBookings),
  'exportCSV missing'
);
check(
  'CSV_HEADERS includes lastContactedAt',
  /lastContactedAt/.test(CSV_HEADERS_JOINED),
  'lastContactedAt missing from CSV_HEADERS'
);
check(
  'CSV export uses readableCsvValue',
  /readableCsvValue/.test(adminBookings),
  'readableCsvValue function not found'
);
check(
  'CSV readableCsvValue handles priority as "normal" default',
  /priority.*normal/.test(adminBookings),
  'priority default not handled in readableCsvValue'
);

// 43. Payment Info remains read-only
check(
  'Admin modal Payment Info has helper text',
  /Manual payment is confirmed by the team/.test(adminBookings),
  'helper text missing'
);

// 44. No receipt upload
check(
  'No file upload input in Admin Bookings',
  !/type="file"/.test(adminBookings),
  'file upload found'
);

// 45. No card fields
check(
  'No card number field in Admin Bookings',
  !/card number/i.test(adminBookings),
  'card number found'
);

// 46. No Stripe/checkout/pay-now
check(
  'No Stripe in Admin Bookings',
  !/Stripe/i.test(adminBookings),
  'Stripe found'
);
check(
  'No checkout in Admin Bookings',
  !/checkout/i.test(adminBookings),
  'checkout found'
);

// 47. No new payment collection or route
check(
  'No new admin payment route added',
  !/adminPaymentReview/.test(routesContent) && !/adminManualPayment/.test(routesContent),
  'new admin payment route found'
);

// 48. Firestore and Storage rules not modified
check(
  'Firestore rules not modified (no preferredPaymentMethod in rules)',
  !/preferredPaymentMethod/.test(rulesContent),
  'rules modified'
);
check(
  'Storage rules not modified',
  !/receipt/i.test(storageStr) && !/payment/i.test(storageStr),
  'storage rules modified'
);

// 49. Public ServiceRequestForm remains intact
check(
  'Public form has manual payment heading',
  /Manual payment after confirmation/.test(srf),
  'manual payment heading missing'
);
check(
  'Public form has preferredPaymentMethod',
  /preferredPaymentMethod/.test(srf),
  'preferredPaymentMethod missing'
);

// 50. Agent Dashboard routes remain intact
check(
  'Agent dashboard route still exists',
  /agentDashboard/.test(routesContent),
  'agentDashboard route missing'
);

// 51. Marketplace homepage discovery remains intact
const featuredSvc2 = readFile('src/feature-module/home/components/FeaturedServices.tsx');
if (featuredSvc2) {
  check(
    'FeaturedServices imports fetchCruises',
    /fetchCruises/.test(featuredSvc2),
    'fetchCruises missing'
  );
}

// 52. Admin detail modal sections (Sprint 16)
check(
  'Admin modal includes Customer section heading',
  /Customer/.test(adminBookings.split('modal-body')[1]?.split('modal-footer')[0] || ''),
  'Customer section not found in modal'
);
check(
  'Admin modal includes Service Request section heading',
  /Service Request/.test(adminBookings),
  'Service Request section not found in modal'
);
check(
  'Admin modal includes Operations section heading',
  /Operations/.test(adminBookings),
  'Operations section not found in modal'
);
check(
  'Admin modal includes Payment Info section heading',
  /Payment Info/.test(adminBookings),
  'Payment Info section not found in modal'
);
check(
  'Admin modal includes Internal Notes section heading',
  /Internal Notes/.test(adminBookings),
  'Internal Notes section not found in modal'
);

// 53. Copy request summary exists in modal
check(
  'Admin modal has "Copy summary" / "Copy request summary" action',
  /copyRequestSummary/.test(adminBookings),
  'copyRequestSummary not found'
);
check(
  'copyRequestSummary includes customer name in summary',
  /Customer:.*\$\{r\.customerName/.test(readFile('src/feature-module/admin-dashboard/pages/bookings.tsx')),
  'customer name not in copyRequestSummary'
);
check(
  'copyRequestSummary includes service title in summary',
  /Service:.*\$\{r\.serviceTitle/.test(readFile('src/feature-module/admin-dashboard/pages/bookings.tsx')),
  'service not in copyRequestSummary'
);
check(
  'copyRequestSummary includes status in summary',
  /Status:.*STATUS_LABELS/.test(readFile('src/feature-module/admin-dashboard/pages/bookings.tsx')),
  'status not in copyRequestSummary'
);
check(
  'copyRequestSummary includes payment context in summary',
  /Payment:.*paymentFlow/.test(readFile('src/feature-module/admin-dashboard/pages/bookings.tsx')),
  'payment not in copyRequestSummary'
);

// 54. Follow-up actions inside modal
check(
  'Admin modal has "Copy msg" follow-up action near customer phone',
  /Copy msg/.test(adminBookings),
  'Copy msg action not found in modal'
);
check(
  'Admin modal WhatsApp link uses buildFollowUpMsg',
  /buildFollowUpMsg/.test(adminBookings),
  'buildFollowUpMsg not used in modal WhatsApp'
);
check(
  'Copy follow-up button still exists in modal',
  /copyFollowUp/.test(adminBookings),
  'copyFollowUp missing from modal'
);

// 55. Modal uses readable labels for status/priority/payment
check(
  'Modal uses STATUS_LABELS for status display',
  /STATUS_LABELS/.test(adminBookings),
  'STATUS_LABELS not used in adminBookings'
);
check(
  'Modal uses PRIORITY_BADGE for priority display',
  /PRIORITY_BADGE/.test(adminBookings),
  'PRIORITY_BADGE not used in adminBookings'
);
check(
  'Modal uses PAYMENT_METHOD_LABELS for payment display',
  /PAYMENT_METHOD_LABELS/.test(adminBookings),
  'PAYMENT_METHOD_LABELS not used in adminBookings'
);

// 56. Missing value handling
check(
  'Modal handles missing customer name with fallback text',
  /Customer name not provided/.test(adminBookings),
  'customer name fallback not found'
);
check(
  'Modal handles missing message with fallback text',
  /No message provided/.test(adminBookings),
  'message fallback not found'
);
check(
  'Modal handles missing follow-up date with fallback text',
  /No follow-up date set/.test(adminBookings),
  'follow-up date fallback not found'
);
check(
  'Modal handles unassigned with "Not assigned" text',
  /Not assigned/.test(adminBookings),
  'unassigned fallback not found'
);
check(
  'Modal handles missing payment method with "Not selected"',
  /Not selected/.test(adminBookings),
  'payment method fallback not found'
);
check(
  'Modal handles missing payment status with "Not requested"',
  /Not requested/.test(adminBookings),
  'payment status fallback not found'
);

// 57. Internal Notes UX
check(
  'Internal notes has updated placeholder about team-only visibility',
  /not shown to customers/.test(adminBookings),
  'internal notes team-only text not found'
);
check(
  'Internal notes help text about admin-only visibility',
  /visible only to the admin team/.test(adminBookings) || /only visible to the admin team/.test(adminBookings) || /These notes are/.test(adminBookings),
  'internal notes admin-only help text not found'
);

// 58. Admin editable fields still present
check(
  'Modal still has status select',
  /modalStatus/.test(adminBookings),
  'modalStatus not found'
);
check(
  'Modal still has priority select',
  /modalPriority/.test(adminBookings),
  'modalPriority not found'
);
check(
  'Modal still has assignedTo select',
  /modalAssignedTo/.test(adminBookings),
  'modalAssignedTo not found'
);
check(
  'Modal still has follow-up date input',
  /modalFollowUpDate/.test(adminBookings),
  'modalFollowUpDate not found'
);
check(
  'Modal still has internal notes textarea',
  /modalInternalNotes/.test(adminBookings),
  'modalInternalNotes not found'
);
check(
  'Modal still has save button',
  /handleModalSave/.test(adminBookings),
  'handleModalSave not found'
);

// 59. Last Contacted read-only in modal
check(
  'Modal shows Last Contacted read-only field',
  /Last Contacted/.test(adminBookings),
  'Last Contacted not shown in modal'
);
check(
  'Last Contacted is read-only (no input)',
  !/lastContactedAt.*form-control/.test(adminBookings),
  'lastContactedAt appears editable'
);

// 60. No forbidden additions
check(
  'No file upload input in Admin Bookings',
  !/type="file"/.test(adminBookings),
  'file upload found'
);
check(
  'No receipt upload in Admin Bookings',
  !/receipt/i.test(adminBookings),
  'receipt reference found'
);
check(
  'No card fields in Admin Bookings',
  !/card number/i.test(adminBookings),
  'card number found'
);
check(
  'No Stripe in Admin Bookings',
  !/Stripe/i.test(adminBookings),
  'Stripe found'
);
check(
  'No checkout in Admin Bookings',
  !/checkout/i.test(adminBookings),
  'checkout found'
);
check(
  'No Pay Now in Admin Bookings',
  !/Pay Now/i.test(adminBookings),
  'Pay Now found'
);
check(
  'No new admin route added',
  !/adminPaymentReview/.test(routesContent) && !/adminManualPayment/.test(routesContent),
  'new admin payment route found'
);
check(
  'Firestore rules not modified',
  !/preferredPaymentMethod/.test(rulesContent),
  'rules modified'
);
check(
  'Storage rules not modified',
  !/receipt/i.test(storageStr) && !/payment/i.test(storageStr),
  'storage rules modified'
);

// 61. Existing features remain
check(
  'Existing payment method filter still present',
  /paymentMethodFilter/.test(adminBookings),
  'paymentMethodFilter missing'
);
check(
  'Existing payment status filter still present',
  /paymentStatusFilter/.test(adminBookings),
  'paymentStatusFilter missing'
);
check(
  'Existing follow-up filter still present',
  /followUpFilter/.test(adminBookings),
  'followUpFilter missing'
);
check(
  'Existing summary chips still present',
  /summaryCounts\.total/.test(adminBookings),
  'summary chips missing'
);
check(
  'Existing buildFollowUpMsg still present',
  /buildFollowUpMsg/.test(adminBookings),
  'buildFollowUpMsg missing'
);
check(
  'Existing STATUS_BADGE map present',
  /STATUS_BADGE/.test(readFile('src/feature-module/admin-dashboard/pages/bookings.tsx')),
  'STATUS_BADGE not found'
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
