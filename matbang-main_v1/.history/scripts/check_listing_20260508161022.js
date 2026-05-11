import db from "../config/db.js";

async function check(id) {
  try {
    const res = await db.query('SELECT id,title,price,area,address,city,lat,lng FROM listings WHERE id = $1 LIMIT 1', [Number(id)]);
    if (res.rows.length === 0) {
      console.log(`No listing found with id=${id}`);
      process.exit(0);
    }
    console.log('Listing row:', res.rows[0]);
    process.exit(0);
  } catch (err) {
    console.error('DB query failed:', err.message);
    process.exit(1);
  }
}

const id = process.argv[2] || 10000;
check(id);
