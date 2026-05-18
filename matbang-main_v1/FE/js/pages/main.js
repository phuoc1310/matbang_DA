// public/js/pages/main.js
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

// --- FEATURE 1: Lịch sử tìm kiếm ---
async function saveSearchHistory(paramsObj) {
  if (!paramsObj.keyword && !paramsObj.city) return;
  const userId = getClientUserId();
  try {
    await fetch("/api/interactions/history", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, ...paramsObj })
    });
  } catch(err) {
    console.error("Lỗi save history:", err);
  }
}

// --- Inject CSS cho Search History Dropdown ---
(function injectSearchHistoryCSS() {
  if (document.getElementById('sh-dropdown-styles')) return;
  const style = document.createElement('style');
  style.id = 'sh-dropdown-styles';
  style.textContent = `
    .sh-dropdown {
      display: none;
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      z-index: 999;
      margin-top: 6px;
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      box-shadow: 0 12px 40px rgba(0,0,0,0.1), 0 2px 8px rgba(0,0,0,0.06);
      overflow: hidden;
      animation: shSlideIn 0.22s cubic-bezier(.4,0,.2,1);
    }
    .dark .sh-dropdown {
      background: #1e293b;
      border-color: #334155;
      box-shadow: 0 12px 40px rgba(0,0,0,0.35);
    }
    @keyframes shSlideIn {
      from { opacity: 0; transform: translateY(-8px) scale(0.98); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }
    .sh-dropdown.show { display: block; }

    .sh-dropdown-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px 8px 16px;
      border-bottom: 1px solid #f1f5f9;
    }
    .dark .sh-dropdown-header { border-color: #334155; }
    .sh-dropdown-header .sh-title {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #94a3b8;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .sh-dropdown-header .sh-title .material-symbols-outlined { font-size: 16px; }
    .sh-dropdown-clear {
      font-size: 12px;
      color: #ef4444;
      cursor: pointer;
      font-weight: 600;
      padding: 3px 10px;
      border-radius: 8px;
      border: none;
      background: transparent;
      transition: all 0.15s;
    }
    .sh-dropdown-clear:hover { background: #fef2f2; color: #dc2626; }
    .dark .sh-dropdown-clear:hover { background: rgba(127,29,29,0.2); }

    .sh-dropdown-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 11px 16px;
      cursor: pointer;
      transition: all 0.15s;
      font-size: 14px;
      color: #334155;
      border-left: 3px solid transparent;
    }
    .dark .sh-dropdown-item { color: #e2e8f0; }
    .sh-dropdown-item:hover {
      background: #f8fafc;
      border-left-color: #137fec;
    }
    .dark .sh-dropdown-item:hover {
      background: #334155;
      border-left-color: #137fec;
    }
    .sh-dropdown-item:last-child { border-radius: 0 0 16px 16px; }
    .sh-dropdown-item .sh-icon-wrap {
      width: 32px;
      height: 32px;
      border-radius: 10px;
      background: #f1f5f9;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .dark .sh-dropdown-item .sh-icon-wrap { background: #334155; }
    .sh-dropdown-item .sh-icon-wrap .material-symbols-outlined {
      font-size: 18px;
      color: #94a3b8;
    }
    .sh-dropdown-item:hover .sh-icon-wrap {
      background: #dbeafe;
    }
    .sh-dropdown-item:hover .sh-icon-wrap .material-symbols-outlined {
      color: #137fec;
    }
    .dark .sh-dropdown-item:hover .sh-icon-wrap { background: #1e3a5f; }
    .sh-dropdown-item .sh-text {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-weight: 500;
    }
    .sh-dropdown-item .sh-badge {
      font-size: 11px;
      color: #64748b;
      background: #f1f5f9;
      padding: 2px 10px;
      border-radius: 20px;
      flex-shrink: 0;
      font-weight: 600;
    }
    .dark .sh-dropdown-item .sh-badge { background: #334155; color: #94a3b8; }

    .sh-dropdown-empty {
      padding: 24px 16px;
      text-align: center;
      color: #94a3b8;
      font-size: 13px;
    }
    .sh-dropdown-empty .material-symbols-outlined {
      font-size: 32px;
      display: block;
      margin-bottom: 6px;
      opacity: 0.5;
    }
  `;
  document.head.appendChild(style);
})();

async function showSearchHistory() {
  const searchInput = document.querySelector("#search");
  if (!searchInput) return;

  let dropdown = document.getElementById("searchHistoryDropdown");
  if (!dropdown) {
    dropdown = document.createElement("div");
    dropdown.id = "searchHistoryDropdown";
    dropdown.className = "sh-dropdown";
    const container = searchInput.closest('.relative') || searchInput.parentElement;
    container.style.position = "relative";
    container.appendChild(dropdown);
  }

  const userId = getClientUserId();
  let history = [];
  try {
    const res = await fetch(`/api/interactions/history?userId=${userId}`);
    if (res.ok) history = await res.json();
  } catch(err) {}

  if (history.length === 0) {
    dropdown.innerHTML = `
      <div class="sh-dropdown-header">
        <span class="sh-title">
          <span class="material-symbols-outlined">history</span>
          Tìm kiếm gần đây
        </span>
      </div>
      <div class="sh-dropdown-empty">
        <span class="material-symbols-outlined">manage_search</span>
        Chưa có lịch sử tìm kiếm
      </div>`;
    dropdown.classList.add("show");
    return;
  }

  let html = `
    <div class="sh-dropdown-header">
      <span class="sh-title">
        <span class="material-symbols-outlined">history</span>
        Tìm kiếm gần đây
      </span>
      <button type="button" class="sh-dropdown-clear" onclick="window.clearHistory()">Xóa tất cả</button>
    </div>`;

  history.forEach(item => {
    const keyword = item.keyword || '';
    const city = item.city || '';
    const display = keyword || 'Tất cả';
    html += `
      <div class="sh-dropdown-item" data-keyword="${keyword}" data-city="${city}">
        <div class="sh-icon-wrap">
          <span class="material-symbols-outlined">history</span>
        </div>
        <span class="sh-text">${display}</span>
        ${city ? `<span class="sh-badge">${city}</span>` : ''}
      </div>`;
  });

  dropdown.innerHTML = html;

  // Bind click events
  dropdown.querySelectorAll('.sh-dropdown-item').forEach(el => {
    el.addEventListener('mousedown', (e) => {
      e.preventDefault();
      searchInput.value = el.dataset.keyword || '';
      const citySelect = document.getElementById("citySelect");
      if (citySelect) citySelect.value = el.dataset.city || '';
      hideSearchHistory();
      document.querySelector("#btnSearch")?.click();
    });
  });

  dropdown.classList.add("show");
}

function hideSearchHistory() {
  const dropdown = document.getElementById("searchHistoryDropdown");
  if (dropdown) dropdown.classList.remove("show");
}

window.clearHistory = async function() {
  const userId = getClientUserId();
  try {
    await fetch(`/api/interactions/history?userId=${userId}`, { method: "DELETE" });
    // Re-render dropdown empty state
    showSearchHistory();
  } catch(err){}
};

// Tự động hiện dropdown khi focus ô search
document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.querySelector("#search");
  if (!searchInput) return;

  searchInput.addEventListener("focus", () => {
    showSearchHistory();
  });

  searchInput.addEventListener("blur", () => {
    setTimeout(hideSearchHistory, 200);
  });

  searchInput.addEventListener("input", () => {
    if (searchInput.value.trim().length > 0) {
      hideSearchHistory();
    } else {
      showSearchHistory();
    }
  });
});

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
  try {
    const res = await fetch(`/api/interactions/compare?userId=${userId}`);
    if (res.ok) {
      const list = await res.json();
      updateCompareUI(list);
    }
  } catch(err){}
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
  
  list.forEach(id => {
    document.querySelectorAll(`.compare-btn-${id}`).forEach(btn => {
      btn.classList.add("text-primary", "bg-blue-50");
      btn.classList.remove("text-gray-700", "bg-white/90");
    });
  });
}

window.toggleCompare = async function(id) {
  const userId = getClientUserId();
  try {
    const res = await fetch("/api/interactions/compare", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, propertyId: id })
    });
    const data = await res.json();
    if (data.error) {
      alert(data.error);
      return;
    }
    // Lấy lại danh sách sau khi toggle
    initCompare();
  } catch(err){}
};

window.clearCompare = async function() {
  const userId = getClientUserId();
  try {
    await fetch(`/api/interactions/compare?userId=${userId}`, { method: "DELETE" });
    updateCompareUI([]);
  } catch(err){}
};

// --- DOM READY ---
document.addEventListener("DOMContentLoaded", () => {
  initCompare();

  const searchInput = document.querySelector("#search");
  if (searchInput) {
    searchInput.addEventListener("focus", showSearchHistory);
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

    await saveSearchHistory({ keyword, city });

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