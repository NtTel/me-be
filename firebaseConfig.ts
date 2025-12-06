
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Safe environment variable access
const getEnv = () => {
  try {
    // @ts-ignore
    return (import.meta && import.meta.env) ? import.meta.env : {};
  } catch {
    return {};
  }
};

const env = getEnv();

// Configuration using Vite environment variables with Hardcoded Fallbacks for Preview
const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || "AIzaSyD4BcKMNU54sbRVIz9qlA5lccyHJg730NA",
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || "askingkisd.firebaseapp.com",
  projectId: env.VITE_FIREBASE_PROJECT_ID || "askingkisd",
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || "askingkisd.firebasestorage.app",
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || "707611534408",
  appId: env.VITE_FIREBASE_APP_ID || "1:707611534408:web:c0bcc4919a29dc7be7247d",
  measurementId: "G-QZTM2MTNS2"
};

// Initialize Firebase
let app;
let auth: any;
let db: any;
let storage: any;
let googleProvider: any;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
  googleProvider = new GoogleAuthProvider();
  console.log("Firebase initialized successfully");
} catch (error) {
  console.error("Firebase initialization failed:", error);
}

export { auth, db, storage, googleProvider };
