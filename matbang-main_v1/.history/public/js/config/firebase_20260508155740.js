// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDCHRIOffuKJMD2fUn7L4jD4gZBi-WcmZk",
  authDomain: "damb-d6ead.firebaseapp.com",
  // Realtime Database URL (fixes: FIREBASE WARNING: Firebase error...)
  databaseURL: "https://damb-d6ead-default-rtdb.firebaseio.com",
  projectId: "damb-d6ead",
  storageBucket: "damb-d6ead.firebasestorage.app",
  messagingSenderId: "168988939636",
  appId: "1:168988939636:web:4c88004bc46cd3fa83c821",
  measurementId: "G-KP8B846FNK"
};

// Initialize Firebase

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

// 🔥 TÁCH RÕ
export const firestore = getFirestore(app);   // users / permissions
export const realtimeDb = getDatabase(app);
