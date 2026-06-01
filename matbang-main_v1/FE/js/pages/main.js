// public/js/pages/main.js
import { initSearchHistory, saveSearchHistory } from '../modules/searchHistory.js';
import { interactionService } from '../services/interactionService.js';

window.PAGE_SIZE = 12;
window.currentPage = 1;

// Helper function to get or generate client user ID
function getClientUserId() {
  let uid = localStorage.getItem("client_user_id");
  if (!uid) {
    uid = "guest_" + Math.random().toString(36).substr(2, 9) + Date.now();
    localStorage.setItem("client_user_id", uid);
  }
  return uid;
}

// --- FEATURE 2: So sánh mặt bằng ---
async function initCompare() {
  // Render floating bar
  let bar = document.getElementById("compareFloatingBar");
  if (!bar) {
    bar = document.createElement("div");
    bar.id = "compareFloatingBar";
    bar.className = "fixed bottom-0 left-0 right-0 bg-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] border-t z-50 p-4 transform transition-transform duration-300 translate-y-full flex justify-between items-center";
    bar.innerHTML = `
      <div class="container mx-auto flex justify-between items-center px-4 max-w-7xl">
        <div class="flex items-center gap-4">
          <div class="bg-blue-100 text-blue-600 p-2 rounded-full hidden md:flex">
             <span class="material-symbols-outlined">compare_arrows</span>
          </div>
          <div>
            <p class="font-bold text-gray-800">Đang chọn <span id="compareCount">0</span>/4 mặt bằng</p>
            <p class="text-xs text-gray-500 hidden md:block">Bạn có thể chọn tối đa 4 mặt bằng để so sánh</p>
          </div>
        </div>
        <div class="flex gap-2">
          <button type="button" onclick="window.clearCompare()" class="px-4 py-2 text-sm border rounded hover:bg-gray-50 text-gray-600">Xóa hết</button>
          <a href="/js/views/sosanh.html" class="px-6 py-2 text-sm font-bold bg-primary text-white rounded hover:bg-primary/90 shadow">So sánh ngay</a>
        </div>
      </div>
    `;
    document.body.appendChild(bar);
  }

  const userId = getClientUserId();
  const list = await interactionService.getCompareList(userId);
  updateCompareUI(list);
}

function updateCompareUI(list) {
  const bar = document.getElementById("compareFloatingBar");
  if (!bar) return;
  
  document.getElementById("compareCount").innerText = list.length;
  if (list.length > 0) {
    bar.classList.remove("translate-y-full");
  } else {
    bar.classList.add("translate-y-full");
  }

  // Update button active state on page if elements exist
  document.querySelectorAll('[class*="compare-btn-"]').forEach(btn => {
    btn.classList.remove("text-primary", "bg-blue-50");
    btn.classList.add("text-gray-700", "bg-white/90");
  });
  
  list.forEach(item => {
    // API returns objects like { listingId: ... }, so handle both string IDs or objects
    const id = typeof item === 'object' ? item.listingId : item;
    document.querySelectorAll(`.compare-btn-${id}`).forEach(btn => {
      btn.classList.add("text-primary", "bg-blue-50");
      btn.classList.remove("text-gray-700", "bg-white/90");
    });
  });
}

window.toggleCompare = async function(id) {
  const userId = getClientUserId();
  
  // Kiểm tra xem đã trong danh sách chưa
  const list = await interactionService.getCompareList(userId);
  const exists = list.some(item => (typeof item === 'object' ? item.listingId : item) === id);
  
  if (!exists && list.length >= 4) {
    alert('Bạn chỉ có thể so sánh tối đa 4 mặt bằng.');
    return;
  }
  
  await interactionService.toggleCompare(userId, id);
  
  // Lấy lại danh sách sau khi toggle
  initCompare();
};

window.clearCompare = async function() {
  const userId = getClientUserId();
  await interactionService.clearCompare(userId);
  updateCompareUI([]);
};

// --- DOM READY ---
document.addEventListener("DOMContentLoaded", () => {
  initCompare();

  const searchInput = document.querySelector("#search");
  if (searchInput) {
    initSearchHistory("search");
    // Ẩn dropdown khi click ngoài
    document.addEventListener("click", (e) => {
      if (!e.target.closest("#search") && !e.target.closest("#searchHistoryDropdown")) {
        document.getElementById("searchHistoryDropdown")?.classList.add("hidden");
      }
    });
  }

  const handleSearchRedirect = async () => {
    const keyword = (document.querySelector("#search")?.value || "").trim();
    const city = document.getElementById("citySelect")?.value || "";
    const type = document.getElementById("type")?.value || "";
    const price = document.getElementById("price")?.value || ""; // format min-max in VND
    const area = document.getElementById("area")?.value || ""; // format min-max in m2

    await saveSearchHistory(keyword, city);

    let minPrice = "";
    let maxPrice = "";
    if (price && price.includes("-")) {
      [minPrice, maxPrice] = price.split("-");
    }

    let minArea = "";
    let maxArea = "";
    if (area && area.includes("-")) {
      [minArea, maxArea] = area.split("-");
    }

    // Nếu đang ở trang timkiem.html thì chỉ update param
    if (window.location.pathname.includes("timkiem")) {
      const url = new URL(window.location);
      url.searchParams.set("keyword", keyword);
      if (city) url.searchParams.set("city", city);
      else url.searchParams.delete("city");
      window.location.href = url.toString();
      return;
    }

    // Chuyển hướng sang trang tìm kiếm với đường dẫn đúng
    const params = new URLSearchParams();
    if (keyword) params.set("keyword", keyword);
    if (city) params.set("city", city);
    if (type) params.set("type", type);
    if (minPrice !== "") params.set("minPrice", minPrice);
    if (maxPrice !== "") params.set("maxPrice", maxPrice);
    if (minArea !== "") params.set("minArea", minArea);
    if (maxArea !== "") params.set("maxArea", maxArea);

    window.location.href = `/js/views/timkiem.html?${params.toString()}`;
  };

  // Gán sự kiện cho nút tìm kiếm
  document.querySelectorAll("#btnSearch").forEach(btn => {
    btn.addEventListener("click", handleSearchRedirect);
  });

  // Gán sự kiện Enter cho ô input
  document.querySelector("#search")?.addEventListener("keypress", (e) => {
    if (e.key === "Enter") handleSearchRedirect();
  });
});