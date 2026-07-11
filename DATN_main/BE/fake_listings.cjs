const { Pool } = require('pg');

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "mat_bang",
  password: "123456",
  port: 5432,
});

const images = [
  "https://images.unsplash.com/photo-1582281987593-7848e4b6009a?q=80&w=600&auto=format&fit=crop", 
  "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=600&auto=format&fit=crop", 
  "https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=600&auto=format&fit=crop", 
  "https://images.unsplash.com/photo-1541889812440-42036746811e?q=80&w=600&auto=format&fit=crop", 
  "https://images.unsplash.com/photo-1600607688969-a5bfcd64bd28?q=80&w=600&auto=format&fit=crop", 
  "https://images.unsplash.com/photo-1519642918688-7e43b19245d8?q=80&w=600&auto=format&fit=crop", 
  "https://images.unsplash.com/photo-1449844908441-8829872d2607?q=80&w=600&auto=format&fit=crop", 
  "https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=600&auto=format&fit=crop", 
  "https://images.unsplash.com/photo-1580237072617-771c3ecc4a24?q=80&w=600&auto=format&fit=crop", 
  "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=600&auto=format&fit=crop"
];

async function run() {
  try {
    const usersRes = await pool.query("SELECT id FROM users LIMIT 10;");
    const users = usersRes.rows.map(r => r.id);
    
    if (users.length === 0) {
      console.log("No users found to assign listings to.");
      return;
    }

    console.log(`Found ${users.length} users to assign listings to.`);

    const insertQuery = `
      INSERT INTO listings (
        title, price, area, address, city, district, ward, 
        lat, lng, type, description, image, source, user_id, status, is_visible, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW())
    `;

    let inserted = 0;
    for (let i = 0; i < 80; i++) {
      const status = i < 30 ? 'rejected' : 'pending'; // 30 rejected, 50 pending
      const userId = users[i % users.length];
      
      const title = `Mặt bằng siêu rộng trung tâm - Test ${status} ${i + 1}`;
      const description = `Mặt bằng cho thuê, diện tích rộng rãi. Giao thông thuận lợi, dân cư đông đúc. Tin này đang ở trạng thái ${status}. Hình ảnh minh hoạ được đính kèm.`;
      const price = Math.floor(Math.random() * 80 + 15) * 1000000; // 15tr - 95tr
      const area = Math.floor(Math.random() * 150 + 40); // 40m2 - 190m2
      
      const address = `Số ${Math.floor(Math.random() * 200 + 1)} Phố Xã Đàn`;
      const city = 'Hà Nội';
      const district = 'Đống Đa';
      const ward = 'Phương Liên';
      
      let lat = 21.01 + (Math.random() - 0.5) * 0.03;
      let lng = 105.83 + (Math.random() - 0.5) * 0.03;
      
      const type = 'Mặt bằng kinh doanh';
      const image = images[Math.floor(Math.random() * images.length)];
      const source = 'User';
      const is_visible = false; 

      await pool.query(insertQuery, [
        title, price, area, address, city, district, ward,
        lat, lng, type, description, image, source, userId, status, is_visible
      ]);
      inserted++;
    }
    
    console.log(`Successfully inserted ${inserted} listings! (30 rejected, 50 pending)`);
  } catch(e) {
    console.error(e);
  } finally {
    pool.end();
  }
}
run();
