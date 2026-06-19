# Secure Administration & Testing Scripts

This directory contains trusted, one-time scripts for Firebase administration and security rule testing.

## Security Notes

- Never commit service-account JSON files.
- Never hardcode passwords in these scripts or in source code.
- Always pass secrets via environment variables.
- Delete temporary service-account keys immediately after use.

## create-admin.cjs

Securely provisions the first administrator account.

### Requirements

- A Firebase service-account key with Owner or Firebase Admin roles, **or**
- gcloud application-default credentials with sufficient permissions.

### Usage

```bash
# Using a service-account key (recommended)
export GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
export ADMIN_EMAIL=manager.emtilek@gmail.com
export ADMIN_PASSWORD="ChangeMe123!"
node scripts/create-admin.cjs
```

On Windows PowerShell:

```powershell
$env:GOOGLE_APPLICATION_CREDENTIALS = "C:\path\to\service-account.json"
$env:ADMIN_EMAIL = "manager.emtilek@gmail.com"
$env:ADMIN_PASSWORD = "ChangeMe123!"
node scripts/create-admin.cjs
```

The script:

1. Checks whether the email already exists in Firebase Authentication.
2. Creates the account only if it does not exist.
3. Sets the Firebase custom claim `{ role: "admin" }`.
4. Creates or updates the Firestore `users/{uid}` profile with `role: "admin"`.

After running, ask the administrator to change their password on first login.

## test-firestore-rules.cjs

Validates `firestore.rules` against real scenarios using the Firebase Emulator.

### Requirements

- Java 21 or newer.
- Firestore emulator downloaded by `firebase emulators:start --only firestore` at least once.

### Usage

Start the Firestore emulator manually (required because the project path contains characters that `firebase emulators:exec` cannot pass correctly):

```bash
java -Dgoogle.cloud_firestore.debug_log_level=FINE \
  -Duser.language=en \
  -jar ~/.cache/firebase/emulators/cloud-firestore-emulator-v1.21.0.jar \
  --host 127.0.0.1 --port 8080 --websocket_port 9150 \
  --database-edition standard --project_id tour-tunisi-test \
  --rules firestore.rules --single_project_mode true
```

Then in another terminal:

```bash
npm run test:rules:firestore
```

## test-storage-rules.cjs

Validates `storage.rules` using the Firebase Emulator.

### Usage

Start the Storage emulator:

```bash
npx firebase emulators:start --only storage --project=tour-tunisi-test
```

Then in another terminal:

```bash
npm run test:rules:storage
```

## test-runtime-routes.cjs

Uses Playwright to verify route protection in the running Vite dev server.

### Usage

```bash
npm run dev
npm run test:routes
```

Set `BASE_URL` if the dev server runs on a different port:

```bash
BASE_URL=http://localhost:5176 npm run test:routes
```

## Agent Approval Scripts

These trusted Admin SDK scripts manage agent promotion, rejection, suspension, and claim synchronization. All require `GOOGLE_APPLICATION_CREDENTIALS` to point to a Firebase service-account key.

```bash
export GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json

node scripts/approveAgent.mjs <uid>
node scripts/rejectAgent.mjs <uid> [reason]
node scripts/suspendAgent.mjs <uid>
node scripts/syncAgentClaims.mjs
```

- `approveAgent.mjs` sets `{ role: "agent" }` custom claim and updates Firestore with `role="agent"`, `agentStatus="approved"`, `approved=true`.
- `rejectAgent.mjs` sets `{ role: "customer" }` custom claim and updates Firestore with `role="customer"`, `agentStatus="rejected"`, `approved=false`.
- `suspendAgent.mjs` keeps the `agent` custom claim and updates Firestore with `agentStatus="suspended"`, `suspended=true`.
- `syncAgentClaims.mjs` finds all users where `agentStatus=="approved"` but `role!="agent"`, then sets the claim and role.

## createAgentTestAccount.mjs

Local helper to create a test customer account for the `/become-agent` flow.

```bash
node scripts/createAgentTestAccount.mjs <admin-email> <admin-password> <test-email> <test-password>
```

This uses the Firebase client SDK (signed in as the provided admin) to create the test Auth user and the `users/{uid}` document with `role="customer"`. The new uid is printed to the console.
