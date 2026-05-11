import pool from '../config/db.js';

async function run() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS search_history (
          id SERIAL PRIMARY KEY,
          user_id VARCHAR(255) NOT NULL,
          keyword VARCHAR(255),
          city VARCHAR(100),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS compare_list (
          id SERIAL PRIMARY KEY,
          user_id VARCHAR(255) NOT NULL,
          property_id VARCHAR(100) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(user_id, property_id)
      );
    `);
    console.log('Tables created successfully!');
    process.exit(0);
  } catch(err) {
    console.error(err);
    process.exit(1);
  }
}

run();
