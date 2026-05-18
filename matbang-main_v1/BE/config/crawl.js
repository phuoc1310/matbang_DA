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
  "?limit=20&st=s,k&sp=0&region_v2=13000&o=";

const headers = {
  accept: "application/json",
  "user-agent": "Mozilla/5.0",
};

// ================= FILTER =================
function isBatDongSan(ad) {
  return [1010, 1020, 1030, 1040].includes(ad.category);
}

// ================= FETCH =================
async function fetchData(offset = 0) {
  try {
    const res = await axios.get(BASE_URL + offset, { headers });

    console.log(`👉 Offset ${offset} | ${res.data?.ads?.length} tin`);

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
      if (!isBatDongSan(ad)) continue;
      if (!ad.price || !ad.size) continue;

      await client.query(
        `INSERT INTO ads (
          ad_id, title, price, area, category, category_name,
          city, district, ward,
          description, image,
          latitude, longitude, address, date
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
        ON CONFLICT (ad_id) DO NOTHING`,
        [
          ad.ad_id,
          ad.subject,
          ad.price,
          ad.size,
          ad.category,
          ad.category_name,
          ad.region_name || null,
          ad.area_name || null,
          ad.ward_name || null,
          ad.body || null,
          ad.image || null,
          ad.latitude || null,
          ad.longitude || null,
          ad.address || null,
          null, // fix date
        ]
      );

      count++;
    } catch (err) {
      console.error("❌ Insert lỗi:", err.message);
    }
  }

  console.log(`✔️ Đã lưu ${count} tin`);
}

// ================= MAIN =================
async function main() {
  try {
    await client.connect();
    console.log("🚀 Start crawl...");

    let offset = 0;

    while (true) {
      const ads = await fetchData(offset);

      if (ads.length === 0) break;

      await saveToDB(ads);

      offset += 20;
      await new Promise((r) => setTimeout(r, 1000));
    }

    console.log("🎯 DONE");
  } catch (err) {
    console.error("❌ Lỗi:", err.message);
  } finally {
    await client.end();
  }
}

main();