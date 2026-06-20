const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const checks = [
  ['Customer dashboard page', 'src/feature-module/userDashboard/dashboard/dashboard.tsx', ['fetchUserBookings', 'fetchUserOrders', 'fetchUserWishlist']],
  ['Customer bookings page', 'src/feature-module/userDashboard/myBooking/CustomerBookingsPage.tsx', ['fetchUserBookings']],
  ['Customer sidebar', 'src/core/common/sidebar/sidebar.tsx', ['userDashboard', 'userOrders', 'myProfile', 'profileSettings', 'wishlist']],
];

for (const [label, rel, needles] of checks) {
  const file = path.join(root, rel);
  if (!fs.existsSync(file)) {
    console.error(`${label} missing: ${rel}`);
    process.exit(1);
  }
  const text = fs.readFileSync(file, 'utf8');
  for (const needle of needles) {
    if (!text.includes(needle)) {
      console.error(`${label} missing expected text: ${needle}`);
      process.exit(1);
    }
  }
}

console.log('Customer dashboard smoke checks passed.');
