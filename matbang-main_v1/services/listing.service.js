import db from "../config/db.js";

export async function createListing(data, user_id) {
  const {
    title,
    price,
    area,
    address,
    city,
    district,
    ward,
    latitude,
    longitude,
    type,
    description,
    image
  } = data;

  const result = await db.query(
    `INSERT INTO listings 
    (title, price, area, address, city, district, ward, latitude, longitude, type, description, image, user_id)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
    RETURNING *`,
    [
      title,
      price,
      area,
      address,
      city,
      district,
      ward,
      latitude,
      longitude,
      type,
      description,
      image,
      user_id
    ]
  );

  return result.rows[0];
}
// 🔥 COMPARE LISTINGS
export async function compareListings(ids) {
  const idArray = ids
    .split(",")
    .map(Number)
    .filter(id => !isNaN(id));

  if (idArray.length < 2) {
    throw new Error("Need at least 2 valid IDs");
  }

  const result = await db.query(
    `SELECT id, title, price, area, address, image
     FROM listings
     WHERE id = ANY($1)`,
    [idArray]
  );

  return result.rows;
}
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