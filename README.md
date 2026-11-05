# THẦY/CÔ HUB 3D CHIBI — Phiên bản 6

Văn phòng ảo tương tác dành cho giáo viên và đội ngũ 12 AI Agent. Giao diện bám theo phong cách minh họa 3D góc nhìn isometric, bàn làm việc màu pastel, nhân vật chibi có hoạt ảnh đi lại, gặp gỡ và trò chuyện.

## A. Mở nhanh, không cần cài phần mềm

Nhấp đúp `MO_NGAY_VAN_PHONG_CHIBI_V6.html` bằng Chrome hoặc Edge. Đợi giao diện tải xong.

- **Chibi:** 12 vị trí làm việc có thể nhấp; một số nhân viên chibi hoạt ảnh rời bàn đi qua các lối đi, gặp nhau, nói bằng bong bóng thoại rồi trở lại. Các nhân viên khác vẫn xuất hiện ở bàn trong ảnh minh họa.
- **Gặp gỡ:** nhân viên đang chọn đi đến gặp đồng nghiệp trong bộ phận và trao đổi các câu thoại mô phỏng. Trong bản ngoại tuyến, những câu nói này là kịch bản có sẵn, không phải hội thoại AI tự sinh.
- **Bật tiếng:** cho phép trình duyệt đọc câu thoại tiếng Việt bằng Web Speech API, tùy giọng nói cài đặt trên máy. Cần nhấn nút để bật, trình duyệt có thể không có giọng tiếng Việt.
- **Nói yêu cầu:** dùng Speech Recognition trên trình duyệt hỗ trợ (thường là Chrome). Bạn phải cấp quyền microphone; tính năng có thể cần kết nối mạng và không hoạt động trên mọi máy.
- **3D đi lại:** chế độ xoay, kéo, phóng to mô hình CSS 3D với 12 nhân viên đi theo tuyến. Mặt bằng cho phép nhìn từ trên xuống.
- **Giao nhiệm vụ:** nhấp nhân viên hoặc tên phòng, nhập yêu cầu ở bên phải. Không có API key sẽ xuất prompt để sao chép; **chưa có phản hồi AI thực**.
- **Công việc:** tạo / theo dõi / cập nhật trạng thái; khi mở file đơn lẻ, dữ liệu chỉ lưu bằng localStorage trong trình duyệt.

## B. Kết nối AI thực với Node.js (>= 20)

1. Sao chép `.env.example` thành `.env`.
2. Nhập giá trị `OPENAI_API_KEY=...` trong `.env`. Không dán API key vào mã HTML hoặc giao diện website.
3. Chạy `start.bat` trên Windows, hoặc `node server.js` trên macOS/Linux.
4. Truy cập `http://127.0.0.1:3000` bằng Chrome/Edge.
5. Nhấp nhân viên để trò chuyện và giao việc. Câu trả lời từ AI trả về trong bảng phải; dữ liệu công việc/lịch sử lưu tại `data/workspace.json` trên máy chủ cục bộ.

Bản mẫu này chủ yếu dành cho chạy cục bộ trên một máy. Nếu triển khai qua Internet, hãy bổ sung cơ chế đăng nhập/phân quyền theo người dùng, HTTPS, quản lý phiên, giới hạn tốc độ, bảo vệ dữ liệu học viên và cấu hình `APP_PASSWORD` trước khi mở truy cập. Chỉ riêng mật khẩu mẫu không đủ cho triển khai nhiều người dùng quy mô sản xuất.

## C. Đủ 12 bộ phận

1. AI Biên kịch
2. AI Viết bài
3. AI Dựng video
4. AI Quản lý bài đăng
5. AI Giáo án
6. AI Trợ lý cá nhân
7. AI Chăm sóc học viên
8. AI Quản lý lớp
9. AI Quiz
10. AI Chấm bài
11. AI TOPIK I
12. AI TOPIK II

## D. Giới hạn hiện tại

- Chibi là cảnh minh họa isometric kèm nhân vật SVG có hoạt ảnh 2D, không phải mô hình người WebGL có rig 3D. Chế độ 3D là mô hình CSS 3D có thể xoay với nhân vật hoạt ảnh.
- Hội thoại giữa hai nhân viên trong văn phòng là lời thoại mẫu; khi kết nối OpenAI API, **yêu cầu do bạn nhập** mới được gửi tới AI thật.
- Giọng đọc và nhập bằng giọng nói phụ thuộc khả năng hỗ trợ và quyền của trình duyệt.
- AI Dựng video hiện đưa ra storyboard/hướng dẫn dựng, không trực tiếp kết xuất MP4. AI Quản lý bài đăng chưa tự đăng lên Facebook/TikTok.
- Chưa có xác thực đa người dùng / lưu trữ đám mây / quyền riêng tư theo học viên đủ cho triển khai chính thức.

## E. Kiểm tra kỹ thuật

JavaScript frontend và `server.js` đã qua kiểm tra cú pháp. Backend đã được kiểm tra bằng HTTP đối với trang chủ, trạng thái API, tạo nhiệm vụ và thông báo chưa có API key. Không thể hoàn tất kiểm thử giao diện bằng Chromium tự động trong môi trường kiểm thử do chính sách trình duyệt.

## Trien khai truc tuyen

Xem `HUONG_DAN_DUA_LEN_MANG.md` va file Render Blueprint `render.yaml`. Can dat `APP_PASSWORD`, `OPENAI_API_KEY`, `HOST=0.0.0.0`, `COOKIE_SECURE=1` khi deploy Render. Khong upload file `.env`.
