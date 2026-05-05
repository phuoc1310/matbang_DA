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
  // Normalize shorthand inputs
  if (filters.price && typeof filters.price === 'string' && filters.price.includes('-')) {
    const [pMin, pMax] = filters.price.split('-').map(s => Number(s.replace(/,/g, '')));
    if (!isNaN(pMin)) filters.minPrice = pMin;
    if (!isNaN(pMax)) filters.maxPrice = pMax;
  }
  if (filters.area && typeof filters.area === 'string' && filters.area.includes('-')) {
    const [aMin, aMax] = filters.area.split('-').map(Number);
    if (!isNaN(aMin)) filters.minArea = aMin;
    if (!isNaN(aMax)) filters.maxArea = aMax;
  }

  const clauses = [];
  const values = [];
  let idx = 1;

  // city mapping
  if (filters.city) {
    const map = { hcm: 'Tp Hồ Chí Minh', hn: 'Hà Nội', dn: 'Đà Nẵng', bd: 'Bình Dương' };
    let cityVal = String(filters.city || '').trim();
    const key = cityVal.toLowerCase();
    if (map[key]) cityVal = map[key];
    clauses.push(`LOWER(city) LIKE LOWER($${idx++})`);
    values.push(`%${cityVal}%`);
  }

  // prices (convert triệu -> VND heuristically)
  if (filters.minPrice !== undefined && filters.minPrice !== "") {
    let min = Number(filters.minPrice);
    if (isNaN(min)) min = 0;
    if (min < 1000000) min = Math.round(min * 1000000);
    clauses.push(`price >= $${idx++}`);
    values.push(min);
  }
  if (filters.maxPrice !== undefined && filters.maxPrice !== "") {
    let max = Number(filters.maxPrice);
    if (isNaN(max)) max = 0;
    if (max < 1000000) max = Math.round(max * 1000000);
    clauses.push(`price <= $${idx++}`);
    values.push(max);
  }

  // area
  if (filters.minArea !== undefined && filters.minArea !== "") {
    const amin = Number(filters.minArea) || 0;
    clauses.push(`area >= $${idx++}`);
    values.push(amin);
  }
  if (filters.maxArea !== undefined && filters.maxArea !== "") {
    const amax = Number(filters.maxArea) || 0;
    clauses.push(`area <= $${idx++}`);
    values.push(amax);
  }

  // type -> check type/title/description
  if (filters.type) {
    clauses.push(`(LOWER(COALESCE(type, '')) LIKE LOWER($${idx}) OR LOWER(COALESCE(title, '')) LIKE LOWER($${idx}) OR LOWER(COALESCE(description, '')) LIKE LOWER($${idx}))`);
    values.push(`%${filters.type}%`);
    idx++;
  }

  // filter out very large garbage prices
  clauses.push(`price < 100000000000`);

  const where = clauses.length ? ` WHERE ${clauses.join(' AND ')}` : '';

  // count total
  const countQuery = `SELECT COUNT(*) AS total FROM listings${where}`;
  const countRes = await db.query(countQuery, values);
  const total = Number(countRes.rows?.[0]?.total) || 0;

  // data query with pagination
  const limit = parseInt(filters.limit) || 10;
  const page = parseInt(filters.page) || 1;
  const offset = (page - 1) * limit;

  const dataQuery = `SELECT * FROM listings${where} ORDER BY created_at DESC LIMIT $${idx++} OFFSET $${idx++}`;
  const dataValues = values.concat([limit, offset]);

  const result = await db.query(dataQuery, dataValues);
  return { data: result.rows, total };
}