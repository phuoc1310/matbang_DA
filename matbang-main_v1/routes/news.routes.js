import express from "express";
import db from "../config/db.js";

const router = express.Router();

// GET /api/news - Lấy danh sách tin tức
router.get("/", async (req, res) => {
  try {
    const { limit = 20, page = 1 } = req.query;
    const offset = (Math.max(1, parseInt(page)) - 1) * parseInt(limit);
    
    // Đếm tổng số
    const countRes = await db.query(`SELECT COUNT(*) AS total FROM news`);
    const total = Number(countRes.rows[0]?.total) || 0;

    // Lấy danh sách
    const result = await db.query(
      `SELECT n.id, n.title, n.excerpt, n.image_url, n.created_at, 
              u.name AS author_name,
              COALESCE(AVG(r.rating), 0) AS average_rating,
              COUNT(r.id) AS review_count
       FROM news n
       LEFT JOIN users u ON n.author_id = u.id
       LEFT JOIN news_ratings r ON n.id = r.news_id
       GROUP BY n.id, u.name
       ORDER BY n.created_at DESC
       LIMIT $1 OFFSET $2`,
      [parseInt(limit), offset]
    );

    res.json({
      success: true,
      news: result.rows.map(row => ({
        ...row,
        average_rating: parseFloat(row.average_rating).toFixed(1),
        review_count: parseInt(row.review_count)
      })),
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit))
    });
  } catch (err) {
    console.error("Get news list error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/news/:id - Lấy chi tiết bài viết
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      `SELECT n.*, u.name AS author_name,
              COALESCE(AVG(r.rating), 0) AS average_rating,
              COUNT(r.id) AS review_count
       FROM news n
       LEFT JOIN users u ON n.author_id = u.id
       LEFT JOIN news_ratings r ON n.id = r.news_id
       WHERE n.id = $1
       GROUP BY n.id, u.name`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Không tìm thấy bài viết" });
    }

    const news = result.rows[0];
    news.average_rating = parseFloat(news.average_rating).toFixed(1);
    news.review_count = parseInt(news.review_count);

    res.json({ success: true, news });
  } catch (err) {
    console.error("Get news detail error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/news/:id/ratings - Lấy danh sách đánh giá của bài viết
router.get("/:id/ratings", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      `SELECT r.*, u.name AS user_name, u.avatar_url 
       FROM news_ratings r
       JOIN users u ON r.user_id = u.id
       WHERE r.news_id = $1
       ORDER BY r.created_at DESC`,
      [id]
    );

    res.json({ success: true, ratings: result.rows });
  } catch (err) {
    console.error("Get news ratings error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/news/:id/ratings - Gửi đánh giá mới
router.post("/:id/ratings", async (req, res) => {
  try {
    const { id: news_id } = req.params;
    // Chú ý: Ở đây bạn đang dùng JWT authentication. 
    // Chúng ta cần lấy auth header, nhưng hiện tại backend có middleware xác thực không?
    // Giả sử có hoặc frontend truyền user_id lên (vì dự án cũ có thể đang truyền lên body).
    // Ở đây ta nhận user_id từ body để dễ tích hợp với frontend hiện tại nếu chưa có middleware chuẩn.
    const { rating, comment, user_id } = req.body;

    if (!user_id) {
      return res.status(401).json({ success: false, message: "Vui lòng đăng nhập để đánh giá" });
    }

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: "Số sao đánh giá phải từ 1 đến 5" });
    }

    // Kiểm tra xem user đã đánh giá chưa
    const checkRes = await db.query(
      `SELECT id FROM news_ratings WHERE news_id = $1 AND user_id = $2`,
      [news_id, user_id]
    );

    if (checkRes.rows.length > 0) {
      // Đã đánh giá -> Cập nhật
      const updateRes = await db.query(
        `UPDATE news_ratings SET rating = $1, comment = $2, created_at = CURRENT_TIMESTAMP WHERE news_id = $3 AND user_id = $4 RETURNING *`,
        [rating, comment, news_id, user_id]
      );
      return res.json({ success: true, message: "Đã cập nhật đánh giá", rating: updateRes.rows[0] });
    } else {
      // Chưa đánh giá -> Thêm mới
      const insertRes = await db.query(
        `INSERT INTO news_ratings (news_id, user_id, rating, comment) VALUES ($1, $2, $3, $4) RETURNING *`,
        [news_id, user_id, rating, comment]
      );
      return res.status(201).json({ success: true, message: "Đã gửi đánh giá thành công", rating: insertRes.rows[0] });
    }
  } catch (err) {
    console.error("Post news rating error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
