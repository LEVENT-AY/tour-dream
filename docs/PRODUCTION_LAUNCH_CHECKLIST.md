# Production Launch Checklist

Live site: <https://tour-tunisi.web.app>

---

## 1. Public Marketplace Verification

- [ ] Homepage loads without console errors.
- [ ] "Explore Tunisia Services" section appears when Firestore has published services.
- [ ] Empty categories are hidden (no empty boxes).
- [ ] If all categories are empty, the section hides completely.
- [ ] List pages load and show published items:
  - `/cruise-list`
  - `/bus-list`
  - `/visa-list`
  - `/guide-list`
- [ ] Empty list pages show a friendly "No services available right now" message (not a blank page).
- [ ] Detail pages open with `?id=` in the URL.
- [ ] Detail pages show the Service Request form.
- [ ] No "Pay Now", "checkout", or "card payment" wording appears on public pages.
- [ ] Manual payment guidance is visible on the request form.
- [ ] "Wafa Cash" and "bank transfer" are mentioned as payment options.
- [ ] No "No card payment is collected on the website" statement is missing.
- [ ] Prices on the homepage and detail pages show in TND (not USD `$`).
- [ ] All images have descriptive alt text (no generic `alt="img"`).

---

## 2. Admin Catalog Readiness

Before going live, ensure services are ready:

- [ ] Each category (Cruise, Bus, Visa, Guide) has at least 1 published item.
- [ ] Each published item has:
  - `title` — clear service name
  - `price` > 0 — set in TND
  - `location` or `route` — where the service operates
  - `description` — useful public copy for customers
  - `image` — recommended for homepage display
- [ ] Draft items are kept as drafts (incomplete items not visible to public).
- [ ] Featured toggles are set on items you want shown on the homepage.
- [ ] No fake seed names, addresses, or invoices remain in the system.
- [ ] Admin catalog pages show correct Total / Published / Draft counters.

---

## 3. Request Flow Test

Run a full end-to-end test:

- [ ] Open a public detail page (e.g., a cruise).
- [ ] Fill in the Service Request form with test data.
- [ ] Select a preferred payment method (Wafa Cash or bank transfer).
- [ ] Optionally add a payment reference note.
- [ ] Submit the form.
- [ ] Confirm the success message appears.
- [ ] Log in as admin.
- [ ] Open Admin Bookings.
- [ ] Find the test request in the list.
- [ ] Open the detail modal and verify:
  - Customer info is correct
  - Service info is correct
  - Status is "Pending"
  - Priority is shown
  - Payment method preference is visible
  - Payment reference is shown (if provided)
  - Follow-up date field is empty
  - Internal notes field is empty

---

## 4. Admin Bookings CRM — Daily Operations

- [ ] Can view all incoming service requests in Admin Bookings.
- [ ] Can filter by status (Pending / Contacted / Confirmed / Cancelled).
- [ ] Can filter by payment method (Wafa Cash / Bank transfer / Not sure yet).
- [ ] Can filter by payment status (Not requested / Requested).
- [ ] Can filter by follow-up (Needs follow-up / Today & Overdue / No date).
- [ ] Can filter by assignment (All / Assigned / Unassigned / My Requests).
- [ ] Can open detail modal and see 5 sections:
  - Customer
  - Service Request
  - Operations
  - Payment Info
  - Internal Notes
- [ ] Can update status (Pending → Contacted → Confirmed / Cancelled).
- [ ] Can set priority (Normal / High).
- [ ] Can assign to a team member.
- [ ] Can set a follow-up date.
- [ ] Can add internal notes.
- [ ] Can use "Copy msg" to copy a WhatsApp-friendly follow-up message.
- [ ] Can use WhatsApp link to open chat with the customer.
- [ ] Can use "Copy request summary" to copy all request info.
- [ ] Can export to CSV.
- [ ] Summary chips at the top show: Total / Pending / Unassigned / Needs follow-up / Manual.

---

## 5. Manual Payment Workflow

Important clarifications for the team:

- [ ] No card payment is collected on the website.
- [ ] No Stripe, checkout, or payment gateway is active.
- [ ] Wafa Cash and bank transfer are manual payment methods — the admin handles them outside the system.
- [ ] The customer's payment method preference is informational only.
- [ ] The optional payment reference is a note the customer leaves — it is not automatic proof of payment.
- [ ] Receipt upload is not implemented.
- [ ] Admin confirms payment manually (offline).
- [ ] The follow-up message templates include the correct manual payment instructions.

---

## 6. Agent Dashboard Operations

- [ ] Agents can log in and view their dashboard.
- [ ] Dashboard shows real stats (total listings, recent bookings).
- [ ] Agent booking pages filter by service type:
  - Bus bookings
  - Cruise bookings
  - Visa bookings
  - Activities bookings
  - Guide bookings
  - Cancellation requests
- [ ] Empty states show "No listings yet" / "No invoices yet" — not fake data.
- [ ] No finance or payout workflow exists — invoices show an honest empty state.

---

## 7. Build and QA Commands

```bash
# Full production build
npm run build

# Run all QA checks
npm run qa:service-requests
npm run qa:marketplace
npm run qa:agent-dashboard
npm run qa:manual-payment

# Deploy hosting only (after QA passes)
firebase deploy --only hosting
```

**Do not run** these unless specifically planned:

```bash
firebase deploy --only firestore:rules
firebase deploy --only storage
```

---

## 8. What Is Intentionally Not Built

The following features are **not implemented** and are not expected in this release:

- Receipt image/file upload
- Storage rules for receipts
- Stripe / card / checkout / payment gateway
- Invoice / payout / finance system
- Automated payment confirmation
- Activity / audit log collection
- Real-time notification system (email, SMS)
- Dynamic per-page SEO titles
- Advanced analytics dashboard
- Customer account dashboard
- Multi-language support

---

## 9. Emergency Rollback

If a deploy causes an issue on the live site:

1. Go to [Firebase Console](https://console.firebase.google.com/project/tour-tunisi/hosting) → Hosting.
2. Click the three-dot menu on the latest release.
3. Select **Rollback** and choose a previous working version.

**Known good commits:**

| Sprint | Commit     | Description                        |
|--------|------------|------------------------------------|
| 20     | `5db33a7`  | Production readiness audit         |
| 21     | `40d564f`  | Public SEO and trust polish        |
| 22     | `c91901a`  | Public UX conversion polish        |
| 23     | `a601180`  | Public mobile UX polish            |

If the current deploy is broken, roll back to the most recent known good commit above.

---

## 10. Post-Launch Monitoring

- [ ] Monitor Firebase Console for crash reports and errors.
- [ ] Check that new service requests appear in Admin Bookings daily.
- [ ] Verify homepage FeaturedServices updates when new items are published.
- [ ] Confirm no "Pay Now" / "checkout" wording has been inadvertently added.
- [ ] Keep this checklist updated as the platform evolves.
