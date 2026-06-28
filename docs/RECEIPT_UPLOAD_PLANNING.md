# Receipt Upload Planning

Planning document for a future receipt upload feature for manual payment verification in the DreamsTour Tunisia marketplace.

---

## A. Current State

- Manual payment is handled entirely outside the system:
  - Customer selects a preferred payment method (Wafa Cash / bank transfer / not sure yet).
  - Customer optionally provides a `paymentReference` text (maxLength 300) — a transfer code, Wafa Cash reference, or short note.
  - The admin reviews the request and handles payment confirmation manually (offline).
- **No receipt file upload exists.** No file input, no Storage upload, no preview.
- **No Storage rules have been changed** for receipt upload.
- **No online payment gateway exists.** There is no Stripe, checkout, or card collection.

### Existing upload patterns in the project

The project already has Firebase Storage integration for other purposes:

| Pattern | Path | Auth Required |
|---------|------|---------------|
| Admin listing images | `listing-images/{allPaths=**}` | Admin |
| Admin listing images (legacy) | `listings/{listingId}/{fileName}` | Admin |
| Agent listing images | `agents/{agentId}/listings/{allPaths=**}` | Owner agent or admin |
| Agent profile images | `agents/{agentId}/profile/{fileName}` | Owner agent or admin |
| User profile images | `users/{userId}/profile/{fileName}` | Owner user |
| Demo/seed images | `demo/{category}/{fileName}` | Admin |

All existing write paths require `isSignedIn()` and most require role or ownership checks. The ServiceRequestForm, by contrast, is **public (unauthenticated)** — this is the key design challenge for receipt upload.

---

## B. Why Upload Is Not Implemented Yet

Receipt upload was intentionally deferred because it requires careful planning of:

1. **Storage rules** — the request form is public (unauthenticated), so Storage write rules must either:
   - Allow public write to a restricted path (risky), or
   - Require auth before upload (changes the UX flow).
2. **File type and size limits** — must prevent dangerous file types (executables, HTML/SVG).
3. **Path scoping** — must ensure customers cannot overwrite or read others' receipts.
4. **Admin preview** — admin must be able to view uploaded receipts without exposing them publicly.
5. **No automatic payment confirmation** — upload must not imply payment is verified.

These require a dedicated implementation sprint with explicit owner decisions.

---

## C. Recommended Future Data Model

If receipt upload is implemented, add optional fields to existing `serviceRequests` documents:

```typescript
// Proposed fields on serviceRequests (not implemented)
receiptUrl?: string;          // Firebase Storage download URL
receiptFileName?: string;     // Original file name for admin reference
receiptContentType?: string;  // e.g., "image/jpeg", "application/pdf"
receiptUploadedAt?: string;   // ISO timestamp
receiptStatus?: "not_uploaded" | "submitted" | "reviewed" | "rejected";
```

**Notes:**

- These fields are proposed only. Final names should match existing project conventions (camelCase, consistent with `paymentStatus`, `paymentReference`).
- No new Firestore collection is required — storing receipt metadata directly on `serviceRequests` keeps the data model flat and avoids extra reads.
- `receiptStatus` allows admin to mark a receipt as "reviewed" or "rejected" without requiring a separate subcollection.
- If multiple receipts per request are needed later, a subcollection (`serviceRequests/{id}/receipts`) would be more appropriate.

---

## D. Recommended Storage Path

### Preferred: Upload after request creation

```
service-request-receipts/{serviceRequestId}/{timestamp}-{safeFileName}
```

**Why this is preferred:**

- `serviceRequestId` is known after form submission — the receipt can be uploaded in a follow-up step or linked back to the request immediately.
- Path is naturally scoped per request, preventing cross-request access.
- No orphan cleanup logic needed.

### Alternative: Upload during request form (before request ID exists)

```
temp-receipts/{sessionId}/{timestamp}-{safeFileName}
```

**Tradeoffs:**

- Requires temporary cleanup logic for abandoned uploads.
- `sessionId` must be generated client-side (e.g., a UUID) since there is no auth session for public users.
- More complex to implement correctly.

**Recommendation:** Prefer upload after request creation unless UX requires same-form upload.

---

## E. Required Storage Rules Concept

These are **conceptual guidelines only** — not deployable rule code.

### Checklist for a future Storage rules update

- [ ] **Write access**: Allow create under `service-request-receipts/{serviceRequestId}/` only with a valid `serviceRequestId` matching the request. If public upload is allowed, do not require `request.auth`.
- [ ] **File size limit**: max 5MB (matching existing `isValidFile()` pattern but extended for PDF).
- [ ] **Content type allowlist**: `image/jpeg`, `image/png`, `application/pdf`. Reject all others.
- [ ] **Prevent overwrite**: Use a timestamp or UUID in the filename so users cannot overwrite existing files.
- [ ] **Prevent public delete**: Only admin can delete.
- [ ] **Read access**: Admin can read all. If public must read own receipt (e.g., confirmation page), scope by `serviceRequestId`.
- [ ] **No public listing**: Do not allow `list` on the bucket or path prefix.
- [ ] **No executable files**: Reject `text/html`, `image/svg+xml`, `application/x-*`, etc.

### Special consideration: public unauthenticated upload

Currently, **anyone can submit a service request without logging in**. If receipt upload is added to the same form:

- The request form cannot use `request.auth` in Storage rules because the user is not signed in.
- A safer intermediate approach:
  - Keep the public request form text-only (current state with `paymentReference`).
  - After the request is created, provide a follow-up link where the customer can upload a receipt.
  - The follow-up link could use a request-specific token or simply require the customer to have the request ID (low security but avoids auth requirement).

**If public unauthenticated upload is required**, the Storage path must include a client-generated token or the `serviceRequestId` returned by `createServiceRequest`.

---

## F. Public UX Plan

### Optional upload after request form (recommended flow)

1. Customer submits the public request form (current flow, no changes).
2. On the success page, add a secondary step: "Upload payment receipt (optional)".
3. File input accepts JPG, PNG, PDF only.
4. Helper text: "Accepted: JPG, PNG, PDF. Do not upload card details or personal IDs."
5. The upload is linked to the `serviceRequestId` returned from the submission.
6. Success state says: "Receipt submitted. Our team will review it manually."
7. **No "Pay Now"**, no "Checkout", no automatic confirmation.

### If same-form upload is desired

- Add a file input to ServiceRequestForm with the same constraints as above.
- Upload the file after `createServiceRequest` succeeds (so `serviceRequestId` is available).
- Show upload progress with an existing pattern like `uploadBytesResumable`.

### What must NOT happen

- No card details requested or stored.
- No automatic payment confirmation.
- No "payment verified" badge before admin review.
- No gateway integration.

---

## G. Admin UX Plan

### Payment Info section additions (future)

In the Admin Bookings detail modal, the Payment Info section would be extended with:

- **Receipt**: "Submitted" / "Not submitted" badge
- **File name**: original file name (if submitted)
- **Uploaded date**: ISO timestamp (if submitted)
- **View receipt**: link/button to open the file in a new tab
- **Status**: not_uploaded → submitted → reviewed / rejected (manual toggle)

### What must NOT happen

- No approve/reject payment workflow unless specifically requested in a future sprint.
- No automatic status change when receipt is submitted.
- No "payment confirmed" checkbox that modifies customer-facing behavior.

---

## H. Security Checklist

- [ ] Allow only `image/jpeg`, `image/png`, `application/pdf`.
- [ ] Reject `text/html`, `image/svg+xml`, `application/x-*`, `application/octet-stream`.
- [ ] Max file size: 5MB (consistent with existing project limits).
- [ ] No public bucket listing — deny `list` on all paths.
- [ ] No overwrite — filenames must include timestamp or UUID.
- [ ] No executable or script file types.
- [ ] No card data requested anywhere in the upload form or guidance text.
- [ ] No automatic payment confirmation — always requires admin manual review.
- [ ] Admin-only read access for receipt preview.
- [ ] If public read is needed (e.g., customer confirmation page), scope by `serviceRequestId`.

---

## I. Future Sprint Proposal

### Title: Receipt Upload Implementation with Storage Rules

### Implementation steps:

1. **Storage rules update** (dedicated sprint, rules deployed separately):
   - Add `service-request-receipts/{serviceRequestId}/{fileName}` path.
   - Allow public create (no auth) or limited auth depending on owner decision.
   - Apply file type and size limits.
   - Allow admin read only.

2. **Firestore data model update**:
   - Add `receiptUrl`, `receiptFileName`, `receiptContentType`, `receiptUploadedAt`, `receiptStatus` to `ServiceRequest` type.
   - Add to `CreateServiceRequestInput` if same-form upload, or add a new `uploadReceipt` function.

3. **Upload helper**:
   - Create `uploadServiceRequestReceipt(serviceRequestId, file)` in a new or existing storage service.
   - Reuse existing `uploadBytesResumable` pattern with progress callbacks.

4. **Public upload UI** (optional, on success page or on form):
   - File input with accept types.
   - Upload progress indicator.
   - Helper text and security warnings.

5. **Admin Bookings update**:
   - Add read-only receipt info to Payment Info section.
   - Add "View receipt" link.
   - Add receipt status display.

6. **QA extension**:
   - Add checks for file type/size limits.
   - Add checks for no gateway/no card fields.
   - Add checks for Storage rule patterns.
   - Verify existing QA checks still pass.

7. **Deploy**:
   - Deploy Storage rules first.
   - Deploy hosting after app changes pass QA.

---

## J. Decisions Required Before Implementation

The owner/admin must approve these decisions before implementation begins:

| Decision | Options | Recommendation |
|----------|---------|----------------|
| Allow unauthenticated public upload? | Yes / No (require login/admin follow-up) | Prefer "No" — require request ID from created request; avoid fully public write |
| Accepted file types | JPG + PNG + PDF / JPG + PNG only | JPG + PNG + PDF |
| Max file size | 5MB / 10MB / other | 5MB (match existing project limit) |
| Upload timing | During request form / After request creation (follow-up step) | After request creation (cleaner, avoids orphan files) |
| Admin review workflow | View only / View + mark reviewed/rejected | Start with view only; add reviewed/rejected in a later sprint if needed |
| Receipt expiration / deletion | Never delete / Auto-delete after N days | Never delete automatically (manual cleanup only) |

---

## K. Related Documents

- [Production Launch Checklist](PRODUCTION_LAUNCH_CHECKLIST.md) — current manual payment workflow
- [Admin Training Notes](ADMIN_TRAINING_NOTES.md) — no receipt upload covered yet
- `src/core/services/firebaseStorage.ts` — existing Storage upload helpers
- `src/core/services/agentStorage.ts` — existing agent upload helpers with progress
- `storage.rules` — current Storage rules (no receipt path yet)
