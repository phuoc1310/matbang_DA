import pkg from "pg";

const { Pool } = pkg;

// tạo pool (khuyên dùng thay vì Client)
const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "mat_bang",
  password: "123456",
  port: 5432,
});

// test kết nối
pool.connect()
  .then(() => console.log("✅ PostgreSQL connected"))
  .catch(err => console.error("❌ DB error:", err.message));

export default pool;