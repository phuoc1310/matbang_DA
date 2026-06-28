export function scoreListing(item, ctx, stats) {
  console.log("📝 Scoring item:", item.id, "regionCode:", item.regionCode);
  
  const priceScore =
    stats.priceRange === 0
      ? 1
      : 1 - Math.abs(item.price - ctx.avgPrice) / stats.priceRange;

  const areaScore =
    stats.areaRange === 0
      ? 1
      : 1 - Math.abs(item.area - ctx.avgArea) / stats.areaRange;

  
  let locationScore = 0.6; 
  
  if (ctx.city && item.regionCode) {
    
    locationScore = (item.regionCode === ctx.city) ? 1 : 0.4;
  } else if (ctx.city && !item.regionCode) {
    
    const regionName = (item.region || "").toLowerCase();
    const cityKeywords = {
      hcm: ["hồ chí minh", "tphcm", "tp hcm", "hcm"],
      hn: ["hà nội", "hn"],
      dn: ["đà nẵng", "dn"],
      bd: ["bình dương", "bd"]
    };
    
    if (cityKeywords[ctx.city]?.some(keyword => regionName.includes(keyword))) {
      locationScore = 0.8;
    } else {
      locationScore = 0.4;
    }
  }

  const ratingScore = (item.rating || 0) / 5;
  const interestScore = Math.min(item.interests || 0, stats.maxInterest) / stats.maxInterest;

  const score =
    0.35 * priceScore +
    0.25 * areaScore +
    0.20 * locationScore +
    0.10 * ratingScore +
    0.10 * interestScore;

  const finalScore = Math.max(0, Math.min(score, 1));
  console.log("📊 Final score:", finalScore);
  
  return finalScore;
}
