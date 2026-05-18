import pool from "../config/db.js";

// Lấy lịch sử tìm kiếm
export const getSearchHistory = async (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: "Missing userId" });

  try {
    const result = await pool.query(
      "SELECT * FROM search_history WHERE user_id = $1 ORDER BY created_at DESC LIMIT 5",
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Lỗi getSearchHistory:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// Thêm lịch sử tìm kiếm
export const addSearchHistory = async (req, res) => {
  const { userId, keyword, city } = req.body;
  if (!userId) return res.status(400).json({ error: "Missing userId" });
  if (!keyword && !city) return res.status(400).json({ error: "No search criteria provided" });

  try {
    // Để tránh lặp, có thể xóa những keyword/city giống nhau trước
    await pool.query(
      "DELETE FROM search_history WHERE user_id = $1 AND (keyword = $2 OR (keyword IS NULL AND $2 IS NULL)) AND (city = $3 OR (city IS NULL AND $3 IS NULL))",
      [userId, keyword || null, city || null]
    );

    // Insert mới
    await pool.query(
      "INSERT INTO search_history (user_id, keyword, city) VALUES ($1, $2, $3)",
      [userId, keyword || null, city || null]
    );

    // Giới hạn 5 bản ghi mới nhất
    await pool.query(
      `DELETE FROM search_history 
       WHERE user_id = $1 
       AND id NOT IN (
           SELECT id FROM search_history WHERE user_id = $1 ORDER BY created_at DESC LIMIT 5
       )`,
      [userId]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("Lỗi addSearchHistory:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// Xóa lịch sử tìm kiếm
export const clearSearchHistory = async (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: "Missing userId" });

  try {
    await pool.query("DELETE FROM search_history WHERE user_id = $1", [userId]);
    res.json({ success: true });
  } catch (err) {
    console.error("Lỗi clearSearchHistory:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// Lấy danh sách so sánh
export const getCompareList = async (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: "Missing userId" });

  try {
    const result = await pool.query(
      "SELECT property_id FROM compare_list WHERE user_id = $1 ORDER BY created_at ASC",
      [userId]
    );
    const ids = result.rows.map(row => row.property_id);
    res.json(ids);
  } catch (err) {
    console.error("Lỗi getCompareList:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// Toggle so sánh
export const toggleCompare = async (req, res) => {
  const { userId, propertyId } = req.body;
  if (!userId || !propertyId) return res.status(400).json({ error: "Missing userId or propertyId" });

  try {
    // Kiểm tra xem đã có chưa
    const check = await pool.query(
      "SELECT id FROM compare_list WHERE user_id = $1 AND property_id = $2",
      [userId, propertyId]
    );

    if (check.rows.length > 0) {
      // Đã có -> Xóa
      await pool.query("DELETE FROM compare_list WHERE id = $1", [check.rows[0].id]);
      res.json({ success: true, action: "removed" });
    } else {
      // Chưa có -> Kiểm tra số lượng tối đa là 4
      const countRes = await pool.query("SELECT COUNT(*) FROM compare_list WHERE user_id = $1", [userId]);
      if (parseInt(countRes.rows[0].count) >= 4) {
        return res.status(400).json({ error: "Bạn chỉ có thể so sánh tối đa 4 mặt bằng!" });
      }

      await pool.query(
        "INSERT INTO compare_list (user_id, property_id) VALUES ($1, $2)",
        [userId, propertyId]
      );
      res.json({ success: true, action: "added" });
    }
  } catch (err) {
    console.error("Lỗi toggleCompare:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// Xóa tất cả so sánh
export const clearCompareList = async (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: "Missing userId" });

  try {
    await pool.query("DELETE FROM compare_list WHERE user_id = $1", [userId]);
    res.json({ success: true });
  } catch (err) {
    console.error("Lỗi clearCompareList:", err);
    res.status(500).json({ error: "Server error" });
  }
};
