# DreamsTour / Tour Tunisia

Firestore-backed Tunisia travel marketplace for cruises, buses, visas, and guides, with public request flow, manual payment preference/reference, Admin Bookings CRM, and Agent Dashboard real booking data.

**Live app:** <https://tour-tunisi.web.app>

---

## Quick Start

```bash
npm install
npm run build
npm run dev:5174
```

---

## Production Docs

| Document | Audience |
|----------|----------|
| [Production Launch Checklist](docs/PRODUCTION_LAUNCH_CHECKLIST.md) | Owner / admin |
| [Admin Training Notes](docs/ADMIN_TRAINING_NOTES.md) | Non-technical team |
| [Workflows](docs/WORKFLOWS.md) | Developer workflow |
| [Demo Checklist](docs/MANUAL_DEMO_CHECKLIST.md) | Demo / smoke test |
| [Project Status](PROJECT_STATUS.md) | Current state |
| [Feature Map](FEATURE_MAP.md) | Architecture reference |
| [Agent Rules](AGENT_RULES.md) | Dev agent conventions |
| [Receipt Upload Planning](docs/RECEIPT_UPLOAD_PLANNING.md) | Future feature plan |
| [Conversion Analytics Planning](docs/CONVERSION_ANALYTICS_PLANNING.md) | Future feature plan |

---

## Current Production State

- Homepage discovery is Firestore-powered (FeaturedServices).
- Public list/detail pages for cruises, buses, visas, guides are Firestore-backed.
- ServiceRequestForm writes to `serviceRequests` collection.
- Manual payment method preference + optional payment reference (informational only).
- Admin Bookings CRM is operational: filters, modal, WhatsApp, CSV, status lifecycle.
- Agent Dashboard uses real booking data (no fake invoices/payouts).
- No online card payment is collected.

---

## Commands

```bash
# Build
npm run build

# QA suites
npm run qa:service-requests    # 69 checks
npm run qa:marketplace          # 108 checks
npm run qa:agent-dashboard      # 83 checks
npm run qa:manual-payment       # 273 checks

# Deploy hosting only
firebase deploy --only hosting
```

**Total QA baseline:** 533 passing checks.

---

## Key Constraints

- No fake seed data.
- No checkout / payment gateway.
- No receipt upload yet.
- No invoice / payout / finance system yet.
- Do not create a new Agent Dashboard.
- Do not change Firestore/Storage rules unless the sprint explicitly requires it.
- Do not add new dependencies.
- Deploy hosting only when app/public files changed.

---

## What Is Intentionally Not Built

- Receipt image / file upload ([planning doc](docs/RECEIPT_UPLOAD_PLANNING.md))
- Conversion analytics ([planning doc](docs/CONVERSION_ANALYTICS_PLANNING.md))
- Stripe / card / checkout / payment gateway
- Invoice / payout / finance system
- Automated payment confirmation
- Activity / audit log collection
- Real notification sending (email, SMS)
- Dynamic per-page SEO titles
- Multi-language support
- Customer dashboard

---

## License

Private — DreamsTour Tunisia
