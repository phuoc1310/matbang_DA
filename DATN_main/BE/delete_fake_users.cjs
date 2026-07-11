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
    const res = await pool.query(`DELETE FROM users WHERE email LIKE 'fakeuser%@gmail.com' OR name LIKE 'Người Dùng Ảo%'`);
    console.log(`Deleted ${res.rowCount} fake users.`);
    pool.end();
  } catch (err) {
    console.error(err);
    pool.end();
  }
}

run();
