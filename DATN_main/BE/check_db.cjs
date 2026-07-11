const { Pool } = require('pg');
const pool = new Pool({ user: 'postgres', password: '123456', host: 'localhost', port: 5432, database: 'mat_bang' });
pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'listings'").then(res => { console.log(res.rows); pool.end(); }).catch(console.error);
