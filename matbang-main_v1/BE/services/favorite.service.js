import db from "../config/db.js";

async function resolveDbUserId(userId) {
  if (!userId) return null;
  if (isNaN(Number(userId))) {
    const res = await db.query(`SELECT id FROM users WHERE firebase_uid = $1 LIMIT 1`, [userId]);
    return res.rows.length > 0 ? res.rows[0].id : null;
  }
  return Number(userId);
}

// ADD FAVORITE
export async function addFavorite(user_id, listing_id) {
  const resolvedId = await resolveDbUserId(user_id);
  if (!resolvedId) throw new Error("User not found in database");

  const result = await db.query(
    `INSERT INTO favorites (user_id, listing_id)
     VALUES ($1, $2)
     ON CONFLICT (user_id, listing_id) DO NOTHING
     RETURNING *`,
    [resolvedId, listing_id]
  );

  return result.rows[0];
}

// GET FAVORITES BY USER
export async function getFavoritesByUser(user_id) {
  const resolvedId = await resolveDbUserId(user_id);
  if (!resolvedId) return [];

  const result = await db.query(
    `SELECT f.*, l.title, l.price, l.image
     FROM favorites f
     JOIN listings l ON f.listing_id = l.id
     WHERE f.user_id = $1
     ORDER BY f.id DESC`,
    [resolvedId]
  );

  return result.rows;
}

// DELETE FAVORITE
export async function deleteFavorite(user_id, listing_id) {
  const resolvedId = await resolveDbUserId(user_id);
  if (!resolvedId) throw new Error("User not found in database");

  await db.query(
    `DELETE FROM favorites
     WHERE user_id = $1 AND listing_id = $2`,
    [resolvedId, listing_id]
  );

  return { message: "Deleted" };
}