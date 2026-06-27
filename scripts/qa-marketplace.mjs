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

// 12. All four list routes still exported
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
