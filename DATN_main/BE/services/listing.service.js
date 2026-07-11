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
      search_vector @@ websearch_to_tsquery('simple', f_unaccent($${idx}))
      OR f_unaccent(COALESCE(title, '')) % f_unaccent($${idx})
      OR f_unaccent(COALESCE(district, '')) % f_unaccent($${idx})
      OR f_unaccent(COALESCE(ward, '')) % f_unaccent($${idx})
      OR f_unaccent(COALESCE(address, '')) % f_unaccent($${idx})
    )`);
    values.push(keyword);
    idx++;
  }


  if (filters.type?.trim()) {
    const rawType = filters.type.trim();
    const typeLower = rawType.toLowerCase();

    let mappedTypes = [rawType];
    if (typeLower.includes('căn hộ') || typeLower.includes('chung cư') || typeLower.includes('can ho')) {
      mappedTypes.push('canho');
    } else if (typeLower.includes('mặt bằng') || typeLower.includes('kinh doanh') || typeLower.includes('mat bang')) {
      mappedTypes.push('matbang');
    } else if (typeLower.includes('nhà') || typeLower.includes('nha')) {
      mappedTypes.push('nha');
    } else if (typeLower.includes('đất') || typeLower.includes('dat')) {
      mappedTypes.push('dat');
    }

    const typeClauses = [];
    for (const t of mappedTypes) {
      typeClauses.push(`(
        LOWER(COALESCE(type, '')) LIKE LOWER($${idx})
        OR LOWER(COALESCE(title, '')) LIKE LOWER($${idx})
        OR LOWER(COALESCE(description, '')) LIKE LOWER($${idx})
      )`);
      values.push(`%${t}%`);
      idx++;
    }

    clauses.push(`(${typeClauses.join(' OR ')})`);
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

  if (filters.sort === 'views') {
    orderBy = 'views DESC NULLS LAST, created_at DESC';
  }
  if (hasKeywordSearch && keywordParamIdx !== null) {
    selectFields += `,
      (
        COALESCE(ts_rank_cd(search_vector, websearch_to_tsquery('simple', f_unaccent($${keywordParamIdx}))), 0) * 0.6
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
    `SELECT l.*, 
            u.name AS seller_name, 
            u.phone_number AS seller_phone, 
            u.email AS seller_email,
            (SELECT COALESCE(ROUND(AVG(rating), 1), 0) FROM reviews r WHERE r.listing_id = l.id) AS rating
     FROM listings l 
     LEFT JOIN users u ON l.user_id = u.id 
     WHERE l.id = $1 LIMIT 1`,
    [Number(id)]
  );

  const r = result.rows?.[0];
  if (!r) return null;

  return {
    ...r,
    rating: Number(r.rating) || 0,
    image: r.image || 'https://placehold.co/600x400/cccccc/666666?text=No+Image',
    latitude: r.lat ?? r.latitude ?? null,
    longitude: r.lng ?? r.longitude ?? null
  };
}

export async function incrementListingView(id) {
  if (!id) return null;
  const result = await db.query(
    `UPDATE listings SET views = COALESCE(views, 0) + 1 WHERE id = $1 RETURNING views`,
    [Number(id)]
  );
  return result.rows?.[0] || null;
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

export async function getListingTypeDistribution() {
  const query = `
    SELECT type, COUNT(*) as count 
    FROM listings 
    WHERE is_visible = true AND status = 'approved' AND type IS NOT NULL
    GROUP BY type
    ORDER BY count DESC
  `;
  const result = await db.query(query);
  return result.rows;
}

// ================= SEARCH SUGGESTIONS =================
export async function getSearchSuggestions(keyword, limit = 5) {
  if (!keyword || keyword.trim().length === 0) return [];

  const query = `
    SELECT DISTINCT unaccent_val AS suggestion, MAX(score) as max_score
    FROM (
      SELECT title AS unaccent_val, similarity(f_unaccent(title), f_unaccent($1)) AS score
      FROM listings
      WHERE is_visible = true AND status = 'approved' AND (f_unaccent(title) % f_unaccent($1) OR f_unaccent(title) ILIKE '%' || f_unaccent($1) || '%')
      
      UNION ALL
      
      SELECT district AS unaccent_val, similarity(f_unaccent(district), f_unaccent($1)) AS score
      FROM listings
      WHERE is_visible = true AND status = 'approved' AND district IS NOT NULL AND (f_unaccent(district) % f_unaccent($1) OR f_unaccent(district) ILIKE '%' || f_unaccent($1) || '%')
    ) subquery
    GROUP BY unaccent_val
    ORDER BY max_score DESC
    LIMIT $2;
  `;
  const result = await db.query(query, [keyword.trim(), limit]);
  return result.rows.map(r => r.suggestion);
}

// ================= PERSONALIZED RECOMMENDATIONS (Weighted Scoring) =================
// Trọng số: Khu vực 50% | Khoảng giá 30% | Loại hình 20%
export async function getPersonalizedRecommendations({ districts, types, avgPrice, excludeIds, limit = 8 }) {
  // Lấy tất cả mặt bằng đang hiển thị
  let query = `
    SELECT id, title, price, area, address, city, district, ward, type, image, views,
           (SELECT COALESCE(ROUND(AVG(rating), 1), 0) FROM reviews r WHERE r.listing_id = l.id) AS rating
    FROM listings l
    WHERE is_visible = true AND status = 'approved'
  `;
  const params = [];
  let idx = 1;

  // Loại bỏ các mặt bằng đã xem
  if (excludeIds && excludeIds.length > 0) {
    query += ` AND id != ALL($${idx++}::int[])`;
    params.push(excludeIds.map(Number));
  }

  query += ` LIMIT 200`; // Lấy pool 200 mặt bằng để chấm điểm

  const result = await db.query(query, params);
  const listings = result.rows || [];

  // ===== THUẬT TOÁN CHẤM ĐIỂM (SCORING ALGORITHM) =====
  // Trọng số phân bổ:
  const W_LOCATION = 50; // Tần suất khu vực:       50%
  const W_PRICE = 30; // Khoảng giá mục tiêu:    30%
  const W_TYPE = 20; // Tần suất loại hình BĐS: 20%

  // Chuẩn hóa tần suất districts & types thành map tỷ lệ
  const totalDistrictViews = Object.values(districts || {}).reduce((a, b) => a + b, 0) || 1;
  const totalTypeViews = Object.values(types || {}).reduce((a, b) => a + b, 0) || 1;

  const scored = listings.map(listing => {
    let locationScore = 0;
    let typeScore = 0;
    let priceScore = 0;

    // --- 1. ĐIỂM KHU VỰC (0 - 50 điểm) ---
    // Quận/Huyện/TP mà user xem nhiều nhất → điểm cao nhất theo tần suất
    const listingDistrict = (listing.district || '').trim();
    if (listingDistrict && districts) {
      for (const [d, count] of Object.entries(districts)) {
        if (listingDistrict.toLowerCase().includes(d.toLowerCase()) || d.toLowerCase().includes(listingDistrict.toLowerCase())) {
          // Điểm = trọng số * (tần suất quận này / tổng tần suất)
          locationScore = W_LOCATION * (count / totalDistrictViews);
          break;
        }
      }
    }

    // --- 2. ĐIỂM LOẠI HÌNH BĐS (0 - 30 điểm) ---
    // Loại hình (Nhà ở, Đất, Căn hộ, Mặt bằng...) user xem nhiều nhất → điểm theo tần suất
    const listingType = (listing.type || '').trim();
    if (listingType && types) {
      for (const [t, count] of Object.entries(types)) {
        if (listingType.toLowerCase() === t.toLowerCase()) {
          typeScore = W_TYPE * (count / totalTypeViews);
          break;
        }
      }
    }

    // --- 3. ĐIỂM KHOẢNG GIÁ MỤC TIÊU (0 - 20 điểm) ---
    // Giá trung bình cộng các mặt bằng đã xem, biên độ dao động ±50%
    // Càng gần giá trung bình → càng cao điểm (công thức tuyến tính)
    if (avgPrice > 0 && listing.price > 0) {
      const priceDiff = Math.abs(listing.price - avgPrice);
      const maxDiff = avgPrice * 0.5; // Biên độ dao động ±50% giá trung bình
      if (priceDiff <= maxDiff) {
        const ratio = 1 - (priceDiff / maxDiff);
        priceScore = W_PRICE * ratio;
      }
    } else if (avgPrice === 0) {
      priceScore = W_PRICE * 0.5;
    }

    const totalScore = Math.round((locationScore + typeScore + priceScore) * 100) / 100;

    return {
      ...listing,
      search_vector: undefined,
      image: listing.image || 'https://placehold.co/600x400/cccccc/666666?text=No+Image',
      _score: totalScore,
      _breakdown: {
        location: Math.round(locationScore * 100) / 100,
        type: Math.round(typeScore * 100) / 100,
        price: Math.round(priceScore * 100) / 100
      }
    };
  });

  // Sắp xếp theo điểm giảm dần, sau đó theo views (trending)
  scored.sort((a, b) => {
    if (b._score !== a._score) return b._score - a._score;
    return (b.views || 0) - (a.views || 0);
  });

  // Chỉ trả về những mặt bằng có điểm > 0
  return scored.filter(s => s._score > 0).slice(0, limit);
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