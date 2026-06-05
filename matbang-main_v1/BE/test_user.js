import db from './config/db.js';

async function test() {
  try {
    const res = await db.query("SELECT * FROM users WHERE email = 'admin@renthub.vn'");
    console.log(res.rows);
  } catch (err) {
    console.error(err);
  }
  process.exit(0);
}

test();
