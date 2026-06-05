# BẢNG ĐÁNH GIÁ TIẾN ĐỘ THỰC HIỆN DỰ ÁN (CHECKLIST)

Bảng dưới đây liệt kê chi tiết các hạng mục công việc, chức năng dựa trên cơ sở dữ liệu và mã nguồn thực tế của dự án. Checklist này được thiết kế để dễ dàng đối chiếu và đưa vào báo cáo đồ án (Word).

## 1. Giao diện người dùng (Frontend)

- [x] **Trang chủ (`Trangchu.html`):** Giao diện chuyên nghiệp, tích hợp thanh tìm kiếm và bộ lọc nhanh.
- [x] **Trang tìm kiếm & Bản đồ (`timkiem.html`):** Hiển thị danh sách kết quả, bộ lọc nâng cao (vị trí, giá, diện tích, loại hình) và tích hợp bản đồ (MapLibre).
- [x] **Trang chi tiết mặt bằng (`chitiet.html`):** Hiển thị đầy đủ thông tin, hình ảnh, tiện ích, bản đồ chỉ đường, và đánh giá.
- [x] **Trang so sánh (`sosanh.html`):** Tính năng thêm các mặt bằng vào danh sách và so sánh trực quan các thông số.
- [x] **Trang tài khoản (`taikhoan.html`):** Quản lý thông tin cá nhân và xem danh sách mặt bằng đã lưu (Favorites).
- [x] **Trang quản lý tin đăng (`quanly.html`):** Cho phép người dùng (chủ nhà) đăng tin mới, sửa, xóa và quản lý trạng thái tin đăng.
- [x] **Trang quản trị viên (`admin.html`):** Bảng điều khiển (Dashboard) thống kê dữ liệu, duyệt tin đăng, quản lý người dùng và phản hồi.
- [x] **Xác thực người dùng (`dangnhap.html`, `dangky.html`):** Đăng ký, đăng nhập với Firebase Auth.

## 2. Xử lý logic & API (Backend - Node.js/Express)

- [x] **API User (`user.controller.js`):** Xử lý đăng nhập, đồng bộ user từ Firebase sang PostgreSQL, phân quyền JWT.
- [x] **API Listing (`listing.controller.js`):** Thêm, sửa, xóa, lấy danh sách mặt bằng, và lọc dữ liệu đa tiêu chí.
- [x] **API Favorite (`favorite.controller.js`):** Thêm/xóa mặt bằng khỏi danh sách yêu thích của người dùng.
- [x] **API Review (`review.controller.js`):** Chức năng người dùng đánh giá, bình luận và chấm điểm mặt bằng.
- [x] **API Admin (`admin.controller.js`):** Thống kê số liệu, duyệt/từ chối bài đăng, phân tích đánh giá, quản lý tài khoản.
- [x] **API Tương tác (`interaction.controller.js`):** Lưu trữ lịch sử tìm kiếm, danh sách so sánh và xử lý các phản hồi (feedbacks), liên hệ (contacts).
- [x] **API Chat/AI (`chat.controller.js`):** Tích hợp Chatbot Dify để tư vấn, hỗ trợ tìm kiếm bằng AI.

## 3. Cơ sở dữ liệu (PostgreSQL)

- [x] **Bảng `Users` & `Listings`:** Lưu trữ người dùng và tin đăng hoàn chỉnh, có thiết lập quan hệ 1-N.
- [x] **Bảng `Favorites` & `Compare_list`:** Hoạt động tốt cho các tính năng lưu tin và so sánh.
- [x] **Bảng `Reviews` & `Feedbacks` & `Contacts`:** Hỗ trợ tương tác, đánh giá và liên hệ hỗ trợ.
- [x] **Bảng `Search_history` & `Site_stats`:** Lưu lịch sử tìm kiếm để phục vụ gợi ý và thống kê website.

## 4. Các tính năng nổi bật (Dùng để viết điểm nhấn trong Báo cáo)

- [x] **Tích hợp bản đồ số (MapLibre):** Hiển thị trực quan vị trí mặt bằng, hỗ trợ tìm kiếm quanh khu vực và chỉ đường.
- [x] **Trợ lý ảo AI (Chatbot Dify):** Hỗ trợ tư vấn, giải đáp thắc mắc và gợi ý mặt bằng thông minh cho người dùng.
- [x] **Bảo mật và Xác thực:** Sử dụng Firebase Auth kết hợp với PostgreSQL và JSON Web Token (JWT) cho xác thực API.
- [x] **Hệ thống phân quyền (Role-based):** Người thuê, Chủ nhà, Quản trị viên (Admin).

## 5. Những hạng mục chưa làm / Cần hoàn thiện (Để phát triển tiếp)

- [ ] **Kiểm thử tự động (Unit Test / Integration Test):** Cần cấu trúc lại các file test rời rạc (`test_*.js`) thành một test suite bài bản (VD: Jest, Mocha).

- [ ] **Hoàn thiện Word/Báo cáo:** Chụp ảnh màn hình các chức năng đã làm, vẽ lại Biểu đồ Use Case, ERD, Sequence Diagram cho khớp với code hiện tại.
