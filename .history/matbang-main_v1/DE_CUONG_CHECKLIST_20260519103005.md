# Checklist đối chiếu đề cương

## 1. Mục tiêu đề cương

- [x] Hệ thống tìm kiếm mặt bằng cho thuê trực tuyến với bộ lọc đa tiêu chí (vị trí, giá, diện tích, loại hình kinh doanh).
- [x] Nâng cao độ chính xác tìm kiếm qua cơ chế lọc và xếp hạng kết quả phù hợp.
- [x] Tích hợp bản đồ để hiển thị vị trí và hỗ trợ tìm kiếm theo khu vực.
- [x] Xây dựng chức năng lưu tìm kiếm và so sánh các mặt bằng.
- [x] Xây dựng hệ thống quản lý tài khoản và đăng tin cho thuê.
- [ ] Xây dựng chức năng đánh giá và nhận xét đầy đủ.
- [ ] Hoàn thiện báo cáo, slide và chuẩn bị bảo vệ (không thể đánh giá từ mã nguồn).

## 2. Những gì đã làm được trong mã nguồn

### 2.1 Frontend

- [x] Trang chủ `Trangchu.html` có giao diện tìm kiếm chuyên nghiệp với bộ lọc:
  - Thành phố, quận, địa chỉ.
  - Loại hình kinh doanh (Văn phòng, Cửa hàng, Kho xưởng,...).
  - Mức giá và diện tích.
- [x] Trang kết quả tìm kiếm `timkiem.html` có:
  - MapLibre bản đồ (`maplibre-gl`) để hiển thị vị trí.
  - Bộ lọc chi tiết, reset filter, sort và pagination cơ bản.
  - Lưu lịch sử tìm kiếm vào backend qua `/api/interactions/history`.
- [x] Chức năng so sánh mặt bằng:
  - Frontend hiển thị thanh so sánh.
  - Trang `sosanh.html` lấy danh sách so sánh từ `/api/interactions/compare`.
- [x] Chức năng yêu thích / favorites:
  - Trang tài khoản `taikhoan.html` hiển thị danh sách favorite.
  - Backend có API `/api/favorites`.
- [x] Xác thực người dùng:
  - Firebase Auth trên frontend trong `FE/js/modules/auth/auth.js`.
  - `verifyToken` middleware backend kiểm tra token Firebase.
- [x] Giao diện quản lý tin đăng là `quanly.html` và có các module liên quan.
- [x] Chatbot widget đã được đưa vào giao diện.
- [x] Có admin panel và dashboard trong `FE/js/views/admin.html`.

### 2.2 Backend

- [x] Server Node.js + Express (`BE/server.js`).
- [x] Kết nối PostgreSQL qua `BE/config/db.js`.
- [x] API danh sách và CRUD listing (`BE/routes/listing.routes.js`).
- [x] API lịch sử tìm kiếm và compare list (`BE/routes/interaction.routes.js`).
- [x] API favorite (`BE/routes/favorite.routes.js`).
- [x] Đồng bộ user Firebase lên PostgreSQL (`BE/routes/user.routes.js`, `BE/controllers/user.controller.js`).
- [x] Middleware xác thực token Firebase (`BE/middlewares/auth.js`).

## 3. Chưa xong / cần hoàn thiện

- [ ] Hệ thống đánh giá và nhận xét chưa đủ:
  - Có route `BE/routes/review.routes.js`, nhưng frontend không gọi API review rõ ràng.
  - Trang chi tiết `chitiet.html` chỉ hiển thị rating nếu có, chưa có UI thêm review.
- [ ] Quản lý tài khoản / đăng tin cho thuê cần kiểm tra kỹ:
  - Backend có route tạo listing và update/delete listing.
  - Chưa thấy UI đăng tin mới rõ ràng trong code đọc nhanh.
- [ ] Backend và frontend dùng hybrid:
  - Frontend có nguồn dữ liệu từ `/api/ads` (Chotot public API) và từ `/api/listings`.
  - Proposal đề cập PostgreSQL; thực tế có PostgreSQL nhưng vẫn dùng external ads API làm dữ liệu listing.
- [ ] Tài liệu đề cương (UML, ERD, báo cáo) không có trong repo.
- [ ] Nếu tính năng per-user review/rating cần hoàn chỉnh, hiện đang thiếu luồng tạo/hiển thị/truy vấn review đầy đủ.
- [ ] Chưa rõ chức năng dashboard thống kê dữ liệu có hoạt động đầy đủ do chưa kiểm tra kỹ admin backend.

## 4. Gợi ý tiếp theo

- Hoàn thiện API review và kết nối với frontend chi tiết.
- Kiểm tra lại form đăng tin / quản lý tin đăng trong `quanly.html`.
- Hoàn tất tài liệu ERD/UML và báo cáo để trùng với đề cương.
- Test lại flow đăng nhập, đăng ký, lưu lịch sử tìm kiếm, so sánh và favorites.
- Nếu cần, làm rõ dữ liệu listing chủ yếu từ Chotot API hay PostgreSQL nội bộ.

---

> File này tạo ra từ việc đối chiếu đề cương `333_DeCuong_DATN_NguyenTuanPhuoc.docx` với mã nguồn trong `matbang-main_v1`.
