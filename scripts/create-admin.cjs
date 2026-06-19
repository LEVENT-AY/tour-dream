/**
 * Secure first-admin provisioning script.
 *
 * Usage:
 *   node scripts/create-admin.js
 *
 * Requires one of the following authentication methods:
 *   1. GOOGLE_APPLICATION_CREDENTIALS environment variable pointing to a
 *      Firebase service-account JSON file (recommended for CI/CD).
 *   2. gcloud application-default credentials configured via
 *      `gcloud auth application-default login`.
 *
 * The script:
 *   - Checks whether the admin email already exists in Firebase Authentication.
 *   - Creates the account only if it does not exist.
 *   - Sets a trusted `admin` custom claim.
 *   - Creates/updates the Firestore `users/{uid}` profile with role `admin`.
 *
 * IMPORTANT:
 *   - Never commit service-account keys.
 *   - The temporary initial password must be changed after the first login.
 */

const admin = require('firebase-admin');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore } = require('firebase-admin/firestore');

const TARGET_EMAIL = process.env.ADMIN_EMAIL || 'manager.emtilek@gmail.com';
const TARGET_PASSWORD = process.env.ADMIN_PASSWORD; // Optional; if omitted, existing user is not modified.

async function main() {
  if (admin.getApps().length === 0) {
    admin.initializeApp({ projectId: 'tour-tunisi' });
  }

  const auth = getAuth();
  const db = getFirestore();

  let user;
  let created = false;

  try {
    user = await auth.getUserByEmail(TARGET_EMAIL);
    console.log(`Admin user already exists: ${TARGET_EMAIL}`);
  } catch (err) {
    if (err.code === 'auth/user-not-found') {
      if (!TARGET_PASSWORD) {
        throw new Error(
          `No existing user found for ${TARGET_EMAIL} and ADMIN_PASSWORD is not set. ` +
            'Set ADMIN_PASSWORD to create the initial account.'
        );
      }
      user = await auth.createUser({
        email: TARGET_EMAIL,
        password: TARGET_PASSWORD,
        emailVerified: false,
      });
      created = true;
      console.log(`Created admin user: ${TARGET_EMAIL}`);
    } else {
      throw err;
    }
  }

  // Set custom claim for admin role
  await auth.setCustomUserClaims(user.uid, { role: 'admin' });
  console.log(`Set admin custom claim for UID ${maskUid(user.uid)}`);

  // Create or update Firestore profile
  const profileRef = db.collection('users').doc(user.uid);
  const existing = await profileRef.get();
  const profileData = {
    uid: user.uid,
    email: TARGET_EMAIL,
    displayName: user.displayName || 'Administrator',
    role: 'admin',
    createdAt: existing.exists ? existing.data().createdAt : new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  await profileRef.set(profileData, { merge: true });
  console.log(`${existing.exists ? 'Updated' : 'Created'} Firestore profile for UID ${maskUid(user.uid)}`);

  console.log('\nAdmin provisioning complete.');
  console.log(`  Created: ${created}`);
  console.log(`  Email: ${TARGET_EMAIL}`);
  console.log(`  UID: ${maskUid(user.uid)}`);
  console.log('  Custom claim: { role: "admin" }');
  console.log('\nACTION REQUIRED: Ask the administrator to change their password after first login.');
}

function maskUid(uid) {
  if (!uid || uid.length < 8) return uid;
  return uid.slice(0, 4) + '...' + uid.slice(-4);
}

main().catch((err) => {
  console.error('Admin provisioning failed:', err.message || err);
  process.exit(1);
});
