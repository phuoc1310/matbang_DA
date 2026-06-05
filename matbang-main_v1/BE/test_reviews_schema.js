import db from './config/db.js';

async function test() {
  try {
    const res = await db.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'reviews';
    `);
    console.log(res.rows);
  } catch (err) {
    console.error(err);
  }
  process.exit(0);
}

test();
