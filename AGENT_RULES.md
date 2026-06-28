# Agent Rules

- Read `PROJECT_STATUS.md` and `FEATURE_MAP.md` before work.
- Do not do a broad repo audit.
- Do not guess credentials.
- Do not commit secrets.
- Do not add fake seed data.
- Do not duplicate existing Agent Dashboard.
- Do not change Firestore/Storage rules unless the sprint explicitly asks.
- Prefer 3-6 files per sprint. Max 8 files.
- Run `npm run build` before any commit.
- Run all 4 QA suites before any commit:
  `npm run qa:service-requests`
  `npm run qa:marketplace`
  `npm run qa:agent-dashboard`
  `npm run qa:manual-payment`
- Deploy hosting only when app/public files changed.
- Deploy Firestore rules only when `firestore.rules` changed.
- Deploy Storage rules only when `storage.rules` changed.
- Commit and push only after build + QA pass.
- Stop if scope expands.
- Prefer medium-size phases over micro-steps.
- Current QA baseline: 533 checks.
