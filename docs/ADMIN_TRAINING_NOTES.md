# Admin Training Notes

*Plain-language guide for the DreamsTour Tunisia team.*

---

## 1. How to Add a New Service

1. Log in as Admin.
2. Open the Admin Dashboard.
3. Choose a category from the sidebar:
   - **Cruises** – boat trips / sea tours
   - **Buses** – intercity transport
   - **Visas** – visa assistance services
   - **Guides** – local tour guides
4. Click **Add New**.
5. Fill in the required fields:
   - **Title** – the service name customers will see
   - **Price** – in TND (Tunisian Dinar)
   - **Location or Route** – where the service takes place
   - **Description** – explain what's included
   - **Image** – optional but recommended for homepage visibility
6. Choose a status:
   - **Draft** – save without publishing (invisible to customers)
   - **Publish** – make visible on the public site
7. Click **Save**.

---

## 2. Draft vs. Published

| Status    | Visible to customers? | Visible to admin? |
|-----------|----------------------|-------------------|
| **Draft** | No                   | Yes               |
| **Published** | Yes              | Yes               |

- Use **Draft** while you're still preparing the listing.
- Switch to **Published** only when the service is ready and accurate.
- Draft items never appear on the homepage or list pages.

---

## 3. What Makes a Service Ready to Publish

A good published service has:

- **Clear title** — "Hammamet to Tunis Express Bus" not "Bus 1"
- **Price > 0** — always set a price in TND. If price varies, write it in the description.
- **Location or route** — customers need to know where the service operates.
- **Description** — 2-3 sentences explaining what's included.
- **Image** — recommended so it shows on the homepage Featured Services section.

**Avoid:**
- Leaving price at 0 (shows as "Price on request" — acceptable but less clear)
- Generic titles like "Service" or "New Item"
- Publishing without a description

---

## 4. How Customer Requests Arrive

1. A visitor browses the public site.
2. They open a service detail page.
3. They fill in the **Service Request form** (name, contact, date, etc.).
4. They optionally select a preferred payment method and add a payment note.
5. They click **Send Request**.
6. The request instantly appears in your **Admin Bookings** panel.

**There is no automatic email or SMS notification.** You need to check Admin Bookings regularly for new requests.

---

## 5. How to Follow Up by WhatsApp

1. Open Admin Bookings → find the request.
2. Click the request row to open the detail modal.
3. In the **Customer** section, click the **WhatsApp** icon.
4. A pre-written message opens in WhatsApp with the customer's phone number.
5. Review the message, edit if needed, and send.

Alternatively:
- Click **Copy msg** to copy the follow-up text to your clipboard.
- Paste it into WhatsApp manually.

The follow-up message changes based on the request status:
- **Pending:** "checking availability... will share manual payment next step"
- **Contacted:** "Let us know if you need help with the manual payment step"
- **Confirmed:** "Our team will share the manual payment instructions and next steps"
- **Cancelled:** "could not proceed at this time"

---

## 6. How to Use Statuses

Each request has one of four statuses:

| Status      | Meaning                                      |
|-------------|----------------------------------------------|
| **Pending** | New request, not yet reviewed                |
| **Contacted** | You've reached out to the customer         |
| **Confirmed** | Service is confirmed, sharing payment info |
| **Cancelled** | Request cannot be fulfilled                 |

**Typical workflow:**
1. New request arrives → **Pending**
2. You contact the customer → change to **Contacted**
3. Customer agrees → change to **Confirmed**
4. If the service is not available → change to **Cancelled**

Change the status in the detail modal by selecting from the dropdown. The WhatsApp follow-up message automatically adjusts based on the status.

---

## 7. How to Use Payment Method & Reference

**Preferred Payment Method** — the customer tells you how they'd like to pay:
- Wafa Cash
- Bank transfer
- Not sure yet (they haven't decided)

This is **informational only**. No payment is processed on the website. You handle the payment outside the system (by phone, in person, or via bank transfer).

**Payment Reference** — the customer can optionally add a note:
- A Wafa Cash code
- A bank transfer reference number
- Any short note about payment

This is **not automatic proof of payment**. Always verify manually.

**Important:**
- Never ask customers for card details through the request form or WhatsApp.
- Never treat a payment reference as confirmed without manual verification.

---

## 8. How to Use Internal Notes

Internal notes are visible **only to admin team members**. Customers never see them.

Use internal notes for:
- Reminders to yourself or teammates
- Special instructions about a request
- Follow-up history
- Anything the customer does not need to see

To add a note:
1. Open the request detail modal.
2. Scroll to **Internal Notes**.
3. Type your note and click **Save**.

---

## 9. How to Export CSV

1. Open Admin Bookings.
2. Apply the filters you want (status, payment method, assignment, etc.).
3. Click the **CSV Export** button.
4. A `.csv` file downloads with all visible requests.
5. Open it in Excel, Google Sheets, or any spreadsheet tool.

The CSV includes:
- Customer name, phone, email
- Service title and type
- Status, priority, assignment
- Payment method, status, and reference
- Follow-up date and last contacted date
- Internal notes

---

## 10. What Agents Can See

Agents have their own dashboard. They can see:
- Their own stats (total listings, recent bookings)
- Booking requests assigned to them, filtered by service type:
  - Bus bookings
  - Cruise bookings
  - Visa bookings
  - Activity bookings
  - Guide bookings
  - Cancellation requests

Agents **cannot** see:
- Other agents' bookings
- Admin Bookings (the full CRM)
- Internal notes from other agents
- Payment info from other agents' requests

The agent dashboard shows honest empty states — no fake invoices, no fake earnings.

---

## 11. What NOT to Do

- **Do not** promise instant confirmation. Every request is manually reviewed.
- **Do not** ask customers for credit/debit card details — not on the form, not on WhatsApp.
- **Do not** treat a payment reference as automatic proof of payment. Always verify.
- **Do not** edit Firestore rules or Storage rules unless you are certain of the change.
- **Do not** run `firebase deploy --only firestore:rules` or `firebase deploy --only storage` without developer guidance.
- **Do not** publish fake or placeholder listings with invented names/addresses.
- **Do not** expect automated payment confirmation — it does not exist yet.

---

## 12. Quick Troubleshooting

| Problem | Likely Cause | Solution |
|---------|-------------|----------|
| New service not showing on homepage | Not published or not featured | Check Published status and Featured toggle |
| Request form not submitting | Missing required field | Check customer name and at least one contact method |
| WhatsApp link not working | Missing or invalid phone number | Ask customer for a valid phone number manually |
| CSV export downloads but is empty | Filters are too restrictive | Clear filters and try again |
| Agent dashboard shows no data | Agent has no listings or bookings | Create listings under the agent's account |

---

## 13. Need Help?

- For platform issues, check the `docs/PRODUCTION_LAUNCH_CHECKLIST.md`.
- For development or code changes, contact the development team.
- Firebase Console: <https://console.firebase.google.com/project/tour-tunisi/overview>
- Live site: <https://tour-tunisi.web.app>
