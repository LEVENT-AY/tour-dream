/**
 * Trusted Admin SDK script: sync custom claims for approved agents.
 *
 * Usage:
 *   GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json \
 *     node scripts/syncAgentClaims.mjs
 *
 * This script:
 *   - Iterates all users where agentStatus=='approved' and role!='agent'.
 *   - Sets the custom claim { role: 'agent' }.
 *   - Updates Firestore users/{uid} with role='agent'.
 *   - Reports counts.
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
  requireServiceAccount();

  if (admin.getApps().length === 0) {
    admin.initializeApp({ projectId: 'tour-tunisi' });
  }

  const auth = getAuth();
  const db = getFirestore();

  const snapshot = await db.collection('users')
    .where('agentStatus', '==', 'approved')
    .where('role', '!=', 'agent')
    .get();

  let updated = 0;
  let failed = 0;

  for (const docSnap of snapshot.docs) {
    const uid = docSnap.id;
    try {
      await auth.setCustomUserClaims(uid, { role: 'agent' });
      await docSnap.ref.set({ role: 'agent', updatedAt: new Date().toISOString() }, { merge: true });
      updated++;
      console.log(`Synced ${maskUid(uid)}`);
    } catch (err) {
      failed++;
      console.error(`Failed to sync ${maskUid(uid)}:`, err.message || err);
    }
  }

  console.log('\nSync complete:');
  console.log(`  Approved users without role='agent': ${snapshot.size}`);
  console.log(`  Updated successfully: ${updated}`);
  console.log(`  Failed: ${failed}`);
}

function maskUid(uid) {
  if (!uid || uid.length < 8) return uid;
  return uid.slice(0, 4) + '...' + uid.slice(-4);
}

main().catch((err) => {
  console.error('syncAgentClaims failed:', err.message || err);
  process.exit(1);
});
