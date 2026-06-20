const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const checks = [
  ['Booking helper', 'src/core/services/firebaseServices.ts', ['createUserBookingRequest', 'fetchUserBookings', 'collection(db, "users", userId, "bookings")']],
  ['Booking entry point', 'src/feature-module/hotel/hotel-details/stickyContent.tsx', ['createUserBookingRequest', 'Book Now', 'userHotlesBooking']],
  ['Firestore rules', 'firestore.rules', ['match /users/{userId}/bookings/{bookingId}', 'allow read, create, update, delete: if isOwner(userId);']],
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
