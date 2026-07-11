import db from "../config/db.js";

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


export async function getReviewsByListing(listing_id) {
  const result = await db.query(
    `SELECT r.*, u.name as user_name, u.email as user_email
     FROM reviews r
     LEFT JOIN users u ON r.user_id = u.id
     WHERE r.listing_id = $1 
     ORDER BY r.created_at DESC`,
    [listing_id]
  );

  return result.rows;
}