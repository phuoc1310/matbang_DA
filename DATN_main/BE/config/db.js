import pkg from "pg";

const { Pool } = pkg;


const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "mat_bang",
  password: "123456",
  port: 5432,
});


pool.connect()
  .then(async (client) => {
    console.log("✅ PostgreSQL connected");
    
    await client.query("SET pg_trgm.similarity_threshold = 0.15;");

    // Tự động kích hoạt PostGIS
    try {
      await client.query("CREATE EXTENSION IF NOT EXISTS postgis;");
      console.log("🌍 PostGIS extension is ready.");
      
      // Thêm cột location nếu chưa có và cập nhật dữ liệu từ lat, lng hiện tại
      await client.query(`
        ALTER TABLE listings ADD COLUMN IF NOT EXISTS location GEOMETRY(Point, 4326);
        UPDATE listings SET location = ST_SetSRID(ST_MakePoint(lng, lat), 4326) 
        WHERE location IS NULL AND lat IS NOT NULL AND lng IS NOT NULL;
      `);
    } catch (err) {
      console.warn("⚠️ PostGIS warning: ", err.message);
    }

    client.release();
  })
  .catch(err => console.error("❌ DB error:", err.message));

export default pool;