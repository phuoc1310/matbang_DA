// routes/admin.routes.js
import express from "express";
import db from "../config/db.js";

const router = express.Router();

// GET /api/admin/users - Lấy danh sách tất cả người dùng
router.get("/users", async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, firebase_uid, email, name AS "fullName", phone_number AS phone, avatar_url, role, created_at AS "createdAt"
       FROM users ORDER BY created_at DESC`
    );
    res.json({ success: true, users: result.rows });
  } catch (err) {
    console.error("Admin get users error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/admin/users/:id - Lấy chi tiết 1 người dùng
router.get("/users/:id", async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, firebase_uid, email, name AS "fullName", phone_number AS phone, avatar_url, role, created_at AS "createdAt"
       FROM users WHERE id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Không tìm thấy người dùng" });
    }
    res.json({ success: true, user: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/admin/users/:id - Cập nhật thông tin người dùng
router.put("/users/:id", async (req, res) => {
  try {
    const { fullName, phone, role } = req.body;
    const result = await db.query(
      `UPDATE users 
       SET name = COALESCE($1, name),
           phone_number = COALESCE($2, phone_number),
           role = COALESCE($3, role)
       WHERE id = $4
       RETURNING id, firebase_uid, email, name AS "fullName", phone_number AS phone, avatar_url, role, created_at AS "createdAt"`,
      [fullName, phone, role, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Không tìm thấy người dùng" });
    }
    res.json({ success: true, user: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/admin/users/:id - Xóa người dùng
router.delete("/users/:id", async (req, res) => {
  try {
    const check = await db.query("SELECT role FROM users WHERE id = $1", [req.params.id]);
    if (check.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Không tìm thấy người dùng" });
    }
    if (check.rows[0].role === "admin") {
      return res.status(403).json({ success: false, message: "Không thể xóa tài khoản admin" });
    }
    await db.query("DELETE FROM users WHERE id = $1", [req.params.id]);
    res.json({ success: true, message: "Đã xóa người dùng" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/admin/users/:id/role - Thay đổi role
router.put("/users/:id/role", async (req, res) => {
  try {
    const { role } = req.body;
    if (!["admin", "user", "nguoithue", "chumattbang"].includes(role)) {
      return res.status(400).json({ success: false, message: "Role không hợp lệ" });
    }
    const result = await db.query(
      `UPDATE users SET role = $1 WHERE id = $2
       RETURNING id, firebase_uid, email, name AS "fullName", phone_number AS phone, avatar_url, role, created_at AS "createdAt"`,
      [role, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Không tìm thấy người dùng" });
    }
    res.json({ success: true, user: result.rows[0], message: `Đã cập nhật role thành ${role}` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ================== LISTINGS MANAGEMENT ==================

// GET /api/admin/listings - Lấy toàn bộ tin đăng (không lọc status/visibility)
router.get("/listings", async (req, res) => {
  try {
    const { status, search, page = 1, limit = 50 } = req.query;
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

    // Count
    const countRes = await db.query(`SELECT COUNT(*) AS total FROM listings l LEFT JOIN users u ON l.user_id = u.firebase_uid ${where}`, values);
    const total = Number(countRes.rows[0]?.total) || 0;

    // Data
    const dataValues = [...values, parseInt(limit), offset];
    const result = await db.query(
      `SELECT l.*, u.name AS user_name, u.email AS user_email
       FROM listings l
       LEFT JOIN users u ON l.user_id = u.firebase_uid
       ${where}
       ORDER BY l.created_at DESC
       LIMIT $${idx++} OFFSET $${idx++}`,
      dataValues
    );

    res.json({
      success: true,
      listings: result.rows,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit))
    });
  } catch (err) {
    console.error("Admin get listings error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/admin/listings/:id/status - Duyệt / Từ chối tin đăng
router.patch("/listings/:id/status", async (req, res) => {
  try {
    const { status, reason } = req.body;
    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: "Trạng thái không hợp lệ" });
    }
    const result = await db.query(
      `UPDATE listings SET status = $1 WHERE id = $2 RETURNING *`,
      [status, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Không tìm thấy tin đăng" });
    }
    res.json({ success: true, listing: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/admin/listings/:id - Xóa tin đăng (Admin)
router.delete("/listings/:id", async (req, res) => {
  try {
    const result = await db.query(
      `DELETE FROM listings WHERE id = $1 RETURNING id`,
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Không tìm thấy tin đăng" });
    }
    res.json({ success: true, message: "Đã xóa tin đăng" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
