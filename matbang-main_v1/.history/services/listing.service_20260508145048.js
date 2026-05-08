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
    lat,
    lng,
    latitude,
    longitude,
    type,
    description,
    image
  } = data;

  const result = await db.query(
    `
    INSERT INTO listings (
      title,
      price,
      area,
      address,
      city,
      district,
      ward,
      lat,
      lng,
      type,
      description,
      image,
      user_id
    )
    VALUES (
      $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13
    )
    RETURNING *
    `,
    [
      title?.trim(),
      Number(price),
      Number(area),
      address?.trim(),
      city?.trim(),
      district?.trim(),
      ward?.trim(),
      // accept either `lat`/`lng` or `latitude`/`longitude` from the client
      (lat ?? latitude) || null,
      (lng ?? longitude) || null,
      type?.trim(),
      description?.trim(),
      image,
      user_id
    ]
  );

  const created = result.rows[0];

  return {
    ...created,
    // normalize output so frontend can use `latitude`/`longitude`
    latitude: created.lat ?? created.latitude ?? null,
    longitude: created.lng ?? created.longitude ?? null,
    image: created.image || 'https://placehold.co/600x400/cccccc/666666?text=No+Image'
  };
}

export async function compareListings(ids) {
  const idArray = [...new Set(
    ids
      .split(",")
      .map(id => Number(id))
      .filter(Number.isInteger)
  )];

  if (idArray.length < 2) {
    throw new Error("Need at least 2 valid IDs");
  }

  const result = await db.query(
    `
    SELECT
      id,
      title,
      price,
      area,
      address,
      image
    FROM listings
    WHERE id = ANY($1)
    `,
    [idArray]
  );

  return result.rows;
}

export async function getListings(rawFilters) {
  const filters = { ...rawFilters };

  // normalize shorthand price
  if (
    typeof filters.price === "string" &&
    filters.price.includes("-")
  ) {
    const [pMin, pMax] = filters.price
      .split("-")
      .map(v => Number(v.replace(/,/g, "")));

    if (!isNaN(pMin)) filters.minPrice = pMin;
    if (!isNaN(pMax)) filters.maxPrice = pMax;
  }

  // normalize shorthand area
  if (
    typeof filters.area === "string" &&
    filters.area.includes("-")
  ) {
    const [aMin, aMax] = filters.area
      .split("-")
      .map(Number);

    if (!isNaN(aMin)) filters.minArea = aMin;
    if (!isNaN(aMax)) filters.maxArea = aMax;
  }

  const clauses = [];
  const values = [];
  let idx = 1;

  // city mapping
  if (filters.city?.trim()) {
    // If frontend accidentally sends a display name like "Toàn quốc", skip city filtering
    const cityRaw = String(filters.city).trim().toLowerCase();
    // detect variants of "Toàn quốc" (e.g. 'Toàn quốc', 'toan quoc') and skip city filtering
    const hasToan = cityRaw.includes('toàn') || cityRaw.includes('toan');
    const hasQuoc = cityRaw.includes('quốc') || cityRaw.includes('quoc');
    if (hasToan && hasQuoc) {
      // ignore city filter
    } else {
    const cityMap = {
      hcm: "Hồ Chí Minh",
      hn: "Hà Nội",
      dn: "Đà Nẵng",
      bd: "Bình Dương"
    };

    let cityVal = filters.city.trim();

    const key = cityVal.toLowerCase();

    if (cityMap[key]) {
      cityVal = cityMap[key];
    }

    clauses.push(`
      LOWER(city) LIKE LOWER($${idx++})
    `);

    values.push(`%${cityVal}%`);
    }
  }

  // min price
  if (filters.minPrice !== undefined) {
    let min = Number(filters.minPrice);

    if (!isNaN(min)) {
      if (min < 1000000) {
        min *= 1000000;
      }

      clauses.push(`price >= $${idx++}`);
      values.push(Math.round(min));
    }
  }

  // max price
  if (filters.maxPrice !== undefined) {
    let max = Number(filters.maxPrice);

    if (!isNaN(max)) {
      if (max < 1000000) {
        max *= 1000000;
      }

      clauses.push(`price <= $${idx++}`);
      values.push(Math.round(max));
    }
  }

  // min area
  if (filters.minArea !== undefined) {
    const minArea = Number(filters.minArea);

    if (!isNaN(minArea)) {
      clauses.push(`area >= $${idx++}`);
      values.push(minArea);
    }
  }

  // max area
  if (filters.maxArea !== undefined) {
    const maxArea = Number(filters.maxArea);

    if (!isNaN(maxArea)) {
      clauses.push(`area <= $${idx++}`);
      values.push(maxArea);
    }
  }

  // type search
  if (filters.type?.trim()) {
    clauses.push(`
      (
        LOWER(COALESCE(type, ''))
          LIKE LOWER($${idx})

        OR LOWER(COALESCE(title, ''))
          LIKE LOWER($${idx})

        OR LOWER(COALESCE(description, ''))
          LIKE LOWER($${idx})
      )
    `);

    values.push(`%${filters.type.trim()}%`);

    idx++;
  }

  // anti garbage
  clauses.push(`price < 100000000000`);

  const where = clauses.length
    ? `WHERE ${clauses.join(" AND ")}`
    : "";

  // pagination
  const limit = Math.min(
    Math.max(parseInt(filters.limit) || 10, 1),
    50
  );

  const page = Math.max(
    parseInt(filters.page) || 1,
    1
  );

  const offset = (page - 1) * limit;

  // count query
  const countQuery = `
    SELECT COUNT(*) AS total
    FROM listings
    ${where}
  `;

  const countRes = await db.query(countQuery, values);

  const total =
    Number(countRes.rows?.[0]?.total) || 0;

  // data query
  const dataQuery = `
    SELECT *
    FROM listings
    ${where}
    ORDER BY created_at DESC
    LIMIT $${idx++}
    OFFSET $${idx++}
  `;

  const dataValues = [...values, limit, offset];

  const result = await db.query(
    dataQuery,
    dataValues
  );

  // Ensure every row has a usable image URL to avoid frontend missing-image issues
  const rows = (result.rows || []).map(r => ({
    ...r,
    image: r.image || 'https://placehold.co/600x400/cccccc/666666?text=No+Image',
    latitude: r.lat ?? r.latitude ?? null,
    longitude: r.lng ?? r.longitude ?? null
  }));

  return {
    data: rows,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit)
  };
}