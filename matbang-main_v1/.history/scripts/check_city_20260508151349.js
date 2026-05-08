import db from '../config/db.js';

async function run() {
  try {
    const res = await db.query(`SELECT DISTINCT(city) as city FROM listings ORDER BY city LIMIT 50`);
    console.log('Distinct city values:', res.rows.map(r => r.city));

    const sample = await db.query(`SELECT id, title, city, lat, lng, latitude, longitude FROM listings WHERE LOWER(city) LIKE LOWER($1) LIMIT 10`, ['%Hồ Chí Minh%']);
    console.log('Sample rows for "%Hồ Chí Minh%":', sample.rows);

    const sample2 = await db.query(`SELECT id, title, city, lat, lng, latitude, longitude FROM listings WHERE LOWER(city) LIKE LOWER($1) LIMIT 10`, ['%HCM%']);
    console.log('Sample rows for "%HCM%":', sample2.rows);

    process.exit(0);
  } catch (err) {
    console.error('Error running checks:', err.message);
    process.exit(1);
  }
}

run();
