import axios from "axios";
import pkg from "pg";

const { Client } = pkg;

// ================= DB =================
const client = new Client({
  user: "postgres",
  host: "localhost",
  database: "mat_bang",
  password: "123456",
  port: 5432,
});

// API config cho 2 khu vực: HCM (13000) và Hà Nội (12000)
// Lấy các chuyên mục: 1010 (Căn hộ), 1020 (Nhà ở), 1040 (Mặt bằng)
const REGIONS = [13000, 12000]; 
const CATEGORIES = [1010, 1020, 1040];

const headers = {
  accept: "application/json",
  "user-agent": "Mozilla/5.0",
};

// ================= HELPERS =================
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

// ================= FETCH =================
async function fetchData(region, category, offset = 0) {
  const url = `https://gateway.chotot.com/v1/public/ad-listing?limit=20&st=s,k&sp=0&region_v2=${region}&cg=${category}&o=${offset}`;
  try {
    const res = await axios.get(url, { headers });
    console.log(`👉 Region ${region} | Category ${category} | Offset ${offset} | Lấy được ${res.data?.ads?.length || 0} tin`);
    return res.data?.ads || [];
  } catch (err) {
    console.error("❌ Fetch lỗi:", err.message);
    return [];
  }
}

// ================= INSERT =================
async function saveToDB(ads) {
  let count = 0;

  for (let ad of ads) {
    try {
      if (!ad.price || !ad.size) continue;

      const type = getListingType(ad.category);
      const address = constructAddress(ad);
      const city = ad.region_name_v3 || ad.region_name || null;
      const district = ad.area_name || null;
      const ward = ad.ward_name || null;
      // Dùng images mảng hoặc fallback sang image đơn
      const imageUrl = (ad.images && ad.images.length > 0) ? ad.images[0] : ad.image;

      // Kiểm tra xem tin đã tồn tại chưa
      const check = await client.query(`SELECT id FROM listings WHERE external_id = $1 LIMIT 1`, [ad.list_id.toString()]);
      if (check.rows.length > 0) {
        // Đã tồn tại, bỏ qua (hoặc có thể update)
        continue;
      }

      await client.query(
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

// ================= MAIN =================
async function main() {
  try {
    await client.connect();
    console.log("🚀 Bắt đầu cào dữ liệu (Crawl Data)...");

    for (const region of REGIONS) {
      for (const category of CATEGORIES) {
        let offset = 0;
        let totalSaved = 0;

        // Giới hạn cào 100 tin mỗi category/region để tránh spam server
        while (offset < 100) {
          const ads = await fetchData(region, category, offset);
          if (ads.length === 0) break;

          const savedCount = await saveToDB(ads);
          totalSaved += savedCount;

          if (ads.length < 20) break; // Hết data

          offset += 20;
          await new Promise((r) => setTimeout(r, 1500)); // Delay để tránh bị block
        }
        
        console.log(`✔️ Hoàn thành Region ${region} | Category ${category}. Đã lưu thêm ${totalSaved} tin mới.`);
      }
    }

    console.log("🎯 DONE. Đã cào xong!");
  } catch (err) {
    console.error("❌ Lỗi toàn cục:", err.message);
  } finally {
    await client.end();
  }
}

main();