# Feature Map

## Customer Dashboard
- Main dashboard: `src/feature-module/userDashboard/dashboard/dashboard.tsx`
- Sidebar/navigation: `src/core/common/sidebar/sidebar.tsx`
- Bookings: `src/feature-module/userDashboard/myBooking/CustomerBookingsPage.tsx`
- Booking variants: `src/feature-module/userDashboard/myBooking/*/*.tsx`
- Orders: `src/feature-module/userDashboard/orders/userOrders.tsx`
- Wishlist: `src/feature-module/userDashboard/wishlist/userWishlist.tsx`
- My Profile: `src/feature-module/userDashboard/myProfile/myProfile.tsx`
- Profile Settings: `src/feature-module/userDashboard/settings/profileSettings.tsx`

## Agent Dashboard
- Area: `src/feature-module/agent-dashboard/*`
- Booking pages: `src/feature-module/agent-dashboard/Booking/*`
- Listing pages: `src/feature-module/agent-dashboard/listing/*` and related subfolders

## Admin Dashboard
- Area: `src/feature-module/admin-dashboard/*`
- Booking pages: `src/feature-module/admin-dashboard/pages/bookings*.tsx`

## Firebase Data
- `users/{uid}`
- `users/{uid}/bookings`
- `users/{uid}/orders`
- `users/{uid}/wishlist`
- `tours`
- `hotels`
- `flights`
- `cars`
- `activities`
- `resorts`
- `chalets`

## Services And Rules
- Shared Firebase helpers: `src/core/services/firebaseServices.ts`
- Admin services: `src/core/services/adminDashboardServices.ts`
- Agent services: `src/core/services/agentServices.ts`
- Firestore rules: `firestore.rules`

## Hosting And Project
- Firebase project: `tour-tunisi`
- Hosting deploy target: `hosting`
- Preferred dev server: `npm run dev:5174`
