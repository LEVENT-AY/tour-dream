/**
 * Trusted Admin SDK script: reject an agent application.
 *
 * Usage:
 *   GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json \
 *     node scripts/rejectAgent.mjs <uid> [reason]
 *
 * This script:
 *   - Sets the Firebase custom claim { role: 'customer' }.
 *   - Updates Firestore users/{uid} with role='customer' and rejection status fields.
 *
 * IMPORTANT: Never commit service-account keys.
 */

import admin from 'firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

function requireServiceAccount() {
  if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    console.error('Set GOOGLE_APPLICATION_CREDENTIALS to the path of your Firebase service account key.');
    process.exit(1);
  }
}

async function main() {
  const uid = process.argv[2];
  const reason = process.argv[3] || '';
  if (!uid) {
    console.error('Usage: node scripts/rejectAgent.mjs <uid> [reason]');
    process.exit(1);
  }

  requireServiceAccount();

  if (admin.getApps().length === 0) {
    admin.initializeApp({ projectId: 'tour-tunisi' });
  }

  const auth = getAuth();
  const db = getFirestore();

  const now = new Date().toISOString();

  await auth.setCustomUserClaims(uid, { role: 'customer' });
  console.log(`Set custom claim { role: "customer" } for ${maskUid(uid)}`);

  await db.collection('users').doc(uid).set(
    {
      role: 'customer',
      agentStatus: 'rejected',
      approved: false,
      suspended: false,
      rejectedAt: now,
      rejectedReason: reason,
      updatedAt: now,
    },
    { merge: true }
  );
  console.log(`Updated Firestore profile for ${maskUid(uid)}`);
}

function maskUid(uid) {
  if (!uid || uid.length < 8) return uid;
  return uid.slice(0, 4) + '...' + uid.slice(-4);
}

main().catch((err) => {
  console.error('rejectAgent failed:', err.message || err);
  process.exit(1);
});
