import db from './config/db.js';
const r = await db.query("UPDATE users SET name = 'Admin RentHub' WHERE email = 'admin@renthub.vn' RETURNING *");
console.log(r.rows[0]);
process.exit();
