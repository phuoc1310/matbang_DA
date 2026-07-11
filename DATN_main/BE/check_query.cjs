const { Pool } = require('pg');

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "mat_bang",
  password: "123456",
  port: 5432,
});

async function run() {
  try {
    const res = await pool.query(
      `SELECT id, email, created_at FROM users ORDER BY created_at DESC LIMIT 20`
    );
    console.log("Total returned:", res.rows.length);
    console.log(res.rows);
  } catch (e) {
    console.error(e);
  } finally {
    pool.end();
  }
}
run();
