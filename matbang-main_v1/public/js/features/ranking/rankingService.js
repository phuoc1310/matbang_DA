import { buildBIModel } from "./biModel.js";
import { scoreListing } from "./scoring.js";

export function runBIAnalysis(rawData = [], searchContext = {}) {
  console.log("🚀 Starting BI Analysis...");
  console.log("Data count:", rawData.length);
  console.log("Search context:", searchContext);

  if (!Array.isArray(rawData) || rawData.length === 0) {
    console.warn("⚠️ No data to analyze");
    return [];
  }

  // Build BI models
  const biData = rawData.map(buildBIModel);
  console.log("BI Models built:", biData.length);

  // Calculate stats
  const prices = biData.map(x => x.price).filter(p => p > 0);
  const areas = biData.map(x => x.area).filter(a => a > 0);

  if (prices.length === 0 || areas.length === 0) {
    console.warn("⚠️ Insufficient data for stats calculation");
    return biData.map(item => ({
      ...item,
      score: 0.5,
      level: "Bình thường"
    }));
  }

  const stats = {
    minPrice: Math.min(...prices),
    maxPrice: Math.max(...prices),
    priceRange: Math.max(...prices) - Math.min(...prices),
    minArea: Math.min(...areas),
    maxArea: Math.max(...areas),
    areaRange: Math.max(...areas) - Math.min(...areas),
    maxInterest: Math.max(...biData.map(x => x.interests)) || 1,
  };

  console.log("📈 Stats calculated:", stats);

  // Set up context với giá trị mặc định
  const ctx = {
    avgPrice: searchContext.avgPrice || (stats.minPrice + stats.maxPrice) / 2,
    avgArea: searchContext.avgArea || 50,
    city: searchContext.city || null,
  };

  console.log("🎯 Context:", ctx);

  // Score và phân loại
  const scoredData = biData
    .map(item => {
      try {
        const score = scoreListing(item, ctx, stats);
        const level =
          score >= 0.7 ? "Ưu tiên cao" :
          score >= 0.4 ? "Theo dõi" :
                         "Hiệu quả thấp";
        
        return {
          ...item,
          score,
          level,
        };
      } catch (error) {
        console.error("Error scoring item:", item.id, error);
        return {
          ...item,
          score: 0.5,
          level: "Bình thường"
        };
      }
    })
    .sort((a, b) => b.score - a.score);

  console.log("✅ BI Analysis complete");
  return scoredData;
}