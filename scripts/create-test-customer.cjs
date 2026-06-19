/**
 * Create a temporary test customer account for access-control verification.
 * Delete the account after testing with scripts/delete-test-customer.cjs.
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
  const password = process.env.TEST_CUSTOMER_PASSWORD || 'TestCustomer123!';

  let user;
  try {
    user = await auth.createUser({ email, password });
    console.log(`Created test customer: ${email}`);
  } catch (err) {
    if (err.code === 'auth/email-already-in-use') {
      user = await auth.getUserByEmail(email);
      console.log(`Using existing test customer: ${email}`);
    } else {
      throw err;
    }
  }

  await auth.setCustomUserClaims(user.uid, { role: 'customer' });
  await db.collection('users').doc(user.uid).set({
    uid: user.uid,
    email,
    displayName: 'Test Customer',
    role: 'customer',
    createdAt: new Date().toISOString(),
  });

  console.log(`Test customer ready: ${email} / UID ${user.uid}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
