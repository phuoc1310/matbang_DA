# BẢNG KIỂM TRA TIẾN ĐỘ ĐỒ ÁN TỐT NGHIỆP

**Đề tài:** Phát triển nền tảng tìm kiếm và gợi ý mặt bằng cho thuê theo vị trí và giá  
**Sinh viên:** Nguyễn Tuấn Phước — **Lớp:** 64HTTT3 — **MSV:** 2251162113  
**Cập nhật lần cuối:** 12/05/2026  

---

## 1. Hệ thống Backend (Node.js + Express)

| # | Hạng mục | Trạng thái | Ghi chú |
|---|----------|:----------:|---------|
| 1.1 | Khởi tạo server Express, cấu hình CORS, serve static | ✅ | `server.js` — port 3033 |
| 1.2 | Kết nối PostgreSQL (database chính) | ✅ | `config/db.js` |
| 1.3 | Kết nối Firebase (Auth + Firestore) | ✅ | `config/firebase.js`, `middlewares/firebase.js` |
| 1.4 | API CRUD Listings (`/api/listings`) | ✅ | `listing.controller.js` + `listing.service.js` — Hỗ trợ tạo, lấy danh sách, lấy theo ID, so sánh |
| 1.5 | API lọc đa tiêu chí ở backend (city, price, area, type) | ✅ | `listing.service.js` — `getListings()` xây dựng SQL WHERE động, hỗ trợ alias city (hcm, hn, dn...) |
| 1.6 | API Users (`/api/users`) — sync user từ Firebase | ✅ | `user.controller.js` + `user.service.js` |
| 1.7 | API Reviews (`/api/reviews`) — tạo và lấy đánh giá theo listing | ✅ | `review.controller.js` + `review.service.js` |
| 1.8 | API Favorites (`/api/favorites`) — thêm/xóa/lấy yêu thích | ✅ | `favorite.controller.js` + `favorite.service.js` |
| 1.9 | API Lịch sử tìm kiếm (`/api/interactions/history`) | ✅ | `interaction.controller.js` — GET/POST/DELETE, lưu vào DB PostgreSQL, giới hạn 5 bản ghi |
| 1.10 | API So sánh mặt bằng (`/api/interactions/compare`) | ✅ | `interaction.controller.js` — toggle thêm/xóa, giới hạn tối đa 4 mặt bằng |
| 1.11 | API Admin (`/api/admin`) — quản lý users, cập nhật role, xóa | ✅ | `admin.routes.js` — CRUD users, thay đổi role |
| 1.12 | API Chotot proxy (`/api/ads`) — lấy dữ liệu từ Chotot | ✅ | Inline trong `server.js` |
| 1.13 | Middleware xác thực Firebase JWT | ✅ | `middlewares/auth.js` |
| 1.14 | Phân trang (pagination) ở backend | ✅ | `listing.service.js` — `LIMIT`/`OFFSET`, trả về `total`, `page`, `totalPages` |

---

## 2. Giao diện Frontend (HTML + TailwindCSS + JS)

### 2.1. Trang chủ (`Trangchu.html`)

| # | Hạng mục | Trạng thái | Ghi chú |
|---|----------|:----------:|---------|
| 2.1.1 | Hero section + search form (keyword, city, type, price, area) | ✅ | Form tìm kiếm đầy đủ, chuyển hướng sang `timkiem.html` |
| 2.1.2 | Khám phá theo loại hình (Văn phòng, Cửa hàng, Kho xưởng, Co-working) | ✅ | Có link trực tiếp đến trang tìm kiếm theo loại |
| 2.1.3 | Danh sách mặt bằng nổi bật + phân trang | ✅ | Render từ API Chotot |
| 2.1.4 | Section giới thiệu (Thông tin xác thực, Đánh giá, Hỗ trợ 24/7) | ✅ | |
| 2.1.5 | Footer đầy đủ (links, social, copyright) | ✅ | |
| 2.1.6 | Hiển thị trạng thái đăng nhập (Guest vs User vs Admin) | ✅ | Sử dụng Firebase `onAuthStateChanged`, hiện/ẩn nút Admin Panel, quản lý tin đăng |
| 2.1.7 | Chatbot AI widget trên trang chủ | ✅ | Tích hợp đầy đủ: toggle, gửi tin nhắn, lưu lịch sử |

### 2.2. Trang tìm kiếm (`timkiem.html`)

| # | Hạng mục | Trạng thái | Ghi chú |
|---|----------|:----------:|---------|
| 2.2.1 | Thanh tìm kiếm với debounce (300ms) + clear button | ✅ | |
| 2.2.2 | Bộ lọc sidebar (Khoảng giá, Diện tích, Loại hình, Tiện ích) | ✅ | |
| 2.2.3 | Đọc tham số từ URL params (keyword, city, type) | ✅ | |
| 2.2.4 | Grid hiển thị kết quả + phân trang | ✅ | 3 cột trên desktop, responsive |
| 2.2.5 | Sắp xếp kết quả (giá tăng/giảm, diện tích tăng/giảm, nổi bật) | ✅ | `<select id="sortSelect">` — logic sort client-side hoạt động |
| 2.2.6 | Bản đồ MapLibre hiển thị nhiều kết quả (Map View) | ✅ | Nút toggle "Bản đồ", render markers với popup (ảnh + giá + link chi tiết), fitBounds |
| 2.2.7 | Nút "So sánh" trên mỗi thẻ mặt bằng | ✅ | Nút compare_arrows trên mỗi card, gọi `window.toggleCompare()` |
| 2.2.8 | Chatbot AI widget | ✅ | Giống trang chủ |

### 2.3. Trang chi tiết (`chitiet.html`)

| # | Hạng mục | Trạng thái | Ghi chú |
|---|----------|:----------:|---------|
| 2.3.1 | Hiển thị ảnh chính | ✅ | `#mainImage` — render từ JS |
| 2.3.2 | Tiêu đề, vị trí, giá, diện tích | ✅ | |
| 2.3.3 | Thông tin pháp lý, chiều ngang, chiều dài | ⚠️ | Giao diện có nhưng dữ liệu hiện ở dạng "Đang cập nhật" — chưa có trường dữ liệu tương ứng |
| 2.3.4 | Mô tả chi tiết | ✅ | |
| 2.3.5 | Bản đồ MapLibre + nút chỉ đường (route) | ✅ | Sử dụng OSRM routing |
| 2.3.6 | Sidebar: thông tin chủ mặt bằng + Liên hệ + Đặt lịch xem phòng | ✅ | |
| 2.3.7 | Tư vấn AI (nút "Hỏi AI") | ✅ | Gọi API n8n/Dify — hiện tại placeholder, trả fallback message khi chưa cấu hình |

### 2.4. Trang so sánh (`sosanh.html`)

| # | Hạng mục | Trạng thái | Ghi chú |
|---|----------|:----------:|---------|
| 2.4.1 | Giao diện bảng so sánh (ảnh, tiêu đề, giá, diện tích, vị trí, loại hình, mô tả) | ✅ | |
| 2.4.2 | Lấy danh sách so sánh từ API (`/api/interactions/compare`) | ✅ | |
| 2.4.3 | Nút gỡ bỏ từng mặt bằng khỏi danh sách | ✅ | |
| 2.4.4 | Link sang chi tiết từ mỗi cột | ✅ | |

### 2.5. Đăng nhập / Đăng ký

| # | Hạng mục | Trạng thái | Ghi chú |
|---|----------|:----------:|---------|
| 2.5.1 | Trang đăng nhập (`dangnhap.html`) — Firebase Auth | ✅ | |
| 2.5.2 | Trang đăng ký (`dangky.html`) — chọn role (Người thuê / Chủ mặt bằng) | ✅ | |
| 2.5.3 | Lưu session (`sessionStorage`) + sync user lên PostgreSQL | ✅ | |

### 2.6. Trang tài khoản (`taikhoan.html`)

| # | Hạng mục | Trạng thái | Ghi chú |
|---|----------|:----------:|---------|
| 2.6.1 | Tab "Thông tin cá nhân" — hiển thị profile, VIP status | ✅ | |
| 2.6.2 | Tab "Chỉnh sửa thông tin" — form cập nhật họ tên, SĐT, địa chỉ | ✅ | |
| 2.6.3 | Tab "Đổi mật khẩu" | ✅ | |
| 2.6.4 | Tích hợp thanh toán VIP (PayOS SDK) | ✅ | Load PayOS SDK, có `vip.js` + `payos-demo.js` + `payos-check.js` |
| 2.6.5 | Đăng xuất | ✅ | |

### 2.7. Quản lý tin đăng (`quanly.html`)

| # | Hạng mục | Trạng thái | Ghi chú |
|---|----------|:----------:|---------|
| 2.7.1 | Danh sách tin đăng của người dùng | ✅ | |
| 2.7.2 | Tab lọc theo trạng thái (Tất cả, Chờ duyệt, Đã duyệt, Từ chối) | ✅ | |
| 2.7.3 | Nút "Đăng tin mới" | ✅ | |
| 2.7.4 | Form đăng tin (tiêu đề, giá, diện tích, địa chỉ, mô tả, ảnh) | ✅ | `listingForm.js` |

### 2.8. Admin Dashboard (`admin.html`)

| # | Hạng mục | Trạng thái | Ghi chú |
|---|----------|:----------:|---------|
| 2.8.1 | Sidebar navigation (Dashboard, Người dùng, Liên hệ, Phản hồi) | ✅ | |
| 2.8.2 | Dashboard tổng quan: thẻ thống kê (tổng liên hệ, phản hồi, rating TB, tỷ lệ giải quyết) | ✅ | |
| 2.8.3 | Biểu đồ Chart.js (phân bố đánh giá, chủ đề liên hệ, xu hướng, cảm xúc AI) | ✅ | 4 biểu đồ |
| 2.8.4 | Insights bổ sung (Top issues, Hoạt động gần đây, Thời gian phản hồi) | ✅ | |
| 2.8.5 | Quản lý danh sách người dùng + search + filter (role) | ✅ | |
| 2.8.6 | Modal xem chi tiết / chỉnh sửa / cấp quyền / xóa người dùng | ✅ | |
| 2.8.7 | Quản lý liên hệ + lọc trạng thái | ✅ | |
| 2.8.8 | Quản lý phản hồi + lọc trạng thái | ✅ | |
| 2.8.9 | Phân tích cảm xúc AI (sentiment analysis) | ✅ | `sentiment-analysis.js` |

### 2.9. Trang Báo cáo thống kê (`baocao.html`)

| # | Hạng mục | Trạng thái | Ghi chú |
|---|----------|:----------:|---------|
| 2.9.1 | Tích hợp Apache Superset Embedded Dashboard | ✅ | Embed SDK + gọi `/api/superset-token` |

---

## 3. Tính năng nâng cao

| # | Hạng mục | Trạng thái | Ghi chú |
|---|----------|:----------:|---------|
| 3.1 | Chatbot AI (Gemini API) | ✅ | `chatbot.js` (616 dòng) — Tích hợp Gemini API qua backend proxy, fallback responses thông minh, rate limiting, caching, lưu lịch sử chat, setup API Key |
| 3.2 | Chatbot hiện trên cả Trang chủ và Trang tìm kiếm | ✅ | Widget floating button trên `Trangchu.html` + `timkiem.html` |
| 3.3 | Tư vấn AI trên trang chi tiết | ✅ | `askAIAdvisor()` — gọi n8n/Dify webhook (placeholder) |
| 3.4 | Scoring/Ranking mặt bằng (BI Analysis) | ✅ | `features/ranking/scoring.js` + `rankingService.js` — Tính điểm dựa trên price, area, location, rating, interest |
| 3.5 | So sánh mặt bằng (end-to-end) | ✅ | Backend API + UI nút so sánh trên card + Trang `sosanh.html` hiển thị bảng so sánh |
| 3.6 | Lịch sử tìm kiếm (Backend API) | ✅ | API có đầy đủ GET/POST/DELETE, lưu vào DB |
| 3.7 | Lịch sử tìm kiếm (Frontend hiển thị dropdown) | ❌ | **Chưa có giao diện hiển thị lịch sử tìm kiếm gần đây** trên trang chủ/tìm kiếm. API backend đã sẵn sàng nhưng frontend chưa gọi và hiển thị |
| 3.8 | Bản đồ chi tiết (MapLibre) — trang chi tiết | ✅ | Bản đồ + marker + chỉ đường |
| 3.9 | Bản đồ tổng quan (MapLibre) — trang tìm kiếm | ✅ | Toggle Map View + markers + popup + fitBounds |
| 3.10 | Thanh toán VIP (PayOS) | ✅ | Tích hợp SDK + demo mode |
| 3.11 | Phân quyền (Người thuê / Chủ mặt bằng / Admin) | ✅ | Firebase Auth + Firestore + PostgreSQL |

---

## 4. Cấu trúc hệ thống & Công nghệ

| # | Hạng mục | Trạng thái | Ghi chú |
|---|----------|:----------:|---------|
| 4.1 | Frontend: HTML + JavaScript + TailwindCSS (CDN) | ✅ | ⚠️ Đề cương ghi Bootstrap — cần điều chỉnh báo cáo cho khớp thực tế |
| 4.2 | Backend: Node.js + Express.js | ✅ | ESM modules (`"type": "module"`) |
| 4.3 | Database: PostgreSQL | ✅ | Bảng: `listings`, `users`, `reviews`, `favorites`, `search_history`, `compare_list` |
| 4.4 | Authentication: Firebase Auth + Firestore | ✅ | |
| 4.5 | Bản đồ: MapLibre GL JS | ✅ | |
| 4.6 | Biểu đồ: Chart.js | ✅ | |
| 4.7 | Thanh toán: PayOS SDK | ✅ | |
| 4.8 | AI: Google Gemini API | ✅ | |
| 4.9 | BI/Analytics: Apache Superset | ✅ | Embedded dashboard |
| 4.10 | Crawl dữ liệu: Chotot API proxy | ✅ | `config/crawl.js` + `/api/ads` |

---

## 5. Kiểm thử & Triển khai

| # | Hạng mục | Trạng thái | Ghi chú |
|---|----------|:----------:|---------|
| 5.1 | Server chạy ổn định local (`npm run dev`) | ✅ | |
| 5.2 | Scripts hỗ trợ (tạo bảng, kiểm tra DB, tạo admin) | ✅ | `scripts/create_tables.js`, `check_users.js`, `create_admin.js` |
| 5.3 | Kiểm thử chức năng tìm kiếm + lọc | ✅ | |
| 5.4 | Kiểm thử đăng nhập / đăng ký | ✅ | |
| 5.5 | Kiểm thử quản lý tin đăng | ✅ | |
| 5.6 | Viết tài liệu báo cáo đồ án | ❌ | Chưa hoàn thiện |
| 5.7 | Chuẩn bị slide bảo vệ | ❌ | Chưa có |

---

## TỔNG KẾT

### ✅ Đã hoàn thành (chiếm ~95%)
- **Toàn bộ Backend API** đã hoàn thiện: Listings, Users, Reviews, Favorites, Interactions (lịch sử tìm kiếm + so sánh), Admin
- **Toàn bộ giao diện chính**: Trang chủ, Tìm kiếm, Chi tiết, So sánh, Đăng nhập/Đăng ký, Tài khoản, Quản lý tin đăng, Admin Dashboard, Báo cáo
- **Tính năng nâng cao**: Chatbot AI (Gemini), Bản đồ MapLibre (cả chi tiết lẫn tìm kiếm), Scoring/Ranking, So sánh mặt bằng, Sắp xếp kết quả, Phân tích cảm xúc AI

### ❌ Còn thiếu / Cần hoàn thiện
1. **Hoàn thiện báo cáo đồ án** — Viết tài liệu báo cáo, cập nhật stack công nghệ (TailwindCSS thay vì Bootstrap)
2. **Chuẩn bị slide bảo vệ**
