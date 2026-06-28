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
      
      path = `interests/${listingId}/${type}s/${userId}`;
      const interestRef = ref(realtimeDb, path);
      const snap = await get(interestRef);
      if (snap.exists()) return;
      await set(interestRef, Date.now());
    } else {
      
      path = `interests/${listingId}/${type}s`;
      await push(ref(realtimeDb, path), Date.now());
    }
    
    
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

