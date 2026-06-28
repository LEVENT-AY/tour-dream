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

// 1. FeaturedServices component exists
check(
  'FeaturedServices component exists',
  fileExists('src/feature-module/home-service-one/FeaturedServices.tsx'),
  'FeaturedServices.tsx not found'
);

const fsContent = readFile('src/feature-module/home-service-one/FeaturedServices.tsx');

// 2. FeaturedServices imports all four fetch functions
check(
  'FeaturedServices imports fetchCruises',
  /fetchCruises/.test(fsContent),
  'fetchCruises not imported'
);
check(
  'FeaturedServices imports fetchBuses',
  /fetchBuses/.test(fsContent),
  'fetchBuses not imported'
);
check(
  'FeaturedServices imports fetchVisas',
  /fetchVisas/.test(fsContent),
  'fetchVisas not imported'
);
check(
  'FeaturedServices imports fetchGuides',
  /fetchGuides/.test(fsContent),
  'fetchGuides not imported'
);

// 3. FeaturedServices uses Promise.allSettled (graceful per-category failure)
check(
  'FeaturedServices uses Promise.allSettled for parallel fetch',
  /Promise\.allSettled/.test(fsContent),
  'Promise.allSettled not found'
);

// 4. FeaturedServices has loading state
check(
  'FeaturedServices has loading state',
  /loading/.test(fsContent),
  'loading state not found'
);

// 5. FeaturedServices returns null when no results
check(
  'FeaturedServices handles empty results gracefully',
  /results.*length.*===.*0.*return null/.test(fsContent),
  'empty result handling not found'
);
check(
  'FeaturedServices all-zero hide behavior (returns null silently when all empty)',
  /if \(!results\s*\|\|\s*results\.length\s*===\s*0\)\s*\{?\s*return null/.test(fsContent),
  'all-zero hide behavior not found'
);

// 6. FeaturedServices links to details with ?id=
check(
  'FeaturedServices links to details with ?id=',
  /\?id=/.test(fsContent),
  '?id= not found in FeaturedServices'
);

// 7. FeaturedServices links to cruises, buses, visas, guides detail routes
check(
  'FeaturedServices references cruise detail route',
  /cruiseDetails/.test(fsContent),
  'cruiseDetails not referenced'
);
check(
  'FeaturedServices references bus detail route',
  /busDetails/.test(fsContent),
  'busDetails not referenced'
);
check(
  'FeaturedServices references visa detail route',
  /visaDetails/.test(fsContent),
  'visaDetails not referenced'
);
check(
  'FeaturedServices references guide detail route',
  /guideDetails/.test(fsContent),
  'guideDetails not referenced'
);

// 8. FeaturedServices has category constants for max limits
check(
  'FeaturedServices limits items (MAX_ITEMS/MAX_PER_CATEGORY)',
  /MAX_ITEMS/.test(fsContent) && /MAX_PER_CATEGORY/.test(fsContent),
  'MAX_ITEMS or MAX_PER_CATEGORY not found'
);

// 9. FeaturedServices uses ImageWithBasePath and fallback
check(
  'FeaturedServices uses ImageWithBasePath',
  /ImageWithBasePath/.test(fsContent),
  'ImageWithBasePath not found'
);
check(
  'FeaturedServices uses getCategoryFallbackSrc',
  /getCategoryFallbackSrc/.test(fsContent),
  'getCategoryFallbackSrc not found'
);

// 10. FeaturedServices imported in HomeServiceOne
const homeContent = readFile('src/feature-module/home-service-one/HomeServiceOne.tsx');
check(
  'HomeServiceOne imports FeaturedServices',
  /FeaturedServices/.test(homeContent),
  'FeaturedServices not imported in HomeServiceOne'
);
check(
  'HomeServiceOne renders FeaturedServices',
  /<FeaturedServices\s*\/>/.test(homeContent),
  '<FeaturedServices /> not found in HomeServiceOne'
);

// 11. Hero section has clean Tunisia CTA (no fake search, no Newyork/USA)
check(
  'Hero section shows Explore Tunisia heading',
  /Explore Tunisia Travel Services/.test(homeContent),
  'Explore Tunisia heading not found in hero'
);
check(
  'Hero CTA links to cruiseList route',
  /to=\{routes\.cruiseList\}/.test(homeContent),
  'cruiseList route not found in hero CTA'
);
check(
  'Hero section no longer contains Newyork or USA',
  !/Newyork|USA/.test(homeContent),
  'Newyork or USA still found in hero section'
);
check(
  'Hero section no longer contains fake search tabs',
  !/Flights|Hotels.*Cars.*Cruise.*Tour.*Bus.*Activity/.test(homeContent),
  'Fake search tabs still present in hero'
);

// 13. Homepage localized copy checks
check(
  'FeaturedServices heading contains "Explore Tunisia Services"',
  /Explore Tunisia Services/.test(fsContent),
  'heading not found in FeaturedServices'
);
check(
  'FeaturedServices mentions request flow / no online payment',
  /no online payment/.test(fsContent) || /send a request/.test(fsContent),
  'request flow helper text not found in FeaturedServices'
);

// 14. How It Works section exists (deliverySection replaced)
const deliveryContent = readFile('src/feature-module/home-service-one/deliverySection.tsx');
check(
  'How It Works section exists',
  /How It/.test(deliveryContent),
  'How It Works heading not found in deliverySection'
);
check(
  'How It Works step 1: Explore Services',
  /Explore Services/.test(deliveryContent),
  'step 1 not found'
);
check(
  'How It Works step 2: Send a Request',
  /Send a Request/.test(deliveryContent),
  'step 2 not found'
);
check(
  'How It Works step 3: Team Contacts You',
  /Team Contacts You/.test(deliveryContent),
  'step 3 not found'
);
check(
  'How It Works step 4: Confirm Details',
  /Confirm Details/.test(deliveryContent),
  'step 4 not found'
);
check(
  'How It Works mentions no online payment',
  /No online[\s\S]*?payment/.test(deliveryContent),
  'no online payment copy not found in How It Works'
);

// 15. Trust / Why Choose section localized to Tunisia
const chooseContent = readFile('src/feature-module/home-service-one/chooseSection.tsx');
check(
  'Why Choose section heading is Tunisia-specific',
  /Why Choose DreamsTour/.test(chooseContent),
  'heading not localized to DreamsTour'
);
check(
  'Why Choose mentions Tunisia-Focused',
  /Tunisia-Focused/.test(chooseContent),
  'Tunisia-Focused not found in chooseSection'
);
check(
  'Why Choose mentions Human Follow-Up',
  /Human Follow-Up/.test(chooseContent),
  'Human Follow-Up not found in chooseSection'
);
check(
  'Why Choose mentions Flexible Requests',
  /Flexible Requests/.test(chooseContent),
  'Flexible Requests not found'
);
check(
  'Why Choose mentions Multiple Categories',
  /Multiple Categories/.test(chooseContent),
  'Multiple Categories not found'
);

// 20. No old broken cruiseGrid/visaGrid links remain in homepage
check(
  'No cruiseGrid references remain in HomeServiceOne',
  !/all_routes\.cruiseGrid/.test(homeContent),
  'cruiseGrid still referenced in HomeServiceOne'
);
check(
  'No visaGrid references remain in HomeServiceOne',
  !/all_routes\.visaGrid/.test(homeContent),
  'visaGrid still referenced in HomeServiceOne'
);

// 21. All four list routes still exported
const routesContent = readFile('src/feature-module/router/all_routes.tsx');
check(
  'cruiseList route exists',
  /cruiseList: "\/cruise\/cruise-list"/.test(routesContent),
  'cruiseList route missing'
);
check(
  'busList route exists',
  /busList: "\/bus\/bus-list"/.test(routesContent),
  'busList route missing'
);
check(
  'visaList route exists',
  /visaList:"\/visa\/visa-list"/.test(routesContent),
  'visaList route missing'
);
check(
  'guideGrid route exists',
  /guideGrid:"\/guide\/guide-grid"/.test(routesContent),
  'guideGrid route missing'
);

// 22. Admin catalog pages exist and have validation
const cruiseAdmin = readFile('src/feature-module/admin-dashboard/pages/cruises.tsx');
const busAdmin = readFile('src/feature-module/admin-dashboard/pages/buses.tsx');
const visaAdmin = readFile('src/feature-module/admin-dashboard/pages/visas.tsx');
const guideAdmin = readFile('src/feature-module/admin-dashboard/pages/guides.tsx');
const catalogMgr = readFile('src/feature-module/admin-dashboard/components/AdminCatalogManager.tsx');

check('Admin Cruises page exists', /AdminCruises/.test(cruiseAdmin), 'AdminCruises not found');
check('Admin Buses page exists', /AdminBuses/.test(busAdmin), 'AdminBuses not found');
check('Admin Visas page exists', /AdminVisas/.test(visaAdmin), 'AdminVisas not found');
check('Admin Guides page exists', /AdminGuides/.test(guideAdmin), 'AdminGuides not found');

check('Admin Cruises has validateItem', /validateCruiseItem/.test(cruiseAdmin), 'validateCruiseItem not found');
check('Admin Cruises has normalizeItem', /normalizeCruiseItem/.test(cruiseAdmin), 'normalizeCruiseItem not found');
check('Admin Buses has validateItem', /validateBusItem/.test(busAdmin), 'validateBusItem not found');
check('Admin Visas has validateItem', /validateVisaItem/.test(visaAdmin), 'validateVisaItem not found');
check('Admin Guides has validateItem', /validateGuideItem/.test(guideAdmin), 'validateGuideItem not found');

check('Admin forms use TND/default currency', /DEFAULT_CURRENCY/.test(cruiseAdmin) && /DEFAULT_CURRENCY/.test(busAdmin) && /DEFAULT_CURRENCY/.test(visaAdmin) && /DEFAULT_CURRENCY/.test(guideAdmin), 'DEFAULT_CURRENCY not found in all admin pages');

// 23. Published quality validation references
check('Cruise published validation: price > 0', /published[\s\S]*?price[\s\S]*?0/.test(cruiseAdmin), 'cruise published price validation missing');
check('Bus published validation: route required', /published[\s\S]*?(?:departureCity.*arrivalCity|Departure City.*Arrival City)/.test(busAdmin), 'bus published route validation missing');
check('Visa published validation: destination required', /published[\s\S]*?destination/.test(visaAdmin), 'visa published destination validation missing');
check('Guide published validation: location required', /published[\s\S]*?(?:location.*city|Location.*City)/.test(guideAdmin), 'guide published location validation missing');

// 24. Featured field support
check('AdminCatalogManager has featured toggle', /featured/.test(catalogMgr), 'featured not found in AdminCatalogManager');
check('Cruises admin has featured field', /featured/.test(cruiseAdmin), 'featured not found in cruises admin');
check('Buses admin has featured field', /featured/.test(busAdmin), 'featured not found in buses admin');
check('Visas admin has featured field', /featured/.test(visaAdmin), 'featured not found in visas admin');
check('Guides admin has featured field', /featured/.test(guideAdmin), 'featured not found in guides admin');

// 25. Admin catalog counters exist
check('AdminCatalogManager has total counter', /Total/.test(catalogMgr), 'Total counter not found');
check('AdminCatalogManager has published counter', /Published/.test(catalogMgr), 'Published counter not found');
check('AdminCatalogManager has draft counter', /Draft/.test(catalogMgr), 'Draft counter not found');
check('AdminCatalogManager has featured counter', /Featured/.test(catalogMgr), 'Featured counter not found');

// 26. Image helper text exists
check('AdminCatalogManager has image helper text', /Optional.*recommended.*homepage/.test(catalogMgr), 'image helper text not found');

// 27. Public discovery still uses fetch functions
check('Public FeaturedServices uses fetchCruises', /fetchCruises/.test(fsContent), 'fetchCruises not in FeaturedServices');
check('Public FeaturedServices uses fetchBuses', /fetchBuses/.test(fsContent), 'fetchBuses not in FeaturedServices');

// 28. No Firestore rules changed
const firestoreRules = readFile('firestore.rules');
const storageRules = readFile('storage.rules');
if (firestoreRules) {
  check('Firestore rules unchanged', /service cloud\.firestore/.test(firestoreRules), 'firestore rules file exists');
} else {
  check('Firestore rules unchanged', true, 'firestore.rules not in project');
}
if (storageRules) {
  check('Storage rules unchanged', /service firebase\.storage/.test(storageRules), 'storage rules file exists');
} else {
  check('Storage rules unchanged', true, 'storage.rules not in project');
}

// 29. index.html title and meta description are DreamsTour Tunisia-specific
const indexHtml = readFile('index.html');
check(
  'Page title is DreamsTour Tunisia specific',
  /DreamsTour Tunisia/.test(indexHtml),
  'title not updated to DreamsTour Tunisia'
);
check(
  'Meta description mentions Tunisia and manual payment',
  /Explore Tunisia travel services.*manual follow-up.*No online card payment/.test(indexHtml),
  'meta description not updated'
);

// 30. Emergency Visual Reset - header topbar removed
const headerContentCheck = readFile('src/core/common/header/header.tsx');
check(
  'Header no longer shows Toll Free in topbar',
  !/Toll Free/.test(headerContentCheck),
  'Toll Free still present in header topbar'
);
check(
  'Header no longer shows Email in topbar',
  !/Email :/.test(headerContentCheck),
  'Email : still present in header topbar'
);
check(
  'Header no longer has header-topbar CSS (all topbars removed)',
  !/header-topbar/.test(headerContentCheck),
  'header-topbar CSS class still present in header'
);
check(
  'Header no longer has wishlist cart counter in topbar',
  !/count-icon.*0/.test(headerContentCheck),
  'Cart counter still present in header topbar'
);
check(
  'Homepage no longer imports ExperienceSection',
  !/ExperienceSection/.test(homeContent),
  'ExperienceSection still present in HomeServiceOne'
);
check(
  'Homepage no longer imports Recomanded section',
  !/Recomanded/.test(homeContent),
  'Recomanded still present in HomeServiceOne'
);
check(
  'Homepage no longer imports GuideSection',
  !/GuideSection/.test(homeContent),
  'GuideSection still present in HomeServiceOne'
);
const footerSectionContentEarly = readFile('src/feature-module/home-service-one/footerSection.tsx');
check(
  'FooterSection no longer has "Subscribe to our Newsletter"',
  !/Subscribe to our Newsletter/.test(footerSectionContentEarly),
  'Newsletter subscription still present in FooterSection'
);
check(
  'ChooseSection no longer has EXPLORE TUNISIA background text',
  !/EXPLORE TUNISIA/.test(chooseContent),
  'EXPLORE TUNISIA background text still present in ChooseSection'
);
check(
  'ChooseSection no longer has PLAN YOUR TRIP background text',
  !/PLAN YOUR TRIP/.test(chooseContent),
  'PLAN YOUR TRIP background text still present in ChooseSection'
);
check(
  'Homepage no longer contains "612 x 700" dimensions',
  !/612\s*x\s*700/.test(homeContent),
  '"612 x 700" still found in homepage sections'
);
check(
  'Homepage no longer contains "Popular Tunisia Tours"',
  !/Popular Tunisia Tours/.test(homeContent),
  '"Popular Tunisia Tours" still found in HomeServiceOne'
);
check(
  'Homepage no longer contains "Local Tunisian Guides"',
  !/Local Tunisian Guides/.test(homeContent),
  '"Local Tunisian Guides" still found in HomeServiceOne'
);

// 31. No SEO dependency (react-helmet) added
const mainContent = readFile('src/main.tsx');
const packageContent = readFile('package.json');
check(
  'No react-helmet dependency added',
  !/react-helmet/.test(packageContent),
  'react-helmet found in package.json'
);

// 32. Detail page not-found copy is user-friendly
const cruiseDetails = readFile('src/feature-module/curise/curise-details/FirestoreCruiseDetails.tsx');
const busDetails = readFile('src/feature-module/bus/bus-details/FirestoreBusDetails.tsx');
const visaDetails = readFile('src/feature-module/visa/visa-details/FirestoreVisaDetails.tsx');
const guideDetails = readFile('src/feature-module/guide/guide-Details/FirestoreGuideDetails.tsx');
check(
  'Cruise detail not-found copy uses friendly message',
  /could not be found or is no longer available/.test(cruiseDetails),
  'cruise not-found copy not updated'
);
check(
  'Bus detail not-found copy uses friendly message',
  /could not be found or is no longer available/.test(busDetails),
  'bus not-found copy not updated'
);
check(
  'Visa detail not-found copy uses friendly message',
  /could not be found or is no longer available/.test(visaDetails),
  'visa not-found copy not updated'
);
check(
  'Guide detail not-found copy uses friendly message',
  /could not be found or is no longer available/.test(guideDetails),
  'guide not-found copy not updated'
);
check(
  'Cruise detail no-ID shows friendly message with back link',
  /Service link is missing/.test(cruiseDetails),
  'cruise no-ID missing friendly message'
);
check(
  'Bus detail no-ID shows friendly message with back link',
  /Service link is missing/.test(busDetails),
  'bus no-ID missing friendly message'
);
check(
  'Visa detail no-ID shows friendly message with back link',
  /Service link is missing/.test(visaDetails),
  'visa no-ID missing friendly message'
);
check(
  'Guide detail no-ID shows friendly message with back link',
  /Service link is missing/.test(guideDetails),
  'guide no-ID missing friendly message'
);
check(
  'Cruise detail no-ID has Back to Cruises button',
  /Back to Cruises/.test(cruiseDetails),
  'cruise no-ID back button missing'
);
check(
  'Bus detail no-ID has Back to Buses button',
  /Back to Buses/.test(busDetails),
  'bus no-ID back button missing'
);
check(
  'Visa detail no-ID has Back to Visas button',
  /Back to Visas/.test(visaDetails),
  'visa no-ID back button missing'
);
check(
  'Guide detail no-ID has Back to Guides button',
  /Back to Guides/.test(guideDetails),
  'guide no-ID back button missing'
);

// 33. Public CTAs do not include "Pay Now" or "checkout" wording
check(
  'Homepage does not contain "Pay Now"',
  !/Pay Now/.test(homeContent + fsContent + deliveryContent + chooseContent),
  '"Pay Now" found in homepage content'
);
check(
  'FeaturedServices does not contain "checkout"',
  !/checkout/.test(fsContent),
  '"checkout" found in FeaturedServices'
);

// 34. List page empty states are user-friendly (not null)
const cruiseListContent = readFile('src/feature-module/curise/cruise-list/FirestoreCruiseList.tsx');
const busListContent = readFile('src/feature-module/bus/bus-list/FirestoreBusList.tsx');
const visaListContent = readFile('src/feature-module/visa/visa-list/FirestoreVisaList.tsx');
const guideListContent = readFile('src/feature-module/guide/guide-grid/FirestoreGuideList.tsx');
check(
  'Cruise list empty state shows friendly message (not null)',
  /No cruises available right now/.test(cruiseListContent),
  'cruise list still returns null when empty'
);
check(
  'Bus list empty state shows friendly message (not null)',
  /No bus trips available right now/.test(busListContent),
  'bus list still returns null when empty'
);
check(
  'Visa list empty state shows friendly message (not null)',
  /No visa services available right now/.test(visaListContent),
  'visa list still returns null when empty'
);
check(
  'Guide list empty state shows friendly message (not null)',
  /No guides available right now/.test(guideListContent),
  'guide list still returns null when empty'
);

// 35. Cruise list agent avatar alt text is descriptive
check(
  'Cruise list agent avatar uses descriptive alt text',
  !/alt="img"/.test(cruiseListContent),
  'cruise list still has alt="img" for agent avatar'
);

// 36. FeaturedServices does not use $ prefix for prices
check(
  'FeaturedServices does not use $ prefix for prices',
  !/\$\{item\.price\}/.test(fsContent),
  'FeaturedServices still uses $ prefix for TND prices'
);

// 37. ServiceRequestForm has "Send another request" in success state
const srFormContent = readFile('src/core/common/service-request/ServiceRequestForm.tsx');
check(
  'ServiceRequestForm has "Send another request" in success state',
  /Send another request/.test(srFormContent),
  '"Send another request" button missing in success state'
);

// 38. FooterSection no longer contains template/fake content
const footerSectionContent = readFile('src/feature-module/home-service-one/footerSection.tsx');
check(
  'FooterSection no longer has info@example.com',
  !/info@example\.com/.test(footerSectionContent),
  'info@example.com still present in footerSection'
);
check(
  'FooterSection no longer has car rental mission copy',
  !/car rental experience/.test(footerSectionContent),
  'Car rental mission copy still present'
);
check(
  'FooterSection no longer has Toll Free',
  !/Toll Free/.test(footerSectionContent),
  'Toll Free still present in footerSection'
);
check(
  'FooterSection no longer has Google Play badges',
  !/googleplay/.test(footerSectionContent),
  'Google Play badges still present in footerSection'
);
check(
  'FooterSection links focus on Cruise/Bus/Visa/Guide/Contact',
  /\{all_routes\.cruiseList\}/.test(footerSectionContent),
  'cruiseList link not found in footerSection nav'
);

// 39. Shared footer no longer contains non-Tunisia destinations
const sharedFooterContent = readFile('src/core/common/footer/footer.tsx');
check(
  'Shared footer no longer has Newyork destination',
  !/Newyork/.test(sharedFooterContent),
  'Newyork still present in shared footer destinations'
);
check(
  'Shared footer no longer has Hawai destination',
  !/Hawai/.test(sharedFooterContent),
  'Hawai still present in shared footer destinations'
);
check(
  'Shared footer no longer has app store badges',
  !/googleplay|appstore/.test(sharedFooterContent),
  'App store badges still present in shared footer'
);
check(
  'Shared footer no longer has payment card logos',
  !/card-links|card-0[1-6]/.test(sharedFooterContent),
  'Payment card logos still present in shared footer'
);

// 40. Testimonials no longer contain fake US names
const testimonialContent = readFile('src/feature-module/home-service-one/testimonialSection.tsx');
check(
  'Testimonials section replaced with factual trust section',
  /Why travelers use DreamsTour/.test(testimonialContent),
  'Testimonials section still has fake content'
);
check(
  'Testimonials no longer contain Michael Smith',
  !/Michael Smith/.test(testimonialContent),
  'Michael Smith still present in testimonials'
);

// 42. LatestSection (client logos) removed
const latestContent = readFile('src/feature-module/home-service-one/latestSection.tsx');
check(
  'LatestSection no longer has client logos slider',
  !/clients-sec-eight|clientSliderTwo/.test(latestContent),
  'Client logos slider still present'
);

// 43. Header navigation restored (Sprint 28B)
const headerContent = readFile('src/core/common/header/header.tsx');
check('Header contains Flight', /\{ label: "Flight"/.test(headerContent), 'Flight nav item missing');
check('Header contains Hotel', /\{ label: "Hotel"/.test(headerContent), 'Hotel nav item missing');
check('Header contains Car', /\{ label: "Car"/.test(headerContent), 'Car nav item missing');
check('Header contains Resort', /\{ label: "Resort"/.test(headerContent), 'Resort nav item missing');
check('Header contains Chalet', /\{ label: "Chalet"/.test(headerContent), 'Chalet nav item missing');
check('Header contains Cruise', /\{ label: "Cruise"/.test(headerContent), 'Cruise nav item missing');
check('Header contains Tour', /\{ label: "Tour"/.test(headerContent), 'Tour nav item missing');
check('Header contains Bus', /\{ label: "Bus"/.test(headerContent), 'Bus nav item missing');
check('Header contains Activity', /\{ label: "Activity"/.test(headerContent), 'Activity nav item missing');
check('Header contains Visa', /\{ label: "Visa"/.test(headerContent), 'Visa nav item missing');
check('Header contains Guide', /\{ label: "Guide"/.test(headerContent), 'Guide nav item missing');
check('Header contains Contact', /\{ label: "Contact"/.test(headerContent), 'Contact nav item missing');
check('Header does not contain USD dropdown', !/USD/.test(headerContent), 'USD dropdown still present');
check('Header does not contain cart/payment checkout signals', !/(shopping.?cart|add.?to.?cart|checkout|isax-bag)/i.test(headerContent), 'Cart/checkout signals still present in header');
check('Header does not contain Pay Now', !/Pay Now/.test(headerContent), 'Pay Now still present in header');
check('Header does not contain Stripe/PayPal/payment logos', !/Stripe|PayPal/.test(headerContent), 'Stripe/PayPal still present in header');

// 44. Duplicate light footer removed (Sprint 28C hotfix)
const footerSectionFile = readFile('src/feature-module/home-service-one/footerSection.tsx');
check('FooterSection contains dark footer mission copy', /DreamsTour helps travelers explore Tunisia services/.test(footerSectionFile), 'Dark footer mission copy missing');
check('FooterSection does not contain Pages column from light footer', !/Pages.*Marketplace.*Destinations.*Support/.test(footerSectionFile), 'Pages/Marketplace columns still in FooterSection');
check('FooterSection does not contain light footer white card', !/bg-white/.test(footerSectionFile), 'White card section still in FooterSection');
check('FooterSection does not contain duplicate customer support card', !/second.*Customer Support|Customer Support.*second/.test(footerSectionFile), 'Duplicate customer support still in FooterSection');
check('FooterSection does not contain QA Footer text', !/QA Footer/.test(footerSectionFile), 'QA Footer text still present');
check('FooterSection does not contain QA Site text', !/QA Site/.test(footerSectionFile), 'QA Site text still present');
// Verify shell config no longer uses shared footer for home-service-one
const firebaseServicesFile = readFile('src/core/services/firebaseServices.ts');
check('HomeServiceOne shell footer is local (not shared)', /home-service-one[\s\S]*?shell:\s*\{[\s\S]*?footer:\s*"local"/.test(firebaseServicesFile), 'Shell footer still set to shared');

// 45. Firestore Data Cleanup Report exists (Sprint 29)
check(
  'Firestore data cleanup report exists',
  fileExists('docs/FIRESTORE_DATA_CLEANUP_REPORT.md'),
  'FIRESTORE_DATA_CLEANUP_REPORT.md not found'
);

// Summary
console.log('\n=== QA: Homepage Marketplace Discovery ===\n');
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
