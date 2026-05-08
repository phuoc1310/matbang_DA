# BẢNG KIỂM TRA TIẾN ĐỘ ĐỒ ÁN TỐT NGHIỆP

Đề cương "Phát triển nền tảng tìm kiếm và gợi ý mặt bằng cho thuê theo vị trí và giá" và mã nguồn hiện tại, dưới đây là danh sách các công việc đã hoàn thành và chưa hoàn thành:

## 1. Nền tảng tìm kiếm và lọc mặt bằng
- [x] Xây dựng giao diện tìm kiếm (`timkiem.html`).
- [x] Tích hợp bộ lọc đa tiêu chí (vị trí, khoảng giá, diện tích, loại hình, tiện ích).
- [x] Xử lý tìm kiếm thông qua API và đọc tham số từ URL Params.
- [ ] Hoàn thiện cơ chế xếp hạng kết quả theo mức độ phù hợp (hiện tại phần UI "Sắp xếp theo Nổi bật nhất" đang ở dạng giao diện).

## 2. Bản đồ và vị trí
- [x] Tích hợp bản đồ vào trang chi tiết mặt bằng (sử dụng MapLibre trong `chitiet.html`).
- [x] Nút chức năng chỉ đường cho người dùng.
- [x] Tích hợp bản đồ hiển thị nhiều kết quả trực tiếp ở trang tìm kiếm (tìm kiếm theo khu vực trên map).

## 3. Lưu trữ và So sánh
- [x] Khởi tạo API cho tính năng yêu thích (`favorite.controller.js`).
- [x] Xây dựng chức năng lưu lịch sử tìm kiếm cho người dùng.
- [x] Xây dựng chức năng so sánh nhiều mặt bằng với nhau trên giao diện.

## 4. Quản lý tài khoản và Đăng tin
- [x] Đăng nhập, đăng ký và quản lý tài khoản (`dangnhap.html`, `dangky.html`, `taikhoan.html`).
- [x] Phân quyền người dùng (Người thuê, Chủ mặt bằng, Admin).
- [x] Giao diện quản lý tin đăng cá nhân (`quanly.html`), hỗ trợ trạng thái (chờ duyệt, đã duyệt, từ chối).
- [x] Chức năng thêm/sửa/xóa tin đăng cho người dùng.

## 5. Dashboard Quản trị viên (Admin)
- [x] Xây dựng Dashboard cho Admin (`admin.html`).
- [x] Thống kê tổng quan (liên hệ, phản hồi, tỷ lệ giải quyết, điểm đánh giá).
- [x] Biểu đồ phân bố (sử dụng Chart.js).
- [x] Chức năng quản lý danh sách người dùng, liên hệ và phản hồi.

## 6. Đánh giá và Chatbot/AI
- [x] Chức năng đánh giá và nhận xét mặt bằng (đã có API `review.controller.js`).
- [x] Tích hợp "Tư vấn AI" vào trang chi tiết (`askAIAdvisor`), hỗ trợ phân tích sự phù hợp của mặt bằng dựa trên Dify/n8n.
- [x] Mở rộng Chatbot để hỗ trợ tìm kiếm ngay từ trang chủ.

## 7. Cấu trúc hệ thống & Công nghệ
- [x] Giao diện (Frontend) xây dựng bằng HTML, JavaScript và TailwindCSS (Lưu ý: Đề cương ghi Bootstrap nhưng mã nguồn thực tế đang sử dụng TailwindCSS, đây là một điểm cần điều chỉnh trong báo cáo).
- [x] Hệ thống Backend sử dụng Node.js & Express.
- [x] Kết nối cơ sở dữ liệu và xác thực (Sử dụng Firebase và PostgreSQL).

## Tổng kết
- **Hoàn thành:** Phần lớn các tính năng cốt lõi (Giao diện, Tìm kiếm đa tiêu chí, Quản lý tài khoản, Đăng tin, Admin Dashboard) đã được hoàn thiện.
- **Cần tập trung:**
  - Hoàn thiện chức năng so sánh mặt bằng.
  - Hoàn thiện chức năng lưu tìm kiếm.
  - Map view (Hiển thị kết quả dạng bản đồ ở trang tìm kiếm).

---

## Gợi ý hướng triển khai (Hoàn thiện mã nguồn)

Dưới đây là các gợi ý kỹ thuật để bạn có thể hoàn thành những tính năng còn thiếu:

### 1. Chức năng So sánh mặt bằng
- **UI:** Thêm nút "So sánh" (icon cân) trên mỗi thẻ mặt bằng. Khi click, lưu mảng ID các mặt bằng đã chọn vào `localStorage` (ví dụ: `localStorage.setItem('compare_list', JSON.stringify(ids))`). Hiển thị một thanh thông báo (Floating Bar) "Đang chọn X/4 mặt bằng - Bấm để so sánh".
- **Logic:** Tạo file `sosanh.html`. Khi trang load, đọc mảng ID từ `localStorage`, gọi API (ví dụ `GET /api/properties?ids=1,2,3`) lấy dữ liệu chi tiết của từng mặt bằng và hiển thị dưới dạng bảng (Table) để so sánh các tiêu chí: Giá, Diện tích, Vị trí, Tiện ích cạnh nhau.

### 2. Bản đồ hiển thị nhiều kết quả ở trang tìm kiếm (Map View)
- **UI:** Tại `timkiem.html`, thêm nút Toggle chuyển đổi giữa "Chế độ Danh sách" và "Chế độ Bản đồ" (hoặc chia nửa màn hình).
- **Logic:** Tái sử dụng thư viện `MapLibre` đã dùng ở `chitiet.html`. Khi gọi API tìm kiếm thành công và trả về danh sách các mặt bằng, lặp qua mảng này, lấy tọa độ (`lat`, `lng`) của từng mặt bằng để vẽ các Marker lên bản đồ. Khi click vào Marker, hiện Popup chứa thông tin ngắn gọn của mặt bằng đó kèm link tới trang chi tiết.

### 3. Lưu lịch sử tìm kiếm cho người dùng
- **UI & Logic:** Có thể làm cách đơn giản nhất là dùng `localStorage`. Khi người dùng thực hiện một tìm kiếm (submit form ở `Trangchu.html` hoặc `timkiem.html`), lưu các tham số tìm kiếm (keyword, city, price...) thành một object vào mảng `search_history` trong `localStorage`.
- Tại ô tìm kiếm ở Trang chủ, khi người dùng click vào input, lấy `search_history` từ `localStorage` và hiển thị một danh sách dropdown "Tìm kiếm gần đây". Người dùng click vào sẽ chuyển hướng sang trang tìm kiếm với các tham số tương ứng.

### 4. Cơ chế xếp hạng và sắp xếp kết quả (Sắp xếp theo nổi bật, giá...)
- **UI:** Gắn sự kiện `onchange` vào ô select "Sắp xếp theo" trong `timkiem.html`. Khi thay đổi, cập nhật URL (ví dụ: thêm `&sort=price_asc`) và gọi lại hàm fetch tìm kiếm.
- **Backend:** Tại API lấy danh sách mặt bằng, nhận tham số `sort` từ request query. Dựa vào đó, thêm mệnh đề `ORDER BY` trong SQL (ví dụ: `ORDER BY price ASC` cho Giá thấp-cao, `ORDER BY created_at DESC` cho Mới nhất) trước khi trả dữ liệu về Frontend.

### 5. Mở rộng Chatbot ở trang chủ
- **UI:** Thêm một bong bóng chat (Floating Button) ở góc dưới cùng bên phải của `Trangchu.html` (và các trang khác nếu cần). Khi click vào sẽ mở ra cửa sổ chat mini.
- **Logic:** Sử dụng lại luồng API kết nối với Dify/n8n đã làm ở Tư vấn AI. Thiết lập prompt hệ thống để Chatbot có thể hiểu ý định tìm kiếm (VD: "Tìm cho tôi mặt bằng 10 triệu ở Quận 3"), sau đó chatbot gọi thẳng tới API tìm kiếm và trả về câu trả lời chứa link danh sách mặt bằng phù hợp.
