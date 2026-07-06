import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBVR0ETWbuWiV4bWGgslbEdonnuu_LPh_I",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "rythm-3d705.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "rythm-3d705",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "rythm-3d705.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "872586681017",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:872586681017:web:ce7e01b6b0041f9e78d968"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
