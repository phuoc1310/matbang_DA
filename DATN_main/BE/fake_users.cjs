const { Pool } = require('pg');

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "mat_bang",
  password: "123456",
  port: 5432,
});

async function run() {
  try {
    for (let i = 1; i <= 100; i++) {
        const uid = `user_fake_${Date.now()}_${i}`;
        const email = `fakeuser${i}@gmail.com`;
        const name = `Người Dùng Ảo ${i}`;
        const role = 'user';
        const phone = `09${Math.floor(10000000 + Math.random() * 90000000)}`;

        await pool.query(
            `INSERT INTO users (firebase_uid, email, name, phone_number, role, created_at)
             VALUES ($1, $2, $3, $4, $5, NOW())`,
            [uid, email, name, phone, role]
        );
    }
    console.log("Thêm 100 người dùng ảo thành công!");
  } catch (e) {
    console.error(e);
  } finally {
    pool.end();
  }
}
run();
