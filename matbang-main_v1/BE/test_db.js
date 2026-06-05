import db from './config/db.js';

async function test() {
  const res = await db.query("SELECT COUNT(*) FROM listings WHERE price <= 1000000000 AND city ILIKE '%Nội%' AND is_visible = true AND status = 'approved'");
  console.log('Hanoi listings < 1 billion (visible & approved):', res.rows[0]);

  const res2 = await db.query("SELECT COUNT(*) FROM listings WHERE price <= 1000000000 AND city ILIKE '%Hồ Chí Minh%' AND is_visible = true AND status = 'approved'");
  console.log('HCM listings < 1 billion (visible & approved):', res2.rows[0]);
  
  process.exit(0);
}

test();
