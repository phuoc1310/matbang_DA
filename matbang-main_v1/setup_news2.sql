CREATE TABLE IF NOT EXISTS news (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    excerpt TEXT,
    content TEXT NOT NULL,
    image_url TEXT,
    author_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS news_ratings (
    id SERIAL PRIMARY KEY,
    news_id INTEGER REFERENCES news(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

DO $do$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM news LIMIT 1) THEN
        INSERT INTO news (title, excerpt, content, image_url, author_id)
        VALUES 
        ('Thị trường mặt bằng cho thuê phục hồi mạnh mẽ', 'Nhu cầu thuê mặt bằng kinh doanh đang có dấu hiệu tăng trưởng trở lại sau thời gian dài trầm lắng.', '<p>Theo báo cáo mới nhất, thị trường cho thuê mặt bằng thương mại tại các thành phố lớn đang chứng kiến sự phục hồi ấn tượng. Nhiều thương hiệu lớn bắt đầu mở rộng hệ thống, đặc biệt là trong lĩnh vực F&B và bán lẻ thời trang.</p><p>Giá thuê tại các khu vực trung tâm cũng ghi nhận mức tăng nhẹ 2-5% so với quý trước.</p>', 'https://images.unsplash.com/photo-1556761175-5973dc0f32d7?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', NULL),
        ('Kinh nghiệm chọn mặt bằng mở quán Cafe hiệu quả', 'Khởi nghiệp quán Cafe cần chú ý những gì khi chọn địa điểm? Dưới đây là 5 tiêu chí quan trọng nhất.', '<p>Chọn đúng mặt bằng quyết định đến 50% thành công của một quán Cafe. Dưới đây là những kinh nghiệm xương máu:</p><ul><li><b>1. Vị trí và lưu lượng giao thông:</b> Hãy quan sát lưu lượng người qua lại vào các khung giờ khác nhau.</li><li><b>2. Chỗ để xe:</b> Đây là yếu tố sống còn tại các đô thị lớn.</li><li><b>3. Hợp đồng thuê:</b> Đảm bảo hợp đồng dài hạn (thường là 3-5 năm) để kịp thu hồi vốn.</li></ul><p>Đừng vội vàng chốt ngay khi chưa khảo sát kỹ!</p>', 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', NULL),
        ('Xu hướng Co-working space tiếp tục bùng nổ', 'Các văn phòng chia sẻ đang thu hút nhiều startup và freelancer hơn bao giờ hết.', '<p>Mô hình Co-working space không chỉ cung cấp không gian làm việc chuyên nghiệp mà còn tạo ra cộng đồng kết nối hiệu quả. Giới trẻ và các startup ngày càng ưa chuộng sự linh hoạt về chi phí và thời gian của mô hình này.</p>', 'https://images.unsplash.com/photo-1497366216548-37526070297c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', NULL);
    END IF;
END
$do$;
