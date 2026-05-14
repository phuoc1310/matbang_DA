import db from '../config/db.js';
async function migrate() {
  try {
    await db.query(`ALTER TABLE listings ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'pending'`);
    await db.query(`ALTER TABLE listings ADD COLUMN IF NOT EXISTS is_visible BOOLEAN DEFAULT true`);
    console.log("Migration successful: Added status and is_visible columns.");
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    process.exit(0);
  }
}
migrate();
