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

// ================= API =================
const BASE_URL =
  "https://gateway.chotot.com/v1/public/ad-listing" +
  "?limit=20" +
  "&st=s,k" +
  "&sp=0" +
  "&region_v2=13000" +
  "&o=";

const headers = {
  accept: "application/json",
  "user-agent": "Mozilla/5.0",
  referer: "https://www.nhatot.com/mua-ban-bat-dong-san",
};

// ================= FILTER =================
function isBatDongSan(ad) {
  return [1010, 1020, 1030, 1040].includes(ad.category);
}

// ================= FETCH =================
async function fetchData(offset = 0) {
  try {
    const url = BASE_URL + offset;

    const res = await axios.get(url, { headers });

    console.log(`👉 Fetch offset ${offset} | số tin: ${res.data?.ads?.length}`);

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
    if (!isBatDongSan(ad)) continue;

    try {
      await client.query(
        `INSERT INTO ads (
          ad_id, title, price, area, category,
          description, image, size, latitude, longitude, address, date
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
        ON CONFLICT (ad_id) DO NOTHING`,
        [
          ad.ad_id,
          ad.subject,
          ad.price,
          ad.area_name,
          ad.category_name,
          ad.body || null,
          ad.image || null,
          ad.size || null,
          ad.latitude || null,
          ad.longitude || null,
          ad.address || null,
          ad.date || null,
        ]
      );

      count++;
    } catch (err) {
      console.error("❌ Insert lỗi:", err.message);
    }
  }

  console.log(`✔️ Đã lưu ${count} tin hợp lệ`);
}

// ================= MAIN =================
async function main() {
  await client.connect();
  console.log("🚀 Start auto crawl...");

  let offset = 0;
  let totalSaved = 0;

  while (true) {
    const ads = await fetchData(offset);

    if (ads.length === 0) {
      console.log("🛑 Hết dữ liệu, dừng crawl");
      break;
    }

    await saveToDB(ads);

    totalSaved += ads.length;
    offset += 20;

    // 🔥 delay tránh bị block
    await new Promise((r) => setTimeout(r, 1000));
  }

  await client.end();
  console.log(`🎯 DONE - Tổng crawl: ${totalSaved} tin`);
}

main();