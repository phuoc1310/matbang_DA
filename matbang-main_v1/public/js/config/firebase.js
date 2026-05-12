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
  apiKey: "AIzaSyAdQs6A3-4LZUUnz-A727PZLPwNDQOE3ZE",
  authDomain: "damb-7c12d.firebaseapp.com",
  databaseURL: "https://damb-7c12d-default-rtdb.firebaseio.com",
  projectId: "damb-7c12d",
  storageBucket: "damb-7c12d.firebasestorage.app",
  messagingSenderId: "985606043217",
  appId: "1:985606043217:web:e9f7ad05ee83dc49076a70",
  measurementId: "G-1GC6WG1BVX"
};

// Initialize Firebase

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

// 🔥 TÁCH RÕ
export const firestore = getFirestore(app);   // users / permissions
export const realtimeDb = getDatabase(app);
