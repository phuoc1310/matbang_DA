import db from "../config/db.js";

// ADD FAVORITE
export async function addFavorite(user_id, listing_id) {
  const result = await db.query(
    `INSERT INTO favorites (user_id, listing_id)
     VALUES ($1, $2)
     ON CONFLICT (user_id, listing_id) DO NOTHING
     RETURNING *`,
    [user_id, listing_id]
  );

  return result.rows[0];
}

// GET FAVORITES BY USER
export async function getFavoritesByUser(user_id) {
  const result = await db.query(
    `SELECT f.*, l.title, l.price, l.image
     FROM favorites f
     JOIN listings l ON f.listing_id = l.id
     WHERE f.user_id = $1
     ORDER BY f.created_at DESC`,
    [user_id]
  );

  return result.rows;
}

// DELETE FAVORITE
export async function deleteFavorite(user_id, listing_id) {
  await db.query(
    `DELETE FROM favorites
     WHERE user_id = $1 AND listing_id = $2`,
    [user_id, listing_id]
  );

  return { message: "Deleted" };
}