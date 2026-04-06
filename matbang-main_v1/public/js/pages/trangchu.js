// pages/trangchu.js

import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import { auth, firestore } from "../core/firebase.js";
import { fetchAllData } from "../core/api.js";
import { renderPage } from "../components/render.js";


// ===== DOM =====
const guestUI = document.getElementById("guest-actions");
const userUI = document.getElementById("user-actions");
const userName = document.getElementById("user-name");
const btnLogout = document.getElementById("btn-logout");


// ===== LOAD DATA HOMEPAGE =====
document.addEventListener("DOMContentLoaded", async () => {
  try {
    const data = await fetchAllData(20, "");

    window.rawData = data || [];

    // fake ranking tạm (sẽ sửa sau)
    window.filteredData = window.rawData.map(item => ({
      ...item,
      score: Math.random()
    }));

    window.filteredData.sort((a, b) => b.score - a.score);

    renderPage();

  } catch (error) {
    console.error("Lỗi load trang chủ:", error);
    window.filteredData = [];
    renderPage();
  }
});


// ===== AUTH =====
onAuthStateChanged(auth, async (user) => {
  if (user) {
    guestUI?.classList.add("hidden");
    userUI?.classList.remove("hidden");

    if (userName) {
      try {
        const ref = doc(firestore, "users", user.uid);
        const snap = await getDoc(ref);

        if (snap.exists()) {
          userName.textContent = snap.data().displayName || user.email;
        } else {
          userName.textContent = user.email;
        }
      } catch {
        userName.textContent = user.email;
      }
    }

  } else {
    guestUI?.classList.remove("hidden");
    userUI?.classList.add("hidden");
  }
});


// ===== LOGOUT =====
btnLogout?.addEventListener("click", async () => {
  await signOut(auth);
  location.reload();
});