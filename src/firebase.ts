import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA53UvUPYNbs5sBK7Y8dS1-GnidLbmXO3g",
  authDomain: "tour-tunisi.firebaseapp.com",
  projectId: "tour-tunisi",
  storageBucket: "tour-tunisi.firebasestorage.app",
  messagingSenderId: "680331427957",
  appId: "1:680331427957:web:652d180694969fcf62f83c",
  measurementId: "G-2EN7YMMTRK"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const analytics = typeof window !== "undefined" ? getAnalytics(app) : null;
export const auth = getAuth(app);
export const db = getFirestore(app);
