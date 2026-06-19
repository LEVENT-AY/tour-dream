import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyA53UvUPYNbs5sBK7Y8dS1-GnidLbmXO3g",
  authDomain: "tour-tunisi.firebaseapp.com",
  projectId: "tour-tunisi",
  storageBucket: "tour-tunisi.firebasestorage.app",
  messagingSenderId: "680331427957",
  appId: "1:680331427957:web:652d180694969fcf62f83c",
  measurementId: "G-2EN7YMMTRK"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const main = async () => {
  const [email, password] = process.argv.slice(2);
  const cred = await signInWithEmailAndPassword(auth, email, password);
  console.log('UID:', cred.user.uid);
  const snap = await getDoc(doc(db, 'users', cred.user.uid));
  if (snap.exists()) {
    console.log('Firestore user doc:', snap.data());
  } else {
    console.log('No Firestore user doc found.');
  }
};

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
