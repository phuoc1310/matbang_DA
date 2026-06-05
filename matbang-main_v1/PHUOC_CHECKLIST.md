# Checklist đối chiếu đề cương

## 1. Mục tiêu đề cương

- [x] Hệ thống tìm kiếm mặt bằng cho thuê trực tuyến với bộ lọc đa tiêu chí (vị trí, giá, diện tích, loại hình kinh doanh).
- [x] Nâng cao độ chính xác tìm kiếm qua cơ chế lọc và xếp hạng kết quả phù hợp.
- [x] Tích hợp bản đồ để hiển thị vị trí và hỗ trợ tìm kiếm theo khu vực.
- [x] Xây dựng chức năng lưu tìm kiếm và so sánh các mặt bằng.
- [x] Xây dựng hệ thống quản lý tài khoản và đăng tin cho thuê.
- [x] Xây dựng chức năng đánh giá và nhận xét đầy đủ.
- [ ] Hoàn thiện báo cáo, slide và chuẩn bị bảo vệ (ngoài phạm vi mã nguồn).

## 2. Những gì đã làm được trong mã nguồn

### 2.1 Frontend

- [x] Trang chủ `Trangchu.html` có giao diện tìm kiếm chuyên nghiệp với bộ lọc đa dạng.
- [x] Trang kết quả tìm kiếm `timkiem.html` tích hợp MapLibre hiển thị bản đồ, bộ lọc chi tiết, sắp xếp và lịch sử tìm kiếm.
- [x] Chức năng so sánh mặt bằng tại `sosanh.html`.
- [x] Xác thực người dùng (Firebase Auth + đồng bộ PostgreSQL).
- [x] Giao diện quản lý tin đăng tại `quanly.html` đã đồng bộ với PostgreSQL.
- [x] Chatbot hỗ trợ tìm kiếm (tích hợp Dify AI).
- [x] Admin Dashboard (`admin.html`) thống kê, quản lý người dùng, bài đăng, liên hệ và phản hồi.
- [x] Tư vấn AI và chỉ đường trên trang chi tiết mặt bằng.
- [x] Tính năng liên hệ, đánh giá (reviews) hoạt động thực tế với Database.

### 2.2 Backend

- [x] Server Node.js + Express.
- [x] Kết nối CSDL PostgreSQL đầy đủ các bảng (`listings`, `users`, `reviews`, `search_history`, `compare_list`, `contacts`, `feedbacks`...).
- [x] API danh sách và CRUD listing hoàn chỉnh.
- [x] API lịch sử tìm kiếm và so sánh.
- [x] API đánh giá (review), liên hệ, phản hồi.
- [x] API cho Admin Dashboard (phân tích cảm xúc AI, duyệt/từ chối bài đăng, thống kê).
- [x] Đồng bộ user Firebase lên PostgreSQL và middleware xác thực bằng JWT (phân quyền 3 cấp).

## 3. Chưa xong / cần hoàn thiện (Chuẩn bị bảo vệ)

- [ ] Bổ sung các tính năng nâng cao (AI Advisor, Sentiment Analysis, Chatbot Dify, Admin Dashboard...) vào báo cáo để lấy điểm cộng.
- [ ] Hoàn tất tài liệu ERD/UML phù hợp với cơ sở dữ liệu hiện tại.
- [ ] Chuẩn bị slide bảo vệ và kịch bản demo (nhấn mạnh các luồng chính: Tìm kiếm, Bản đồ, So sánh, Đăng tin, AI, Admin).

## 4. Gợi ý tiếp theo

- Rà soát lại toàn bộ UI/UX (test thử các chức năng từ góc nhìn người dùng chưa biết gì về hệ thống).
- Viết kịch bản test (Test cases) cho buổi bảo vệ.
- Test cẩn thận việc chạy qua Cloudflare Tunnel để đảm bảo ổn định lúc demo, hoặc quay video demo dự phòng.

---


