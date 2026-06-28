import pool from "../config/db.js";

export async function getSearchHistory(userId) {
  const result = await pool.query(
    "SELECT * FROM search_history WHERE user_id::varchar = $1::varchar ORDER BY created_at DESC LIMIT 5",
    [userId]
  );
  return result.rows;
}

export async function addSearchHistory(userId, keyword, city) {
  await pool.query(
    "DELETE FROM search_history WHERE user_id::varchar = $1::varchar AND (keyword = $2 OR (keyword IS NULL AND $2 IS NULL)) AND (city = $3 OR (city IS NULL AND $3 IS NULL))",
    [userId, keyword || null, city || null]
  );
  await pool.query(
    "INSERT INTO search_history (user_id, keyword, city) VALUES ($1, $2, $3)",
    [userId, keyword || null, city || null]
  );
  await pool.query(
    `DELETE FROM search_history 
     WHERE user_id::varchar = $1::varchar 
     AND id NOT IN (
         SELECT id FROM search_history WHERE user_id::varchar = $1::varchar ORDER BY created_at DESC LIMIT 5
     )`,
    [userId]
  );
  return { success: true };
}

export async function clearSearchHistory(userId) {
  await pool.query("DELETE FROM search_history WHERE user_id::varchar = $1::varchar", [userId]);
  return { success: true };
}

export async function getCompareList(userId) {
  const result = await pool.query(`
    SELECT l.* 
    FROM compare_list cl
    JOIN listings l ON cl.property_id::varchar = l.id::varchar
    WHERE cl.user_id::varchar = $1::varchar 
    ORDER BY cl.created_at ASC
  `, [userId]);

  if (result.rows.length > 0) {
    return result.rows;
  }

  
  const fallback = await pool.query(
    "SELECT property_id FROM compare_list WHERE user_id::varchar = $1::varchar ORDER BY created_at ASC",
    [userId]
  );
  return fallback.rows.map(row => row.property_id);
}

export async function toggleCompare(userId, propertyId) {
  const check = await pool.query(
    "SELECT id FROM compare_list WHERE user_id::varchar = $1::varchar AND property_id::varchar = $2::varchar",
    [userId, propertyId]
  );

  if (check.rows.length > 0) {
    await pool.query("DELETE FROM compare_list WHERE id = $1", [check.rows[0].id]);
    return { success: true, action: "removed" };
  } else {
    const countRes = await pool.query("SELECT COUNT(*) FROM compare_list WHERE user_id::varchar = $1::varchar", [userId]);
    if (parseInt(countRes.rows[0].count) >= 4) {
      return { error: "Bạn chỉ có thể so sánh tối đa 4 mặt bằng!", status: 400 };
    }
    await pool.query(
      "INSERT INTO compare_list (user_id, property_id) VALUES ($1, $2)",
      [userId, propertyId]
    );
    return { success: true, action: "added" };
  }
}

export async function clearCompareList(userId) {
  await pool.query("DELETE FROM compare_list WHERE user_id::varchar = $1::varchar", [userId]);
  return { success: true };
}
