// Use dynamic imports to avoid hard-failing the whole module
let fetchDetail, renderImages, addInterest, auth;

// DEBUG: temporary marker to confirm module loaded in the browser
console.log('chitiet.js loaded (module entry)');
// Global error handlers: show a friendly fallback when unexpected errors occur
window.addEventListener('error', (ev) => {
  console.error('Global error captured:', ev.error || ev.message || ev);
  try {
    const titleEl = document.getElementById('title');
    const descEl = document.getElementById('description');
    if (titleEl) titleEl.textContent = 'Đã xảy ra lỗi trên trang';
    if (descEl) descEl.innerHTML = `
      <p class="text-red-500 font-semibold">Có lỗi xảy ra trong trình duyệt. Nội dung có thể không hiển thị đầy đủ.</p>
    `;
  } catch (e) {
    // ignore
  }
});
window.addEventListener('unhandledrejection', (ev) => {
  console.error('Unhandled promise rejection:', ev.reason);
});
let map;
let currentItem = null;


function getQueryParam(key) {
  return new URLSearchParams(window.location.search).get(key);
}


function getUserLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) reject("Trình duyệt không hỗ trợ GPS");
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => reject(err),
      { enableHighAccuracy: true }
    );
  });
}

// Hàm lấy API chỉ đường
async function getRoute(from, to) {
  const url = `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`;
  const res = await fetch(url);
  const data = await res.json();
  if (!data.routes || !data.routes.length) throw new Error("Không tìm thấy đường đi");
  return data.routes[0].geometry;
}

// Hàm vẽ đường lên bản đồ
function drawRoute(geometry) {
  if (!map) return;
  const geojson = { type: "Feature", geometry };

  if (map.getSource("route")) {
    map.getSource("route").setData(geojson);
  } else {
    map.addSource("route", { type: "geojson", data: geojson });
    map.addLayer({
      id: "route-line",
      type: "line",
      source: "route",
      paint: { "line-color": "#2563eb", "line-width": 5 }
    });
  }
}

// // 🔥 TÍNH NĂNG MỚI: Tự động sửa toạ độ nếu bị sai
// async function smartFixLocation(item) {
//   // Nếu toạ độ bằng 0 hoặc (địa chỉ Hà Nội mà toạ độ lại ở Miền Nam < vĩ độ 17)
// const address = item.address || "";
// const isHanoi =
//   item.region_v2 === 13000 || address.includes("Hà Nội");
//   const isSuspicious =
//   !item.lat ||
//   !item.lng ||
//   (isHanoi && item.lat < 17);
//   if (isSuspicious) {
//     console.warn("⚠️ Phát hiện toạ độ nghi ngờ sai, đang tự động tìm lại vị trí theo địa chỉ...");
//     try {
//       // Dùng OpenStreetMap để tìm toạ độ từ text địa chỉ
//       const query = encodeURIComponent(item.address);
//       const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1`);
//       const data = await res.json();

//       if (data && data.length > 0) {
//         console.log("✅ Đã sửa toạ độ thành công!");
//         item.lat = parseFloat(data[0].lat);
//         item.lng = parseFloat(data[0].lon);
//         item.isFixed = true; // Đánh dấu đã sửa
//       }
//     } catch (e) {
//       console.error("Không thể tự động sửa vị trí", e);
//     }
//   }
//   return item;
// }

// ===== MAIN LOGIC =====
async function init() {
  // Try to dynamically import dependencies to avoid blocking if one fails
  try {
    console.log('chitiet: importing modules...');
    const modApi = await import("../services/api.js?v=1.0.5");
    fetchDetail = modApi.fetchDetail;
    console.log('chitiet: imported api');

    const modRender = await import("../components/render.js?v=1.0.1");
    renderImages = modRender.renderImages;
    console.log('chitiet: imported render');

    const modFBService = await import("../services/firebaseService.js?v=1.0.1");
    addInterest = modFBService.addInterest;
    console.log('chitiet: imported firebaseService');

    const modCfg = await import("../config/firebase.js?v=1.0.1");
    auth = modCfg.auth;
    console.log('chitiet: imported firebase config');
  } catch (e) {
    console.error("Dynamic import failed:", e);
    // Fallback: try to fetch raw listing directly and render minimal UI
    const fid = new URLSearchParams(location.search).get("id");
    if (!fid) {
      document.getElementById("title").textContent = "Lỗi tải trang";
      document.getElementById("description").innerHTML = `
        <p class="text-red-500 font-semibold">Không thể tải thành phần cần thiết. Vui lòng kiểm tra Console.</p>
      `;
      return;
    }

    try {
      const r = await fetch(`/api/listings/${fid}`);
      if (!r.ok) throw new Error('Fetch failed');
      const raw = await r.json();

      const item = {
        id: String(raw.id || raw.ad_id || fid),
        title: raw.title || raw.name || raw.subject || 'Đang cập nhật',
        images: raw.images || (raw.image ? [raw.image] : []),
        image: raw.image || (raw.images || [])[0] || 'https://placehold.co/1200x600?text=No+Image',
        address: raw.address || [raw.street_name, raw.ward_name, raw.area_name, raw.region_name].filter(Boolean).join(', ') || '',
        price_string: raw.price ? `${Number(raw.price).toLocaleString('vi-VN')} VNĐ` : (raw.price_string || 'Thỏa thuận'),
        area_m2: Number(raw.area) || Number(raw.size) || raw.area_m2 || 0,
        seller: raw.seller || raw.user_id || 'Chính chủ',
        seller_name: raw.seller_name || raw.seller || 'Chính chủ',
        seller_phone: raw.seller_phone || '',
        seller_email: raw.seller_email || '',
        rating: raw.rating || 0,
        lat: raw.latitude ?? raw.lat,
        lng: raw.longitude ?? raw.lng,
        description: raw.description || raw.desc || ''
      };

      // Render minimal UI
      window.currentListing = item;
      currentItem = item;

      const mainImageEl = document.getElementById('mainImage');
      if (mainImageEl) {
        mainImageEl.innerHTML = `<img src="${item.image}" class="w-full h-full object-cover" alt="${item.title}">`;
      }

      document.getElementById("title").textContent = item.title;
      document.getElementById("location").textContent = item.address || 'Đang cập nhật vị trí';
      document.getElementById("price").textContent = item.price_string || '—';
      document.getElementById("area").textContent = item.area_m2 ? `${item.area_m2} m²` : '—';
      document.getElementById("detail-seller").textContent = item.seller_name || item.seller || "Chính chủ";
      document.getElementById("detail-rating").textContent = item.rating ? `⭐ ${item.rating}` : 'Chưa có đánh giá';
      
      const btnContact = document.getElementById("btn-contact-seller");
      if (btnContact) {
        if (item.seller_phone) {
          btnContact.href = `tel:${item.seller_phone}`;
          btnContact.textContent = `Gọi ${item.seller_phone}`;
          btnContact.classList.remove("opacity-50", "cursor-not-allowed");
        } else {
          btnContact.textContent = "Không có SĐT";
          btnContact.classList.add("opacity-50", "cursor-not-allowed");
          btnContact.removeAttribute("href");
        }
      }

      document.getElementById("description").innerHTML = `<p class="font-bold">Địa chỉ:</p> <p>${item.address}</p>`;

      // Map placeholder when coords available
      if (item.lat && item.lng && window.maplibregl) {
        map = new maplibregl.Map({
          container: "vietmap",
          style: "https://tiles.basemaps.cartocdn.com/gl/positron-gl-style/style.json",
          center: [item.lng, item.lat],
          zoom: 15
        });
        new maplibregl.Marker({ color: "#ea4335" })
          .setLngLat([item.lng, item.lat])
          .setPopup(new maplibregl.Popup().setHTML(`<b>${item.title}</b>`))
          .addTo(map);
      }

    } catch (err2) {
      console.error('Fallback fetch failed', err2);
      document.getElementById("title").textContent = "Lỗi tải trang";
      document.getElementById("description").innerHTML = `
        <p class="text-red-500 font-semibold">Không thể tải dữ liệu mặt bằng. Vui lòng thử lại sau.</p>
      `;
    }

    return;
  }

  const id = new URLSearchParams(location.search).get("id");
  if (!id) return;

  console.log('chitiet: fetching detail for id', id);
  const item = await fetchDetail(id);
  console.log('chitiet: fetchDetail returned', item);

  if (!item) {
    document.getElementById("title").textContent = "Tin không còn khả dụng";
    document.getElementById("description").innerHTML = `
      <p class="text-red-500 font-semibold">
        Tin này có thể đã bị gỡ hoặc hết hạn.
      </p>
      <a href="Trangchu.html" class="underline">
        ← Quay lại trang chủ
      </a>
    `;
    return;
  }

  /* ===== RENDER ===== */
  currentItem = item;
  window.currentListing = item;

  console.log('chitiet: rendering images');
  renderImages(item); // ✅ CHỈ GỌI 1 LẦN
  console.log('chitiet: images rendered');

  document.getElementById("title").textContent = item.title;
  document.getElementById("location").textContent = item.address;
  document.getElementById("price").textContent = item.price_string;
  document.getElementById("area").textContent =
    item.area_m2 ? `${item.area_m2} m²` : "—";
  document.getElementById("detail-seller").textContent = item.seller_name || item.seller || "Chính chủ";
  document.getElementById("detail-rating").textContent =
    item.rating ? `⭐ ${item.rating}` : "Chưa có đánh giá";

  // Cập nhật các trường pháp lý, kích thước
  // Nếu DB có lưu các trường này thì thay bằng item.legal, item.width, v.v. Tạm thời nếu ko có thì để mặc định.
  document.getElementById("detail-legal").textContent = item.legal || "Sổ đỏ/Sổ hồng";
  document.getElementById("detail-width").textContent = item.width ? `${item.width} m` : "Đang cập nhật";
  document.getElementById("detail-length").textContent = item.length ? `${item.length} m` : "Đang cập nhật";

  const btnContact = document.getElementById("btn-contact-seller");
  if (btnContact) {
    if (item.seller_phone) {
      btnContact.href = `tel:${item.seller_phone}`;
      btnContact.textContent = `Gọi ${item.seller_phone}`;
      btnContact.classList.remove("opacity-50", "cursor-not-allowed");
    } else {
      btnContact.textContent = "Không có SĐT";
      btnContact.classList.add("opacity-50", "cursor-not-allowed");
      btnContact.removeAttribute("href");
    }
  }

  document.getElementById("description").innerHTML = `
    <p class="font-bold">Địa chỉ:</p> <p>${item.address}</p>
    <div class="mt-4">${item.description}</div>
  `;

  /* 🔥 GHI NHẬN VIEW – CHỈ 1 LẦN (Chạy ngầm không block UI) */
  try {
    const uid = auth.currentUser?.uid || "guest";
    addInterest(item.id, uid, "view").catch(e => console.warn("Lỗi ghi nhận view:", e));
  } catch (e) {
    console.warn("Không thể gọi hàm ghi nhận lượt xem", e);
  }

  /* ===== MAP ===== */
  if (item.lat && item.lng && window.maplibregl) {
    map = new maplibregl.Map({
      container: "vietmap",
      style: "https://tiles.basemaps.cartocdn.com/gl/positron-gl-style/style.json",
      center: [item.lng, item.lat],
      zoom: 15
    });

    new maplibregl.Marker({ color: "#ea4335" })
      .setLngLat([item.lng, item.lat])
      .setPopup(new maplibregl.Popup().setHTML(`<b>${item.title}</b>`))
      .addTo(map);

    map.addControl(new maplibregl.NavigationControl(), "top-right");

    const btn = document.getElementById("btnRoute");
    if (btn) btn.classList.remove("opacity-50", "cursor-not-allowed");
  } else {
    document.getElementById("vietmap").innerHTML =
      `<div class="flex items-center justify-center h-full bg-gray-100 text-gray-500">
        Không xác định được toạ độ của địa chỉ này
      </div>`;
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}

// ===== GLOBAL FUNCTIONS =====
window.routeToListing = async function () {
  try {
    if (!map || !currentItem) return alert("Bản đồ chưa sẵn sàng");

    const btn = document.getElementById("btnRoute");
    const originalText = btn.innerHTML;
    btn.innerHTML = "⏳ Đang định vị...";
    btn.disabled = true;

    const pos = await getUserLocation();

    new maplibregl.Marker({ color: "#16a34a" }) // User location
      .setLngLat([pos.lng, pos.lat])
      .setPopup(new maplibregl.Popup().setHTML("Vị trí của bạn"))
      .addTo(map);

    const geometry = await getRoute(
      { lat: pos.lat, lng: pos.lng },
      { lat: currentItem.lat, lng: currentItem.lng }
    );

    drawRoute(geometry);

    // Zoom fit bounds
    const bounds = new maplibregl.LngLatBounds();
    bounds.extend([pos.lng, pos.lat]);
    bounds.extend([currentItem.lng, currentItem.lat]);
    map.fitBounds(bounds, { padding: 50 });

    btn.innerHTML = originalText;
    btn.disabled = false;

  } catch (e) {
    alert("Lỗi: " + e.message);
    document.getElementById("btnRoute").disabled = false;
  }
};



window.askAIAdvisor = async function () {
  const box = document.getElementById("ai-result");
  if (!window.currentListing) return;
  box.innerHTML = `<span class="animate-pulse">🤖 Đang phân tích...</span>`;

  const listing = window.currentListing;
  const priceText = listing.price ? `${(listing.price / 1000000).toFixed(1)} triệu VNĐ/tháng` : 'chưa rõ';
  const areaText = listing.area_m2 ? `${listing.area_m2} m²` : 'chưa rõ';

  const prompt = `Phân tích mặt bằng cho thuê sau và đưa ra nhận xét ngắn gọn về mức giá, vị trí, tiềm năng kinh doanh:
- Tiêu đề: ${listing.title || 'Không rõ'}
- Giá thuê: ${priceText}
- Diện tích: ${areaText}
- Địa chỉ: ${listing.address || 'Không rõ'}
- Loại hình: ${listing.category || listing.type || 'Mặt bằng'}
Hãy trả lời ngắn gọn trong 3-4 câu.`;

  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        conversation: [{ role: "user", content: prompt }],
        conversation_id: "",
        user: "ai-advisor"
      })
    });

    const data = await res.json();
    const answer = data.answer || "(AI không trả lời)";
    box.innerHTML = `<b>🤖 AI Tư vấn:</b><br>${answer}`;
  } catch (e) {
    console.error("AI Advisor error:", e);
    box.innerHTML = `<b>AI:</b> Xin lỗi, không thể kết nối với AI lúc này. Vui lòng thử lại sau.`;
  }
};

// ================== REVIEW LOGIC ==================
let currentRating = 0;

document.addEventListener("DOMContentLoaded", () => {
  const stars = document.querySelectorAll(".star-item");
  
  stars.forEach(star => {
    star.addEventListener("click", function() {
      currentRating = parseInt(this.getAttribute("data-val"));
      updateStarUI(currentRating);
    });
    
    star.addEventListener("mouseover", function() {
      const val = parseInt(this.getAttribute("data-val"));
      updateStarUI(val);
    });
    
    star.addEventListener("mouseout", function() {
      updateStarUI(currentRating);
    });
  });

  function updateStarUI(val) {
    stars.forEach(s => {
      const sVal = parseInt(s.getAttribute("data-val"));
      if (sVal <= val) {
        s.classList.remove("text-gray-300");
        s.classList.add("text-yellow-400");
      } else {
        s.classList.remove("text-yellow-400");
        s.classList.add("text-gray-300");
      }
    });
  }

  // Load reviews after a short delay
  setTimeout(loadReviews, 1000);
});

async function loadReviews() {
  const listingId = new URLSearchParams(window.location.search).get("id");
  if (!listingId) return;

  const listEl = document.getElementById("review-list");
  if (!listEl) return;

  try {
    const res = await fetch(`/api/reviews/${listingId}`);
    const data = await res.json();
    
    if (!data || data.length === 0) {
      listEl.innerHTML = '<div class="text-gray-500 italic">Chưa có đánh giá nào. Hãy là người đầu tiên đánh giá!</div>';
      return;
    }

    let html = '';
    data.forEach(rv => {
      const dateStr = new Date(rv.created_at).toLocaleDateString('vi-VN');
      const starsHtml = '⭐'.repeat(rv.rating) + '☆'.repeat(5 - rv.rating);
      
      html += `
        <div class="bg-gray-50 p-4 rounded-lg border border-gray-100">
          <div class="flex items-center justify-between mb-2">
            <div class="font-bold text-gray-800">Khách hàng ẩn danh</div>
            <div class="text-xs text-gray-400">${dateStr}</div>
          </div>
          <div class="text-yellow-500 text-sm mb-2">${starsHtml}</div>
          <div class="text-gray-600 text-sm">${rv.comment || ''}</div>
        </div>
      `;
    });
    listEl.innerHTML = html;
  } catch (err) {
    console.error("Load reviews error:", err);
    listEl.innerHTML = '<div class="text-red-500 text-sm">Không thể tải đánh giá.</div>';
  }
}

window.submitReview = async function() {
  const listingId = new URLSearchParams(window.location.search).get("id");
  if (!listingId) return;

  const commentEl = document.getElementById("review-comment");
  const msgEl = document.getElementById("review-msg");
  const btn = document.getElementById("btn-submit-review");
  
  if (currentRating === 0) {
    msgEl.textContent = "Vui lòng chọn số sao.";
    msgEl.className = "text-sm mt-2 font-medium text-red-500";
    msgEl.classList.remove("hidden");
    return;
  }
  
  const comment = commentEl.value.trim();

  // Get User ID from session storage
  let userId = null;
  let token = null;
  try {
    const raw = sessionStorage.getItem('currentUser');
    if (raw) {
      const u = JSON.parse(raw);
      userId = u.id || u.postgres_id;
    }
    
    // Import auth module dynamically to get a valid token (waits for Firebase to init)
    const modAuth = await import("../modules/auth/auth.js?v=1.0.6");
    token = await modAuth.getValidToken();
    
  } catch (e) {
    console.error("Lỗi xác thực:", e);
  }

  if (!userId || !token) {
    msgEl.textContent = "Vui lòng đăng nhập để đánh giá.";
    msgEl.className = "text-sm mt-2 font-medium text-red-500";
    msgEl.classList.remove("hidden");
    return;
  }

  btn.disabled = true;
  btn.textContent = "Đang gửi...";

  try {
    const res = await fetch('/api/reviews', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        listing_id: listingId,
        user_id: userId,
        rating: currentRating,
        comment: comment
      })
    });

    const result = await res.json();
    
    if (res.ok) {
      msgEl.textContent = "Cảm ơn bạn đã đánh giá!";
      msgEl.className = "text-sm mt-2 font-medium text-green-600";
      msgEl.classList.remove("hidden");
      commentEl.value = "";
      currentRating = 0;
      
      document.querySelectorAll(".star-item").forEach(s => {
        s.classList.remove("text-yellow-400");
        s.classList.add("text-gray-300");
      });
      
      loadReviews();
    } else {
      msgEl.textContent = result.message || "Đã xảy ra lỗi khi gửi.";
      msgEl.className = "text-sm mt-2 font-medium text-red-500";
      msgEl.classList.remove("hidden");
    }
  } catch (err) {
    msgEl.textContent = "Lỗi kết nối máy chủ.";
    msgEl.className = "text-sm mt-2 font-medium text-red-500";
    msgEl.classList.remove("hidden");
  } finally {
    btn.disabled = false;
    btn.textContent = "Gửi đánh giá";
  }
};
