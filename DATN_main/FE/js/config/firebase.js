import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";


const firebaseConfig = {
  apiKey: "AIzaSyAdQs6A3-4LZUUnz-A727PZLPwNDQOE3ZE",
  authDomain: "damb-7c12d.firebaseapp.com",
  projectId: "damb-7c12d",
  storageBucket: "damb-7c12d.firebasestorage.app",
  messagingSenderId: "985606043217",
  appId: "1:985606043217:web:e9f7ad05ee83dc49076a70",
  measurementId: "G-1GC6WG1BVX"
};


const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);

export const firestore = getFirestore(app);
export const realtimeDb = getDatabase(app);
