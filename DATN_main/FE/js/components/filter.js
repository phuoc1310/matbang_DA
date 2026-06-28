import { renderPage } from "./render.js?v=1.0.6";
import { runBIAnalysis } from "../features/ranking/rankingService.js";


async function getInterestCountMap() { return {}; }



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
    rawKeyword,
    keyword,
    city: detectedCity || (rawKeyword ? "" : (state.city || "")),
    minPrice: minPriceInput ? parseMoney(minPriceInput) : defaultMinPrice,
    maxPrice: maxPriceInput ? parseMoney(maxPriceInput) : defaultMaxPrice,
    areas: Array.from(
      document.querySelectorAll("input[data-area]:checked")
    ).map(cb => cb.dataset.area),
    types: Array.from(
      document.querySelectorAll("input[data-type]:checked")
    ).map(cb => cb.dataset.type),
    minArea: state.minArea || 0,
    maxArea: state.maxArea || 99999,
  };
}



export async function applyFilter(refetch = false) {
  console.log("🔄 Applying filter...", { refetch });

  if (!location.pathname.includes("timkiem")) {
    window.filteredData = window.rawData || [];
    if (window.renderPage) window.renderPage();
    return;
  }

  const f = collectFilterState();
  console.log("📋 Filter state:", f);

  
  window.__SEARCH_STATE__ = {
    ...window.__SEARCH_STATE__,
    keyword: f.rawKeyword || f.keyword,
    city: f.city,
    minPrice: f.minPrice,
    maxPrice: f.maxPrice,
    minArea: f.minArea,
    maxArea: f.maxArea,
    types: f.types,
    areas: f.areas,
  };

  if (refetch && typeof window.apiFetchAllListings === 'function') {
    try {
      
      const listingEl = document.getElementById("listing");
      if (listingEl) {
        listingEl.innerHTML = `
          <div class="col-span-3 text-center py-20">
            <span class="material-symbols-outlined animate-spin text-5xl text-primary">
              progress_activity
            </span>
            <p class="mt-4 text-slate-500">
              Đang cập nhật kết quả bộ lọc...
            </p>
          </div>
        `;
      }
      
      console.log("📡 Refetching listings from backend with state:", window.__SEARCH_STATE__);
      await window.apiFetchAllListings({
        keyword: f.rawKeyword || f.keyword,
        city: f.city,
        minPrice: f.minPrice,
        maxPrice: f.maxPrice,
        minArea: f.minArea,
        maxArea: f.maxArea,
        limit: 100,
        maxPages: 5
      });
    } catch (e) {
      console.error("Failed to refetch filtered listings:", e);
    }
  }

  if (!window.rawData || !Array.isArray(window.rawData)) {
    console.warn("No raw data available");
    window.filteredData = [];
    if (window.renderPage) window.renderPage();
    return;
  }

  
  const hasActiveFilters = f.keyword || f.city || f.areas.length > 0 || f.types.length > 0 || 
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

    if (f.types.length) {
      const type = normalizeText(item.type || "");
      const title = normalizeText(item.title || "");
      let ok = false;
      for (const t of f.types) {
        if (t === "vanphong" && (type.includes("văn phòng") || type.includes("van phong") || title.includes("văn phòng") || title.includes("van phong") || title.includes("vănphòng"))) ok = true;
        if (t === "matbang" && (type.includes("mặt bằng") || type.includes("mat bang") || title.includes("mặt bằng") || title.includes("mat bang") || title.includes("mặtbằng"))) ok = true;
        if (t === "canho" && (type.includes("căn hộ") || type.includes("can ho") || type.includes("chung cư") || type.includes("chung cu") || title.includes("căn hộ") || title.includes("can ho") || title.includes("cànhộ"))) ok = true;
        if (t === "nhao" && (type.includes("nhà ở") || type.includes("nha o") || type.includes("nha") || title.includes("nhà") || title.includes("nha"))) ok = true;
        if (t === "dat" && (type.includes("đất") || type.includes("dat") || title.includes("đất") || title.includes("dat"))) ok = true;
        if (t === "cuahang" && (type.includes("cửa hàng") || type.includes("cua hang") || title.includes("cửa hàng") || title.includes("cua hang"))) ok = true;
        if (t === "khoxuong" && (type.includes("kho xưởng") || type.includes("kho xuong") || title.includes("kho xưởng") || title.includes("kho xuong"))) ok = true;
        if (t === "coworking" && (type.includes("co-working") || type.includes("coworking") || title.includes("co-working") || title.includes("coworking"))) ok = true;
      }
      if (!ok) return false;
    }

    
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

    
    if (!f.areas.length && (f.minArea > 0 || f.maxArea < 99999)) {
      const area = item.area_m2 || 0;
      if (area < f.minArea || area > f.maxArea) return false;
    }

    return true;
  });

  console.log(`✅ Filtered: ${filtered.length} items`);
  window.totalCount = filtered.length;
  
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


window.applyFilter = applyFilter;


function setupFilterEvents() {
  document.getElementById("search")?.addEventListener("input", () => {
    applyFilter(false);
  });

  document
    .getElementById("applyFilterBtn")
    ?.addEventListener("click", (e) => {
      e?.preventDefault();
      applyFilter(true);
    });

  
  document.querySelectorAll("input[data-area]").forEach(cb => {
    cb.addEventListener("change", () => {
      applyFilter(false);
    });
  });

  
  document.querySelectorAll("input[data-type]").forEach(cb => {
    cb.addEventListener("change", () => {
      applyFilter(false);
    });
  });

  
  document.getElementById("minPrice")?.addEventListener("change", () => {
    applyFilter(false);
  });
  document.getElementById("maxPrice")?.addEventListener("change", () => {
    applyFilter(false);
  });

  
  document.getElementById("resetFilterBtn")?.addEventListener("click", (e) => {
    e?.preventDefault();
    
    document.querySelectorAll("input[data-area]:checked").forEach(cb => {
      cb.checked = false;
    });
    document.querySelectorAll("input[data-type]:checked").forEach(cb => {
      cb.checked = false;
    });
    
    const minPriceEl = document.getElementById("minPrice");
    const maxPriceEl = document.getElementById("maxPrice");
    if (minPriceEl) minPriceEl.value = "0";
    if (maxPriceEl) maxPriceEl.value = "20,000,000,000";
    
    
    if (typeof window.updatePriceFilterUI === 'function') {
      window.updatePriceFilterUI();
    }
    
    
    const searchEl = document.getElementById("search");
    if (searchEl) searchEl.value = "";
    
    // Xóa state hoàn toàn
    window.__SEARCH_STATE__ = {
      keyword: "",
      city: "",
      minPrice: 0,
      maxPrice: 20000000000,
      minArea: 0,
      maxArea: 99999,
      types: [],
      areas: []
    };
    window.currentPage = 1;
    // Apply lại and refetch
    applyFilter(true);
  });
}

// Module scripts are deferred — DOMContentLoaded may have already fired
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", setupFilterEvents);
} else {
  setupFilterEvents();
}
