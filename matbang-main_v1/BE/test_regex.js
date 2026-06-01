import db from './config/db.js';

(async () => {
  try {
    const q1 = await db.query("SELECT id, district, title FROM listings WHERE district LIKE '%Quận 8%'");
    console.log('LIKE Quận 8:', q1.rows.length);
    
    const q2 = await db.query("SELECT id, district, title FROM listings WHERE COALESCE(district, '') ~* 'quận 8\\y'");
    console.log('Regex quận 8\\y:', q2.rows.length);

    const q3 = await db.query("SELECT id, district, title FROM listings WHERE LOWER(COALESCE(district, '')) ~* LOWER('Quận 8\\y')");
    console.log('LOWER Regex Quận 8\\y:', q3.rows.length);
    
    const q4 = await db.query("SELECT id, district, title FROM listings WHERE COALESCE(district, '') ~* 'quận 8\b'");
    console.log('Regex quận 8\b (standard boundary):', q4.rows.length);
    
  } catch(e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
})();
