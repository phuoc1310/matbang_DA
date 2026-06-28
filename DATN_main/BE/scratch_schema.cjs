const { Pool } = require('pg');
require('dotenv').config({ path: './.env' });
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'mat_bang',
  password: process.env.DB_PASSWORD || '123456',
  port: process.env.DB_PORT || 5432,
});
async function main() {
  try {
    const res = await pool.query(`
      SELECT table_name, column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      ORDER BY table_name, ordinal_position;
    `);
    
    let currentTable = '';
    for (const row of res.rows) {
        if (row.table_name !== currentTable) {
            console.log('\n--- ' + row.table_name + ' ---');
            currentTable = row.table_name;
        }
        console.log(`${row.column_name}: ${row.data_type}`);
    }
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}
main();
