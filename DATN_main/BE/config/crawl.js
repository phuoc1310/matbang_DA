import axios from "axios";

// ==================== CẤU HÌNH ====================
const REGIONS = [13000, 12000]; // HCM, Hà Nội
const CATEGORIES = [1010, 1020, 1040]; // Căn hộ, Nhà, Mặt bằng

const headers = {
  accept: "application/json",
  "user-agent": "Mozilla/5.0",
};

// ==================== HELPER ====================
function getListingType(categoryId) {
  if (categoryId === 1010) return 'canho';
  if (categoryId === 1040) return 'matbang';
  if (categoryId === 1020) return 'nha';
  return 'matbang';
}

function constructAddress(ad) {
  if (ad.address) return ad.address;
  const parts = [];
  if (ad.street_name) parts.push(ad.street_name);
  if (ad.ward_name) parts.push(ad.ward_name);
  if (ad.area_name) parts.push(ad.area_name);
  if (ad.region_name_v3 || ad.region_name) parts.push(ad.region_name_v3 || ad.region_name);
  return parts.join(', ');
}

// ==================== FETCH ====================
async function fetchData(region, category, offset = 0) {
  const url = `https://gateway.chotot.com/v1/public/ad-listing?limit=20&st=s,k&sp=0&region_v2=${region}&cg=${category}&o=${offset}`;
  try {
    const res = await axios.get(url, { headers });
    return res.data?.ads || [];
  } catch (err) {
    console.error("❌ Fetch lỗi:", err.message);
    return [];
  }
}

// ==================== SAVE ====================
async function saveToDB(pool, ads) {
  let count = 0;

  for (let ad of ads) {
    try {
      if (!ad.price || !ad.size) continue;

      const type = getListingType(ad.category);
      const address = constructAddress(ad);
      const city = ad.region_name_v3 || ad.region_name || null;
      const district = ad.area_name || null;
      const ward = ad.ward_name || null;

      const imageUrl = (ad.images && ad.images.length > 0) ? ad.images[0] : ad.image;

      // Kiểm tra trùng lặp theo external_id
      const check = await pool.query(`SELECT id FROM listings WHERE external_id = $1 LIMIT 1`, [ad.list_id.toString()]);
      if (check.rows.length > 0) {
        continue;
      }

      await pool.query(
        `INSERT INTO listings (
          title, price, area, address, city, district, ward, 
          lat, lng, type, description, image, source, external_id, is_visible, status
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,true,'approved')`,
        [
          ad.subject,
          ad.price,
          ad.size,
          address,
          city,
          district,
          ward,
          ad.latitude || null,
          ad.longitude || null,
          type,
          ad.body || null,
          imageUrl || null,
          'chotot',
          ad.list_id.toString()
        ]
      );

      count++;
    } catch (err) {
      console.error("❌ Insert lỗi:", err.message);
    }
  }

  return count;
}

// ==================== MAIN CRAWL FUNCTION ====================
/**
 * Hàm crawl chính — có thể gọi từ cron hoặc chạy standalone.
 * @param {import('pg').Pool} pool - PostgreSQL connection pool
 */
export async function runCrawl(pool) {
  const startTime = Date.now();
  let totalNewListings = 0;

  console.log("🔄 [Auto-Crawl] Bắt đầu cào dữ liệu...");

  try {
    for (const region of REGIONS) {
      for (const category of CATEGORIES) {
        let offset = 0;
        let totalSaved = 0;

        while (offset < 100) {
          const ads = await fetchData(region, category, offset);
          if (ads.length === 0) break;

          const savedCount = await saveToDB(pool, ads);
          totalSaved += savedCount;

          if (ads.length < 20) break;

          offset += 20;
          await new Promise((r) => setTimeout(r, 1500)); // Chờ 1.5s tránh bị chặn
        }

        totalNewListings += totalSaved;
        console.log(`✔️ Region ${region} | Category ${category} → +${totalSaved} tin mới`);
      }
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`🎯 [Auto-Crawl] DONE — ${totalNewListings} tin mới — ${elapsed}s`);
  } catch (err) {
    console.error("❌ [Auto-Crawl] Lỗi:", err.message);
  }

  return totalNewListings;
}

// ==================== STANDALONE MODE ====================
// Nếu chạy trực tiếp: node config/crawl.js
const isRunDirectly = process.argv[1]?.includes('crawl.js');
if (isRunDirectly) {
  import("pg").then(async (pkg) => {
    const { default: { Pool } } = pkg;
    const pool = new Pool({
      user: "postgres",
      host: "localhost",
      database: "mat_bang",
      password: "123456",
      port: 5432,
    });
    await runCrawl(pool);
    await pool.end();
    process.exit(0);
  });
}