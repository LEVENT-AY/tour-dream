# Workflows

## Customer Dashboard Feature
1. Read `PROJECT_STATUS.md` and `FEATURE_MAP.md`.
2. Inspect only the relevant customer dashboard file(s).
3. Use existing helpers from `src/core/services/firebaseServices.ts`.
4. Keep empty states honest.
5. Run `npm run build`.

## Booking Request V1
1. Use a single safe customer-facing entry point.
2. Create a pending request under `users/{uid}/bookings`.
3. Include `customerId`, name/email/phone, title, and listing identifiers when available.
4. Reuse `fetchUserBookings(uid)` for display.
5. Build before deploy.

## Wishlist
1. Reuse `fetchUserWishlist(uid)` and `removeFromWishlist(uid, itemId)`.
2. Show only owned items.
3. Use a clear empty state when there are no saved items.

## Firestore Rules
1. Edit `firestore.rules` only for the exact collection path in scope.
2. Keep ownership checks strict.
3. Deploy rules only after build passes.
4. Verify with the relevant rules test script when available.

## Build, Deploy, Commit
1. Run `npm run build`.
2. If frontend changed, run `npm run deploy:hosting`.
3. If `firestore.rules` changed, run `npm run deploy:rules`.
4. Commit once with the smallest complete change.
5. Push once.

## Smoke Test
1. Run `npm run smoke:customer-dashboard`.
2. Run `npm run smoke:booking-request-v1`.
3. Use `npm run dev:5174` for manual browser verification.
4. Use `npm run cleanup:temp-test-data` only if the project-specific cleanup path is configured.
