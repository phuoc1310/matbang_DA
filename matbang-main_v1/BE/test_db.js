import db from './config/db.js';
db.query("SELECT id, title, user_id, status FROM listings ORDER BY id DESC LIMIT 5")
  .then(res => { console.log(res.rows); process.exit(0); })
  .catch(err => { console.error(err); process.exit(1); });
