# Kịch Bản Thuyết Trình Bảo Vệ Đồ Án Tốt Nghiệp: Hệ Thống SpaceRent (16 Slides)

> [!TIP] 
> **Chiến thuật thuyết trình cho 16 Slide (Tầm 15-20 phút):**
> - **Slide 6 & 7 (Tìm kiếm):** Đây là phần cốt lõi của đề tài, hãy nói chậm, giải thích luồng xử lý từ lúc User bấm tìm kiếm đến lúc Backend trả dữ liệu.
> - **Demo (Slide 12-14):** Thực hiện theo đúng vòng đời của 1 tin đăng (Khách xem -> User đăng bài -> Admin duyệt).
> - **Trả lời phản biện:** Ở cuối tài liệu này có danh sách các câu hỏi thường gặp của Hội đồng CNTT. Hãy đọc thật kỹ và chuẩn bị.

---

## Slide 1: Lời mở đầu & Giới thiệu đề tài

**Bạn nói:**
"Dạ em kính chào Quý Thầy Cô trong Hội đồng bảo vệ đồ án tốt nghiệp. Em là Nguyễn Tuấn Phước. Hôm nay, em rất vinh dự được trình bày đồ án tốt nghiệp của mình với đề tài: **'Phát triển hệ thống tìm kiếm mặt bằng qua vị trí và giá - SpaceRent'**."

---

## Slide 2: Đặt vấn đề & Lý do thực hiện đề tài

**Bạn nói:**
"Kính thưa Thầy Cô, xuất phát từ thực tiễn hiện nay, việc tìm kiếm không gian kinh doanh và nhà ở đang gặp phải 3 rào cản lớn:
Thứ nhất, người đi thuê gặp rất nhiều khó khăn trong việc **định vị trực quan** mặt bằng trên bản đồ.
Thứ hai, việc đối chiếu, so sánh **mức giá** giữa hàng ngàn tin đăng tốn rất nhiều công sức.
Và thứ ba, thị trường thiếu hụt một công cụ tìm kiếm kết hợp chặt chẽ giữa 'Bản đồ' và 'Bộ lọc kết hợp nhiều điều kiện'.
Vì vậy, em quyết định xây dựng hệ thống **SpaceRent** nhằm tự động hóa việc thu thập dữ liệu và hỗ trợ tìm kiếm mặt bằng."

---

## Slide 3: Tổng quan chức năng & Mục tiêu cốt lõi

**Bạn nói:**
"Hệ thống SpaceRent được thiết kế với 4 nhóm chức năng chính:
1. **Dành cho Người đi thuê:** Công cụ tìm kiếm chuyên sâu theo Vị trí, Khoảng giá, và Diện tích kết hợp Bản đồ số.
2. **Dành cho Người cho thuê:** Hệ thống đăng tin, quản lý tin đăng cá nhân.
3. **Dành cho Hệ thống:** Module thu thập dữ liệu (Crawling) tự động theo chu kỳ.
4. **Dành cho Quản trị viên:** Dashboard quản lý tập trung, phê duyệt tin và kiểm duyệt người dùng."

---

## Slide 4: Kiến trúc hệ thống và Lý do chọn công nghệ

**Bạn nói:**
"Hệ thống được phát triển bám sát mô hình kiến trúc Client-Server hiện đại:
- **Tầng Frontend:** Em sử dụng HTML, CSS kết hợp **TailwindCSS** để tạo giao diện Responsive. Em lựa chọn **Vanilla JavaScript** vì hệ thống không quá phức tạp về luồng dữ liệu UI tĩnh, đồng thời giúp giảm kích thước ứng dụng và tránh phụ thuộc vào framework.
- **Tầng Backend:** Xây dựng bằng **Node.js** và framework **Express**, cung cấp các RESTful API.
- **Tích hợp bản đồ:** Em sử dụng **MapLibre GL** thay vì các thư viện khác nhờ ưu điểm mã nguồn mở, nhẹ và hiển thị bản đồ vector tốt, phù hợp cho việc thao tác với Marker số lượng lớn."

---

## Slide 5: Cơ sở dữ liệu & Xác thực người dùng

**Bạn nói:**
"Về mặt lưu trữ, em sử dụng **PostgreSQL** để cấu trúc hóa dữ liệu. PostgreSQL lưu trữ dữ liệu vị trí và hỗ trợ truy vấn hiệu quả các điều kiện kết hợp.
Về cơ chế đăng nhập, hệ thống sử dụng **Firebase Authentication** để xác thực người dùng. Sau khi Firebase xác thực thành công, Backend sẽ đảm nhận việc kiểm tra quyền truy cập theo vai trò (Role-based access control) được lưu trữ tại PostgreSQL để phân quyền Guest, User, và Admin."

---

## Slide 6: Tính năng cốt lõi 1 - Hệ thống tìm kiếm theo Vị trí

**Bạn nói:**
"Đi vào tính năng trọng tâm của đề tài: **Tìm kiếm theo Vị trí**.
Khi người dùng nhập điều kiện tìm kiếm, Backend sẽ tiến hành xây dựng câu lệnh truy vấn SQL tương ứng. Kết quả trả về gồm thông tin chi tiết mặt bằng kèm theo tọa độ Latitude và Longitude.
Từ dữ liệu đó, Frontend sử dụng thư viện **MapLibre** để hiển thị các Marker tương ứng trên bản đồ số và đồng bộ hóa với danh sách kết quả bên trái. Người dùng có thể hình dung rõ ràng vị trí mặt bằng nằm ở tuyến đường nào."

---

## Slide 7: Tính năng cốt lõi 2 - Hệ thống lọc kết hợp (Giá & Diện tích)

**Bạn nói:**
"Bên cạnh Vị trí là **Bộ lọc kết hợp nhiều điều kiện**.
Dữ liệu bất động sản luôn đi kèm với mức giá và diện tích đa dạng. Em đã thiết kế API cho phép truyền nhiều tham số cùng lúc (như Khoảng giá, Loại hình, Tỉnh thành). 
Việc xử lý lọc và phân trang (nếu có) được thực hiện trực tiếp tại Backend (Database level) giúp giảm thiểu thời gian truy vấn và tải trang, thay vì việc trả về toàn bộ dữ liệu rồi mới lọc ở Frontend."

---

## Slide 8: Tính năng 3 - Module thu thập dữ liệu (Crawling)

**Bạn nói:**
"Để hệ thống tìm kiếm phát huy hiệu quả, cần có một tập dữ liệu nguồn đủ lớn. 
Thay vì chỉ trông cậy vào việc người dùng đăng tin thủ công, em đã xây dựng một Module Crawling. Module này được lập lịch bằng **Cron Job**, thực hiện thu thập dữ liệu tự động theo chu kỳ mỗi 30 phút. 
Quá trình thu thập sẽ bóc tách các trường thông tin quan trọng như 'Mức giá', 'Địa chỉ', 'Tọa độ' từ các trang nguồn để chuẩn hóa và đưa vào CSDL của SpaceRent."

---

## Slide 9: Trải nghiệm người dùng (UX/UI)

**Bạn nói:**
"Giao diện của SpaceRent được thiết kế tối giản, tập trung vào tính khả dụng (Usability). Việc kết xuất (Render) các phần tử DOM được xử lý gọn gàng bằng Vanilla JS, kết hợp với thao tác bất đồng bộ (Fetch API) giúp người dùng chuyển đổi giữa các bộ lọc, thao tác thu/phóng (Zoom/Pan) trên bản đồ diễn ra mượt mà."

---

## Slide 10: Quản trị hệ thống (Admin Dashboard)

**Bạn nói:**
"Về phía quản trị, em xây dựng một **Admin Dashboard** để theo dõi các số liệu cơ bản.
Admin có thể nắm bắt được số lượng người dùng đang tham gia, số lượng tin đăng chờ duyệt, cũng như biểu đồ thống kê mức độ tương tác thông qua các đánh giá và phản hồi của hệ thống."

---

## Slide 11: Quản lý Tin đăng & Đánh giá (Moderation)

**Bạn nói:**
"Để duy trì tính minh bạch của thông tin, tính năng kiểm duyệt đóng vai trò then chốt:
- Admin có công cụ để duyệt, từ chối, hoặc ẩn các tin đăng ảo (Spam).
- Quản lý các nhận xét từ người dùng.
Giao diện Admin có áp dụng kỹ thuật Pre-fetching dữ liệu và caching tạm ở phía Frontend, giúp giảm thời gian chờ khi Admin cần xem chi tiết hoặc thao tác duyệt hàng loạt tin."

---

## Slide 12: Demo Hệ thống (Phần 1 - Luồng Tìm Kiếm Khách Hàng)

> [!IMPORTANT] 
> **Thao tác chuyển cảnh:** "Để Thầy Cô có góc nhìn chân thực nhất, em xin phép bắt đầu phần Demo trực tiếp mô phỏng vòng đời của một tin đăng trên Hệ thống SpaceRent."
> *(Kịch bản thao tác Demo):*
> - **Trang chủ (Home):** Giới thiệu sơ lược giao diện.
> - **Tìm kiếm (Search):** Tìm theo 1 Tỉnh/Thành phố và khoảng Giá cụ thể.
> - **Bản đồ (Map):** Hiển thị danh sách kết hợp bản đồ. Click vào Marker trên bản đồ.
> - **Chi tiết:** Mở xem chi tiết mặt bằng đó.

---

## Slide 13: Demo Hệ thống (Phần 2 - Luồng Đăng Tin Người Dùng)

> [!IMPORTANT] 
> *(Kịch bản thao tác Demo):*
> - **Login:** Thực hiện đăng nhập bằng tài khoản người dùng bình thường.
> - **Đăng bài:** Vào trang Quản lý cá nhân, tạo 1 tin đăng mới (Nhập địa chỉ, nhập mức giá để hệ thống lưu tọa độ). Nhấn lưu và thông báo tin đang chờ duyệt.

---

## Slide 14: Demo Hệ thống (Phần 3 - Luồng Quản Trị & Kiểm Duyệt)

> [!IMPORTANT] 
> *(Kịch bản thao tác Demo):*
> - **Admin:** Đăng xuất, đăng nhập lại bằng quyền Admin (Hoặc mở sẵn tab Admin).
> - **Dashboard:** Bấm vào Admin Panel. Cho thấy số liệu Dashboard thay đổi (nếu có).
> - **Duyệt bài:** Vào mục Quản lý tin đăng, tìm tin vừa đăng ở Slide 13, thực hiện chức năng **Duyệt**. (Và mở lại trang chủ để thấy tin vừa duyệt đã xuất hiện).

---

## Slide 15: Tổng kết, Ưu điểm & Hạn chế

**Bạn nói:**
"Trở lại với phần trình bày, em xin đúc kết lại kết quả của đồ án:
**Ưu điểm:**
- Hoàn thiện luồng **Tìm kiếm kết hợp Bản đồ số và Mức giá**.
- Tự động hóa được luồng thu thập dữ liệu (Crawling).
- Cấu trúc hệ thống mạch lạc, tốc độ xử lý và phản hồi tốt.
**Hạn chế:**
- Hiện tại việc Crawl dữ liệu nếu gặp phải cơ chế chống bot mạnh mẽ từ phía trang nguồn thì cần xử lý thủ công hoặc thiết lập proxy phức tạp hơn."

---

## Slide 16: Hướng phát triển tương lai & Lời cảm ơn

**Bạn nói:**
"Trong tương lai, em định hướng sẽ phát triển thêm:
1. Tính năng **Vẽ vùng tìm kiếm tự do (Polygon Search)** trực tiếp trên bản đồ số.
2. Tích hợp thuật toán Máy học để xây dựng Hệ thống Gợi ý (Recommendation System) cá nhân hóa.

Bài báo cáo đồ án của em đến đây là kết thúc. Em xin chân thành cảm ơn Quý Thầy Cô đã dành thời gian theo dõi. Em rất mong nhận được sự phản biện và những lời khuyên quý báu từ Thầy Cô. Em xin cảm ơn!"

---
---

# PHỤ LỤC: CÁC CÂU HỎI PHẢN BIỆN CẦN CHUẨN BỊ KỸ

Dưới đây là danh sách các câu hỏi "xoáy" mà Hội đồng Công nghệ Thông tin rất hay hỏi, bạn cần chuẩn bị sẵn câu trả lời để không bị khớp:

**1. Vì sao chọn PostgreSQL thay vì MongoDB hay MySQL?**
*Gợi ý trả lời:* Dữ liệu bất động sản có cấu trúc quan hệ rất rõ ràng (User -> Listing -> Reviews). PostgreSQL là CSDL quan hệ mạnh mẽ, chuẩn ACID, xử lý rất tốt các câu SQL Join. 

**2. Vì sao dùng MapLibre thay vì Google Maps hay Leaflet?**
*Gợi ý trả lời:* MapLibre là thư viện mã nguồn mở hoàn toàn miễn phí, hỗ trợ Vector Tiles (vẽ bản đồ bằng vector thay vì ảnh raster tĩnh như Leaflet truyền thống), giúp thu phóng mượt mà và không lo giới hạn quota đắt đỏ như Google Maps API.

**3. Search dùng Full-text Search hay truy vấn LIKE thông thường?**
*Gợi ý trả lời:* (Bạn tự kiểm tra lại Code backend của mình xem đang dùng `ILIKE`, `LIKE` hay `to_tsvector` của Postgres để trả lời đúng thực tế). Nếu dùng LIKE thì cứ thừa nhận là do quy mô dữ liệu hiện tại đang ở mức vừa phải, tương lai có thể nâng cấp lên Full-text Search hoặc Elasticsearch.

**4. Nếu Crawl bị trùng lặp dữ liệu thì xử lý thế nào?**
*Gợi ý trả lời:* Khi Crawl, em bóc tách ID gốc hoặc URL của tin đăng trên trang đích làm khóa duy nhất (Unique Key). Trước khi insert vào Database, hệ thống sẽ check `ON CONFLICT` (hoặc kiểm tra tồn tại), nếu đã có thì chỉ cập nhật (Update) chứ không tạo mới (Insert).

**5. Cơ chế đồng bộ Firebase và PostgreSQL diễn ra như thế nào?**
*Gợi ý trả lời:* Khi người dùng đăng nhập bằng Firebase, Firebase trả về một Token. Client gửi Token này xuống Backend. Backend giải mã Token, nếu hợp lệ sẽ kiểm tra User đó đã có trong PostgreSQL chưa. Nếu chưa thì tạo mới với role mặc định, nếu có rồi thì lấy thông tin role và trả về cho Client.

**6. Có chống SQL Injection không?**
*Gợi ý trả lời:* Có ạ. Em dùng thư viện `pg` (hoặc ORM/Query Builder tùy code của bạn) kết hợp với Parameterized Queries (Truy vấn có tham số `$1, $2`) để tự động escape dữ liệu, tránh hoàn toàn SQL Injection.

**7. Có phân trang (Pagination) không? Nếu có 1 triệu bản ghi thì sao?**
*Gợi ý trả lời:* (Nêu cách backend query dùng `LIMIT` và `OFFSET`). Đối với 1 triệu bản ghi, việc dùng OFFSET sẽ bị chậm, hướng giải quyết tương lai là dùng Keyset Pagination (phân trang theo con trỏ - Cursor) hoặc dùng Database Indexing vào các cột giá, thành phố.

**8. Vì sao chọn Vanilla JS mà không dùng React, Vue?**
*Gợi ý trả lời:* Vì đồ án tập trung vào logic tìm kiếm, crawl dữ liệu và tương tác API. Việc dùng Vanilla JS giúp em hiểu sâu hơn về luồng render DOM, DOM manipulation, và bản chất của JavaScript thay vì phụ thuộc vào cú pháp đóng gói sẵn của framework. Hơn nữa, nó giúp dung lượng tải ban đầu (bundle size) của web rất nhẹ.
