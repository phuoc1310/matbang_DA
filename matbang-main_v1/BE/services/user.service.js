// services/user.service.js
import db from "../config/db.js";

export async function findOrCreateUser(data) {
  const check = await db.query(
    `SELECT * FROM users WHERE firebase_uid = $1`,
    [data.uid]
  );

  if (check.rows.length > 0) {
    // Cập nhật thông tin mới nhất nếu có (KHÔNG ghi đè role)
    const updateResult = await db.query(
      `UPDATE users 
       SET email = COALESCE($2, email),
           name = COALESCE($3, name),
           phone_number = COALESCE($4, phone_number),
           avatar_url = COALESCE($5, avatar_url)
       WHERE firebase_uid = $1
       RETURNING id, firebase_uid, email, name, phone_number, avatar_url, role, address, created_at`,
      [data.uid, data.email, data.name, data.phone_number, data.avatar_url]
    );
    return updateResult.rows[0];
  }

  // Nếu chưa có thì Insert
  const result = await db.query(
    `INSERT INTO users (firebase_uid, email, name, phone_number, avatar_url, role)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, firebase_uid, email, name, phone_number, avatar_url, role, address, created_at`,
    [data.uid, data.email, data.name || "No Name", data.phone_number, data.avatar_url, "user"]
  );

  return result.rows[0];
}

export async function getUserByUid(uid) {
  const result = await db.query(
    `SELECT id, firebase_uid, email, name, phone_number, avatar_url, role, address, created_at 
     FROM users 
     WHERE firebase_uid = $1`,
    [uid]
  );
  return result.rows[0] || null;
}

export async function updateUserByUid(uid, fields) {
  const result = await db.query(
    `UPDATE users 
     SET name = COALESCE($2, name),
         phone_number = COALESCE($3, phone_number),
         address = COALESCE($4, address)
     WHERE firebase_uid = $1
     RETURNING id, firebase_uid, email, name, phone_number, avatar_url, role, address, created_at`,
    [uid, fields.name, fields.phone_number, fields.address]
  );
  return result.rows[0];
}