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
const hotelSearchPanel = read('src/feature-module/hotel/components/HotelSearchPanel.tsx');
const dateRange = read('src/core/common/dateRange/CommonDateRange.tsx');
const hotelsPage = read('src/feature-module/admin-dashboard/pages/hotels.tsx');
const tunisiaLocations = read('src/core/common/data/tunisiaHotelLocations.ts');
const pkg = read('package.json');
const status = execSync('git status --short', { cwd: root, encoding: 'utf8' });
const diffNames = execSync('git diff --name-only', { cwd: root, encoding: 'utf8' });

assert(exists('src/core/common/data/tunisiaHotelLocations.ts'), 'Tunisia hotel locations file exists');
assert(exists('src/feature-module/hotel/components/HotelSearchPanel.tsx'), 'Reusable hotel search panel exists');
assert(/AdminCatalogManager/.test(hotelsPage), 'Admin Hotels still uses AdminCatalogManager');
assert(/HotelSearchPanel/.test(home), 'Homepage uses the reusable hotel search panel');
assert(/HotelSearchPanel/.test(grid), 'Hotel grid uses the reusable hotel search panel');
assert(/standalone/.test(grid), 'Hotel grid renders the hotel search panel in standalone mode');
assert(/initialDestination=/.test(grid), 'Hotel grid hydrates hotel search panel from URL params');
assert(/initialCheckInDate=/.test(grid), 'Hotel grid hydrates check-in date');
assert(/initialCheckOutDate=/.test(grid), 'Hotel grid hydrates check-out date');
assert(/initialAdults=/.test(grid), 'Hotel grid hydrates adults');
assert(/initialRooms=/.test(grid), 'Hotel grid hydrates rooms');
assert(/nav-link active/.test(hotelSearchPanel), 'Hotel search panel marks Hotels as active');
assert(/params\.set\('source', 'manual'\)/.test(hotelSearchPanel), 'Hotel search panel navigates with source=manual');
assert(/initialStartDate/.test(dateRange), 'CommonDateRange supports initialStartDate');
assert(/initialEndDate/.test(dateRange), 'CommonDateRange supports initialEndDate');
assert(/TUNISIA_HOTEL_LOCATIONS/.test(hotelSearchPanel), 'Hotel search panel uses Tunisia hotel locations');
assert(!/20 Offers Available|Available offers/i.test(hotelSearchPanel), 'Hotel search panel avoids fake offer count copy');
assert(!/Upto \\d+% offers/i.test(hotelSearchPanel), 'Hotel search panel avoids fake promotional offer copy');
assert(/manualMode/.test(grid), 'Manual hotel grid mode exists');
assert(/fetchHotels\(\)/.test(grid), 'Hotel grid uses fetchHotels');
assert(/matchesTunisiaHotelDestination/.test(grid), 'Hotel grid uses Tunisia destination matcher');
assert(/DESTINATION_ALIAS_MAP/.test(tunisiaLocations), 'Tunisia destination alias map exists');
assert(/tunis: \['tunis', 'bardo', 'le bardo', 'la soukra', 'ariana', 'carthage', 'la marsa', 'gammarth'\]/.test(tunisiaLocations), 'Tunis aliases are defined');
assert(/sousse: \['sousse'\]/.test(tunisiaLocations), 'Sousse aliases are defined');
assert(/djerba: \['djerba', 'midoun', 'houmt souk'\]/.test(tunisiaLocations), 'Djerba aliases are defined');
assert(/phraseContainsAlias/.test(tunisiaLocations), 'Destination matcher uses phrase matching');
assert(!/includes\(query\)/.test(grid), 'Hotel grid no longer uses broad substring destination matching');
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
assert(/normalizeLoopbackAssetUrl/.test(read('src/core/common/imageWithBasePath/index.tsx')), 'Image resolver normalizes loopback asset URLs');

const normalizePhrase = (value) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const tokenize = (value) => normalizePhrase(value).split(' ').filter(Boolean);

const phraseContainsAlias = (value, alias) => {
  const haystack = tokenize(value);
  const needle = tokenize(alias);
  if (!haystack.length || !needle.length || needle.length > haystack.length) return false;
  for (let start = 0; start <= haystack.length - needle.length; start += 1) {
    if (needle.every((token, index) => haystack[start + index] === token)) return true;
  }
  return false;
};

const destinationAliases = {
  tunis: ['tunis', 'bardo', 'le bardo', 'la soukra', 'ariana', 'carthage', 'la marsa', 'gammarth'],
  sousse: ['sousse'],
  hammamet: ['hammamet'],
  djerba: ['djerba', 'midoun', 'houmt souk'],
};

const matchesManualDestination = (destination, hotel) => {
  const aliases = destinationAliases[normalizePhrase(destination)] || [normalizePhrase(destination)];
  const searchableValues = [hotel.city, hotel.location, hotel.address].filter(Boolean);
  return searchableValues.some((value) => aliases.some((alias) => phraseContainsAlias(value, alias)));
};

assert(matchesManualDestination('Tunis', { location: 'bardo tunisie' }), 'Tunis matches Bardo area');
assert(matchesManualDestination('Tunis', { location: 'la soukra tunisie' }), 'Tunis matches La Soukra area');
assert(!matchesManualDestination('Tunis', { location: 'sousse tunisie' }), 'Tunis does not match Sousse');
assert(matchesManualDestination('Sousse', { location: 'sousse tunisie' }), 'Sousse matches Sousse location');
assert(!matchesManualDestination('Tunis', { location: 'tunisie' }), 'Tunis does not match country-only Tunisie');

console.log('qa:hotel-directory passed');
