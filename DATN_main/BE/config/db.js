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
    client.release();
  })
  .catch(err => console.error("❌ DB error:", err.message));

export default pool;