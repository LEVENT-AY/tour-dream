# Sprint 28 — Public Template Cleanup & Trust Alignment (Jun 28, 2026)

## What was done

**Files modified:**
- `src/feature-module/home/HomeServiceOne.tsx` — Full rewrite: removed fake hero (Newyork/USA/8 search tabs), replaced with simple CTA hero + Tunisia service tiles + How It Works + Why Choose + Experience/Guide/Recommended sections
- `src/feature-module/home/trendingList.tsx` — Removed import/render from HomeServiceOne
- `src/feature-module/home/recomanded.tsx` — Removed `$` prices, fake review counts/badges, fake urgency (guest counts), changed CTAs
- `src/feature-module/home/testimonialSection.tsx` — Replaced fake US testimonials with "Why travelers use DreamsTour" trust section (4 process cards)
- `src/feature-module/home/latestSection.tsx` — Returns null (removed client logos + fake articles)
- `src/feature-module/home/footerSection.tsx` — Removed info@example.com, car rental mission, Toll Free, Google Play/App Store badges, pruned nav to Cruise/Bus/Visa/Guide/Contact
- `src/feature-module/home/header.tsx` — Removed 8 USD currency dropdowns, info@example.com fallback, pruned public nav to Cruise/Bus/Visa/Guide/Contact
- `src/shared-components/Footer.tsx` — Removed non-Tunisia destinations, app store badges, payment card logos, fake company links; replaced with Tunisia destinations + marketplace links
- `src/feature-module/contact/contactUs.tsx` — Replaced dreamtourinfo@example.com with generic text
- `scripts/qa-marketplace.mjs` — Added 20+ new regression checks (footer/testimonial/recommended/latest checks)

**QA baseline (all pass):**
- marketplace: 121 checks ✓
- service-requests: 69 checks ✓
- agent-dashboard: 83 checks ✓
- manual-payment: 273 checks ✓
- Total: 546 checks ✓

# Sprint 28B — Restore Public Navigation Without Template Clutter (Jun 28, 2026)

## What was done

**Problem:** Sprint 28 pruned `header.tsx` too aggressively — public nav was reduced to only Home/Cruise/Bus/Visa/Guide/Contact.

**Fix:** Restored all valid existing categories to the public header navigation.

**Files modified:**
- `src/core/common/header/header.tsx` — Restored `publicHeaderNavigation` array to include: Home, Flight, Hotel, Car, Resort, Chalet, Cruise, Tour, Bus, Activity, Visa, Guide, Contact (13 items using existing routes — no new routes created)
- `scripts/qa-marketplace.mjs` — Added 16 header nav regression checks

**Nav items restored:** Flight, Hotel, Car, Resort, Chalet, Tour, Activity
**Intentionally not restored:** USD dropdown, cart, payment signals, app store badges, Add Listing for public visitors

**Not changed:** Firestore rules, Storage rules, upload, payment gateway, routes, dependencies, data flow

**Pricing Plan route** (`/pages/pricing-plan`) — exists in publicRoutes, not included in header nav per sprint scope (not a core service category). Can be added on request.

**QA baseline (all pass):**
- marketplace: 137 checks ✓ (+16 header nav checks)
- service-requests: 69 checks ✓
- agent-dashboard: 83 checks ✓
- manual-payment: 273 checks ✓
- Total: 562 checks ✓

## What to do next
- Agent dashboard "Invalid Date" fix (task K) — low priority, deferred
- Data cleanup report (task L) — needs to be generated
- FeaturedServices polish (task J) — verified already good

## Prior sprints context
- **Sprint 27**: Manual payment flow — paymentReference field, reference input, admin modal read-only display, status constants cleanup, correct empty states, CSV/follow-up integration, invoice page demo data removal
- **Sprint 26**: Admin dashboard stats page; agent dashboard data-driven (removed 10+ fake listings/invoices/names); agent bookings data-driven (removed 6+ static counts/alerts); agent plan/invoice empty states; 0 fake Thomas Lawler/Sara Inc/INV strings
- **Sprint 25**: Agent booking pages for cruise/bus/visa/activity/guide + cancellation; `waitFor` helper for unit tests; agent booking pages filter by itemType; CancellationRequest page filtering by cancelled/canceled status
- **Sprint 24**: Agent booking pages under /agent/bookings — CruiseBookings, BusBookings, VisaBookings, GuideBookings, ActivitiesBookings; fixed booking list infinite scroll, improved `fetchCollection` with `buildWhereMultiple`, added `cancellationRequest` to booking types, agent dashboard filter tabs (sorted listings/invoices by recency, removed demo data), invoice/demo data removal
- **Sprint 23**: Agent dashboard main — stats cards, recent listings, latest invoices, plan settings, earnings modal, cancellation flow; cardIcons mapped; agentServices with getAgentDashboardStats; fixed BookingDataService; removed demo data in EarningsModal
- **Sprint 22**: Agent dashboard route/GuardProvider/PlanSettings/EarningsModal/TransactionsEarnings; fixed `useCallback` import; admin sidebar agent link; added `fetchAgentDashboardStats` and `DashboardStats` type; fixed InfiniteScroll/FirestoreList integration
- **Sprint 21**: Agent login flow — GuardProvider, ProtectedRoute, auth methods, redirect to /agent/agent-dashboard, sidebar link; fixed setDoc merge
- **Sprint 20**: Manual payment plan — consent form data storage; removal of "Card" references; Admin Bookings, Service Request Flow, booking type updates, WhatsApp follow-up, clean/detail modal headings
- **Sprint 19**: Guide booking flow; helper functions; `FirestoreVisaDetails` and `FirestoreGuideDetails`; duplicate removal; type safety; Qatar migration notes
- **Sprint 18**: Visa details request form; ServiceRequestForm; `createServiceRequest`; enhanced Admin Bookings modal; status/priority "normal" default; Removed backend directory
- **Sprint 17**: Search and filter functionality for bus, cruise, visa, and guide pages; service request flow with CRUD operations;
- **Sprint 16**: Admin catalog manager for all categories — featured toggle, image optimization, public listing pages with Firebase data, empty/error/loading/not-found states; auth binding; all 4 category details pages with service request form
- **Sprint 15**: Firestore rules, service booking flow, Visa pages (listing/details/admin), Guide pages (listing/details/admin), user/agent search, bookings tab, admin dashboard
- **Sprint 14**: Bus pages admin (CRUD), public listing/detail pages, customer pages (bus), file upload, terms pages
- **Sprint 13**: Cruise pages admin (CRUD), public listing/detail pages, navigation refactoring, BookingAdmin repository, admin bookings tab with status management
- **Sprint 12**: Cruise pages part 1 — admin, public, sidebar, routes, agent listing/detail pages, auth state fix, guest route, Firestore service, types, hooks
- **Sprint 11**: Initial setup — MERN stack, React cleanup (removed unused files, fixed imports), login/signup, forgotten password
- **Sprint 10**: Initial project creation, template selection
