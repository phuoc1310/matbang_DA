# SO SÁNH ĐỀ CƯƠNG VÀ CODE THỰC TẾ

**Đề tài:** Phát triển nền tảng tìm kiếm và gợi ý mặt bằng cho thuê theo vị trí và giá  
**Sinh viên:** Nguyễn Tuấn Phước — **MSV:** 2251162113  
**Cập nhật:** 19/05/2026

---

## A. CÁC CHỨC NĂNG TRONG ĐỀ CƯƠNG — ĐÃ CÓ TRONG CODE

> Đây là các mục tiêu/yêu cầu từ đề cương đã được hiện thực hóa trong code.

| # | Yêu cầu trong đề cương | Trạng thái | File/Module liên quan | Ghi chú |
|---|------------------------|:----------:|----------------------|---------|
| 1 | Tìm kiếm mặt bằng với bộ lọc đa tiêu chí (vị trí, giá, diện tích, loại hình kinh doanh) | ✅ | `BE/services/listing.service.js`, `FE/js/services/api.js`, `FE/js/views/timkiem.html` | Lọc theo keyword, city, type, price range, area range — SQL WHERE động |
| 2 | Xếp hạng kết quả theo mức độ phù hợp (ranking/scoring) | ✅ | `BE/features/ranking/scoring.js`, `FE/js/services/rankingService.js` | Scoring dựa trên price, area, location, rating, interest (5 tiêu chí, trọng số) |
| 3 | Tích hợp bản đồ hiển thị vị trí | ✅ | `FE/js/views/chitiet.html`, `FE/js/views/timkiem.html`, MapLibre GL JS | Bản đồ chi tiết + markers trên trang tìm kiếm, dùng CartoDB basemap |
| 4 | Tìm kiếm theo khu vực (bản đồ) | ✅ | `FE/js/views/timkiem.html` — Map View toggle | Toggle "Bản đồ" hiện markers + popup + fitBounds |
| 5 | Lưu tìm kiếm (Search history) | ✅ | `BE/controllers/interaction.controller.js`, `FE/js/modules/search/searchHistory.js` | API GET/POST/DELETE lịch sử, lưu PostgreSQL, giới hạn 5 bản ghi. Đã hoàn thiện UI Dropdown. |
| 6 | So sánh các mặt bằng | ✅ | `BE/controllers/interaction.controller.js`, `FE/js/views/sosanh.html` | Toggle so sánh (tối đa 4), bảng so sánh chi tiết |
| 7 | Quản lý tài khoản | ✅ | `FE/js/views/taikhoan.html`, `FE/js/config/firebase.js`, `BE/controllers/user.controller.js` | Profile, chỉnh sửa thông tin, đổi mật khẩu |
| 8 | Đăng tin cho thuê | ✅ | `FE/js/views/quanly.html`, `FE/js/modules/listing/listingForm.js`, `BE/controllers/listing.controller.js` | Form đăng tin đầy đủ (tiêu đề, giá, diện tích, địa chỉ, mô tả, ảnh). Đã đồng bộ ID người dùng với DB. |
| 9 | Đánh giá và nhận xét (reviews) | ✅ | `BE/controllers/review.controller.js`, `BE/services/review.service.js` | API tạo + lấy đánh giá theo listing |
| 10 | Backend Node.js + Express.js | ✅ | `BE/server.js`, `BE/controllers/`, `BE/services/`, `BE/routes/` | ESM modules, port 3033, phân tách thư mục `FE` và `BE` rõ ràng |
| 11 | Database PostgreSQL | ✅ | `BE/config/db.js` | Bảng: `listings`, `users`, `reviews`, `favorites`, `search_history`, `compare_list`, `contacts`, `feedbacks`, `site_stats` |
| 12 | Chatbot hỗ trợ tìm kiếm | ✅ | `BE/controllers/chat.controller.js`, `FE/js/modules/chat/chat-widget.js` | Đã thay thế Gemini bằng Dify API. Có widget floating gọi API proxy nội bộ bảo mật |
| 13 | Dashboard thống kê phục vụ quản trị | ✅ | `FE/js/views/admin.html`, `FE/js/pages/admin.js`, `BE/routes/admin.routes.js` | Thống kê tổng quan, biểu đồ Chart.js, quản lý users/listings/contacts/feedbacks |

---

## B. CHỨC NĂNG THÊM — KHÔNG CÓ TRONG ĐỀ CƯƠNG

> Đây là các tính năng được phát triển thêm ngoài phạm vi đề cương gốc, thể hiện sự mở rộng và nâng cao chất lượng đồ án.

| # | Chức năng bổ sung | Module/File | Mô tả chi tiết |
|---|-------------------|-------------|-----------------|
| 1 | **Yêu thích mặt bằng (Favorites)** | `BE/controllers/favorite.controller.js`, `BE/routes/favorite.routes.js` | API thêm/xóa/lấy danh sách yêu thích theo user — Đề cương chỉ nêu "lưu tìm kiếm", không đề cập lưu yêu thích |
| 2 | **Tư vấn AI trên trang chi tiết** | `FE/js/pages/chitiet.js` → `askAIAdvisor()` | Nút "Hỏi AI" phân tích mặt bằng, đánh giá giá thuê, tiềm năng sinh lời |
| 3 | **Phân tích cảm xúc AI (Sentiment Analysis)** | `FE/js/modules/admin/sentiment-analysis.js` | Phân tích tự động phản hồi/liên hệ: phát hiện cảm xúc (positive/negative/neutral), độ ưu tiên |
| 4 | **Admin quản lý Liên hệ** | `BE/routes/admin.routes.js` → `/api/admin/contacts` | CRUD liên hệ khách hàng: lọc trạng thái, xử lý, xóa |
| 5 | **Admin quản lý Phản hồi (Feedbacks)** | `BE/routes/admin.routes.js` → `/api/admin/feedbacks` | CRUD phản hồi: rating, comment, suggestion, cập nhật trạng thái |
| 6 | **Admin duyệt/từ chối tin đăng** | `BE/routes/admin.routes.js` → `/api/admin/listings/:id/status` | Hệ thống duyệt bài: pending → approved/rejected |
| 7 | **Biểu đồ thống kê (Chart.js)** | `FE/js/views/admin.html`, `FE/js/pages/admin.js` | 4 biểu đồ: phân bố đánh giá, chủ đề liên hệ, xu hướng, cảm xúc AI |
| 8 | **Phân quyền 3 cấp** | `FE/js/config/firebase.js`, `BE/middlewares/auth.js` | Người thuê / Chủ mặt bằng / Admin — Đề cương chỉ nêu "quản lý tài khoản" chung |
| 9 | **Chỉ đường trên bản đồ (Routing)** | `FE/js/pages/chitiet.js` → `getRoute()`, `drawRoute()` | Tích hợp OSRM routing: xác định vị trí user → vẽ đường đi đến mặt bằng |
| 10 | **Crawl dữ liệu Chotot** | `BE/config/crawl.js`, `BE/server.js` → `/api/ads` | Proxy API lấy dữ liệu mặt bằng thực từ Chotot.com |
| 11 | **Sắp xếp kết quả tìm kiếm** | `FE/js/views/timkiem.html` — `#sortSelect` | Sort client-side: giá tăng/giảm, diện tích tăng/giảm, nổi bật |
| 12 | **Phân trang (Pagination)** | `BE/services/listing.service.js`, `FE/js/services/api.js` | Backend LIMIT/OFFSET, trả về `total`, `page`, `totalPages` |
| 13 | **Theo dõi lượt truy cập (Visit tracking)** | `BE/server.js` middleware | Tự động đếm visits vào bảng `site_stats` cho mỗi request HTML |
| 14 | **Xác thực Firebase Auth + JWT** | `FE/js/config/firebase.js`, `BE/middlewares/auth.js` | Firebase Authentication, sync user lên PostgreSQL |
| 15 | **Chatbot widget floating (Dify)** | `FE/js/modules/chat/chat-widget.js` | Widget floating button trên Trang chủ + Trang tìm kiếm (tích hợp AI Dify) |
| 16 | **Logging server** | `BE/server.js` | Tự động ghi log ra `server.log` với timestamp |
| 17 | **Tách biệt kiến trúc FE/BE** | Toàn dự án | Dự án được chia thành 2 thư mục Frontend (`FE`) và Backend (`BE`) độc lập, dễ quản lý |
| 18 | **Tích hợp Cloudflare Tunnel** | Root `cloudflared.exe` | Đưa server local lên internet thông qua tunnel bảo mật, không cần deploy VPS |

---

## C. CHỨC NĂNG TRONG ĐỀ CƯƠNG — CHƯA CÓ HOẶC KHÁC BIỆT

| # | Yêu cầu đề cương | Thực tế | Ghi chú |
|---|-------------------|---------|---------|
| 1 | Frontend: **Bootstrap** | TailwindCSS (CDN) | Đề cương ghi "Bootstrap" nhưng thực tế dùng **TailwindCSS** — cần điều chỉnh báo cáo |

---

## D. TỔNG KẾT

### 📊 Thống kê

| Hạng mục | Số lượng |
|----------|:--------:|
| Chức năng đề cương đã hoàn thành | **13/13** (100%) |
| Chức năng bổ sung ngoài đề cương | **18** |
| Khác biệt công nghệ | **1** (Bootstrap → TailwindCSS) |

### 📝 Nhận xét chung

1. **Hoàn thành đầy đủ đề cương**: Tất cả 13 mục tiêu chính trong đề cương đều đã được implement (bao gồm cả Dropdown Lịch sử tìm kiếm).
2. **Mở rộng đáng kể**: 18 chức năng bổ sung cho thấy sự chủ động và nỗ lực nâng cao chất lượng đồ án.
3. **Điểm mạnh nổi bật**: Chatbot AI (Dify API), Sentiment Analysis, hệ thống Admin đầy đủ, Scoring/Ranking, kiến trúc FE/BE chuẩn hóa chuyên nghiệp.
4. **Cần chú ý trong báo cáo**: 
   - Ghi đúng stack công nghệ (TailwindCSS, không phải Bootstrap)
   - Nêu rõ các chức năng bổ sung là điểm sáng của đồ án
   - Giải thích lý do chọn TailwindCSS thay vì Bootstrap

---

## E. CÁC TRANG GIAO DIỆN

| Trang | File | Mô tả |
|-------|------|-------|
| Trang chủ | `FE/js/views/Trangchu.html` | Hero + search form + mặt bằng nổi bật + chatbot |
| Tìm kiếm | `FE/js/views/timkiem.html` | Bộ lọc + grid kết quả + bản đồ + sắp xếp + lịch sử thả xuống |
| Chi tiết | `FE/js/views/chitiet.html` | Ảnh + thông tin + bản đồ + chỉ đường + AI tư vấn |
| So sánh | `FE/js/views/sosanh.html` | Bảng so sánh tối đa 4 mặt bằng |
| Đăng nhập | `FE/js/views/dangnhap.html` | Firebase Auth login |
| Đăng ký | `FE/js/views/dangky.html` | Chọn role (Người thuê/Chủ mặt bằng) |
| Tài khoản | `FE/js/views/taikhoan.html` | Profile + chỉnh sửa + đổi mật khẩu |
| Quản lý tin | `FE/js/views/quanly.html` | Danh sách tin + lọc trạng thái + đăng tin mới (đã đồng bộ ID Postgres) |
| Admin | `FE/js/views/admin.html` | Dashboard + quản lý users/listings/contacts/feedbacks |
