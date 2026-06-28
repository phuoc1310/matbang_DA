
import db from './config/db.js';

async function migrate() {
  console.log('🚀 Bắt đầu migration nâng cấp tìm kiếm...\n');

  try {
    
    console.log('1️⃣  Bật extensions pg_trgm + unaccent...');
    await db.query(`CREATE EXTENSION IF NOT EXISTS pg_trgm;`);
    await db.query(`CREATE EXTENSION IF NOT EXISTS unaccent;`);
    console.log('   ✅ Extensions OK\n');

    
    
    
    console.log('2️⃣  Tạo immutable unaccent wrapper...');
    await db.query(`
      CREATE OR REPLACE FUNCTION f_unaccent(text)
      RETURNS text AS
      $$
        SELECT public.unaccent('public.unaccent', $1)
      $$ LANGUAGE sql IMMUTABLE PARALLEL SAFE STRICT;
    `);
    console.log('   ✅ f_unaccent() OK\n');

    
    console.log('3️⃣  Thêm cột search_vector...');
    
    const colCheck = await db.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'listings' AND column_name = 'search_vector'
    `);
    
    if (colCheck.rows.length === 0) {
      await db.query(`ALTER TABLE listings ADD COLUMN search_vector tsvector;`);
      console.log('   ✅ Cột search_vector đã được tạo\n');
    } else {
      console.log('   ⏭️  Cột search_vector đã tồn tại, bỏ qua\n');
    }

    
    console.log('4️⃣  Tạo trigger function cập nhật search_vector...');
    await db.query(`
      CREATE OR REPLACE FUNCTION listings_search_vector_update() 
      RETURNS trigger AS $$
      BEGIN
        NEW.search_vector :=
          setweight(to_tsvector('simple', f_unaccent(COALESCE(NEW.title, ''))), 'A') ||
          setweight(to_tsvector('simple', f_unaccent(COALESCE(NEW.district, ''))), 'A') ||
          setweight(to_tsvector('simple', f_unaccent(COALESCE(NEW.ward, ''))), 'B') ||
          setweight(to_tsvector('simple', f_unaccent(COALESCE(NEW.address, ''))), 'B') ||
          setweight(to_tsvector('simple', f_unaccent(COALESCE(NEW.city, ''))), 'B') ||
          setweight(to_tsvector('simple', f_unaccent(COALESCE(NEW.type, ''))), 'C') ||
          setweight(to_tsvector('simple', f_unaccent(COALESCE(NEW.description, ''))), 'D');
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);
    console.log('   ✅ Trigger function OK\n');

    
    console.log('5️⃣  Tạo trigger...');
    await db.query(`
      DROP TRIGGER IF EXISTS trg_listings_search_vector ON listings;
    `);
    await db.query(`
      CREATE TRIGGER trg_listings_search_vector
      BEFORE INSERT OR UPDATE OF title, district, ward, address, city, type, description
      ON listings
      FOR EACH ROW
      EXECUTE FUNCTION listings_search_vector_update();
    `);
    console.log('   ✅ Trigger OK\n');

    
    console.log('6️⃣  Cập nhật search_vector cho dữ liệu hiện có...');
    const updateResult = await db.query(`
      UPDATE listings SET search_vector =
        setweight(to_tsvector('simple', f_unaccent(COALESCE(title, ''))), 'A') ||
        setweight(to_tsvector('simple', f_unaccent(COALESCE(district, ''))), 'A') ||
        setweight(to_tsvector('simple', f_unaccent(COALESCE(ward, ''))), 'B') ||
        setweight(to_tsvector('simple', f_unaccent(COALESCE(address, ''))), 'B') ||
        setweight(to_tsvector('simple', f_unaccent(COALESCE(city, ''))), 'B') ||
        setweight(to_tsvector('simple', f_unaccent(COALESCE(type, ''))), 'C') ||
        setweight(to_tsvector('simple', f_unaccent(COALESCE(description, ''))), 'D')
    `);
    console.log(`   ✅ Đã cập nhật ${updateResult.rowCount} bản ghi\n`);

    
    console.log('7️⃣  Tạo GIN indexes...');
    
    
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_listings_search_vector
      ON listings USING GIN (search_vector);
    `);
    console.log('   ✅ Index search_vector (GIN) OK');
    
    
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_listings_title_trgm
      ON listings USING GIN (f_unaccent(COALESCE(title, '')) gin_trgm_ops);
    `);
    console.log('   ✅ Index title trigram (GIN) OK');

    
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_listings_district_trgm
      ON listings USING GIN (f_unaccent(COALESCE(district, '')) gin_trgm_ops);
    `);
    console.log('   ✅ Index district trigram (GIN) OK');

    
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_listings_address_trgm
      ON listings USING GIN (f_unaccent(COALESCE(address, '')) gin_trgm_ops);
    `);
    console.log('   ✅ Index address trigram (GIN) OK\n');

    
    console.log('8️⃣  Kiểm tra...');
    const verifyResult = await db.query(`
      SELECT COUNT(*) AS total,
             COUNT(search_vector) AS with_vector
      FROM listings
    `);
    const { total, with_vector } = verifyResult.rows[0];
    console.log(`   📊 Tổng: ${total} listings, Có search_vector: ${with_vector}\n`);

    
    const testResult = await db.query(`
      SELECT id, title, 
             ts_rank_cd(search_vector, plainto_tsquery('simple', f_unaccent('mặt bằng'))) AS rank
      FROM listings
      WHERE search_vector @@ plainto_tsquery('simple', f_unaccent('mặt bằng'))
      ORDER BY rank DESC
      LIMIT 3
    `);
    
    if (testResult.rows.length > 0) {
      console.log('   🔍 Test search "mặt bằng":');
      testResult.rows.forEach(r => {
        console.log(`      - [${r.id}] ${r.title?.substring(0, 50)}... (rank: ${Number(r.rank).toFixed(4)})`);
      });
    } else {
      console.log('   ⚠️  Test search "mặt bằng" — không có kết quả (kiểm tra lại dữ liệu)');
    }

    console.log('\n🎉 Migration hoàn tất! Hệ thống tìm kiếm đã được nâng cấp.');
    
  } catch (err) {
    console.error('❌ Migration lỗi:', err.message);
    console.error(err);
  }

  process.exit(0);
}

migrate();
