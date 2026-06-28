# Conversion Analytics Planning

Planning document for a future analytics/conversion tracking strategy for the DreamsTour Tunisia marketplace.

---

## A. Current State

- **No analytics events are currently sent.**
- The Firebase Analytics SDK (`@firebase/analytics`) is already installed as a dependency of `firebase` (in `package-lock.json`).
- `src/firebase.ts` imports and initializes `getAnalytics(app)` and exports an `analytics` instance, but no events are dispatched anywhere in the application code.
- No Google Analytics, Meta Pixel, gtag, or `dataLayer` references exist in source files (only in third-party icon font HTML files).
- The marketplace flow is production-ready with 533 passing QA checks.
- The privacy policy page at `src/feature-module/pages/privacy-policy/privacyPolicy.tsx` mentions "cookies and analytics tools" generically.
- Analytics is listed as "advanced analytics dashboard" in `docs/PRODUCTION_LAUNCH_CHECKLIST.md` under intentionally-not-built items.

**Key observation:** Because Firebase Analytics is already initialized in `src/firebase.ts`, the SDK is already bundled in the production build. A future sprint should either remove the unused initialization or implement deliberate event tracking with proper privacy controls.

---

## B. Why Analytics Should Be Planned First

Planning analytics before implementation prevents common issues:

1. **Random events** — teams add events ad-hoc without naming conventions, creating noisy, unusable data.
2. **Duplicate tracking** — multiple developers add similar events with different names.
3. **Privacy leaks** — sensitive data (payment references, phone numbers, names) can accidentally be included in event properties.
4. **Inconsistent naming** — `snake_case`, `camelCase`, and `PascalCase` mixed across events makes querying difficult.
5. **Tool lock-in** — scattering SDK calls makes it hard to switch providers later.
6. **Consent gaps** — adding analytics without consent/privacy review can cause legal issues.

---

## C. Recommended Future Event Map

### Public events

| Event name | When it fires | Allowed properties |
|---|---|---|
| `marketplace_home_view` | Homepage loads | `source` (e.g., "direct", "referral") |
| `marketplace_category_view` | User views a list page (cruise/bus/visa/guide) | `category` |
| `marketplace_service_card_click` | User clicks a service card on list pages | `category`, `serviceId` |
| `marketplace_service_detail_view` | Detail page loads with valid `?id=` | `category`, `serviceId` |
| `request_form_view` | ServiceRequestForm becomes visible on detail page | `category`, `serviceId` |
| `request_form_submit_attempt` | User clicks "Send Request" | `category`, `serviceId`, `hasPreferredPayment` (boolean) |
| `request_form_submit_success` | `createServiceRequest` succeeds | `category`, `serviceId`, `hasPreferredPayment` (boolean), `hasPaymentReference` (boolean) |
| `request_form_submit_error` | `createServiceRequest` fails | `category`, `serviceId` |
| `payment_method_selected` | User selects a payment method in the dropdown | `preferredPaymentMethod` (value only: "wafa_cash", "bank_transfer", "") |

### Admin events (future, only if analytics covers admin flow)

| Event name | When it fires | Allowed properties |
|---|---|---|
| `admin_booking_detail_open` | Admin opens a booking detail modal | `status` |
| `admin_copy_followup_message` | Admin clicks "Copy msg" | none |
| `admin_open_whatsapp_followup` | Admin clicks WhatsApp follow-up link | none |
| `admin_export_bookings_csv` | Admin exports CSV | none |
| `admin_status_changed` | Admin changes request status | `fromStatus`, `toStatus` |
| `admin_followup_date_set` | Admin sets or updates follow-up date | none |

### What must NOT be tracked

- ❌ `customerName`, `customerPhone`, `customerEmail`
- ❌ `message` (the full request message)
- ❌ `paymentReference` (the actual text value)
- ❌ `internalNotes`
- ❌ `receiptUrl`, `receiptFileName`
- ❌ Any credit/debit card data
- ❌ Any bank account details

---

## D. Privacy and Data Minimization Rules

1. **No PII in events.** Never send customer names, phone numbers, email addresses, or full messages as event properties.
2. **No payment values.** Never send `paymentReference` text, receipt URLs, or bank details.
3. **Use booleans instead of values.** Instead of sending the actual `paymentReference` string, send `hasPaymentReference: true`.
4. **Use Firestore IDs for service reference.** Use `serviceId` (Firestore doc ID) rather than storing the full title if the title contains customer-identifying info. Service titles are safe because they are public listings.
5. **Minimize properties.** Only send properties that are needed for the specific analysis question.
6. **No internal notes.** Never send `internalNotes` content.
7. **Consent-first.** If analytics is used, ensure a consent mechanism exists before tracking.
8. **Data retention minimum.** Configure analytics tools to retain data for the shortest practical period.

---

## E. Recommended Event Naming Convention

- **Format:** `snake_case`
- **Prefix:** `marketplace_` for public events, `admin_` for admin events
- **Structure:** `{domain}_{action}_{context}` where applicable

| ✅ Good | ❌ Avoid |
|---|---|
| `marketplace_service_detail_view` | `detailPageView` |
| `request_form_submit_success` | `formSubmitted` |
| `payment_method_selected` | `preferredPaymentMethodChanged` |
| `admin_status_changed` | `button-blue-click` |

---

## F. Recommended Property Naming Convention

| ✅ Good | ❌ Avoid |
|---|---|
| `category` | `cat` |
| `serviceId` | `id`, `service_id` |
| `hasPaymentReference` | `payment_reference` (could imply raw value) |
| `preferredPaymentMethod` | `method` |
| `fromStatus`, `toStatus` | `status` (ambiguous) |
| `source` | `s` |

---

## G. Tool Options for Future Implementation

### 1. Firebase Analytics (already initialized)

| Aspect | Detail |
|---|---|
| **SDK status** | Already imported in `src/firebase.ts`; `analytics` instance exported but unused |
| **Pros** | Part of existing Firebase setup; no new dependency needed; could simplify if app becomes PWA/mobile |
| **Cons** | Web analytics features are limited compared to GA4; consent/privacy still required |
| **Action needed** | Either implement deliberate tracking via `logEvent(analytics, ...)` or remove the unused import/initialization |

### 2. Google Analytics 4

| Aspect | Detail |
|---|---|
| **SDK status** | Not installed (but Firebase Analytics is the web bridge to GA4 for Firebase projects) |
| **Pros** | Industry standard; strong funnel/reporting; free tier |
| **Cons** | Additional setup required; consent banner must be added |
| **Note** | GA4 can be used with or instead of Firebase Analytics via gtag.js |

### 3. Meta Pixel

| Aspect | Detail |
|---|---|
| **SDK status** | Not installed; no `fbq` references |
| **Pros** | Required for Meta Ads optimization/retargeting |
| **Cons** | Privacy-sensitive; requires consent; separate SDK |
| **When** | Only after business decides to run Meta Ads |

### 4. No Third-Party Analytics

| Aspect | Detail |
|---|---|
| **Approach** | Rely only on Firestore operational data (serviceRequests count, Admin Bookings data) |
| **Pros** | Maximum privacy; no consent needed; no extra cost |
| **Cons** | No funnel visualization; no marketing attribution; no real-time visitor insights |

### Recommendation

Do not implement any tool until the owner chooses the analytics purpose:
- **Marketing ads:** Meta Pixel + GA4 required
- **Funnel conversion:** GA4 or Firebase Analytics sufficient
- **Operations monitoring:** Firestore operational data is already sufficient
- **Privacy-first:** No third-party analytics; remove unused Firebase Analytics import

---

## H. Future Implementation Approach

### Future Sprint Title: Analytics Instrumentation with Consent Review

### Implementation steps:

1. **Choose analytics tool and purpose** (owner decision).
2. **Add consent mechanism** if third-party analytics is used.
3. **Create an analytics wrapper** helper (`src/core/services/analytics.ts`) that:
   - Abstracts the specific SDK (Firebase Analytics, GA4, or custom).
   - Provides typed event functions (e.g., `trackRequestSubmitted(...)`).
   - Prevents PII from being passed at the type level.
4. **Remove or keep** the existing Firebase Analytics initialization in `src/firebase.ts` depending on the chosen tool.
5. **Add events** only through the wrapper, not scattered SDK calls.
6. **Add QA checks** to prevent PII tracking:
   - No `customerName`/`customerPhone`/`customerEmail` in event properties
   - No `paymentReference` value sent
   - No `internalNotes` value sent
   - Event names use `snake_case`
   - Analytics wrapper exists
   - No direct gtag/fbq calls outside the wrapper
7. **Build + QA + deploy hosting** (only if app files changed).
8. **Do not change** Firestore/Storage rules unless specifically required.

---

## I. Owner Decisions Required

| Decision | Options | Notes |
|---|---|---|
| 1. Analytics purpose | Marketing / Operations / Both / None | Drives tool choice |
| 2. Tool choice | GA4 / Firebase Analytics / Meta Pixel / None | Only install what is needed |
| 3. Consent banner needed? | Yes / No | Required for third-party analytics in many jurisdictions |
| 4. Ads planned soon? | Yes / No | If yes, Meta Pixel should be planned |
| 5. Track admin actions? | Yes / No | Admin events are low-priority |
| 6. Data retention policy | 2 months / 14 months / 26 months / Custom | Configure in analytics tool |
| 7. Remove unused Firebase Analytics init? | Yes / No (keep for future) | Currently bundled but unused |

---

## J. QA Ideas for Future Implementation

The following checks should be added in the implementation sprint:

- [ ] No `customerName`, `customerPhone`, or `customerEmail` values sent as event properties
- [ ] No `paymentReference` raw text sent
- [ ] No `internalNotes` sent
- [ ] Event names use `snake_case`
- [ ] Analytics wrapper helper exists
- [ ] No direct `gtag`, `fbq`, or `logEvent` calls outside the wrapper
- [ ] No new analytics SDK dependency added beyond the chosen tool
- [ ] No Pay Now / checkout / card payment wording added
- [ ] Manual payment guidance copy remains intact
- [ ] Existing QA checks still pass (533 baseline)

---

## K. Related Documents

- [Production Launch Checklist](PRODUCTION_LAUNCH_CHECKLIST.md) — "Advanced analytics dashboard" listed as not built
- [Receipt Upload Planning](RECEIPT_UPLOAD_PLANNING.md) — future feature plan
- [Admin Training Notes](ADMIN_TRAINING_NOTES.md) — no analytics covered yet
- `src/firebase.ts` — existing Firebase Analytics initialization (unused)
