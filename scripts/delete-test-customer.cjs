/**
 * Delete the temporary test customer account created for Phase 1 verification.
 */
const admin = require('firebase-admin');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore } = require('firebase-admin/firestore');

async function main() {
  if (admin.getApps().length === 0) {
    admin.initializeApp({ projectId: 'tour-tunisi' });
  }

  const auth = getAuth();
  const db = getFirestore();
  const email = process.env.TEST_CUSTOMER_EMAIL || 'test-customer-phase1@example.com';

  try {
    const user = await auth.getUserByEmail(email);
    await auth.deleteUser(user.uid);
    await db.collection('users').doc(user.uid).delete();
    console.log(`Deleted test customer: ${email}`);
  } catch (err) {
    if (err.code === 'auth/user-not-found') {
      console.log('Test customer does not exist.');
    } else {
      throw err;
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
