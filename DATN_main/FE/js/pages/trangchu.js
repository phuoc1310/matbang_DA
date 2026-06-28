

import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import { auth, firestore } from "../config/firebase.js?v=1.0.1";
import { fetchListings } from "../services/api.js?v=1.0.5";
import { renderPage } from "../components/render.js?v=1.0.1";



const guestUI = document.getElementById("guest-actions");
const userUI = document.getElementById("user-actions");
const userName = document.getElementById("user-name");
const btnLogout = document.getElementById("btn-logout");



document.addEventListener("DOMContentLoaded", async () => {
  
  window.PAGE_SIZE = 3;
  window.currentPage = 1;

  
  try {
    const data = await fetchListings({ limit: 3 });
    window.rawData = data || [];
    window.filteredData = [...window.rawData];
    renderPage();
  } catch (error) {
    console.error("Lỗi load tin nổi bật:", error);
    window.rawData = [];
    window.filteredData = [];
    renderPage();
  }

  
  const loadCategoryCount = async (type, elementId) => {
    try {
      const res = await fetch(`/api/listings?type=${encodeURIComponent(type)}&limit=1`);
      if (res.ok) {
        const json = await res.json();
        const count = json.total || 0;
        const el = document.getElementById(elementId);
        if (el) {
          el.textContent = `${count.toLocaleString('vi-VN')}+ địa điểm`;
        }
      }
    } catch (e) {
      console.warn(`Lỗi load count cho ${type}:`, e);
    }
  };

  loadCategoryCount("Nhà ở", "count-nha-o");
  loadCategoryCount("Căn hộ", "count-can-ho");
  loadCategoryCount("Đất", "count-dat");
  loadCategoryCount("Mặt bằng", "count-mat-bang");
});



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



btnLogout?.addEventListener("click", async () => {
  await signOut(auth);
  location.reload();
});
