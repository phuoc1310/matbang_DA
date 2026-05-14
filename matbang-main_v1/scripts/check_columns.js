import db from './config/db.js';
async function run() {
  const res = await db.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'listings'");
  console.log(res.rows);
  process.exit(0);
}
run();
