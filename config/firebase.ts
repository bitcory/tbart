import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Debug: check if env vars are loaded
console.log('Firebase Config:', {
  apiKey: firebaseConfig.apiKey ? '✓ loaded' : '✗ missing',
  authDomain: firebaseConfig.authDomain ? '✓ loaded' : '✗ missing',
  projectId: firebaseConfig.projectId ? '✓ loaded' : '✗ missing',
  storageBucket: firebaseConfig.storageBucket ? '✓ loaded' : '✗ missing',
  messagingSenderId: firebaseConfig.messagingSenderId ? '✓ loaded' : '✗ missing',
  appId: firebaseConfig.appId ? '✓ loaded' : '✗ missing'
});

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
