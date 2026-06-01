// public/js/services/api.js

// ================== FETCH DETAIL ==================
export async function fetchDetail(id) {
  try {
    // Determine backend base (if frontend served on different port during dev)
    const API_BASE = (location.port && String(location.port) !== '3033') ? `http://${location.hostname}:3033` : '';

    const res = await fetch(`${API_BASE}/api/listings/${id}`);
    if (res.ok) {
      const item = await res.json();
      return {
        id: String(item.id),
        title: item.title || item.name || 'Đang cập nhật',
        image: item.image || (item.images || [])[0] || 'https://placehold.co/600x400?text=RentalSpace',
        images: item.images || [item.image],
        price: Number(item.price) || 0,
        price_string: item.price ? `${Number(item.price).toLocaleString('vi-VN')} VNĐ` : (item.price_string || 'Thỏa thuận'),
        area_m2: Number(item.area) || item.area_m2 || 0,
        district: item.district || '',
        ward: item.ward || '',
        region: item.city || item.region || '',
        address: item.address || '',
        seller: item.seller || item.user_id || 'Chính chủ',
        seller_name: item.seller_name || item.seller || 'Chính chủ',
        seller_phone: item.seller_phone || '',
        seller_email: item.seller_email || '',
        rating: item.rating || 0,
        lat: item.latitude ?? item.lat,
        lng: item.longitude ?? item.lng,
        date: item.created_at || item.date,
        category: item.type || item.category,
        description: item.description || item.desc || ''
      };
    }
    return null;
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
        type: item.type || item.category || "",
      };
    });

    // store globally for existing render/filter logic
    // If this call requested a specific page, treat as paged fetch (don't overwrite full dataset)
    window.pageCache = window.pageCache || {};
    if (opts.page) {
      window.pageCache[String(opts.page)] = normalized;
      // Chỉ ghi đè filteredData nếu KHÔNG đang trong fetchAllListings (tránh race condition)
      if (!window._fetchAllInProgress) {
        window.filteredData = normalized;
        window._renderIsPaged = true;
      }
    } else {
      window.rawData = normalized;
      window.filteredData = [...normalized];
      window._renderIsPaged = false;
    }
    // if backend provided total count, expose it for pagination UI
    window.totalCount = json.total || (Array.isArray(json.data) ? json.data.length : normalized.length);
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
  const maxPagesCap = Number(opts.maxPages) || 100; // default cap increased to 100

  // Đánh dấu đang fetch toàn bộ để tránh race condition trong fetchListings
  window._fetchAllInProgress = true;

  // fetch first page
  const first = await fetchListings({ ...opts, page: 1, limit: pageSize });
  const backendTotal = window.totalCount || first.length;
  const total = backendTotal;
  console.log(`fetchAllListings: first page loaded (${first.length} items), reported total: ${total}`);
  let totalPages = Math.max(1, Math.ceil(total / pageSize));

  if (totalPages > maxPagesCap) {
    console.warn(`fetchAllListings: totalPages (${totalPages}) exceeds maxPages (${maxPagesCap}), capping to ${maxPagesCap}`);
    totalPages = maxPagesCap;
  }

  if (totalPages <= 1) {
    // already have all
    window._fetchAllInProgress = false;
    window.rawData = first;
    window.filteredData = [...first];
    window.totalCount = first.length;
    return first;
  }

  const remaining = [];
  const requests = [];
  for (let p = 2; p <= totalPages; p++) {
    // attach then-log per page
    requests.push(
      fetchListings({ ...opts, page: p, limit: pageSize }).then(res => {
        console.log(`fetchAllListings: page ${p} loaded (${(res||[]).length} items)`);
        return res;
      })
    );
  }

  const results = await Promise.all(requests);
  results.forEach(r => remaining.push(...(r || [])));

  const all = [...first, ...remaining];
  window._fetchAllInProgress = false;
  window.rawData = all;
  window.filteredData = [...all];
  // preserve backend reported total when available; otherwise use fetched length
  window.totalCount = backendTotal || all.length;
  window._renderIsPaged = false;
  return all;
}

window.apiFetchAllListings = window.apiFetchAllListings || fetchAllListings;