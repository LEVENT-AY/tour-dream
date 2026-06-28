# Feature Map — DreamsTour Tunisia

---

## Public Marketplace

| Feature | Files |
|---------|-------|
| Homepage discovery | `src/feature-module/home-service-one/FeaturedServices.tsx` |
| Cruise list | `src/feature-module/curise/cruise-list/FirestoreCruiseList.tsx` |
| Bus list | `src/feature-module/bus/bus-list/FirestoreBusList.tsx` |
| Visa list | `src/feature-module/visa/visa-list/FirestoreVisaList.tsx` |
| Guide list | `src/feature-module/guide/guide-grid/FirestoreGuideList.tsx` |
| Cruise details | `src/feature-module/curise/curise-details/FirestoreCruiseDetails.tsx` |
| Bus details | `src/feature-module/bus/bus-details/FirestoreBusDetails.tsx` |
| Visa details | `src/feature-module/visa/visa-details/FirestoreVisaDetails.tsx` |
| Guide details | `src/feature-module/guide/guide-Details/FirestoreGuideDetails.tsx` |
| Service request form | `src/core/common/service-request/ServiceRequestForm.tsx` |

## Admin

| Feature | Files |
|---------|-------|
| Bookings CRM | `src/feature-module/admin-dashboard/pages/bookings.tsx` |
| Catalog management | `src/feature-module/admin-dashboard/components/AdminCatalogManager.tsx` |
| Cruise admin | `src/feature-module/admin-dashboard/pages/cruises.tsx` |
| Bus admin | `src/feature-module/admin-dashboard/pages/buses.tsx` |
| Visa admin | `src/feature-module/admin-dashboard/pages/visas.tsx` |
| Guide admin | `src/feature-module/admin-dashboard/pages/guides.tsx` |

## Agent Dashboard

| Feature | Files |
|---------|-------|
| Dashboard stats | `src/feature-module/agent-dashboard/dashboard/Dashboard.tsx` |
| Bus bookings | `src/feature-module/agent-dashboard/Booking/BusBooking.tsx` |
| Cruise bookings | `src/feature-module/agent-dashboard/Booking/CruiseBooking.tsx` |
| Visa bookings | `src/feature-module/agent-dashboard/Booking/VisaBooking.tsx` |
| Activity bookings | `src/feature-module/agent-dashboard/Booking/ActivitiesBooking.tsx` |
| Guide bookings | `src/feature-module/agent-dashboard/Booking/GuideBooking.tsx` |
| Cancellation requests | `src/feature-module/agent-dashboard/Booking/CancellationRequest.tsx` |
| Invoices (empty state) | `src/feature-module/pages/invoices/invoices.tsx` |

## Firebase Data

- `cruises` — cruise listings
- `buses` — bus listings
- `visas` — visa listings
- `guides` — guide listings
- `serviceRequests` — customer request submissions (paymentFlow, paymentStatus, preferredPaymentMethod, paymentReference)

## Services

| Service | Path |
|---------|------|
| Shared Firebase helpers | `src/core/services/firebaseServices.ts` |
| Admin services | `src/core/services/adminDashboardServices.ts` |
| Agent services | `src/core/services/agentServices.ts` |
| Detail model normalization | `src/core/services/listingDetailModels.ts` |
| Storage helpers | `src/core/services/firebaseStorage.ts` |

## QA Scripts

| Script | Checks |
|--------|--------|
| `scripts/qa-service-requests.mjs` | 69 |
| `scripts/qa-marketplace.mjs` | 108 |
| `scripts/qa-agent-dashboard.mjs` | 83 |
| `scripts/qa-manual-payment.mjs` | 273 |

## Documentation

| Doc | Purpose |
|-----|---------|
| `docs/PRODUCTION_LAUNCH_CHECKLIST.md` | Launch verification checklist |
| `docs/ADMIN_TRAINING_NOTES.md` | Non-technical admin guide |
| `docs/WORKFLOWS.md` | Developer workflow reference |
| `docs/MANUAL_DEMO_CHECKLIST.md` | Smoke / demo test steps |
| `PROJECT_STATUS.md` | Current project state |
| `FEATURE_MAP.md` | This file |
| `AGENT_RULES.md` | Dev agent conventions |

## Intentionally Not Built

- Receipt image / file upload
- Stripe / card / checkout / payment gateway
- Invoice / payout / finance system
- Automated payment confirmation
- Activity / audit log collection
- Real notification sending
- Dynamic per-page SEO titles
- Multi-language support
- Customer dashboard

## Hosting

- Firebase project: `tour-tunisi`
- Live URL: <https://tour-tunisi.web.app>
- Deploy target: `firebase deploy --only hosting`
