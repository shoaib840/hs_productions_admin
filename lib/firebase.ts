import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { initializeFirestore, getFirestore, Firestore, setLogLevel } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";
import { getAnalytics, isSupported, Analytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyDxLU4-Cf8j9WcpNLe-YpyJMEhHVrFaDrA",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "hs-productions.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "hs-productions",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "hs-productions.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "951741196507",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:951741196507:web:55c14d7169f0040a4884fe",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-10M365HCC9",
};

// Initialize Firebase (singleton pattern prevents re-initialization errors in Next.js Fast Refresh)
const app: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Initialize Firebase services
const auth: Auth = getAuth(app);

// Suppress internal stream close noise during route changes
if (typeof window !== "undefined") {
  try {
    setLogLevel("error");
  } catch {
    // Ignore log level errors
  }
}

let db: Firestore;
try {
  db = initializeFirestore(app, {
    experimentalAutoDetectLongPolling: true,
  });
} catch {
  db = getFirestore(app);
}

const storage: FirebaseStorage = getStorage(app);

// Initialize Analytics conditionally (only in browser, online, and production to avoid offline/ad-blocker errors)
let analytics: Analytics | null = null;
if (typeof window !== "undefined" && typeof navigator !== "undefined" && navigator.onLine && process.env.NODE_ENV === "production") {
  isSupported()
    .then((supported) => {
      if (supported && navigator.onLine) {
        try {
          analytics = getAnalytics(app);
        } catch {
          // Suppress offline or blocked analytics errors
        }
      }
    })
    .catch(() => {
      // Suppress unsupported environment errors
    });
}

export { app, auth, db, storage, analytics, firebaseConfig };
export default app;
