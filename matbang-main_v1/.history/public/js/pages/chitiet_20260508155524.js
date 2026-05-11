import { fetchDetail } from "../services/api.js";
import { renderImages } from "../components/render.js";
import { addInterest } from "../services/firebaseService.js";
import { auth } from "../config/firebase.js";

// DEBUG: temporary marker to confirm module loaded in the browser
console.log('chitiet.js loaded');
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
document.addEventListener("DOMContentLoaded", async () => {
  const id = new URLSearchParams(location.search).get("id");
  if (!id) return;

  const item = await fetchDetail(id);

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

  /* 🔥 GHI NHẬN VIEW – CHỈ 1 LẦN */
  try {
    const uid = auth.currentUser?.uid || "guest";
    await addInterest(item.id, uid, "view");
  } catch (e) {
    console.warn("Không thể ghi nhận lượt xem", e);
  }

  /* ===== RENDER ===== */
  currentItem = item;
  window.currentListing = item;

  renderImages(item); // ✅ CHỈ GỌI 1 LẦN

  document.getElementById("title").textContent = item.title;
  document.getElementById("location").textContent = item.address;
  document.getElementById("price").textContent = item.price_string;
  document.getElementById("area").textContent =
    item.area_m2 ? `${item.area_m2} m²` : "—";
  document.getElementById("detail-seller").textContent = item.seller;
  document.getElementById("detail-rating").textContent =
    item.rating ? `⭐ ${item.rating}` : "Chưa có đánh giá";

  document.getElementById("description").innerHTML = `
    <p class="font-bold">Địa chỉ:</p> <p>${item.address}</p>
  `;

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
});


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

  setTimeout(() => {
    const price = window.currentListing.price || 0;
    let msg = "Vị trí này khá thuận lợi.";
    if (price > 10000000) msg += " Giá thuê hơi cao so với mặt bằng chung.";
    else msg += " Mức giá hợp lý, tiềm năng sinh lời tốt.";
    box.innerHTML = `<b>AI:</b> ${msg}`;
  }, 1000);
};