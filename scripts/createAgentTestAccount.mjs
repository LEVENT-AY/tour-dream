/**
 * Local test helper: create a customer account for agent-application testing.
 *
 * Usage:
 *   node scripts/createAgentTestAccount.mjs <admin-email> <admin-password> <test-email> <test-password>
 *
 * This script:
 *   - Signs in as an admin using the provided credentials.
 *   - Creates a new Firebase Auth user with email/password via the client SDK.
 *   - Creates a Firestore users/{uid} document with role='customer'.
 *   - Prints the new uid.
 *
 * IMPORTANT: This is for local testing only. Do not use in production.
 */

import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyA53UvUPYNbs5sBK7Y8dS1-GnidLbmXO3g',
  authDomain: 'tour-tunisi.firebaseapp.com',
  projectId: 'tour-tunisi',
  storageBucket: 'tour-tunisi.firebasestorage.app',
  messagingSenderId: '680331427957',
  appId: '1:680331427957:web:652d180694969fcf62f83c',
  measurementId: 'G-2EN7YMMTRK',
};

async function main() {
  const [adminEmail, adminPassword, testEmail, testPassword] = process.argv.slice(2);

  if (!adminEmail || !adminPassword || !testEmail || !testPassword) {
    console.error('Usage: node scripts/createAgentTestAccount.mjs <admin-email> <admin-password> <test-email> <test-password>');
    process.exit(1);
  }

  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);

  console.log('Signing in as admin...');
  await signInWithEmailAndPassword(auth, adminEmail, adminPassword);

  console.log(`Creating test account: ${testEmail}`);
  const credential = await createUserWithEmailAndPassword(auth, testEmail, testPassword);
  const user = credential.user;

  await setDoc(doc(db, 'users', user.uid), {
    uid: user.uid,
    email: testEmail,
    displayName: user.displayName || 'Test Agent Applicant',
    role: 'customer',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  console.log('\nTest account created:');
  console.log(`  Email: ${testEmail}`);
  console.log(`  UID: ${user.uid}`);
  console.log('  Role: customer');
}

main().catch((err) => {
  console.error('createAgentTestAccount failed:', err.message || err);
  process.exit(1);
});
