const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const checks = [
  ['Booking helper', 'src/core/services/firebaseServices.ts', ['createBookingRequest', 'syncBookingMirror', 'fetchCustomerBookings', 'fetchAdminBookings', 'fetchAgentBookings', 'doc(db, "bookings", bookingId)']],
  ['Booking entry point', 'src/feature-module/hotel/hotel-details/stickyContent.tsx', ['createBookingRequest', 'Book Now', 'userHotlesBooking']],
  ['Firestore rules', 'firestore.rules', ['match /users/{userId}/bookings/{bookingId}', 'match /bookings/{bookingId}', 'allow update: if isAdmin();']],
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

console.log('Booking request V1 smoke checks passed.');
