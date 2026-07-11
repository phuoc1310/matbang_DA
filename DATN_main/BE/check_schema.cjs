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
    const res = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users'");
    console.log(res.rows);
  } catch (e) {
    console.error(e);
  } finally {
    pool.end();
  }
}
run();
