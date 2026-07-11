const { Pool } = require('./BE/node_modules/pg');
const pool = new Pool({ user: 'postgres', host: 'localhost', database: 'mat_bang', password: '123456', port: 5432 });

async function run() {
  console.time('fetch');
  const res = await fetch('http://localhost:3033/api/listings?limit=2&user_id=2ehlBCImbVeW5WlSCrrpGplh6w02');
  const json = await res.json();
  console.timeEnd('fetch');
  console.log(json);

  console.time('query');
  const qRes = await pool.query(`SELECT COUNT(*) FROM listings WHERE user_id = 37 AND (source IS NULL OR source = 'user')`);
  console.timeEnd('query');
  console.log(qRes.rows);
  
  process.exit(0);
}
run();
