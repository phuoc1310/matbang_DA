// public/js/pages/main.js
window.PAGE_SIZE = 12;
window.currentPage = 1;

// --- FEATURE 1: Lịch sử tìm kiếm ---
function saveSearchHistory(paramsObj) {
  if (!paramsObj.keyword && !paramsObj.city) return;
  let history = JSON.parse(localStorage.getItem("search_history") || "[]");
  // Xóa trùng lặp
  history = history.filter(h => h.keyword !== paramsObj.keyword || h.city !== paramsObj.city);
  history.unshift(paramsObj);
  if (history.length > 5) history = history.slice(0, 5); // Lưu tối đa 5
  localStorage.setItem("search_history", JSON.stringify(history));
}

function showSearchHistory() {
  const searchInput = document.querySelector("#search");
  if (!searchInput) return;
  
  let dropdown = document.getElementById("searchHistoryDropdown");
  if (!dropdown) {
    dropdown = document.createElement("div");
    dropdown.id = "searchHistoryDropdown";
    dropdown.className = "absolute top-full left-0 w-full bg-white shadow-lg rounded-xl mt-1 z-50 border hidden overflow-hidden";
    // Tìm container chứa input để append absolute cho đúng
    const container = searchInput.parentElement;
    container.style.position = "relative";
    container.appendChild(dropdown);
  }

  const history = JSON.parse(localStorage.getItem("search_history") || "[]");
  if (history.length === 0) {
    dropdown.classList.add("hidden");
    return;
  }

  dropdown.innerHTML = `
    <div class="px-4 py-2 text-xs text-gray-500 font-semibold bg-gray-50 border-b flex justify-between">
      <span>Tìm kiếm gần đây</span>
      <button class="text-red-500 hover:text-red-700" onclick="localStorage.removeItem('search_history'); document.getElementById('searchHistoryDropdown').classList.add('hidden')">Xóa</button>
    </div>
  `;
  
  history.forEach(item => {
    const div = document.createElement("div");
    div.className = "px-4 py-3 hover:bg-gray-100 cursor-pointer flex items-center gap-2 text-sm";
    div.innerHTML = `<span class="material-symbols-outlined text-gray-400 text-[18px]">history</span> 
                     <span class="flex-1">${item.keyword || "Tất cả"} ${item.city ? ` - ${item.city}` : ""}</span>`;
    div.onclick = () => {
      searchInput.value = item.keyword || "";
      if (document.getElementById("citySelect")) document.getElementById("citySelect").value = item.city || "";
      dropdown.classList.add("hidden");
      document.querySelector("#btnSearch")?.click();
    };
    dropdown.appendChild(div);
  });
  
  dropdown.classList.remove("hidden");
}

// --- FEATURE 2: So sánh mặt bằng ---
function initCompare() {
  const compareList = JSON.parse(localStorage.getItem("compare_list") || "[]");
  
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
          <button onclick="window.clearCompare()" class="px-4 py-2 text-sm border rounded hover:bg-gray-50 text-gray-600">Xóa hết</button>
          <a href="/js/views/sosanh.html" class="px-6 py-2 text-sm font-bold bg-primary text-white rounded hover:bg-primary/90 shadow">So sánh ngay</a>
        </div>
      </div>
    `;
    document.body.appendChild(bar);
  }

  updateCompareUI(compareList);
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

window.toggleCompare = function(id) {
  let list = JSON.parse(localStorage.getItem("compare_list") || "[]");
  const idx = list.indexOf(id);
  if (idx !== -1) {
    list.splice(idx, 1);
  } else {
    if (list.length >= 4) {
      alert("Bạn chỉ có thể so sánh tối đa 4 mặt bằng!");
      return;
    }
    list.push(id);
  }
  localStorage.setItem("compare_list", JSON.stringify(list));
  updateCompareUI(list);
};

window.clearCompare = function() {
  localStorage.setItem("compare_list", JSON.stringify([]));
  updateCompareUI([]);
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

  const handleSearchRedirect = () => {
    const keyword = (document.querySelector("#search")?.value || "").trim();
    const city = document.getElementById("citySelect")?.value || "";
    const type = document.getElementById("type")?.value || "";
    const price = document.getElementById("price")?.value || ""; // format min-max in VND
    const area = document.getElementById("area")?.value || ""; // format min-max in m2

    saveSearchHistory({ keyword, city });

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