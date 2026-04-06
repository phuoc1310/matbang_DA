import { realtimeDb } from "./firebase.js";
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

export async function addInterest(listingId, userId = "guest", type = "view") {
  const path = `interests/${listingId}/${type}s/${userId}`;
  const interestRef = ref(realtimeDb, path);

  const snap = await get(interestRef);

  if (snap.exists()) {
    // ❌ Đã tồn tại → không ghi nữa
    return;
  }

  // ✅ Chưa có → ghi
  return set(interestRef, Date.now());
}
export async function getInterestCountMap() {
  const snapshot = await get(ref(realtimeDb, "interests"));
  const data = snapshot.exists() ? snapshot.val() : {};

  const map = {};

  Object.entries(data).forEach(([listingId, item]) => {
    const views = item.views ? Object.keys(item.views).length : 0;
    const favorites = item.favorites ? Object.keys(item.favorites).length : 0;

    map[listingId] = views + favorites;
  });

  return map;
}


