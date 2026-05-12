// services/user.service.js
import db from "../config/db.js";

export async function findOrCreateUser(data) {
  const check = await db.query(
    `SELECT * FROM users WHERE firebase_uid = $1`,
    [data.uid]
  );

  if (check.rows.length > 0) {
    // Cập nhật thông tin mới nhất nếu có
    const updateResult = await db.query(
      `UPDATE users 
       SET email = COALESCE($2, email),
           name = COALESCE($3, name),
           phone_number = COALESCE($4, phone_number),
           avatar_url = COALESCE($5, avatar_url)
       WHERE firebase_uid = $1
       RETURNING *`,
      [data.uid, data.email, data.name, data.phone_number, data.avatar_url]
    );
    return updateResult.rows[0];
  }

  // Nếu chưa có thì Insert
  const result = await db.query(
    `INSERT INTO users (firebase_uid, email, name, phone_number, avatar_url)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [data.uid, data.email, data.name || "No Name", data.phone_number, data.avatar_url]
  );

  return result.rows[0];
}