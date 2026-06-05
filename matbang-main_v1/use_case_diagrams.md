# Biểu đồ Tuần tự (Sequence Diagrams) cho 13 Use Cases

Dưới đây là 13 biểu đồ tuần tự tương ứng với 13 chức năng, được thiết kế theo chuẩn UML (Model-View-Controller) bao gồm các thành phần: **Actor** (Người dùng/Admin), **Form** (Giao diện/Boundary), **Control** (Bộ điều khiển/API Controller), và **Entity** (Thực thể/Cơ sở dữ liệu).

---

### 1. Tìm kiếm và Lọc mặt bằng nâng cao
```mermaid
sequenceDiagram
    actor U as Người dùng
    participant F as Form Tìm Kiếm (View)
    participant C as Listing Controller
    participant E as Listing Entity (DB)

    U->>F: Nhập từ khóa, giá, diện tích, vị trí
    F->>F: Xác thực dữ liệu đầu vào
    F->>C: GET /api/listings?query...
    C->>E: Truy vấn danh sách mặt bằng (WHERE)
    E-->>C: Trả về dữ liệu mặt bằng
    C-->>F: JSON Danh sách mặt bằng
    F-->>U: Hiển thị danh sách kết quả
```

---

### 2. Xem bản đồ tương tác (Map View)
```mermaid
sequenceDiagram
    actor U as Người dùng
    participant F as Form Bản Đồ (View/MapLibre)
    participant C as Listing Controller
    participant E as Listing Entity (DB)

    U->>F: Chọn chế độ "Xem bản đồ"
    F->>C: GET /api/listings
    C->>E: Lấy danh sách tọa độ (Lat, Lng)
    E-->>C: Dữ liệu mặt bằng + Tọa độ
    C-->>F: JSON Dữ liệu
    F->>F: Render Markers lên bản đồ
    F-->>U: Hiển thị bản đồ tương tác
    U->>F: Click vào Marker
    F-->>U: Hiển thị Popup chi tiết (Giá, Ảnh)
```

---

### 3. So sánh mặt bằng
```mermaid
sequenceDiagram
    actor U as Người dùng
    participant F as Form So Sánh (View)
    participant C as Interaction Controller
    participant E as Compare Entity (DB)

    U->>F: Chọn "Thêm vào so sánh"
    F->>C: POST /api/interactions/compare
    C->>E: Lưu mặt bằng vào danh sách so sánh
    E-->>C: Xác nhận lưu thành công
    C-->>F: Thành công
    F-->>U: Cập nhật UI (Đã thêm)
    
    U->>F: Truy cập trang So sánh
    F->>C: GET /api/interactions/compare
    C->>E: Lấy thông tin các mặt bằng để đối chiếu
    E-->>C: Dữ liệu đối chiếu
    C-->>F: JSON Dữ liệu
    F-->>U: Hiển thị bảng so sánh chi tiết
```

---

### 4. Xem lịch sử tìm kiếm gần đây
```mermaid
sequenceDiagram
    actor U as Người dùng
    participant F as Form Lịch Sử (View)
    participant C as Interaction Controller
    participant E as History Entity (DB)

    U->>F: Thực hiện tìm kiếm
    F->>C: POST /api/interactions/history
    C->>E: Lưu từ khóa/thông tin tìm kiếm
    E-->>C: Thành công
    
    U->>F: Mở ô tìm kiếm / Xem lịch sử
    F->>C: GET /api/interactions/history
    C->>E: Lấy 5-10 tìm kiếm gần nhất
    E-->>C: Trả về danh sách
    C-->>F: JSON History
    F-->>U: Hiển thị từ khóa gợi ý/gần đây
```

---

### 5. Trò chuyện với Chatbot AI
```mermaid
sequenceDiagram
    actor U as Người dùng
    participant F as Form Chatbot (View)
    participant C as Chat Controller
    participant AI as AI Model / Service (Gemini)

    U->>F: Nhập câu hỏi (Ví dụ: Tìm mặt bằng Quận 1)
    F->>C: POST /api/chat (Message)
    C->>AI: Gửi context hệ thống + câu hỏi
    AI-->>C: Phản hồi từ AI (Text/Danh sách)
    C-->>F: Trả về nội dung phản hồi
    F-->>U: Hiển thị câu trả lời trên khung Chat
```

---

### 6. Xác thực Đăng nhập & Đồng bộ dữ liệu
```mermaid
sequenceDiagram
    actor U as Người dùng
    participant F as Form Đăng Nhập (View)
    participant Auth as Firebase Auth
    participant C as User Controller
    participant E as User Entity (DB)

    U->>F: Đăng nhập Google / Email
    F->>Auth: Xác thực tài khoản
    Auth-->>F: Cấp Token (JWT)
    F->>C: POST /api/users/auth/sync (Kèm Token)
    C->>Auth: Verify Token (Middleware)
    C->>E: Cập nhật/Tạo mới thông tin User
    E-->>C: Trả về User Profile
    C-->>F: Thành công
    F-->>U: Chuyển hướng về trang chủ
```

---

### 7. Quản lý tài khoản cá nhân
```mermaid
sequenceDiagram
    actor U as Người dùng
    participant F as Form Tài Khoản (View)
    participant C as User Controller
    participant E as User Entity (DB)

    U->>F: Vào trang Hồ sơ cá nhân
    F->>C: GET /api/users/profile
    C->>E: Lấy thông tin User
    E-->>C: Dữ liệu cá nhân
    C-->>F: Đổ dữ liệu vào Form
    F-->>U: Hiển thị hồ sơ

    U->>F: Chỉnh sửa thông tin & Lưu
    F->>C: PUT /api/users/profile
    C->>E: Cập nhật bảng Users
    E-->>C: Cập nhật thành công
    C-->>F: Thông báo thành công
    F-->>U: Hiển thị thông báo lưu thành công
```

### 8. Đăng tin cho thuê mặt bằng
```mermaid
sequenceDiagram
    actor U as Chủ Nhà
    participant F as Form Đăng Tin (View)
    participant C as Listing Controller
    participant E as Listing Entity (DB)

    U->>F: Điền thông tin chi tiết, Upload ảnh
    F->>F: Validate Form (Diện tích, Giá, Ảnh...)
    F->>C: POST /api/listings
    C->>C: Upload ảnh lên Cloud (Cloudinary/Firebase)
    C->>E: Tạo Record mới (Trạng thái: Chờ duyệt)
    E-->>C: Listing ID
    C-->>F: Xác nhận tạo thành công
    F-->>U: Hiển thị thông báo "Tin đang chờ duyệt"
```

---

### 9. Quản lý tin đăng cá nhân
```mermaid
sequenceDiagram
    actor U as Chủ Nhà
    participant F as Form Quản Lý Tin (View)
    participant C as Listing Controller
    participant E as Listing Entity (DB)

    U->>F: Truy cập "Tin đăng của tôi"
    F->>C: GET /api/listings?owner_id=X
    C->>E: Lấy các tin thuộc về User X
    E-->>C: Danh sách tin đăng cá nhân
    C-->>F: JSON Danh sách
    F-->>U: Hiển thị danh sách tin (Đang hiển thị/Đang ẩn)

    U->>F: Chọn "Ẩn/Hiện" tin đăng
    F->>C: PATCH /api/listings/:id/visibility
    C->>E: Cập nhật cờ Visibility
    E-->>C: Thành công
    C-->>F: Thành công
    F-->>U: Cập nhật giao diện
```

---

### 10. Viết đánh giá (Reviews) và Đánh giá sao
```mermaid
sequenceDiagram
    actor U as Người dùng
    participant F as Form Đánh Giá (View)
    participant C as Review Controller
    participant E as Review Entity (DB)

    U->>F: Chọn 5 sao và viết Nội dung
    F->>C: POST /api/reviews
    C->>E: Lưu Đánh giá mới (Rating, Comment, ListingID)
    E-->>C: Tạo thành công
    C-->>F: Thành công
    F->>C: GET /api/reviews/:listing_id (Làm mới danh sách)
    C->>E: Lấy lại danh sách reviews
    E-->>C: Data
    C-->>F: JSON Reviews
    F-->>U: Hiển thị đánh giá vừa thêm
```

---

### 11. Dashboard thống kê chuyên sâu
```mermaid
sequenceDiagram
    actor A as Admin
    participant F as Form Dashboard (View)
    participant C as Admin Controller
    participant E as Analytics Entity (DB)

    A->>F: Truy cập Dashboard
    F->>C: GET /api/admin/dashboard/stats
    C->>E: Gọi hàm Aggregate (Tổng Users, Tổng Listings, Doanh thu)
    E-->>C: Trả về số liệu thống kê
    C-->>F: JSON Số liệu tổng hợp
    F->>F: Dựng biểu đồ (Chart.js / Recharts)
    F-->>A: Hiển thị biểu đồ & KPI
```

---

### 12. Quản lý và Phê duyệt tin đăng
```mermaid
sequenceDiagram
    actor A as Admin
    participant F as Form Quản Lý Tin (View)
    participant C as Admin Controller
    participant E as Listing Entity (DB)

    A->>F: Xem danh sách tin Chờ duyệt
    F->>C: GET /api/admin/listings?status=pending
    C->>E: Lấy danh sách tin
    E-->>C: Dữ liệu tin
    C-->>F: JSON Danh sách
    F-->>A: Hiển thị bảng tin chờ duyệt

    A->>F: Click Phê duyệt (Approve)
    F->>C: PATCH /api/admin/listings/:id/status
    C->>E: Update Status = 'approved'
    E-->>C: Cập nhật thành công
    C-->>F: Thành công
    F-->>A: Loại tin khỏi danh sách chờ
```

---

### 13. Quản lý người dùng
```mermaid
sequenceDiagram
    actor A as Admin
    participant F as Form Quản Lý User (View)
    participant C as Admin Controller
    participant E as User Entity (DB)

    A->>F: Truy cập danh sách Người dùng
    F->>C: GET /api/admin/users
    C->>E: Lấy tất cả dữ liệu User
    E-->>C: Dữ liệu
    C-->>F: JSON Danh sách User
    F-->>A: Hiển thị bảng phân quyền
    
    A->>F: Khóa tài khoản (Ban User) hoặc Đổi Role
    F->>C: PUT /api/admin/users/:id/role
    C->>E: Update Role/Status
    E-->>C: Lưu thành công
    C-->>F: Thành công
    F-->>A: Cập nhật dòng dữ liệu User
```
