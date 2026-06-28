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
  /return null/.test(fsContent),
  'empty result handling not found'
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

// 11. Hero section Search buttons point to Firestore-enabled list routes
check(
  'Cruise Search button uses cruiseList route',
  /to=\{all_routes\.cruiseList\}[\s\S]*?Search/.test(homeContent),
  'cruiseGrid still referenced in hero Search button'
);
check(
  'Bus Search button uses busList route',
  /to=\{all_routes\.busList\}[\s\S]*?Search/.test(homeContent),
  'busList not found in hero Bus Search button'
);
check(
  'Visa Search button uses visaList route',
  /to=\{all_routes\.visaList\}[\s\S]*?Search/.test(homeContent),
  'visaGrid still referenced in hero Visa Search button'
);
check(
  'Guide Search button uses guideGrid route',
  /to=\{all_routes\.guideGrid\}[\s\S]*?Search/.test(homeContent),
  'guideGrid not found in hero Guide Search button'
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

// 16. Experience destinations localized to Tunisia
const experienceContent = readFile('src/feature-module/home-service-one/experienceSection.tsx');
check(
  'Experience section heading mentions Tunisian Destinations',
  /Explore Tunisian/.test(experienceContent),
  'heading not updated to Tunisia'
);
check(
  'Experience section uses Tunisian city names',
  /Tunis/.test(experienceContent) && /Sousse/.test(experienceContent) && /Hammamet/.test(experienceContent),
  'Tunisian city names not found in experienceSection'
);

// 17. Guide section localized to Tunisia
const guideSectionContent = readFile('src/feature-module/home-service-one/guideSection.tsx');
check(
  'Guide section heading mentions Local Tunisian',
  /Local Tunisian/.test(guideSectionContent),
  'heading not updated to Tunisia'
);
check(
  'Guide section uses Tunisian guide names',
  /Ahmed Ben Ali/.test(guideSectionContent) && /Salma Mansouri/.test(guideSectionContent),
  'Tunisian guide names not found'
);
check(
  'Guide cards link to guideGrid route',
  /all_routes\.guideGrid/.test(guideSectionContent),
  'guideGrid route not found in guideSection links'
);
check(
  'Guide View All links to guideGrid',
  /all_routes\.guideGrid[\s\S]*?View All Guides/.test(guideSectionContent),
  'View All Guides does not link to guideGrid'
);

// 18. Recommended tours localized to Tunisia
const recomandedContent = readFile('src/feature-module/home-service-one/recomanded.tsx');
check(
  'Recommended section heading mentions Tunisia',
  /Popular Tunisia/.test(recomandedContent),
  'heading not updated to Tunisia'
);
check(
  'Recommended section uses Tunisian tour names',
  /Medina Walk/.test(recomandedContent) && /Sahara Escape/.test(recomandedContent),
  'Tunisian tour names not found'
);
check(
  'Recommended tour cards link to cruiseList',
  /all_routes\.cruiseList/.test(recomandedContent),
  'cruiseList route not found in recomanded links'
);
check(
  'Recommended View All links to cruiseList',
  /all_routes\.cruiseList[\s\S]*?View All Listings/.test(recomandedContent),
  'View All Listings does not link to cruiseList'
);

// 19. Homepage CTA routes correct
check(
  'Experience View All destinations links to cruiseList',
  /all_routes\.cruiseList[\s\S]*?View All Destinations/.test(experienceContent),
  'View All Destinations does not link to cruiseList'
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
