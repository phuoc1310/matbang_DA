const { Pool } = require('pg');

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "mat_bang",
  password: "123456",
  port: 5432,
});

const positiveComments = [
  "Mặt bằng rất đẹp, đúng như hình ảnh, giá cả siêu hợp lý.",
  "Chủ nhà nhiệt tình, vị trí tiện kinh doanh quán ăn, cực kỳ hài lòng.",
  "Diện tích phù hợp với nhu cầu của mình, vị trí đắc địa.",
  "Giá cả tương xứng với giá trị mặt bằng. Lô góc 2 mặt tiền tuyệt vời.",
  "Giao thông thuận lợi, có chỗ để xe rộng rãi cho khách, rất ưng ý.",
  "Đã thuê và đang kinh doanh rất tốt, mặt bằng sạch sẽ, an ninh tuyệt đối.",
  "Mặt tiền siêu rộng, thiết kế cực hợp làm siêu thị mini hoặc showroom lớn.",
  "Không gian thoáng mát, điện nước đầy đủ, chủ nhà thân thiện và hỗ trợ nhiệt tình.",
  "Pháp lý rõ ràng, hợp đồng dài hạn, chốt thuê luôn không đắn đo.",
  "Quá tuyệt vời, hiếm có mặt bằng nào đẹp và thuận tiện như thế này ở khu vực trung tâm."
];

async function run() {
  try {
    const usersRes = await pool.query("SELECT id FROM users");
    const users = usersRes.rows.map(r => r.id);
    
    if (users.length === 0) {
      console.log("No users found to assign reviews to.");
      return;
    }

    const listingsRes = await pool.query("SELECT id FROM listings");
    const listings = listingsRes.rows.map(r => r.id);

    if (listings.length === 0) {
      console.log("No listings found to assign reviews to.");
      return;
    }

    console.log(`Found ${users.length} users and ${listings.length} listings. Generating 5 reviews per listing...`);

    const insertQuery = `
      INSERT INTO reviews (listing_id, user_id, rating, comment, created_at) 
      VALUES ($1, $2, $3, $4, NOW())
    `;

    let inserted = 0;
    
    for (const listingId of listings) {
      for (let i = 0; i < 5; i++) {
        const userId = users[Math.floor(Math.random() * users.length)];
        const rating = Math.floor(Math.random() * 2) + 4; // 4 or 5 stars
        const comment = positiveComments[Math.floor(Math.random() * positiveComments.length)];

        await pool.query(insertQuery, [listingId, userId, rating, comment]);
        inserted++;
      }
    }
    
    console.log(`Successfully inserted ${inserted} highly rated reviews!`);
  } catch(e) {
    console.error(e);
  } finally {
    pool.end();
  }
}
run();
