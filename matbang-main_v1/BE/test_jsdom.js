const jsdom = require("jsdom");
const { JSDOM } = jsdom;

const dom = new JSDOM(`
  <!DOCTYPE html>
  <body>
    <input id="search" value="" />
    <input id="minPrice" value="0" />
    <input id="maxPrice" value="20000000000" />
    <div id="listing"></div>
    <div class="pagination"></div>
  </body>
`, {
  url: "http://localhost/js/views/timkiem.html"
});

global.window = dom.window;
global.document = dom.window.document;
global.location = dom.window.location;

window.rawData = [{
  id: "10000",
  title: "🏡 Bán nhà đẹp mê ly đường Dương Bá Trạc P1 Q8\n",
  price: 6580000000,
  area_m2: 33,
  district: "Quận 8",
  ward: "Phường 1",
  region: "Hồ Chí Minh",
  address: "",
  type: "Nhà ở"
}];

window.__SEARCH_STATE__ = {
  minArea: 0,
  maxArea: 99999,
  city: null
};

window.renderPage = () => {
  console.log("renderPage called with filteredData length:", window.filteredData.length);
};

// Paste the relevant parts of filter.js
const CITY_KEYWORDS = {
  hn: ["ha noi", "hn"],
  hcm: ["ho chi minh", "tphcm", "tp hcm", "hcm"],
  dn: ["da nang", "dn"],
  bd: ["binh duong", "bd"],
};

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

function detectCityFromKeyword(keyword) {
  for (const [code, keys] of Object.entries(CITY_KEYWORDS)) {
    if (keys.some(k => keyword.includes(k))) return code;
  }
  return "";
}

function collectFilterState() {
  const state = window.__SEARCH_STATE__ || {};
  const rawKeyword = document.getElementById("search")?.value?.trim() || "";
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
    areas: Array.from(document.querySelectorAll("input[data-area]:checked")).map(cb => cb.dataset.area),
    types: Array.from(document.querySelectorAll("input[data-type]:checked")).map(cb => cb.dataset.type),
    minArea: state.minArea || 0,
    maxArea: state.maxArea || 99999,
  };
}

async function applyFilter(refetch = false) {
  const f = collectFilterState();
  console.log("Filter State:", f);

  const hasActiveFilters = f.keyword || f.city || f.areas.length > 0 || f.types.length > 0 || 
    (f.minPrice !== 0) || (f.maxPrice !== 20000000000 && f.maxPrice !== Infinity) ||
    (f.minArea > 0) || (f.maxArea < 99999);

  console.log("hasActiveFilters:", hasActiveFilters);

  if (!hasActiveFilters) {
    window.filteredData = window.rawData.map(item => ({
      ...item,
      score: 0.5,
      level: "Bình thường"
    }));
    window.renderPage();
    return;
  }

  let filtered = window.rawData.filter(item => {
    const region = normalizeText(item.region || "");
    if (f.city) {
      const allow = CITY_KEYWORDS[f.city] || [];
      if (!allow.some(k => region.includes(k))) return false;
    }
    if (f.keyword) {
      const text = normalizeText(`${item.title} ${item.street} ${item.ward} ${item.district} ${item.region}`);
      if (!text.includes(f.keyword)) return false;
    }
    if (f.minPrice !== 0 || (f.maxPrice !== 20000000000 && f.maxPrice !== Infinity)) {
      const price = item.price || 0;
      if (price < f.minPrice || price > f.maxPrice) return false;
    }
    if (f.types.length) {
      // omitted for brevity
    }
    if (f.areas.length) {
      // omitted for brevity
    }
    if (!f.areas.length && (f.minArea > 0 || f.maxArea < 99999)) {
      const area = item.area_m2 || 0;
      if (area < f.minArea || area > f.maxArea) return false;
    }
    return true;
  });

  console.log("filtered length:", filtered.length);
  window.filteredData = filtered;
  window.renderPage();
}

applyFilter().catch(console.error);
