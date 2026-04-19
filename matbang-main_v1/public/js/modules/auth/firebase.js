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
  apiKey: "AIzaSyCCeJliVkv1_bL1beOLLVGQ4iJu6F-ZE4A",
  authDomain: "midtest4-e87d2.firebaseapp.com",
  databaseURL: "https://midtest4-e87d2-default-rtdb.firebaseio.com",
  projectId: "midtest4-e87d2",
  storageBucket: "midtest4-e87d2.firebasestorage.app",
  messagingSenderId: "679465397361",
  appId: "1:679465397361:web:5effa26bdbc60efd2abfd0",
  measurementId: "G-9HREKCSXVC"
};

// Initialize Firebase

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

// 🔥 TÁCH RÕ
export const firestore = getFirestore(app);   // users / permissions
export const realtimeDb = getDatabase(app);