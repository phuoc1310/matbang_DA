const { Pool } = require('pg');
const pool = new Pool({ user: 'postgres', password: '123456', host: 'localhost', port: 5432, database: 'mat_bang' });

async function run() {
  try {
    console.log("Adding views column...");
    await pool.query("ALTER TABLE listings ADD COLUMN IF NOT EXISTS views INT DEFAULT 0;");
    
    // Add some fake initial views for existing rows so they don't look dead
    console.log("Seeding fake views for existing listings...");
    await pool.query("UPDATE listings SET views = floor(random() * 500 + 50)::int WHERE views = 0 OR views IS NULL;");
    
    console.log("Ensuring views are consistent with reviews...");
    await pool.query(`
      UPDATE listings l
      SET views = GREATEST(
        COALESCE(l.views, 0), 
        (SELECT COUNT(*) FROM reviews r WHERE r.listing_id = l.id) * floor(random() * 20 + 10)::int + floor(random() * 50)::int
      )
      WHERE COALESCE(l.views, 0) < (SELECT COUNT(*) FROM reviews r WHERE r.listing_id = l.id);
    `);

    console.log("Database updated successfully.");
  } catch(e) {
    console.error("DB Update error:", e);
  } finally {
    pool.end();
  }
}
run();
