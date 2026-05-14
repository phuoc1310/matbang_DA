import db from '../config/db.js';
async function run() {
  const res = await db.query("UPDATE listings SET status = 'approved' WHERE status = 'pending'");
  console.log('Updated rows:', res.rowCount);
  process.exit(0);
}
run();
