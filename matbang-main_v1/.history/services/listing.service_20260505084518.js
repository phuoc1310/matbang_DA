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

  // --- Support parsing shorthand query params ---
  // price: 'min-max' or minPrice/maxPrice
  if (filters.price && typeof filters.price === 'string' && filters.price.includes('-')) {
    const [pMin, pMax] = filters.price.split('-').map(s => Number(s.replace(/,/g, '')));
    if (!isNaN(pMin)) filters.minPrice = pMin;
    if (!isNaN(pMax)) filters.maxPrice = pMax;
  }

  // area: 'min-max' or minArea/maxArea
  if (filters.area && typeof filters.area === 'string' && filters.area.includes('-')) {
    const [aMin, aMax] = filters.area.split('-').map(Number);
    if (!isNaN(aMin)) filters.minArea = aMin;
    if (!isNaN(aMax)) filters.maxArea = aMax;
  }

  // 🔍 city (support short codes like 'hcm' -> 'Tp Hồ Chí Minh')
  if (filters.city) {
    const map = {
      hcm: 'Tp Hồ Chí Minh',
      hn: 'Hà Nội',
      dn: 'Đà Nẵng',
      bd: 'Bình Dương'
    };
    let cityVal = String(filters.city || '').trim();
    const key = cityVal.toLowerCase();
    if (map[key]) cityVal = map[key];
    query += ` AND LOWER(city) LIKE LOWER($${i++})`;
    values.push(`%${cityVal}%`);
  }

  // 💰 min price (triệu → đồng)
    // 💰 min/max price
    if (filters.minPrice !== undefined && filters.minPrice !== "") {
      let min = Number(filters.minPrice);
      if (isNaN(min)) min = 0;
      // if value looks already like VND (> 1e6), don't multiply
      if (min < 1000000) min = Math.round(min * 1000000);
      query += ` AND price >= $${i++}`;
      values.push(min);
    }

    if (filters.maxPrice !== undefined && filters.maxPrice !== "") {
      let max = Number(filters.maxPrice);
      if (isNaN(max)) max = 0;
      if (max < 1000000) max = Math.round(max * 1000000);
      query += ` AND price <= $${i++}`;
      values.push(max);
    }

    // 📐 area range
    if (filters.minArea !== undefined && filters.minArea !== "") {
      const amin = Number(filters.minArea) || 0;
      query += ` AND area >= $${i++}`;
      values.push(amin);
    }
    if (filters.maxArea !== undefined && filters.maxArea !== "") {
      const amax = Number(filters.maxArea) || 0;
      query += ` AND area <= $${i++}`;
      values.push(amax);
    }

    // 🔎 type filter
    if (filters.type) {
      query += ` AND LOWER(type) LIKE LOWER($${i++})`;
      values.push(`%${filters.type}%`);
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