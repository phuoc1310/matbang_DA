// services/reviewService.js
import pool from "../config/db.js";

// CREATE
export async function createReview(data) {
  const { listing_id, rating, comment, suggestion, email } = data;

  if (!rating || rating < 1 || rating > 5) {
    throw new Error("Rating phải từ 1 đến 5");
  }

  const result = await pool.query(
    `INSERT INTO reviews (listing_id, rating, comment, suggestion, email)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [listing_id, rating, comment, suggestion, email]
  );

  return result.rows[0];
}

// GET BY LISTING
export async function getReviewsByListing(listing_id) {
  const result = await pool.query(
    `SELECT * FROM reviews WHERE listing_id = $1 ORDER BY created_at DESC`,
    [listing_id]
  );

  return result.rows;
}

// ⭐ AVG RATING (QUAN TRỌNG)
export async function getAverageRating(listing_id) {
  const result = await pool.query(
    `SELECT AVG(rating) as avg FROM reviews WHERE listing_id = $1`,
    [listing_id]
  );

  return Number(result.rows[0].avg) || 0;
}