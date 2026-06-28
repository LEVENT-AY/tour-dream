# Firestore Data Cleanup Report

Generated: Jun 28, 2026
Sprint: 29 — Public Visual Lock & Firestore Data Cleanup Report

## Summary

The following issues originate from Firestore data, not from hardcoded code. Each item below includes a suggested admin action. No automatic deletion is performed.

---

## 1. Guide / Service Images — Screenshots or Non-Professional Images

**Where it appears:** FeaturedServices tiles, detail pages, agent listings
**Example:** A mobile screenshot or low-quality image used as the service image (e.g., `screenshot_2024...png`)
**Why it is data, not code:** The code renders whatever image URL is stored in Firestore. The fallback (`getCategoryFallbackSrc`) only triggers when the image field is empty.
**Suggested action:** An admin should review each document in the `cruises`, `buses`, `visas`, and `guides` Firestore collections and either:
- Upload a proper service photo via the admin panel
- Clear the `image` field so the fallback image appears

---

## 2. Non-Tunisia Listings (Istanbul, Paris, London, etc.)

**Where it appears:** FeaturedServices tiles, service lists, detail pages
**Example:** A cruise or guide listing with `location: "Istanbul"` or `location: "Paris"`
**Why it is data, not code:** The code displays whatever location is stored in Firestore. The homepage and listing pages are Tunisia-focused, but they do not filter by location — they show all items.
**Suggested action:** An admin should:
- Unpublish or delete listings unrelated to Tunisia
- Update the `location` field on any items that should be Tunisia-specific
- For agents located outside Tunisia, consider whether they should be visible on a Tunisia marketplace

---

## 3. Arabic / Non-English Test Titles

**Where it appears:** Service listing pages, FeaturedServices
**Example:** A title stored as `تجربة` (Arabic for "experience") or other test content
**Why it is data, not code:** The code renders `item.title` directly from Firestore.
**Suggested action:** An admin should find and either:
- Update the title to a proper English/French description
- Delete the document if it was created as a test

---

## 4. Missing or Invalid `createdAt` on Listings

**Where it appears:** Agent Dashboard "Recently Added" section
**Example:** Shows "Invalid Date" or empty dash (`—`) for listing date
**Why it is data, not code:** The Agent Dashboard code now handles both missing and invalid dates gracefully (showing `—` or `Date not recorded`). If a date still appears as a dash, the `createdAt` field is either missing or null in Firestore.
**Suggested action:** An admin should:
- Open each listing document in the Firestore console
- Add or correct the `createdAt` field with a valid Firestore timestamp
- Use the format: `{ "createdAt": Timestamp.fromDate(new Date("2026-06-01")) }`

---

## 5. Demo Agent Accounts with Listings

**Where it appears:** Admin panel, agent listings
**Example:** A test/demo agent account that has created listings
**Why it is data, not code:** The application does not filter out demo accounts.
**Suggested action:** An admin should:
- Identify demo agents by checking the `demo` or `isTestAccount` field, or by email pattern
- Unpublish or delete listings from demo accounts
- Optionally, disable or delete the demo agent account

---

## 6. Inconsistent Price Formatting

**Where it appears:** FeaturedServices cards, detail pages
**Example:** Some items have `price: 0` (hides price), others have very high or very low values
**Why it is data, not code:** The code only displays price when `item.price > 0`. Zero or missing prices are hidden, which may confuse users.
**Suggested action:** An admin should:
- Ensure every published listing has a realistic price in TND
- Set unpublished/draft items to have `published: false` rather than `price: 0`

---

## 7. Duplicate or Overlapping Listings

**Where it appears:** Service list pages
**Example:** The same cruise or guide appears multiple times
**Why it is data, not code:** Duplicate documents in Firestore.
**Suggested action:** An admin should use the Firestore console to find and delete duplicate documents, keeping the one with the more complete data.

---

## Appendix: Collections to Review

| Collection | Common Issues |
|---|---|
| `cruises` | missing images, non-Tunisia locations, duplicate entries |
| `buses` | missing route info, placeholder images |
| `visas` | Arabic titles, missing destination |
| `guides` | non-Tunisia locations, invalid createdAt |
| `users` (agents) | demo accounts, incomplete profiles |
| `siteSettings/homepage` | check for stale hero/cta values |

## How to Apply Fixes

All fixes should be performed manually through the Firebase console or the admin panel at `/admin`. Do not modify Firestore data through code or scripts without manual review.
