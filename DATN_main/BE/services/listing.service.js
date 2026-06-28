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

  
  if (filters.city?.trim()) {
    
    const cityRaw = String(filters.city).trim().toLowerCase();
    
    const hasToan = cityRaw.includes('toàn') || cityRaw.includes('toan');
    const hasQuoc = cityRaw.includes('quốc') || cityRaw.includes('quoc');
    if (hasToan && hasQuoc) {
      
    } else {
    
    const normalizeKey = (s = "") =>
      String(s)
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim();

    const aliasMap = {
      // Hồ Chí Minh variants
      "hcm": "Hồ Chí Minh",
      "tphcm": "Hồ Chí Minh",
      "tp hcm": "Hồ Chí Minh",
      "tp ho chi minh": "Hồ Chí Minh",
      "ho chi minh": "Hồ Chí Minh",
      "ho chi minh city": "Hồ Chí Minh",
      "thanh pho ho chi minh": "Hồ Chí Minh",

      
      "hn": "Hà Nội",
      "ha noi": "Hà Nội",
      "ha noi city": "Hà Nội",
      "hanoi": "Hà Nội",
      "thanh pho ha noi": "Hà Nội"
    };

    let cityVal = filters.city.trim();
    const key = normalizeKey(cityVal);

    for (const [k, v] of Object.entries(aliasMap)) {
      if (key === k || key.includes(k) || k.includes(key)) {
        cityVal = v;
        break;
      }
    }

    clauses.push(`
      LOWER(city) LIKE LOWER($${idx++})
    `);

    values.push(`%${cityVal}%`);
    }
  }

  
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

  
  if (filters.minArea !== undefined) {
    const minArea = Number(filters.minArea);

    if (!isNaN(minArea)) {
      clauses.push(`area >= $${idx++}`);
      values.push(minArea);
    }
  }

  
  if (filters.maxArea !== undefined) {
    const maxArea = Number(filters.maxArea);

    if (!isNaN(maxArea)) {
      clauses.push(`area <= $${idx++}`);
      values.push(maxArea);
    }
  }

  
  let hasKeywordSearch = false;
  let keywordParamIdx = null;
  if (filters.keyword?.trim()) {
    hasKeywordSearch = true;
    const keyword = filters.keyword.trim();
    keywordParamIdx = idx;

    
    
    
    clauses.push(`(
      search_vector @@ plainto_tsquery('simple', f_unaccent($${idx}))
      OR f_unaccent(COALESCE(title, '')) % f_unaccent($${idx})
      OR f_unaccent(COALESCE(district, '')) % f_unaccent($${idx})
      OR f_unaccent(COALESCE(ward, '')) % f_unaccent($${idx})
      OR f_unaccent(COALESCE(address, '')) % f_unaccent($${idx})
    )`);
    values.push(keyword);
    idx++;
  }

  
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

  
  if (filters.user_id) {
    let resolvedUserId = filters.user_id;
    
    if (isNaN(Number(filters.user_id))) {
      const userRes = await db.query(
        `SELECT id FROM users WHERE firebase_uid = $1 LIMIT 1`,
        [filters.user_id]
      );
      if (userRes.rows.length > 0) {
        resolvedUserId = userRes.rows[0].id;
      } else {
        
        return { data: [], total: 0, page: 1, limit: 10, totalPages: 0 };
      }
    }
    clauses.push(`user_id = $${idx++}`);
    values.push(resolvedUserId);
    
    
    clauses.push(`(source IS NULL OR source = 'user')`);
  } else {
    
    
    clauses.push(`is_visible = true`);
    clauses.push(`status = 'approved'`);
  }

  
  clauses.push(`price < 100000000000`);

  const where = clauses.length
    ? `WHERE ${clauses.join(" AND ")}`
    : "";

  
  const limit = Math.min(
    Math.max(parseInt(filters.limit) || 10, 1),
    50
  );

  const page = Math.max(
    parseInt(filters.page) || 1,
    1
  );

  const offset = (page - 1) * limit;

  
  const countQuery = `
    SELECT COUNT(*) AS total
    FROM listings
    ${where}
  `;

  const countRes = await db.query(countQuery, values);

  const total =
    Number(countRes.rows?.[0]?.total) || 0;

  
  let selectFields = '*';
  let orderBy = 'created_at DESC';

  if (hasKeywordSearch && keywordParamIdx !== null) {
    
    
    selectFields = `*,
      (
        COALESCE(ts_rank_cd(search_vector, plainto_tsquery('simple', f_unaccent($${keywordParamIdx}))), 0) * 0.6
        + GREATEST(
            COALESCE(similarity(f_unaccent(COALESCE(title, '')), f_unaccent($${keywordParamIdx})), 0),
            COALESCE(similarity(f_unaccent(COALESCE(district, '')), f_unaccent($${keywordParamIdx})), 0),
            COALESCE(word_similarity(f_unaccent($${keywordParamIdx}), f_unaccent(COALESCE(title, ''))), 0)
          ) * 0.4
      ) AS relevance`;
    orderBy = 'relevance DESC, created_at DESC';
  }

  const dataQuery = `
    SELECT ${selectFields}
    FROM listings
    ${where}
    ORDER BY ${orderBy}
    LIMIT $${idx++}
    OFFSET $${idx++}
  `;

  const dataValues = [...values, limit, offset];

  const result = await db.query(
    dataQuery,
    dataValues
  );

  
  const rows = (result.rows || []).map(r => ({
    ...r,
    search_vector: undefined, 
    image: r.image || 'https://placehold.co/600x400/cccccc/666666?text=No+Image',
    latitude: r.lat ?? r.latitude ?? null,
    longitude: r.lng ?? r.longitude ?? null,
    relevance: r.relevance ? Number(Number(r.relevance).toFixed(4)) : undefined
  }));

  return {
    data: rows,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit)
  };
}

export async function getListingById(id) {
  if (!id) return null;

  const result = await db.query(
    `SELECT l.*, u.name AS seller_name, u.phone_number AS seller_phone, u.email AS seller_email 
     FROM listings l 
     LEFT JOIN users u ON l.user_id = u.id 
     WHERE l.id = $1 LIMIT 1`,
    [Number(id)]
  );

  const r = result.rows?.[0];
  if (!r) return null;

  return {
    ...r,
    image: r.image || 'https://placehold.co/600x400/cccccc/666666?text=No+Image',
    latitude: r.lat ?? r.latitude ?? null,
    longitude: r.lng ?? r.longitude ?? null
  };
}

export async function updateListing(id, data, user_id) {
  const { title, price, area, address, city, district, ward, type, description, image } = data;
  const result = await db.query(
    `
    UPDATE listings
    SET title = $1, price = $2, area = $3, address = $4, city = $5, district = $6, ward = $7, type = $8, description = $9, image = $10, status = 'pending'
    WHERE id = $11 AND (user_id = $12 OR $12 IS NULL)
    RETURNING *
    `,
    [title, Number(price), Number(area), address, city, district, ward, type, description, image, Number(id), user_id]
  );
  return result.rows[0];
}

export async function deleteListing(id, user_id) {
  const result = await db.query(
    `DELETE FROM listings WHERE id = $1 AND (user_id = $2 OR $2 IS NULL) RETURNING id`,
    [Number(id), user_id]
  );
  return result.rows.length > 0;
}

export async function updateListingStatus(id, status) {
  const result = await db.query(
    `UPDATE listings SET status = $1 WHERE id = $2 RETURNING *`,
    [status, Number(id)]
  );
  return result.rows[0];
}

export async function toggleListingVisibility(id, user_id) {
  const result = await db.query(
    `UPDATE listings SET is_visible = NOT is_visible WHERE id = $1 AND (user_id = $2 OR $2 IS NULL) RETURNING *`,
    [Number(id), user_id]
  );
  return result.rows[0];
}