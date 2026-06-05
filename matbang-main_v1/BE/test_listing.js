import db from './config/db.js';

async function test() {
  const res = await db.query("SELECT id FROM listings WHERE id = 9977");
  console.log('Listing exists:', res.rows.length > 0);
  process.exit(0);
}

test();
