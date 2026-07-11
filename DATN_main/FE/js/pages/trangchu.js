

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


  // ===== TẢI DỮ LIỆU =====
  try {
    const data = await fetchListings({ limit: 8, sort: 'views' });
    window.rawData = data || [];
    window.filteredData = [...window.rawData];
    renderPage();
  } catch (error) {
    console.error("Lỗi load tin nổi bật:", error);
    window.rawData = [];
    window.filteredData = [];
    renderPage();
  }

  // ===== GỢI Ý DỰA TRÊN LỊCH SỬ XEM (CÁCH 2) =====
  // Tính năng này đã được chuyển xuống xử lý trong onAuthStateChanged (chỉ hiển thị khi đã đăng nhập)


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

  // Logic chuyển trang cho form tìm kiếm Trang chủ
  const btnSearch = document.getElementById("btnSearch");
  if (btnSearch) {
    btnSearch.addEventListener("click", () => {
      const keyword = document.getElementById("search")?.value || "";
      const city = document.getElementById("citySelect")?.value || "";
      const type = document.getElementById("type")?.value || "";
      const price = document.getElementById("price")?.value || "";
      const area = document.getElementById("area")?.value || "";

      const url = new URL("/js/views/timkiem.html", window.location.origin);
      if (keyword) url.searchParams.set("keyword", keyword);
      if (city) url.searchParams.set("city", city);
      if (type) url.searchParams.set("type", type);

      if (price) {
        const [min, max] = price.split("-");
        if (min) url.searchParams.set("minPrice", min);
        if (max) url.searchParams.set("maxPrice", max);
      }
      if (area) {
        const [min, max] = area.split("-");
        if (min) url.searchParams.set("minArea", min);
        if (max) url.searchParams.set("maxArea", max);
      }

      window.location.href = url.toString();
    });
  }


});



async function loadHistorySuggestions(userId) {
  try {
    const key = userId ? `viewed_listings_${userId}` : 'viewed_listings';
    const viewed = JSON.parse(localStorage.getItem(key) || '[]');
    if (viewed.length > 0) {
      const secHistory = document.getElementById("sec-history-suggest");
      const containerHistory = document.getElementById("history-listing");
      const subtitle = document.getElementById("history-suggest-subtitle");

      if (secHistory && containerHistory) {
        // ===== THUẬT TOÁN V3: Weighted Scoring (Chấm điểm theo Trọng số) =====
        const recentHistory = viewed.slice(0, 10); // Phân tích 10 mặt bằng xem gần nhất

        // 1. Tính tần suất Quận (cho trọng số Vị trí 50%)
        const districtCounts = {};
        recentHistory.forEach(v => { if (v.district) districtCounts[v.district] = (districtCounts[v.district] || 0) + 1; });

        // 2. Tính tần suất Loại hình (cho trọng số Loại hình 20%)
        const typeCounts = {};
        recentHistory.forEach(v => { if (v.type) typeCounts[v.type] = (typeCounts[v.type] || 0) + 1; });

        // 3. Tính Giá trung bình (cho trọng số Giá 30%)
        const validPrices = recentHistory.filter(v => v.price > 0).map(v => v.price);
        const avgPrice = validPrices.length > 0 ? validPrices.reduce((a, b) => a + b, 0) / validPrices.length : 0;

        // 4. Gửi hồ sơ hành vi lên Backend để chấm điểm
        const excludeIds = recentHistory.map(v => v.id);
        const res = await fetch('/api/listings/recommendations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            districts: districtCounts,
            types: typeCounts,
            avgPrice,
            excludeIds,
            limit: 8
          })
        });

        if (!res.ok) throw new Error('Recommendation API failed');
        const json = await res.json();
        const histData = (json.data || []).slice(0, 4);

        if (histData.length > 0) {
          // Hiển thị subtitle thông minh
          if (subtitle) {
            const topDistrict = Object.keys(districtCounts).sort((a, b) => districtCounts[b] - districtCounts[a])[0];
            const topType = Object.keys(typeCounts).sort((a, b) => typeCounts[b] - typeCounts[a])[0];
            let reason = "Dựa trên sở thích của bạn";
            if (topType && topDistrict) {
              reason = `Vì bạn thường tìm kiếm ${topType.toLowerCase()} ở ${topDistrict}`;
            } else if (topDistrict) {
              reason = `Dành cho bạn tại khu vực ${topDistrict}`;
            }
            subtitle.textContent = reason;
          }

          let html = '';
          histData.forEach(sItem => {
            const img = sItem.image || 'https://placehold.co/600x400?text=No+Image';
            const price = sItem.price_string || (sItem.price ? `${(sItem.price / 1000000).toLocaleString('vi-VN')} triệu/tháng` : 'Thỏa thuận');
            const area = sItem.area_m2 || sItem.area || sItem.size || 0;
            const matchPercent = Math.round(sItem._score || 0);

            // Màu badge theo mức độ phù hợp
            let badgeColor = 'bg-green-500';
            if (matchPercent < 50) badgeColor = 'bg-yellow-500';
            if (matchPercent < 30) badgeColor = 'bg-orange-500';

            html += `
             <a href="/js/views/chitiet.html?id=${sItem.id}" class="block group bg-white rounded-xl shadow-sm hover:shadow-md transition border border-gray-100 overflow-hidden">
               <div class="relative h-40">
                 <img src="${img}" class="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                 <div class="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded font-bold">${sItem.type || sItem.category || 'Mặt bằng'}</div>
               </div>
               <div class="p-4">
                 <h4 class="font-bold text-gray-900 truncate mb-1">${sItem.title}</h4>
                 <p class="text-xs text-gray-500 truncate mb-2"><span class="material-symbols-outlined text-[12px] align-middle">location_on</span> ${sItem.district || sItem.address || 'Đang cập nhật'}</p>
                 <div class="flex justify-between items-end mt-2">
                   <span class="text-primary font-bold">${price}</span>
                   <span class="text-xs text-gray-500">${area} m²</span>
                 </div>
               </div>
             </a>
            `;
          });
          containerHistory.innerHTML = html;
          secHistory.classList.remove("hidden");
        }
      }
    }
  } catch (e) {
    console.warn("Lỗi load lịch sử gợi ý:", e);
  }
}

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

    // Gọi tải gợi ý lịch sử khi người dùng đã đăng nhập
    await loadHistorySuggestions(user.uid);

  } else {
    guestUI?.classList.remove("hidden");
    userUI?.classList.add("hidden");

    // Ẩn phần gợi ý nếu người dùng chưa đăng nhập
    const secHistory = document.getElementById("sec-history-suggest");
    if (secHistory) {
      secHistory.classList.add("hidden");
    }
  }
});



btnLogout?.addEventListener("click", async () => {
  await signOut(auth);
  location.reload();
});
