// public/js/services/api.js

// ================== NORMALIZE DATA ==================
function normalizeChoTotItem(item) {
  let image = "https://placehold.co/600x400?text=RentalSpace";

  const possibleImageFields = [
    item.image,
    item.thumbnail,
    item.thumbnail_url,
    item.image_url,
    item.images?.[0],
    item.image_thumbnails?.[0]?.image,
    item.image_thumbnails?.[0]?.thumbnail
  ];

  for (const img of possibleImageFields) {
    if (img && typeof img === "string" && img.startsWith("http")) {
      image = img;
      break;
    }
  }

  return {
    id: String(item.list_id || item.ad_id || item.id || Math.random()),
    ad_id: String(item.ad_id || item.list_id || item.id || Math.random()),
    title: item.subject || item.title || "Không có tiêu đề",
    image,
    images: [image],
    price: Number(item.price) || 0,
    price_string: item.price_string || "Thỏa thuận",
    area_m2: Number(item.size || item.area || item.square) || 0,
    district: item.area_name || item.district || "",
    ward: item.ward_name || item.ward || "",
    region: item.region_name || item.city_name || item.region || "",
    street: item.street_name || item.street || "",
    address: [
      item.street_name,
      item.ward_name,
      item.area_name,
      item.region_name
    ].filter(Boolean).join(", "),
    seller:
      item.seller_info?.full_name ||
      item.owner_info?.full_name ||
      item.account_info?.full_name ||
      "Chính chủ",
    rating: item.seller_info?.rating_score || item.rating || 0,
    lat: item.latitude,
    lng: item.longitude,
    date: item.date || item.created_at || item.list_time,
    category: item.category_name || item.category
  };
}


// ================== EXTRACT LIST ==================
function extractList(json) {
  if (Array.isArray(json)) return json;
  if (Array.isArray(json.data)) return json.data;
  if (Array.isArray(json.ads)) return json.ads;
  return [];
}


// ================== FETCH ALL ==================
export async function fetchAllData(pages = 10, keyword = "") {
  console.log(`Fetching ${pages} pages with keyword: "${keyword}"`);

  let all = [];

  const promises = [];

  for (let p = 1; p <= pages; p++) {
    promises.push(
      fetch(`/api/ads?page=${p}&q=${keyword}`)
        .then(res => res.ok ? res.json() : [])
        .then(json => extractList(json))
        .catch(() => [])
    );
  }

  const results = await Promise.all(promises);
  results.forEach(list => all.push(...list));

  // remove duplicate
  const uniqueAds = Array.from(
    new Map(all.map(item => [String(item.ad_id), item])).values()
  );

  const normalized = uniqueAds.map(normalizeChoTotItem);

  // lưu global (tạm dùng cho UI)
  window.rawData = normalized;
  window.filteredData = [...normalized];

  return normalized;
}


// ================== FETCH DETAIL ==================
export async function fetchDetail(id) {
  try {
    const res = await fetch(`/api/ads/${id}`);

    if (!res.ok) return null;

    const item = await res.json();

    return normalizeChoTotItem(item);

  } catch (err) {
    console.error("Fetch detail error:", err);
    return null;
  }
}

// ================== FETCH LISTINGS FROM BACKEND ==================
export async function fetchListings(opts = {}) {
  try {
    // If frontend is served from a different port during dev, prefer backend on 3033
    const API_BASE = (location.port && String(location.port) !== '3033') ? `http://${location.hostname}:3033` : '';
    const params = new URLSearchParams();
    if (opts.keyword) params.set("keyword", opts.keyword);
    if (opts.city) params.set("city", opts.city);
    if (opts.type) params.set("type", opts.type);
    if (opts.minPrice !== undefined) params.set("minPrice", String(opts.minPrice));
    if (opts.maxPrice !== undefined) params.set("maxPrice", String(opts.maxPrice));
    if (opts.minArea !== undefined) params.set("minArea", String(opts.minArea));
    if (opts.maxArea !== undefined) params.set("maxArea", String(opts.maxArea));
    if (opts.page) params.set("page", String(opts.page));
    if (opts.limit) params.set("limit", String(opts.limit));

    const url = `${API_BASE}/api/listings?${params.toString()}`;
    const res = await fetch(url);
    if (!res.ok) return [];

    const json = await res.json();

    // normalize rows from backend into frontend shape
    const normalized = (Array.isArray(json) ? json : json.data || []).map(item => {
      const image = item.image || item.images?.[0] || "https://placehold.co/600x400?text=RentalSpace";
      return {
        id: String(item.id || item.ad_id || Math.random()),
        title: item.title || item.name || "Đang cập nhật",
        image,
        images: item.images || [image],
        price: Number(item.price) || 0,
        price_string: item.price ? `${Number(item.price).toLocaleString('vi-VN')} VNĐ` : (item.price_string || 'Thỏa thuận'),
        area_m2: Number(item.area) || item.area_m2 || 0,
        district: item.district || "",
        region: item.city || item.region || "",
        address: item.address || "",
        seller: item.seller || item.user_id || 'Chính chủ',
        date: item.created_at || item.date,
        score: item.score || Math.random(),
      };
    });

    // store globally for existing render/filter logic
    window.rawData = normalized;
    window.filteredData = [...normalized];
    // if backend provided total count, expose it for pagination UI
    window.totalCount = json.total || normalized.length;
    // expose fetch helper globally so pagination can request pages
    window.apiFetchListings = fetchListings;

    return normalized;
  } catch (err) {
    console.error('fetchListings error', err);
    return [];
  }
}

// expose for other scripts that don't import the module directly
window.apiFetchListings = window.apiFetchListings || fetchListings;

// Fetch all pages from backend and return combined normalized results
export async function fetchAllListings(opts = {}) {
  const pageSize = Number(opts.limit) || 50;
  // fetch first page
  const first = await fetchListings({ ...opts, page: 1, limit: pageSize });
  const total = window.totalCount || first.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  if (totalPages <= 1) {
    // already have all
    window.rawData = first;
    window.filteredData = [...first];
    window.totalCount = first.length;
    return first;
  }

  const remaining = [];
  const requests = [];
  for (let p = 2; p <= totalPages; p++) {
    requests.push(fetchListings({ ...opts, page: p, limit: pageSize }));
  }

  const results = await Promise.all(requests);
  results.forEach(r => remaining.push(...(r || [])));

  const all = [...first, ...remaining];
  window.rawData = all;
  window.filteredData = [...all];
  window.totalCount = all.length;
  return all;
}

window.apiFetchAllListings = window.apiFetchAllListings || fetchAllListings;