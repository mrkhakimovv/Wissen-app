// src/lib/firebase.ts
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json'; // adjust path

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

// Simple function to ensure anonymous auth is ready
export const ensureAuth = async () => {
  try {
    if (!auth.currentUser) {
      await signInAnonymously(auth);
    }
  } catch (error: any) {
    if (error.code === 'auth/admin-restricted-operation') {
      console.warn("LOCKED: Anonymous authentication is not enabled.");
      throw new Error("Iltimos, Firebase Console'ga kiring va Authentication -> Sign-in method bo'limidan 'Anonymous' (Anonim) usulini yoqing. Bu xafvsizlik qoidalarini ishlashi uchun zarur.");
    }
    throw error;
  }
  return auth.currentUser;
};
