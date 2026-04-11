import db from "../config/db.js";

export async function getListings(filters) {
  let query = "SELECT * FROM listings WHERE 1=1";
  const values = [];
  let i = 1;

  // 🔍 city
if (filters.city) {
  query += ` AND LOWER(city) LIKE LOWER($${i++})`;
  values.push(`%${filters.city}%`);
}

  // 💰 min price (triệu → đồng)
  if (filters.minPrice) {
    query += ` AND price >= $${i++}`;
    values.push(filters.minPrice * 1000000);
  }

  // 💰 max price
  if (filters.maxPrice) {
    query += ` AND price <= $${i++}`;
    values.push(filters.maxPrice * 1000000);
  }

  // 📐 diện tích
  if (filters.area) {
    query += ` AND area >= $${i++}`;
    values.push(filters.area);
  }

  // 🚫 lọc data rác (giá quá lớn)
  query += ` AND price < 100000000000`;

  // 🔽 sort
  query += " ORDER BY created_at DESC";

  // 📄 pagination
  const limit = parseInt(filters.limit) || 10;
  const page = parseInt(filters.page) || 1;
  const offset = (page - 1) * limit;

  query += ` LIMIT $${i++} OFFSET $${i++}`;
  values.push(limit, offset);

  const result = await db.query(query, values);
  return result.rows;
}