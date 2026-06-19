/**
 * Trusted Admin SDK script: approve an agent.
 *
 * Usage:
 *   GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json \
 *     node scripts/approveAgent.mjs <uid>
 *
 * This script:
 *   - Sets the Firebase custom claim { role: 'agent' }.
 *   - Updates Firestore users/{uid} with role='agent' and approval status fields.
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
    console.error('Usage: node scripts/approveAgent.mjs <uid>');
    process.exit(1);
  }

  requireServiceAccount();

  if (admin.getApps().length === 0) {
    admin.initializeApp({ projectId: 'tour-tunisi' });
  }

  const auth = getAuth();
  const db = getFirestore();

  const now = new Date().toISOString();

  await auth.setCustomUserClaims(uid, { role: 'agent' });
  console.log(`Set custom claim { role: "agent" } for ${maskUid(uid)}`);

  const profileRef = db.collection('users').doc(uid);
  const existing = await profileRef.get();
  const profileData = {
    uid,
    role: 'agent',
    agentStatus: 'approved',
    approved: true,
    suspended: false,
    approvedAt: now,
    updatedAt: now,
  };
  if (!existing.exists) {
    const user = await auth.getUser(uid);
    profileData.email = user.email || '';
    profileData.displayName = user.displayName || '';
    profileData.createdAt = now;
  }
  await profileRef.set(profileData, { merge: true });
  console.log(`Updated Firestore profile for ${maskUid(uid)}`);
}

function maskUid(uid) {
  if (!uid || uid.length < 8) return uid;
  return uid.slice(0, 4) + '...' + uid.slice(-4);
}

main().catch((err) => {
  console.error('approveAgent failed:', err.message || err);
  process.exit(1);
});
