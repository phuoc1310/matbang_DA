// services/user.service.js
import db from "../config/db.js";

export async function findOrCreateUser(data) {
  const check = await db.query(
    `SELECT * FROM users WHERE firebase_uid = $1`,
    [data.uid]
  );

  if (check.rows.length > 0) {
    return check.rows[0];
  }

  const result = await db.query(
    `INSERT INTO users (firebase_uid, email, name)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [data.uid, data.email, data.name || "No Name"]
  );

  return result.rows[0];
}