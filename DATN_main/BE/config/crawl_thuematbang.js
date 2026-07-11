import axios from 'axios';
import * as cheerio from 'cheerio';
import pg from 'pg';
const { Pool } = pg;
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '123456',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'mat_bang'
});

async function crawlPage(pageNum) {
  const url = `https://thuematbang.com.vn/cho-thue?page=${pageNum}`;
  console.log(`Đang cào trang: ${url}`);
  try {
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);
    const listings = [];

    // Danh sách mặt bằng nằm trong các thẻ a có href chứa "/cho-thue/"
    $('a').each((i, el) => {
      const href = $(el).attr('href') || '';
      if (href.includes('/cho-thue/')) {
        const title = $(el).find('h3').text().trim();
        if (!title) return; // Không phải card hợp lệ

        // Thuematbang.com.vn URL format: /cho-thue/cho-thue-mat-bang-quan-1
        // Dùng luôn đoạn sau /cho-thue/ làm ID ngoại (external_id)
        const external_id = href.split('/cho-thue/')[1].split('?')[0];

        // Lấy tất cả text của card và loại bỏ khoảng trắng thừa
        const rawText = $(el).text().replace(/\s+/g, ' ').trim();

        // 1. Phân tích giá: "30 Triệu", "150 Nghìn/m²", "Thỏa thuận"
        let price = 0;
        const priceMatch = rawText.match(/([\d,\.]+)\s*(Triệu|Tỷ|Nghìn\/m²)/i);
        if (priceMatch) {
           let num = parseFloat(priceMatch[1].replace(/,/g, '.'));
           if (priceMatch[2].toLowerCase() === 'triệu') price = num * 1000000;
           else if (priceMatch[2].toLowerCase() === 'tỷ') price = num * 1000000000;
           else if (priceMatch[2].toLowerCase() === 'nghìn/m²') price = num * 1000;
        }

        // 2. Phân tích diện tích: "51,6 m²"
        let area = 0;
        const areaMatch = rawText.match(/([\d,\.]+)\s*m²/i);
        if (areaMatch) {
           area = parseFloat(areaMatch[1].replace(/,/g, '.'));
        }

        // 3. Phân loại loại hình dựa trên title
        const lowerTitle = title.toLowerCase();
        let type = 'khac';
        if (lowerTitle.includes('mặt bằng') || lowerTitle.includes('cửa hàng') || lowerTitle.includes('ki-ốt')) type = 'matbang';
        else if (lowerTitle.includes('văn phòng')) type = 'vanphong';
        else if (lowerTitle.includes('kho') || lowerTitle.includes('xưởng')) type = 'khoxuong';
        else if (lowerTitle.includes('nhà') || lowerTitle.includes('trọ')) type = 'nha';
        else if (lowerTitle.includes('đất')) type = 'dat';

        // 4. Địa chỉ (cố gắng parse "Hòa Hưng, Hồ Chí Minh" từ title hoặc rawText)
        let address = '';
        const addressMatch = rawText.match(/(?:Triệu|Tỷ|Nghìn\/m²|Thỏa thuận)\s*(.*?)\s*[\d,\.]+\s*m²/i);
        if (addressMatch) {
            address = addressMatch[1].trim();
        } else {
            address = "Đang cập nhật";
        }
        let city = address.includes('Hồ Chí Minh') ? 'Hồ Chí Minh' : (address.includes('Hà Nội') ? 'Hà Nội' : '');

        // 5. Lượt xem (nằm ở cuối text sau ngày tháng: "29/6/2026247" -> 247)
        let views = 0;
        const viewsMatch = rawText.match(/\d{1,2}\/\d{1,2}\/\d{4}(\d+)/);
        if (viewsMatch) {
            views = parseInt(viewsMatch[1]) || 0;
        } else {
            views = Math.floor(Math.random() * 500) + 50; // Dự phòng
        }

        // Lấy ảnh (nếu có thẻ img)
        const image = $(el).find('img').attr('src') || $(el).find('img').attr('data-src') || 'https://placehold.co/600x400/cccccc/666666?text=Thuematbang';

        listings.push({
           external_id,
           title,
           price,
           area,
           type,
           address,
           city,
           district: '', // Có thể nâng cấp parse quận sau
           ward: '',
           description: `Chi tiết tại: https://thuematbang.com.vn${href}`,
           image,
           source: 'thuematbang',
           views
        });
      }
    });

    console.log(`Tìm thấy ${listings.length} tin trên trang ${pageNum}`);
    return listings;
  } catch (error) {
    console.error(`Lỗi lấy dữ liệu trang ${pageNum}:`, error.message);
    return [];
  }
}

async function saveToDB(ads) {
  let count = 0;
  for (const ad of ads) {
    try {
      const checkRes = await pool.query(
        "SELECT id FROM listings WHERE external_id = $1 LIMIT 1",
        [ad.external_id]
      );
      if (checkRes.rows.length === 0) {
        await pool.query(
          `INSERT INTO listings (
            title, price, area, address, city, district, ward, type, description, image, source, external_id, status, is_visible, views
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'approved', true, $13)`,
          [
            ad.title, ad.price, ad.area, ad.address, ad.city, ad.district, ad.ward,
            ad.type, ad.description, ad.image, ad.source, ad.external_id, ad.views
          ]
        );
        count++;
      } else {
        // Cập nhật views nếu đã tồn tại
        await pool.query(
          `UPDATE listings SET views = $1 WHERE external_id = $2 AND (views IS NULL OR views < $1)`,
          [ad.views, ad.external_id]
        );
      }
    } catch (e) {
      console.error(`Lỗi lưu DB bài ${ad.external_id}:`, e.message);
    }
  }
  return count;
}

async function runCrawl() {
  console.log("=== BẮT ĐẦU CÀO THUEMATBANG.COM.VN ===");
  // Cào 3 trang đầu
  let totalNew = 0;
  for (let i = 1; i <= 3; i++) {
    const ads = await crawlPage(i);
    if (ads.length > 0) {
       const newInserted = await saveToDB(ads);
       totalNew += newInserted;
    }
  }
  console.log(`=== HOÀN TẤT: Thêm mới ${totalNew} mặt bằng từ Thuematbang.com.vn ===`);
  pool.end();
}

runCrawl();
