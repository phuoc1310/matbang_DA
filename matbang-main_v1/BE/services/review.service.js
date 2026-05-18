import db from "../config/db.js";
// CREATE REVIEW
export async function createReview(data) {
  const { listing_id, user_id, rating, comment } = data;

  const result = await db.query(
    `INSERT INTO reviews (listing_id, user_id, rating, comment)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [listing_id, user_id, rating, comment]
  );

  return result.rows[0];
}

// GET BY LISTING
export async function getReviewsByListing(listing_id) {
  const result = await db.query(
    `SELECT * FROM reviews WHERE listing_id = $1 ORDER BY created_at DESC`,
    [listing_id]
  );

  return result.rows;
}