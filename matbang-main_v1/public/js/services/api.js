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