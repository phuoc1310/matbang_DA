// pages/trangchu.js

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


// ===== DOM =====
const guestUI = document.getElementById("guest-actions");
const userUI = document.getElementById("user-actions");
const userName = document.getElementById("user-name");
const btnLogout = document.getElementById("btn-logout");


// ===== LOAD DATA HOMEPAGE =====
document.addEventListener("DOMContentLoaded", async () => {
  // Đặt cấu hình hiển thị cho trang chủ (chỉ hiện 3 bài)
  window.PAGE_SIZE = 3;
  window.currentPage = 1;

  // Tải danh sách mặt bằng nổi bật từ backend
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

  // Tải số lượng địa điểm thực tế của từng loại hình từ backend
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

  loadCategoryCount("Văn phòng", "count-van-phong");
  loadCategoryCount("Cửa hàng", "count-cua-hang");
  loadCategoryCount("Kho xưởng", "count-kho-xuong");
  loadCategoryCount("Co-working", "count-co-working");
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