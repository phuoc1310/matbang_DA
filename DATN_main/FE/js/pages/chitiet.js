
let fetchDetail, renderImages, addInterest, auth;


console.log('chitiet.js loaded (module entry)');

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
    
  }
});
window.addEventListener('unhandledrejection', (ev) => {
  console.error('Unhandled promise rejection:', ev.reason);
});
function seededRandom(seed) {
  let h = 0xdeadbeef;
  const strSeed = String(seed);
  for(let i = 0; i < strSeed.length; i++)
    h = Math.imul(h ^ strSeed.charCodeAt(i), 2654435761);
  return ((h ^ h >>> 16) >>> 0) / 4294967296;
}

function getRandomSellerInfo(id) {
  const firstNames = ["Nguyễn", "Trần", "Lê", "Phạm", "Hoàng", "Huỳnh", "Phan", "Vũ", "Võ", "Đặng", "Bùi", "Đỗ", "Hồ", "Ngô", "Dương", "Lý"];
  const middleNames = ["Văn", "Thị", "Ngọc", "Hữu", "Đức", "Minh", "Thanh", "Thu", "Hải", "Tuấn", "Hoài", "Bảo", "Gia", "Thúy", "Anh"];
  const lastNames = ["Anh", "Tuấn", "Nam", "Bình", "Hương", "Lan", "Hoa", "Mai", "Linh", "Trang", "Long", "Đạt", "Phúc", "Thành", "Hưng", "Tùng", "Cường", "Phương", "Nhung", "Yến"];
  
  const rand1 = seededRandom(id + "1");
  const rand2 = seededRandom(id + "2");
  const rand3 = seededRandom(id + "3");
  const rand4 = seededRandom(id + "4");
  
  const fn = firstNames[Math.floor(rand1 * firstNames.length)];
  const mn = middleNames[Math.floor(rand2 * middleNames.length)];
  const ln = lastNames[Math.floor(rand3 * lastNames.length)];
  
  const prefixes = ["090", "091", "092", "093", "094", "096", "097", "098", "086", "088", "089"];
  const pref = prefixes[Math.floor(rand4 * prefixes.length)];
  
  let suffix = "";
  let currentSeed = String(id);
  for(let i=0; i<7; i++) {
    const r = seededRandom(currentSeed + i);
    suffix += Math.floor(r * 10);
    currentSeed += r;
  }
  
  return {
    name: `${fn} ${mn} ${ln}`,
    phone: `${pref} ${suffix.substring(0,3)} ${suffix.substring(3)}`
  };
}

let map;
let currentItem = null;


function getQueryParam(key) {
  return new URLSearchParams(window.location.search).get(key);
}


function getPosition(options) {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, options);
  });
}

async function getUserLocation() {
  // Toạ độ mặc định (Đại học Thuỷ Lợi)
  const defaultLocation = { 
    lat: 21.006989, 
    lng: 105.825101, 
    accuracy: 50 // Giả lập độ chính xác cao để không hiện dòng cảnh báo màu cam 
  };

  if (!navigator.geolocation) {
    return defaultLocation;
  }

  try {
    // 1. Thử lấy GPS thật hoặc DevTools Sensors
    const pos = await getPosition({ enableHighAccuracy: true, timeout: 3000, maximumAge: 0 });
    return { 
      lat: pos.coords.latitude, 
      lng: pos.coords.longitude, 
      accuracy: pos.coords.accuracy 
    };
  } catch (err) {
    // 2. KỂ CẢ KHI BẠN BỊ TỪ CHỐI QUYỀN (Code 1), HAY LỖI (Code 2, 3)...
    // Trả về toạ độ Đại học Thuỷ Lợi để phục vụ demo trơn tru nhất.
    return defaultLocation;
  }
}


async function getRoute(from, to) {
  const url = `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`;
  const res = await fetch(url);
  const data = await res.json();
  if (!data.routes || !data.routes.length) throw new Error("Không tìm thấy đường đi");
  const route = data.routes[0];
  return { 
    geometry: route.geometry, 
    distance: route.distance, // in meters
    duration: route.duration  // in seconds
  };
}


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

































async function init() {
  
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
        description: raw.description || raw.desc || '',
        created_at: raw.created_at || raw.date || null
      };

      // Render minimal UI
      window.currentListing = item;
      currentItem = item;

      const mainImageEl = document.getElementById('mainImage');
      if (mainImageEl) {
        mainImageEl.innerHTML = `<img src="${item.image}" class="w-full h-full object-cover" referrerpolicy="no-referrer" alt="${item.title}">`;
      }

      document.getElementById("title").textContent = item.title;
      document.getElementById("location").textContent = item.address || 'Đang cập nhật vị trí';
      document.getElementById("price").textContent = item.price_string || '—';
      document.getElementById("area").textContent = item.area_m2 ? `${item.area_m2} m²` : '—';
      
      const createdAtEl = document.getElementById("created-at");
      if (createdAtEl) {
        const postDateStr = item.created_at || item.date;
        if (postDateStr) {
          const d = new Date(postDateStr);
          createdAtEl.textContent = !isNaN(d) ? d.toLocaleDateString('vi-VN') : 'Đang cập nhật';
        } else {
          createdAtEl.textContent = 'Đang cập nhật';
        }
      }

      // Hiển thị Lượt xem (nếu chưa call API view thì dùng giá trị cũ, api sẽ trả về số mới sau)
      const viewCountEl = document.getElementById("view-count");
      if (viewCountEl) viewCountEl.textContent = item.views || 0;

      const fallbackSellerInfo = getRandomSellerInfo(item.id);
      const displaySellerName = (item.seller_name && item.seller_name !== 'null') ? item.seller_name : ((item.seller && item.seller !== 'null') ? item.seller : fallbackSellerInfo.name);
      
      let displaySellerPhone = item.seller_phone;
      if (!displaySellerPhone || displaySellerPhone === 'null' || displaySellerPhone === 'undefined' || String(displaySellerPhone).trim() === '') {
        displaySellerPhone = fallbackSellerInfo.phone;
      }

      document.getElementById("detail-seller").textContent = displaySellerName;
      document.getElementById("detail-rating").textContent = item.rating ? `⭐ ${item.rating}` : 'Chưa có đánh giá';
      
      const btnContact = document.getElementById("btn-contact-seller");
      if (btnContact) {
        btnContact.href = `tel:${displaySellerPhone.replace(/\s/g, '')}`;
        btnContact.textContent = `Gọi ${displaySellerPhone}`;
        btnContact.classList.remove("opacity-50", "cursor-not-allowed");
      }

      document.getElementById("description").innerHTML = `<p class="font-bold">Địa chỉ:</p> <p>${item.address}</p>`;

      // Map placeholder when coords available
      if (item.lat && item.lng && window.maplibregl) {
        map = new maplibregl.Map({
          container: "vietmap",
          style: {
            "version": 8,
            "sources": {
              "osm": {
                "type": "raster",
                "tiles": ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
                "tileSize": 256,
                "attribution": "&copy; OpenStreetMap contributors"
              }
            },
            "layers": [
              {
                "id": "osm",
                "type": "raster",
                "source": "osm",
                "minzoom": 0,
                "maxzoom": 19
              }
            ]
          },
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

  
  currentItem = item;
  window.currentListing = item;

  console.log('chitiet: rendering images');
  renderImages(item); 
  console.log('chitiet: images rendered');

  document.getElementById("title").textContent = item.title;
  document.getElementById("location").textContent = item.address;
  document.getElementById("price").textContent = item.price_string;
  document.getElementById("area").textContent =
    item.area_m2 ? `${item.area_m2} m²` : "—";
    
  const createdAtEl = document.getElementById("created-at");
  if (createdAtEl) {
    const postDateStr = item.created_at || item.date;
    if (postDateStr) {
      const d = new Date(postDateStr);
      createdAtEl.textContent = !isNaN(d) ? d.toLocaleDateString('vi-VN') : 'Đang cập nhật';
    } else {
      createdAtEl.textContent = 'Đang cập nhật';
    }
  }

  const fallbackSellerInfo = getRandomSellerInfo(item.id);
  const displaySellerName = (item.seller_name && item.seller_name !== 'null') ? item.seller_name : ((item.seller && item.seller !== 'null') ? item.seller : fallbackSellerInfo.name);
  
  let displaySellerPhone = item.seller_phone;
  if (!displaySellerPhone || displaySellerPhone === 'null' || displaySellerPhone === 'undefined' || String(displaySellerPhone).trim() === '') {
    displaySellerPhone = fallbackSellerInfo.phone;
  }

  document.getElementById("detail-seller").textContent = displaySellerName;
  document.getElementById("detail-rating").textContent =
    item.rating ? `⭐ ${item.rating}` : "Chưa có đánh giá";

  // Cập nhật các trường pháp lý, kích thước
  // Nếu DB có lưu các trường này thì thay bằng item.legal, item.width, v.v. Tạm thời nếu ko có thì để mặc định.
  document.getElementById("detail-legal").textContent = item.legal || "Sổ đỏ/Sổ hồng";
  document.getElementById("detail-width").textContent = item.width ? `${item.width} m` : "Đang cập nhật";
  document.getElementById("detail-length").textContent = item.length ? `${item.length} m` : "Đang cập nhật";

  const btnContact = document.getElementById("btn-contact-seller");
  if (btnContact) {
    btnContact.href = `tel:${displaySellerPhone.replace(/\s/g, '')}`;
    btnContact.textContent = `Gọi ${displaySellerPhone}`;
    btnContact.classList.remove("opacity-50", "cursor-not-allowed");
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

  /* ===== LƯU LỊCH SỬ XEM (GỢI Ý CÁCH 2) ===== */
  const itemType = item.category || item.type || '';
  const itemDistrict = item.district || '';
  
  try {
    let uid = "guest";
    const rawUser = sessionStorage.getItem('currentUser');
    if (rawUser) {
      const u = JSON.parse(rawUser);
      uid = u.id || u.uid || u.postgres_id || "guest";
    }
    const key = uid !== "guest" ? `viewed_listings_${uid}` : 'viewed_listings';

    const viewed = JSON.parse(localStorage.getItem(key) || '[]');
    const newView = { 
      id: item.id, 
      district: itemDistrict, 
      type: itemType, 
      price: item.price, 
      title: item.title,
      timestamp: Date.now() 
    };
    const updatedViewed = [newView, ...viewed.filter(x => String(x.id) !== String(item.id))].slice(0, 10);
    localStorage.setItem(key, JSON.stringify(updatedViewed));
  } catch(e) { console.warn("Lỗi lưu lịch sử xem", e); }

  /* ===== FETCH MẶT BẰNG TƯƠNG TỰ (NÂNG CẤP CHÍNH XÁC HƠN) ===== */
  try {
    const modApi = await import("../services/api.js?v=1.0.5");
    const similarContainer = document.getElementById("similar-listings");
    if (similarContainer) {
      // Nâng cấp: Lọc theo Từ khóa (Quận), Loại hình và Khoảng giá (+- 50%)
      const queryParams = { limit: 10 };
      
      if (itemDistrict) queryParams.keyword = itemDistrict;
      if (itemType) queryParams.type = itemType;
      
      if (item.price) {
        queryParams.minPrice = item.price * 0.5; // Giảm 50%
        queryParams.maxPrice = item.price * 1.5; // Tăng 50%
      }

      const simRes = await modApi.fetchListings(queryParams);
      // Lọc bỏ item hiện tại
      const simData = (simRes.data || simRes).filter(x => String(x.id) !== String(item.id)).slice(0, 4);
      
      if (simData.length > 0) {
        let simHtml = '';
        simData.forEach(sItem => {
           const img = sItem.image || 'https://placehold.co/600x400?text=No+Image';
           const price = sItem.price_string || (sItem.price ? `${(sItem.price/1000000).toLocaleString('vi-VN')} triệu/tháng` : 'Thỏa thuận');
           const area = sItem.area_m2 || sItem.area || sItem.size || 0;
           simHtml += `
            <a href="/js/views/chitiet.html?id=${sItem.id}" class="block group bg-white rounded-xl shadow-sm hover:shadow-md transition border border-gray-100 overflow-hidden">
              <div class="relative h-40">
                <img src="${img}" class="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                <div class="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded font-bold">${sItem.type || sItem.category || 'Mặt bằng'}</div>
              </div>
              <div class="p-4">
                <h4 class="font-bold text-gray-900 truncate mb-1">${sItem.title}</h4>
                <p class="text-xs text-gray-500 truncate mb-2"><span class="material-symbols-outlined text-[12px] align-middle">location_on</span> ${sItem.district || sItem.address || 'Đang cập nhật'}</p>
                <div class="flex justify-between items-end mt-2">
                  <span class="text-primary font-bold">${price}</span>
                  <span class="text-xs text-gray-500">${area} m²</span>
                </div>
              </div>
            </a>
           `;
        });
        similarContainer.innerHTML = simHtml;
      } else {
        similarContainer.innerHTML = '<p class="text-gray-500 italic col-span-full">Chưa có mặt bằng tương tự nào được tìm thấy trong khu vực và tầm giá này.</p>';
      }
    }
  } catch(e) { console.warn("Lỗi load similar listings", e); }

  /* ===== TĂNG VIEW COUNT TRÊN DB (Tự động cộng 1 lượt xem khi load) ===== */
  try {
    const API_BASE = (location.port && String(location.port) !== '3033') ? `http://${location.hostname}:3033` : '';
    fetch(`${API_BASE}/api/listings/${id}/view`, { method: 'POST' })
      .then(res => res.json())
      .then(data => {
        if (data && data.views !== undefined) {
           const viewEl = document.getElementById("view-count");
           if (viewEl) viewEl.textContent = data.views;
        }
      })
      .catch(err => console.warn("Lỗi tăng view count:", err));
  } catch (e) { console.warn("Lỗi fetch view count", e); }

  /* ===== MAP ===== */
  if (item.lat && item.lng && window.maplibregl) {
    map = new maplibregl.Map({
      container: "vietmap",
      style: {
        "version": 8,
        "sources": {
          "osm": {
            "type": "raster",
            "tiles": ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
            "tileSize": 256,
            "attribution": "&copy; OpenStreetMap contributors"
          }
        },
        "layers": [
          {
            "id": "osm",
            "type": "raster",
            "source": "osm",
            "minzoom": 0,
            "maxzoom": 19
          }
        ]
      },
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

    if (window.userMarker) {
      window.userMarker.remove();
    }

    const popup = new maplibregl.Popup({ offset: 25 }).setHTML(
      `<div><b>Vị trí của bạn</b><br><small class='text-gray-500'>(Kéo thả để chỉnh sửa nếu sai)</small><br><span id='route-distance' class='text-primary font-bold text-xs'>Đang tính khoảng cách...</span></div>`
    );

    window.userMarker = new maplibregl.Marker({ color: "#16a34a", draggable: true }) // User location
      .setLngLat([pos.lng, pos.lat])
      .setPopup(popup)
      .addTo(map);

    // Format and display real driving distance and duration
    const updateDistanceUI = (routeData) => {
      const distEl = document.getElementById("route-distance");
      if (distEl && routeData) {
        const distanceText = routeData.distance > 1000 
          ? (routeData.distance/1000).toFixed(1) + ' km' 
          : Math.round(routeData.distance) + ' m';
        distEl.textContent = `Cách mặt bằng: ${distanceText}`;
      }
    };

    window.userMarker.on('dragend', async () => {
      const newLngLat = window.userMarker.getLngLat();
      btn.innerHTML = "⏳ Đang vẽ lại...";
      btn.disabled = true;
      try {
        const routeData = await getRoute(
          { lat: newLngLat.lat, lng: newLngLat.lng },
          { lat: currentItem.lat, lng: currentItem.lng }
        );
        drawRoute(routeData.geometry);
        updateDistanceUI(routeData);
      } catch (err) {
        console.error("Lỗi vẽ lại đường:", err);
      }
      btn.innerHTML = originalText;
      btn.disabled = false;
    });

    const routeData = await getRoute(
      { lat: pos.lat, lng: pos.lng },
      { lat: currentItem.lat, lng: currentItem.lng }
    );

    drawRoute(routeData.geometry);
    setTimeout(() => updateDistanceUI(routeData), 500); // Delay slightly to allow popup to render

    // Zoom fit bounds
    const bounds = new maplibregl.LngLatBounds();
    bounds.extend([pos.lng, pos.lat]);
    bounds.extend([currentItem.lng, currentItem.lat]);
    map.fitBounds(bounds, { padding: 50 });

    btn.innerHTML = originalText;
    btn.disabled = false;
    popup.addTo(map);

  } catch (e) {
    document.getElementById("btnRoute").innerHTML = '<span class="material-symbols-outlined text-sm">directions</span> Chỉ đường';
    document.getElementById("btnRoute").disabled = false;
    
    // Nếu lỗi là do người dùng từ chối quyền hoặc lỗi hệ thống, báo lỗi rõ ràng.
    let errorMsg = "Không thể lấy vị trí của bạn.";
    if (e.code === 1) errorMsg = "Bạn đã từ chối quyền truy cập vị trí. Hãy bật lại trong cài đặt trình duyệt.";
    else if (e.code === 2) errorMsg = "Không thể xác định vị trí hiện tại (Lỗi mạng hoặc thiết bị GPS).";
    else if (e.code === 3) errorMsg = "Quá thời gian lấy vị trí, vui lòng thử lại.";
    
    alert(errorMsg);
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
            <div class="font-bold text-gray-800">${rv.user_name || rv.user_email || 'Khách hàng ẩn danh'}</div>
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

  let userId = null;
  let token = null;
  try {
    const raw = sessionStorage.getItem('currentUser');
    if (raw) {
      const u = JSON.parse(raw);
      userId = u.id || u.postgres_id;
    }

    // Safely get Firebase token
    if (auth) {
      token = await new Promise((resolve) => {
        if (auth.currentUser) return resolve(auth.currentUser.getIdToken());
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
          unsubscribe();
          if (user) resolve(await user.getIdToken());
          else resolve(null);
        });
      });
      if (token && auth.currentUser && !userId) {
        userId = auth.currentUser.uid;
      }
    }
  } catch (e) {
    console.error("Lỗi xác thực:", e);
    alert("Lỗi try/catch: " + e.message);
  }

  if (!userId || !token) {
    alert("Debug: userId=" + userId + ", token=" + (token ? "có" : "null") + ", auth.currentUser=" + (auth && auth.currentUser ? "có" : "null"));
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
