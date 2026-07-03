import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const root = process.cwd();
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');
const exists = (rel) => fs.existsSync(path.join(root, rel));
const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const home = read('src/feature-module/home-service-one/HomeServiceOne.tsx');
const grid = read('src/feature-module/hotel/hotel-grid/hotelGrid.tsx');
const request = read('src/feature-module/hotel/hotel-request/hotelRequest.tsx');
const hotelsPage = read('src/feature-module/admin-dashboard/pages/hotels.tsx');
const pkg = read('package.json');
const status = execSync('git status --short', { cwd: root, encoding: 'utf8' });
const diffNames = execSync('git diff --name-only', { cwd: root, encoding: 'utf8' });

assert(exists('src/core/common/data/tunisiaHotelLocations.ts'), 'Tunisia hotel locations file exists');
assert(/AdminCatalogManager/.test(hotelsPage), 'Admin Hotels still uses AdminCatalogManager');
assert(/params\.set\('source', 'manual'\)/.test(home), 'Homepage hotel search uses source=manual');
assert(/TUNISIA_HOTEL_LOCATIONS/.test(home), 'Homepage uses Tunisia hotel locations');
assert(/manualMode/.test(grid), 'Manual hotel grid mode exists');
assert(/fetchHotels\(\)/.test(grid), 'Hotel grid uses fetchHotels');
assert(/Request this hotel/.test(grid), 'Hotel cards have request button');
assert(/Send hotel request/.test(grid), 'Empty state can send hotel request');
assert(/provider: 'manual'/.test(request), 'Manual hotel request provider is manual');
assert(/serviceType: 'hotel'/.test(request), 'Hotel request keeps serviceType hotel');
assert(/receiptPath/.test(request), 'Hotel request stores receiptPath');
assert(!/getDownloadURL/.test(request), 'Public hotel request page does not call getDownloadURL');
assert(!/Book Now|Pay Now|Checkout|Confirmed booking/.test(request), 'Hotel request page avoids booking/checkout wording');
assert(/"qa:hotel-directory"/.test(pkg), 'package.json has qa:hotel-directory script');
assert(!/functions\/src\/index\.ts/.test(status), 'functions/src/index.ts unchanged in git status');
assert(!/firestore\.rules|storage\.rules/.test(status), 'Firestore and Storage rules unchanged in git status');
assert(!/functions\/src\/index\.ts/.test(diffNames), 'functions/src/index.ts not in diff');
assert(!/firestore\.rules|storage\.rules/.test(diffNames), 'Firestore and Storage rules not in diff');

console.log('qa:hotel-directory passed');
