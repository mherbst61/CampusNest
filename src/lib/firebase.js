// src/lib/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FB_API_KEY,
  authDomain: import.meta.env.VITE_FB_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FB_PROJECT_ID,
  appId: import.meta.env.VITE_FB_APP_ID,


  storageBucket: import.meta.env.VITE_FB_STORAGE_BUCKET,

  messagingSenderId: import.meta.env.VITE_FB_MESSAGING_SENDER_ID,
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence);

const db = getFirestore(app);


const storage = getStorage(app, `gs://${firebaseConfig.storageBucket}`);

if (import.meta.env.DEV) {
  console.log("[Firebase] projectId:", firebaseConfig.projectId);
  console.log("[Firebase] storageBucket:", firebaseConfig.storageBucket);
}

export { app, auth, db, storage };
