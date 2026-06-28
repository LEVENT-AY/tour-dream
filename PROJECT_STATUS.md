# Project Status — DreamsTour Tunisia

**Live app:** <https://tour-tunisi.web.app>

---

## Current State

The DreamsTour Tunisia marketplace is production-ready for cruises, buses, visas, and guides. The platform uses Firestore for all data, with a public request flow, manual payment preference/reference, Admin Bookings CRM, and Agent Dashboard backed by real data.

### Completed (current architecture)

- Homepage Firestore-powered discovery (`FeaturedServices`) — fetches cruises/buses/visas/guides in parallel with `Promise.allSettled`, limits 3 per category, hides empty/all-zero categories.
- Public list pages (`/cruise-list`, `/bus-list`, `/visa-list`, `/guide-list`) — Firestore-backed, friendly empty states.
- Public detail pages — loaded by `?id=`, ServiceRequestForm embedded.
- ServiceRequestForm — writes to `serviceRequests` with manual payment guidance, optional preferred payment method, optional payment reference (maxLength 300), honeypot protection.
- Admin Bookings CRM — full CRUD, status/priority/assignment/payment/follow-up filters, detail modal (5 sections: Customer, Service Request, Operations, Payment Info, Internal Notes), WhatsApp link, copy msg/summary, CSV export, status lifecycle (pending → contacted → confirmed / cancelled).
- Agent Dashboard — real booking data, filtered by service type, honest empty states (no fake invoices/payouts).
- QA suites — 4 automated scripts covering all major flows (533 checks).
- SEO — static title/meta description, descriptive alt text on all homepage images, no react-helmet dependency.
- Documentation — launch checklist, admin training, workflows, demo checklist, feature map, agent rules.

### Not yet built

- Receipt image / file upload
- Stripe / card / checkout / payment gateway
- Invoice / payout / finance system
- Automated payment confirmation
- Activity / audit log collection
- Real notification sending (email, SMS)
- Dynamic per-page SEO titles
- Multi-language support
- Customer dashboard

---

## Latest Commits

| Sprint | Commit     | Description                              |
|--------|------------|------------------------------------------|
| 20     | `5db33a7`  | Production readiness audit               |
| 21     | `40d564f`  | Public SEO and trust polish              |
| 22     | `c91901a`  | Public UX conversion polish              |
| 23     | `a601180`  | Public mobile UX polish                  |
| 24     | `4a11c78`  | Production launch and admin training docs|

---

## QA Baseline

| Suite              | Checks | Status |
|--------------------|--------|--------|
| service-requests   | 69     | ✅     |
| marketplace        | 108    | ✅     |
| agent-dashboard    | 83     | ✅     |
| manual-payment     | 273    | ✅     |
| **Total**          | **533**| ✅     |

---

## Hosting

- Latest app deploy: Sprint 23 (`a601180`)
- Sprint 24 was docs-only — no hosting deploy needed.
- Deploy command: `firebase deploy --only hosting`

---

## Key Constraints

- No fake seed data in the system.
- No checkout/payment gateway active.
- No receipt upload implemented.
- Do not change Firestore/Storage rules unless explicitly planned.
- Do not create a new Agent Dashboard.
- Run `npm run build` + all 4 QA scripts before any deploy.
