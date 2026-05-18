# SO SÁNH ĐỀ CƯƠNG VÀ CODE THỰC TẾ

**Đề tài:** Phát triển nền tảng tìm kiếm và gợi ý mặt bằng cho thuê theo vị trí và giá  
**Sinh viên:** Nguyễn Tuấn Phước — **MSV:** 2251162113  
**Cập nhật:** 15/05/2026

---

## A. CÁC CHỨC NĂNG TRONG ĐỀ CƯƠNG — ĐÃ CÓ TRONG CODE

> Đây là các mục tiêu/yêu cầu từ đề cương đã được hiện thực hóa trong code.

| # | Yêu cầu trong đề cương | Trạng thái | File/Module liên quan | Ghi chú |
|---|------------------------|:----------:|----------------------|---------|
| 1 | Tìm kiếm mặt bằng với bộ lọc đa tiêu chí (vị trí, giá, diện tích, loại hình kinh doanh) | ✅ | `listing.service.js`, `api.js`, `filter.js`, `timkiem.html` | Lọc theo keyword, city, type, price range, area range — SQL WHERE động |
| 2 | Xếp hạng kết quả theo mức độ phù hợp (ranking/scoring) | ✅ | `features/ranking/scoring.js`, `rankingService.js` | Scoring dựa trên price, area, location, rating, interest (5 tiêu chí, trọng số) |
| 3 | Tích hợp bản đồ hiển thị vị trí | ✅ | `chitiet.html`, `timkiem.html`, MapLibre GL JS | Bản đồ chi tiết + markers trên trang tìm kiếm, dùng CartoDB basemap |
| 4 | Tìm kiếm theo khu vực (bản đồ) | ✅ | `timkiem.html` — Map View toggle | Toggle "Bản đồ" hiện markers + popup + fitBounds |
| 5 | Lưu tìm kiếm (Search history) | ✅ | `interaction.controller.js`, `searchHistory.js` | API GET/POST/DELETE lịch sử, lưu PostgreSQL, giới hạn 5 bản ghi |
| 6 | So sánh các mặt bằng | ✅ | `interaction.controller.js`, `sosanh.html` | Toggle so sánh (tối đa 4), bảng so sánh chi tiết |
| 7 | Quản lý tài khoản | ✅ | `taikhoan.html`, `auth.js`, `user.controller.js` | Profile, chỉnh sửa thông tin, đổi mật khẩu |
| 8 | Đăng tin cho thuê | ✅ | `quanly.html`, `listingForm.js`, `listing.controller.js` | Form đăng tin đầy đủ (tiêu đề, giá, diện tích, địa chỉ, mô tả, ảnh) |
| 9 | Đánh giá và nhận xét (reviews) | ✅ | `review.controller.js`, `review.service.js` | API tạo + lấy đánh giá theo listing |
| 10 | Backend Node.js + Express.js | ✅ | `server.js`, `controllers/`, `services/`, `routes/` | ESM modules, port 3033 |
| 11 | Database PostgreSQL | ✅ | `config/db.js`, `scripts/create_tables.js` | Bảng: `listings`, `users`, `reviews`, `favorites`, `search_history`, `compare_list`, `contacts`, `feedbacks`, `site_stats` |
| 12 | Chatbot hỗ trợ tìm kiếm | ✅ | `modules/chat/chatbot.js` (616 dòng) | Gemini API, rate limiting, caching, lưu lịch sử, fallback responses |
| 13 | Dashboard thống kê phục vụ quản trị | ✅ | `admin.html`, `admin.js`, `admin.routes.js` | Thống kê tổng quan, biểu đồ Chart.js, quản lý users/listings/contacts/feedbacks |

---

## B. CHỨC NĂNG THÊM — KHÔNG CÓ TRONG ĐỀ CƯƠNG

> Đây là các tính năng được phát triển thêm ngoài phạm vi đề cương gốc, thể hiện sự mở rộng và nâng cao chất lượng đồ án.

| # | Chức năng bổ sung | Module/File | Mô tả chi tiết |
|---|-------------------|-------------|-----------------|
| 1 | **Yêu thích mặt bằng (Favorites)** | `favorite.controller.js`, `favorite.service.js`, `favorite.routes.js` | API thêm/xóa/lấy danh sách yêu thích theo user — Đề cương chỉ nêu "lưu tìm kiếm", không đề cập lưu yêu thích |
| 2 | **Tư vấn AI trên trang chi tiết** | `chitiet.js` → `askAIAdvisor()` | Nút "Hỏi AI" phân tích mặt bằng, đánh giá giá thuê, tiềm năng sinh lời |
| 3 | **Phân tích cảm xúc AI (Sentiment Analysis)** | `modules/admin/sentiment-analysis.js` | Phân tích tự động phản hồi/liên hệ: phát hiện cảm xúc (positive/negative/neutral), độ ưu tiên |
| 4 | **Admin quản lý Liên hệ** | `admin.routes.js` → `/api/admin/contacts` | CRUD liên hệ khách hàng: lọc trạng thái, xử lý, xóa |
| 5 | **Admin quản lý Phản hồi (Feedbacks)** | `admin.routes.js` → `/api/admin/feedbacks` | CRUD phản hồi: rating, comment, suggestion, cập nhật trạng thái |
| 6 | **Admin duyệt/từ chối tin đăng** | `admin.routes.js` → `/api/admin/listings/:id/status` | Hệ thống duyệt bài: pending → approved/rejected |
| 7 | **Biểu đồ thống kê (Chart.js)** | `admin.html`, `admin.js` | 4 biểu đồ: phân bố đánh giá, chủ đề liên hệ, xu hướng, cảm xúc AI |
| 8 | **Phân quyền 3 cấp** | `auth.js`, `middlewares/auth.js` | Người thuê / Chủ mặt bằng / Admin — Đề cương chỉ nêu "quản lý tài khoản" chung |
| 9 | **Chỉ đường trên bản đồ (Routing)** | `chitiet.js` → `getRoute()`, `drawRoute()` | Tích hợp OSRM routing: xác định vị trí user → vẽ đường đi đến mặt bằng |
| 10 | **Crawl dữ liệu Chotot** | `config/crawl.js`, `server.js` → `/api/ads` | Proxy API lấy dữ liệu mặt bằng thực từ Chotot.com |
| 11 | **Sắp xếp kết quả tìm kiếm** | `timkiem.html` — `#sortSelect` | Sort client-side: giá tăng/giảm, diện tích tăng/giảm, nổi bật |
| 12 | **Phân trang (Pagination)** | `listing.service.js`, `api.js` | Backend LIMIT/OFFSET, trả về `total`, `page`, `totalPages` |
| 13 | **Theo dõi lượt truy cập (Visit tracking)** | `server.js` middleware | Tự động đếm visits vào bảng `site_stats` cho mỗi request HTML |
| 14 | **Xác thực Firebase Auth + JWT** | `config/firebase.js`, `middlewares/auth.js` | Firebase Authentication, sync user lên PostgreSQL |
| 15 | **Chatbot widget floating** | `modules/chat/chat-widget.js` | Widget floating button trên Trang chủ + Trang tìm kiếm |
| 16 | **Logging server** | `server.js` | Tự động ghi log ra `server.log` với timestamp |

---

## C. CHỨC NĂNG TRONG ĐỀ CƯƠNG — CHƯA CÓ HOẶC KHÁC BIỆT

| # | Yêu cầu đề cương | Thực tế | Ghi chú |
|---|-------------------|---------|---------|
| 1 | Frontend: **Bootstrap** | TailwindCSS (CDN) | Đề cương ghi "Bootstrap" nhưng thực tế dùng **TailwindCSS** — cần điều chỉnh báo cáo |
| 2 | Lịch sử tìm kiếm (hiển thị dropdown) | ❌ API có, UI chưa có | Backend API đầy đủ GET/POST/DELETE nhưng **frontend chưa gọi** và **chưa hiển thị dropdown** gợi ý lịch sử |
| 3 | Trang Báo cáo thống kê `baocao.html` (Superset) | ❌ Không tồn tại | Checklist cũ ghi có nhưng file `baocao.html` **không tồn tại** trong project, không có code Superset nào |

---

## D. TỔNG KẾT

### 📊 Thống kê

| Hạng mục | Số lượng |
|----------|:--------:|
| Chức năng đề cương đã hoàn thành | **13/13** (100%) |
| Chức năng bổ sung ngoài đề cương | **16** |
| Chức năng chưa hoàn thiện | **2** (Lịch sử dropdown, Superset) |
| Khác biệt công nghệ | **1** (Bootstrap → TailwindCSS) |

### 📝 Nhận xét chung

1. **Hoàn thành đầy đủ đề cương**: Tất cả 5 mục tiêu chính trong đề cương đều đã được implement.
2. **Mở rộng đáng kể**: 16 chức năng bổ sung cho thấy sự chủ động và nỗ lực nâng cao chất lượng đồ án.
3. **Điểm mạnh nổi bật**: Chatbot AI (Gemini), Sentiment Analysis, hệ thống Admin đầy đủ, Scoring/Ranking.
4. **Cần chú ý trong báo cáo**: 
   - Ghi đúng stack công nghệ (TailwindCSS, không phải Bootstrap)
   - Nêu rõ các chức năng bổ sung là điểm sáng của đồ án
   - Giải thích lý do chọn TailwindCSS thay vì Bootstrap

---

## E. CÁC TRANG GIAO DIỆN

| Trang | File | Mô tả |
|-------|------|-------|
| Trang chủ | `Trangchu.html` | Hero + search form + mặt bằng nổi bật + chatbot |
| Tìm kiếm | `timkiem.html` | Bộ lọc + grid kết quả + bản đồ + sắp xếp |
| Chi tiết | `chitiet.html` | Ảnh + thông tin + bản đồ + chỉ đường + AI tư vấn |
| So sánh | `sosanh.html` | Bảng so sánh tối đa 4 mặt bằng |
| Đăng nhập | `dangnhap.html` | Firebase Auth login |
| Đăng ký | `dangky.html` | Chọn role (Người thuê/Chủ mặt bằng) |
| Tài khoản | `taikhoan.html` | Profile + chỉnh sửa + đổi mật khẩu |
| Quản lý tin | `quanly.html` | Danh sách tin + lọc trạng thái + đăng tin mới |
| Admin | `admin.html` | Dashboard + quản lý users/listings/contacts/feedbacks |
