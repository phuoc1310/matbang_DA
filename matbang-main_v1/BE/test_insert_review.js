import db from './config/db.js';

async function test() {
  try {
    const listing_id = 9977;
    const user_id = 5;
    const rating = 5;
    const comment = 'tốt';

    const result = await db.query(
      `INSERT INTO reviews (listing_id, user_id, rating, comment)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [listing_id, user_id, rating, comment]
    );

    console.log(result.rows[0]);
  } catch (err) {
    console.error('DB Error:', err.message);
  }
  process.exit(0);
}

test();
