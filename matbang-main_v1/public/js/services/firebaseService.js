import { realtimeDb } from "../config/firebase.js";
import { ref, set,get, push } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

export function saveListingForBI(item) {
  return set(ref(realtimeDb, `listings/${item.id}`), {
    price: item.price,
    area: item.area_m2,
    region: item.region,
    regionCode: item.regionCode || "hcm",
    created_at: Date.now()
  });
}

export async function addInterest(listingId, userId = null, type = "view") {
  try {
    let path;
    if (userId) {
      // Nếu có đăng nhập, dùng UID để mỗi người chỉ tính 1 lần
      path = `interests/${listingId}/${type}s/${userId}`;
      const interestRef = ref(realtimeDb, path);
      const snap = await get(interestRef);
      if (snap.exists()) return;
      await set(interestRef, Date.now());
    } else {
      // Nếu là khách, dùng push() để tạo ID mới mỗi lần xem
      path = `interests/${listingId}/${type}s`;
      await push(ref(realtimeDb, path), Date.now());
    }
    
    // Tăng biến đếm tổng (Counter) - Xem mục 2 bên dưới
  } catch (error) {
    console.error("Lỗi:", error);
  }
}

export async function getInterestCountMap() {
  try {
    const snapshot = await get(ref(realtimeDb, "interests"));
    if (!snapshot.exists()) return {};

    const data = snapshot.val();
    const map = {};

    for (const [listingId, types] of Object.entries(data)) {
      // Dùng optional chaining ?. để tránh lỗi nếu views/favorites không tồn tại
      const views = types.views ? Object.keys(types.views).length : 0;
      const favorites = types.favorites ? Object.keys(types.favorites).length : 0;
      map[listingId] = views + favorites;
    }

    return map;
  } catch (error) {
    console.error("Lỗi khi lấy bản đồ tương tác:", error);
    return {};
  }
}

