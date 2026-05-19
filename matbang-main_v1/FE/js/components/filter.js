import { renderPage } from "./render.js";
import { runBIAnalysis } from "../features/ranking/rankingService.js";

// Interest count map - currently no dedicated API, return empty map
async function getInterestCountMap() { return {}; }


/* ================= UTILS ================= */
function normalizeText(s = "") {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function parseMoney(v) {
  return Number(String(v || "").replace(/[^\d]/g, "")) || 0;
}

/* ================= CITY MAP ================= */
const CITY_KEYWORDS = {
  hn: ["ha noi", "hn"],
  hcm: ["ho chi minh", "tphcm", "tp hcm", "hcm"],
  dn: ["da nang", "dn"],
  bd: ["binh duong", "bd"],
};

function detectCityFromKeyword(keyword) {
  for (const [code, keys] of Object.entries(CITY_KEYWORDS)) {
    if (keys.some(k => keyword.includes(k))) return code;
  }
  return "";
}

/* ================= COLLECT FILTER ================= */
function collectFilterState() {
  const state = window.__SEARCH_STATE__ || {};
  const rawKeyword =
    document.getElementById("search")?.value?.trim() || "";

  const keyword = normalizeText(rawKeyword);
  const detectedCity = detectCityFromKeyword(keyword);

  const minPriceInput = document.getElementById("minPrice")?.value;
  const maxPriceInput = document.getElementById("maxPrice")?.value;
  const defaultMinPrice = 0;
  const defaultMaxPrice = 20000000000;

  return {
    keyword,
    city: detectedCity || (rawKeyword ? "" : (state.city || "")),
    minPrice: minPriceInput ? parseMoney(minPriceInput) : defaultMinPrice,
    maxPrice: maxPriceInput ? parseMoney(maxPriceInput) : defaultMaxPrice,
    areas: Array.from(
      document.querySelectorAll("input[data-area]:checked")
    ).map(cb => cb.dataset.area),
    minArea: state.minArea || 0,
    maxArea: state.maxArea || 99999,
  };
}

/* ================= APPLY FILTER ================= */
/* ================= APPLY FILTER ================= */
export async function applyFilter() {
  console.log("🔄 Applying filter...");

  if (!location.pathname.includes("timkiem")) {
    window.filteredData = window.rawData || [];
    if (window.renderPage) window.renderPage();
    return;
  }

  if (!window.rawData || !Array.isArray(window.rawData)) {
    console.warn("No raw data available");
    window.filteredData = [];
    if (window.renderPage) window.renderPage();
    return;
  }

  const f = collectFilterState();
  console.log("📋 Filter state:", f);

  window.__SEARCH_STATE__ = {
    keyword: f.keyword,
    city: f.city,
  };

  /* ===== 1. FILTER DATA ===== */
  const hasActiveFilters = f.keyword || f.city || f.areas.length > 0 || 
    (f.minPrice !== 0) || (f.maxPrice !== 20000000000 && f.maxPrice !== Infinity) ||
    (f.minArea > 0) || (f.maxArea < 99999);

  if (!hasActiveFilters) {
    window.filteredData = window.rawData.map(item => ({
      ...item,
      score: 0.5,
      level: "Bình thường"
    }));
    window.currentPage = 1;
    if (window.renderPage) {
      renderPage();
    }
    return;
  }

  let filtered = window.rawData.filter(item => {
    const region = normalizeText(item.region || "");

    // CITY - chỉ filter nếu có city được chọn
    if (f.city) {
      const allow = CITY_KEYWORDS[f.city] || [];
      if (!allow.some(k => region.includes(k))) return false;
    }

    // KEYWORD - chỉ filter nếu có keyword
    if (f.keyword) {
      const text = normalizeText(
        `${item.title} ${item.street} ${item.ward} ${item.district} ${item.region}`
      );
      if (!text.includes(f.keyword)) return false;
    }

    // PRICE - chỉ filter nếu giá trị khác mặc định
    if (f.minPrice !== 0 || (f.maxPrice !== 20000000000 && f.maxPrice !== Infinity)) {
      const price = item.price || 0;
      if (price < f.minPrice || price > f.maxPrice) return false;
    }

    // AREA (checkbox) - chỉ filter nếu có area được chọn
    if (f.areas.length) {
      const area = item.area_m2 || 0;
      let ok = false;
      for (const a of f.areas) {
        if (a === "0-30" && area < 30) ok = true;
        if (a === "30-50" && area >= 30 && area <= 50) ok = true;
        if (a === "50-80" && area > 50 && area <= 80) ok = true;
        if (a === "80+" && area > 80) ok = true;
      }
      if (!ok) return false;
    }

    // AREA RANGE (từ trang chủ truyền qua URL params)
    if (f.minArea > 0 || f.maxArea < 99999) {
      const area = item.area_m2 || 0;
      if (area < f.minArea || area > f.maxArea) return false;
    }

    return true;
  });

  console.log(`✅ Filtered: ${filtered.length} items`);
  window.totalCount = filtered.length;
  /* ===== 2. BI SCORING ===== */
  const isUserSearching =
    document.activeElement?.id === "search" ||
    location.pathname.includes("timkiem");

  if (filtered.length === 0) {
    window.filteredData = [];
    window.currentPage = 1;
    if (window.renderPage) {
      renderPage();
    }
  } else if (!isUserSearching) {
    window.filteredData = filtered.map(item => ({
      ...item,
      score: 0.5,
      level: "Bình thường"
    }));
    window.currentPage = 1;
    if (window.renderPage) {
      renderPage();
    }
  } else {
    const searchContext = {
      minPrice: f.minPrice,
      maxPrice: f.maxPrice,
      avgPrice: (f.minPrice + f.maxPrice) / 2 || 0,
      avgArea: 50,
      city: f.city || null
    };

    console.log("🎯 Running BI Analysis with context:", searchContext);

    const biResult = runBIAnalysis(filtered, searchContext);
    const biMap = new Map(biResult.map(x => [x.id, x]));

    const interestMap = await getInterestCountMap();

    window.filteredData = filtered.map(item => ({
      ...item,
      score: biMap.get(item.id)?.score ?? 0.5,
      level: biMap.get(item.id)?.level ?? "Bình thường",
      interests: interestMap[item.id] || 0
    }));

    window.currentPage = 1;
    if (window.renderPage) {
      renderPage();
    }
  }
}

// expose for other modules
window.applyFilter = applyFilter;

/* ================= EVENTS ================= */
function setupFilterEvents() {
  document.getElementById("search")?.addEventListener("input", applyFilter);
  document
    .getElementById("applyFilterBtn")
    ?.addEventListener("click", applyFilter);

  // Auto-trigger filter khi tick checkbox diện tích
  document.querySelectorAll("input[data-area]").forEach(cb => {
    cb.addEventListener("change", applyFilter);
  });

  // Auto-trigger filter khi thay đổi giá
  document.getElementById("minPrice")?.addEventListener("change", applyFilter);
  document.getElementById("maxPrice")?.addEventListener("change", applyFilter);

  // Nút "Đặt lại" bộ lọc
  document.getElementById("resetFilterBtn")?.addEventListener("click", () => {
    // Bỏ tick tất cả checkbox
    document.querySelectorAll("input[data-area]:checked").forEach(cb => {
      cb.checked = false;
    });
    // Reset giá về mặc định
    const minPriceEl = document.getElementById("minPrice");
    const maxPriceEl = document.getElementById("maxPrice");
    if (minPriceEl) minPriceEl.value = "0";
    if (maxPriceEl) maxPriceEl.value = "20,000,000,000";
    // Reset ô search
    const searchEl = document.getElementById("search");
    if (searchEl) searchEl.value = "";
    // Xóa state
    window.__SEARCH_STATE__ = { keyword: "", city: "" };
    window.currentPage = 1;
    // Apply lại
    applyFilter();
  });
}

// Module scripts are deferred — DOMContentLoaded may have already fired
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", setupFilterEvents);
} else {
  setupFilterEvents();
}
