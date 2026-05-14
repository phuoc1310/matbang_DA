import db from '../config/db.js';
async function run() {
  const res = await db.query("SELECT id, firebase_uid, email, name, role FROM users ORDER BY id LIMIT 20");
  console.table(res.rows);
  process.exit(0);
}
run();
