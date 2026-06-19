/**
 * Trusted Admin SDK script: suspend an approved agent.
 *
 * Usage:
 *   GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json \
 *     node scripts/suspendAgent.mjs <uid>
 *
 * This script:
 *   - Keeps the existing custom claim role='agent'.
 *   - Updates Firestore users/{uid} with agentStatus='suspended' and suspended=true.
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
  if (!uid) {
    console.error('Usage: node scripts/suspendAgent.mjs <uid>');
    process.exit(1);
  }

  requireServiceAccount();

  if (admin.getApps().length === 0) {
    admin.initializeApp({ projectId: 'tour-tunisi' });
  }

  const auth = getAuth();
  const db = getFirestore();

  const now = new Date().toISOString();

  const user = await auth.getUser(uid);
  const claims = user.customClaims || {};
  if (claims.role !== 'agent') {
    console.warn(`Warning: user ${maskUid(uid)} does not have role='agent' claim (current: ${claims.role || 'none'})`);
  }

  await db.collection('users').doc(uid).set(
    {
      agentStatus: 'suspended',
      approved: true,
      suspended: true,
      suspendedAt: now,
      updatedAt: now,
    },
    { merge: true }
  );
  console.log(`Suspended agent ${maskUid(uid)}`);
}

function maskUid(uid) {
  if (!uid || uid.length < 8) return uid;
  return uid.slice(0, 4) + '...' + uid.slice(-4);
}

main().catch((err) => {
  console.error('suspendAgent failed:', err.message || err);
  process.exit(1);
});
