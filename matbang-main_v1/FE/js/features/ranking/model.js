export function buildBIModel(item) {
  return {
    id: item.id,
    price: item.price || 0,
    area: item.area_m2 || 0,
    rating: item.rating || 0,
    interests: item.interests || Math.floor(Math.random() * 100),
    region: item.region || "",
    regionCode: item.regionCode || "", 
    created_at: item.date,
  };
}