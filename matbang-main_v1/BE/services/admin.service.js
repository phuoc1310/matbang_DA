import db from "../config/db.js";

export async function getDashboardStats() {
  await db.query(`CREATE TABLE IF NOT EXISTS site_stats (key VARCHAR(50) PRIMARY KEY, value INTEGER DEFAULT 0)`);
  await db.query(`INSERT INTO site_stats (key, value) VALUES ('visits', 0) ON CONFLICT DO NOTHING`);

  const [usersRes, listingsRes, pendingRes, visitsRes] = await Promise.all([
    db.query("SELECT COUNT(*) as count FROM users"),
    db.query("SELECT COUNT(*) as count FROM listings"),
    db.query("SELECT COUNT(*) as count FROM listings WHERE status = 'pending'"),
    db.query("SELECT value FROM site_stats WHERE key = 'visits'")
  ]);

  return {
    totalUsers: parseInt(usersRes.rows[0].count),
    totalListings: parseInt(listingsRes.rows[0].count),
    pendingListings: parseInt(pendingRes.rows[0].count),
    totalVisits: visitsRes.rows[0]?.value || 0
  };
}

export async function getUsers() {
  const result = await db.query(
    `SELECT id, firebase_uid, email, name AS "fullName", phone_number AS phone, avatar_url, role, created_at AS "createdAt"
     FROM users ORDER BY created_at DESC`
  );
  return result.rows;
}

export async function getUserById(id) {
  const result = await db.query(
    `SELECT id, firebase_uid, email, name AS "fullName", phone_number AS phone, avatar_url, role, created_at AS "createdAt"
     FROM users WHERE id = $1`,
    [id]
  );
  return result.rows[0];
}

export async function updateUser(id, data) {
  const { fullName, phone, role } = data;
  const result = await db.query(
    `UPDATE users 
     SET name = COALESCE($1, name),
         phone_number = COALESCE($2, phone_number),
         role = COALESCE($3, role)
     WHERE id = $4
     RETURNING id, firebase_uid, email, name AS "fullName", phone_number AS phone, avatar_url, role, created_at AS "createdAt"`,
    [fullName, phone, role, id]
  );
  return result.rows[0];
}

export async function deleteUser(id) {
  const check = await db.query("SELECT role FROM users WHERE id = $1", [id]);
  if (check.rows.length === 0) return { error: "Không tìm thấy người dùng", status: 404 };
  if (check.rows[0].role === "admin") return { error: "Không thể xóa tài khoản admin", status: 403 };
  
  await db.query("DELETE FROM users WHERE id = $1", [id]);
  return { success: true };
}

export async function updateUserRole(id, role) {
  if (!["admin", "user"].includes(role)) return { error: "Role không hợp lệ", status: 400 };
  const result = await db.query(
    `UPDATE users SET role = $1 WHERE id = $2
     RETURNING id, firebase_uid, email, name AS "fullName", phone_number AS phone, avatar_url, role, created_at AS "createdAt"`,
    [role, id]
  );
  if (result.rows.length === 0) return { error: "Không tìm thấy người dùng", status: 404 };
  return { user: result.rows[0] };
}

export async function getListings({ status, search, page = 1, limit = 50 }) {
  const clauses = [];
  const values = [];
  let idx = 1;

  if (status && status !== 'all') {
    clauses.push(`l.status = $${idx++}`);
    values.push(status);
  }

  if (search && search.trim()) {
    clauses.push(`(LOWER(l.title) LIKE LOWER($${idx}) OR LOWER(l.address) LIKE LOWER($${idx}) OR LOWER(COALESCE(u.name, u.email, '')) LIKE LOWER($${idx}))`);
    values.push(`%${search.trim()}%`);
    idx++;
  }

  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const offset = (Math.max(1, parseInt(page)) - 1) * parseInt(limit);

  const countRes = await db.query(`SELECT COUNT(*) AS total FROM listings l LEFT JOIN users u ON l.user_id = u.id ${where}`, values);
  const total = Number(countRes.rows[0]?.total) || 0;

  const dataValues = [...values, parseInt(limit), offset];
  const result = await db.query(
    `SELECT l.*, u.name AS user_name, u.email AS user_email
     FROM listings l
     LEFT JOIN users u ON l.user_id = u.id
     ${where}
     ORDER BY l.created_at DESC
     LIMIT $${idx++} OFFSET $${idx++}`,
    dataValues
  );

  return { listings: result.rows, total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / parseInt(limit)) };
}

export async function getListingStats() {
  const result = await db.query(`SELECT status, COUNT(*) as count FROM listings GROUP BY status`);
  const stats = { total: 0, pending: 0, approved: 0, rejected: 0 };
  
  result.rows.forEach(row => {
    const count = parseInt(row.count);
    stats.total += count;
    if (stats[row.status] !== undefined) stats[row.status] += count;
  });
  return stats;
}

export async function updateListingStatus(id, status) {
  if (!['pending', 'approved', 'rejected'].includes(status)) return { error: "Trạng thái không hợp lệ", status: 400 };
  const result = await db.query(`UPDATE listings SET status = $1 WHERE id = $2 RETURNING *`, [status, id]);
  return result.rows[0] ? { listing: result.rows[0] } : { error: "Không tìm thấy tin đăng", status: 404 };
}

export async function deleteListing(id) {
  const result = await db.query(`DELETE FROM listings WHERE id = $1 RETURNING id`, [id]);
  return result.rows.length > 0;
}

export async function getContacts() {
  const result = await db.query(`
    SELECT id, full_name AS "fullName", email, phone, subject, content, status, created_at AS "createdAt", processed_at AS "processedAt"
    FROM contacts ORDER BY created_at DESC
  `);
  return result.rows;
}

export async function getContactById(id) {
  const result = await db.query(`
    SELECT id, full_name AS "fullName", email, phone, subject, content, status, created_at AS "createdAt", processed_at AS "processedAt"
    FROM contacts WHERE id = $1
  `, [id]);
  return result.rows[0];
}

export async function updateContactStatus(id, status) {
  const processedAt = (status === 'processed' || status === 'resolved') ? new Date() : null;
  const result = await db.query(`
    UPDATE contacts SET status = $1, processed_at = COALESCE($2, processed_at)
    WHERE id = $3 RETURNING *
  `, [status, processedAt, id]);
  return result.rows[0];
}

export async function deleteContact(id) {
  const result = await db.query(`DELETE FROM contacts WHERE id = $1 RETURNING id`, [id]);
  return result.rows.length > 0;
}

export async function getFeedbacks() {
  const result = await db.query(`SELECT id, rating, comment, suggestion, email, status, created_at AS "createdAt" FROM feedbacks ORDER BY created_at DESC`);
  return result.rows;
}

export async function getFeedbackById(id) {
  const result = await db.query(`SELECT id, rating, comment, suggestion, email, status, created_at AS "createdAt" FROM feedbacks WHERE id = $1`, [id]);
  return result.rows[0];
}

export async function updateFeedbackStatus(id, status) {
  const result = await db.query(`UPDATE feedbacks SET status = $1 WHERE id = $2 RETURNING *`, [status, id]);
  return result.rows[0];
}

export async function deleteFeedback(id) {
  const result = await db.query(`DELETE FROM feedbacks WHERE id = $1 RETURNING id`, [id]);
  return result.rows.length > 0;
}
