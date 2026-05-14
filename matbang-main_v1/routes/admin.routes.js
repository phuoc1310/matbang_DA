// routes/admin.routes.js
import express from "express";
import db from "../config/db.js";

const router = express.Router();

// ================== DASHBOARD STATS ==================

// GET /api/admin/dashboard/stats
router.get("/dashboard/stats", async (req, res) => {
  try {
    // Ensure site_stats table exists
    await db.query(`CREATE TABLE IF NOT EXISTS site_stats (key VARCHAR(50) PRIMARY KEY, value INTEGER DEFAULT 0)`);
    await db.query(`INSERT INTO site_stats (key, value) VALUES ('visits', 0) ON CONFLICT DO NOTHING`);

    const [usersRes, listingsRes, pendingRes, visitsRes] = await Promise.all([
      db.query("SELECT COUNT(*) as count FROM users"),
      db.query("SELECT COUNT(*) as count FROM listings"),
      db.query("SELECT COUNT(*) as count FROM listings WHERE status = 'pending'"),
      db.query("SELECT value FROM site_stats WHERE key = 'visits'")
    ]);

    res.json({
      success: true,
      stats: {
        totalUsers: parseInt(usersRes.rows[0].count),
        totalListings: parseInt(listingsRes.rows[0].count),
        pendingListings: parseInt(pendingRes.rows[0].count),
        totalVisits: visitsRes.rows[0]?.value || 0
      }
    });
  } catch (err) {
    console.error("Dashboard stats error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

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
    if (!["admin", "user"].includes(role)) {
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
    const countRes = await db.query(`SELECT COUNT(*) AS total FROM listings l LEFT JOIN users u ON l.user_id = u.id ${where}`, values);
    const total = Number(countRes.rows[0]?.total) || 0;

    // Data
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

// GET /api/admin/listings/stats - Lấy thống kê trạng thái tin đăng
router.get("/listings/stats", async (req, res) => {
  try {
    const result = await db.query(`
      SELECT status, COUNT(*) as count 
      FROM listings 
      GROUP BY status
    `);
    
    const stats = {
      total: 0,
      pending: 0,
      approved: 0,
      rejected: 0
    };
    
    result.rows.forEach(row => {
      const count = parseInt(row.count);
      stats.total += count;
      if (row.status === 'pending') stats.pending += count;
      if (row.status === 'approved') stats.approved += count;
      if (row.status === 'rejected') stats.rejected += count;
    });
    
    res.json({ success: true, stats });
  } catch (err) {
    console.error("Admin get listing stats error:", err);
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

// ================== CONTACTS MANAGEMENT ==================

// GET /api/admin/contacts - Lấy toàn bộ liên hệ
router.get("/contacts", async (req, res) => {
  try {
    const result = await db.query(`
      SELECT id, full_name AS "fullName", email, phone, subject, content, status, 
             created_at AS "createdAt", processed_at AS "processedAt"
      FROM contacts ORDER BY created_at DESC
    `);
    res.json({ success: true, contacts: result.rows });
  } catch (err) {
    console.error("Admin get contacts error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/admin/contacts/:id - Lấy chi tiết liên hệ
router.get("/contacts/:id", async (req, res) => {
  try {
    const result = await db.query(`
      SELECT id, full_name AS "fullName", email, phone, subject, content, status, 
             created_at AS "createdAt", processed_at AS "processedAt"
      FROM contacts WHERE id = $1
    `, [req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Không tìm thấy liên hệ" });
    }
    res.json({ success: true, contact: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/admin/contacts/:id/status - Cập nhật trạng thái liên hệ
router.patch("/contacts/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    let processedAt = null;
    
    if (status === 'processed' || status === 'resolved') {
      processedAt = new Date();
    }
    
    const result = await db.query(`
      UPDATE contacts 
      SET status = $1, processed_at = COALESCE($2, processed_at)
      WHERE id = $3 RETURNING *
    `, [status, processedAt, req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Không tìm thấy liên hệ" });
    }
    res.json({ success: true, contact: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/admin/contacts/:id - Xóa liên hệ
router.delete("/contacts/:id", async (req, res) => {
  try {
    const result = await db.query(`DELETE FROM contacts WHERE id = $1 RETURNING id`, [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Không tìm thấy liên hệ" });
    }
    res.json({ success: true, message: "Đã xóa liên hệ" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ================== FEEDBACKS MANAGEMENT ==================

// GET /api/admin/feedbacks - Lấy toàn bộ phản hồi
router.get("/feedbacks", async (req, res) => {
  try {
    const result = await db.query(`
      SELECT id, rating, comment, suggestion, email, status, created_at AS "createdAt"
      FROM feedbacks ORDER BY created_at DESC
    `);
    res.json({ success: true, feedbacks: result.rows });
  } catch (err) {
    console.error("Admin get feedbacks error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/admin/feedbacks/:id - Lấy chi tiết phản hồi
router.get("/feedbacks/:id", async (req, res) => {
  try {
    const result = await db.query(`
      SELECT id, rating, comment, suggestion, email, status, created_at AS "createdAt"
      FROM feedbacks WHERE id = $1
    `, [req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Không tìm thấy phản hồi" });
    }
    res.json({ success: true, feedback: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/admin/feedbacks/:id/status - Cập nhật trạng thái phản hồi
router.patch("/feedbacks/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    const result = await db.query(`
      UPDATE feedbacks SET status = $1 WHERE id = $2 RETURNING *
    `, [status, req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Không tìm thấy phản hồi" });
    }
    res.json({ success: true, feedback: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/admin/feedbacks/:id - Xóa phản hồi
router.delete("/feedbacks/:id", async (req, res) => {
  try {
    const result = await db.query(`DELETE FROM feedbacks WHERE id = $1 RETURNING id`, [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Không tìm thấy phản hồi" });
    }
    res.json({ success: true, message: "Đã xóa phản hồi" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
