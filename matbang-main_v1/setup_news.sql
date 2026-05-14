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

-- B? qua n?u dã có d? li?u m?u
DO $do$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM news LIMIT 1) THEN
        INSERT INTO news (title, excerpt, content, image_url, author_id)
        VALUES 
        ('Th? tru?ng m?t b?ng cho thuê ph?c h?i m?nh m?', 'Nhu c?u thuê m?t b?ng kinh doanh dang có d?u hi?u tang tru?ng tr? l?i sau th?i gian dài tr?m l?ng.', '<p>Theo báo cáo m?i nh?t, th? tru?ng cho thuê m?t b?ng thuong m?i t?i các thành ph? l?n dang ch?ng ki?n s? ph?c h?i ?n tu?ng. Nhi?u thuong hi?u l?n b?t d?u m? r?ng h? th?ng, d?c bi?t là trong linh v?c F&B và bán l? th?i trang.</p><p>Giá thuê t?i các khu v?c trung tâm cung ghi nh?n m?c tang nh? 2-5% so v?i quý tru?c.</p>', 'https://images.unsplash.com/photo-1556761175-5973dc0f32d7?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', NULL),
        ('Kinh nghi?m ch?n m?t b?ng m? quán Cafe hi?u qu?', 'Kh?i nghi?p quán Cafe c?n chú ý nh?ng gì khi ch?n d?a di?m? Du?i dây là 5 tiêu chí quan tr?ng nh?t.', '<p>Ch?n dúng m?t b?ng quy?t d?nh d?n 50% thành công c?a m?t quán Cafe. Du?i dây là nh?ng kinh nghi?m xuong máu:</p><ul><li><b>1. V? trí và luu lu?ng giao thông:</b> Hãy quan sát luu lu?ng ngu?i qua l?i vào các khung gi? khác nhau.</li><li><b>2. Ch? d? xe:</b> Ðây là y?u t? s?ng còn t?i các dô th? l?n.</li><li><b>3. H?p d?ng thuê:</b> Ð?m b?o h?p d?ng dài h?n (thu?ng là 3-5 nam) d? k?p thu h?i v?n.</li></ul><p>Ð?ng v?i vàng ch?t ngay khi chua kh?o sát k?!</p>', 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', NULL),
        ('Xu hu?ng Co-working space ti?p t?c bùng n?', 'Các van phòng chia s? dang thu hút nhi?u startup và freelancer hon bao gi? h?t.', '<p>Mô hình Co-working space không ch? cung c?p không gian làm vi?c chuyên nghi?p mà còn t?o ra c?ng d?ng k?t n?i hi?u qu?. Gi?i tr? và các startup ngày càng ua chu?ng s? linh ho?t v? chi phí và th?i gian c?a mô hình này.</p>', 'https://images.unsplash.com/photo-1497366216548-37526070297c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', NULL);
    END IF;
END
$do$;
