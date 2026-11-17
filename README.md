# Công cụ tạo tin nhắn hoàn tiền TikTok

Mở `index.html` bằng Chrome, Edge hoặc Safari. Không cần chạy server, cài thư viện hay đăng nhập app LiLa. Có thể cài ra màn hình chính điện thoại (PWA) để dùng như app riêng biệt và dùng ngoại tuyến.

1. Bấm **Dán link** (hoặc dán thủ công link affiliate đã tạo).
2. Nhập hoa hồng gốc trước thuế, ví dụ `25000` hoặc `25.000`.
3. Tùy chỉnh **Lời nhắn gửi khách** nếu muốn (công cụ tự động ghi nhớ câu này cho các lần sau; bấm "Làm mới" vẫn giữ nguyên câu này).
4. Bấm **Tạo tin nhắn**, màn hình tự cuộn xuống mẫu đã tạo.
5. Bấm **Sao chép tin nhắn** và dán vào Zalo.

Thuế = làm tròn 10% hoa hồng gốc. Tiền khách = làm tròn 70% hoa hồng còn lại sau thuế. Phần của bạn = số tiền sau thuế trừ phần khách. Ví dụ 25.000đ → thuế 2.500đ → khách 15.750đ → bạn 6.750đ.

Chỉ có tin nhắn cho khách được sao chép; bảng thuế/phần chia không nằm trong mẫu. Sửa đầu vào sẽ xóa mẫu cũ để tránh gửi nhầm. Nếu trình duyệt chặn sao chép tự động, chọn nội dung và sao chép thủ công.

Công cụ hoạt động ngoại tuyến, không gọi API, không lưu thông tin cá nhân lên mạng. Tối ưu trải nghiệm thao tác 1 tay trên điện thoại di động.

## Khởi động và build

Giao diện, logic tạo tin và phần cài PWA nằm trong `index.html`, không cần tải JavaScript riêng để dùng form. Service worker ưu tiên cache khi mở lại; API không được cache. Nếu trình duyệt chặn localStorage, vẫn tạo và sao chép tin được nhưng lời nhắn không được nhớ qua lần mở sau.

Chạy `node build.cjs` để cập nhật `dist`. Khi sửa giao diện hoặc logic, tăng phiên bản `CACHE` trong `sw.js` trước khi build để thiết bị đã cài nhận bản mới. GitHub Pages hiện phục vụ thư mục gốc; cấu hình hosting khác dùng `dist`.

Kiểm thử: `node tests/startup.cjs` cần Playwright và Edge. Có thể đặt `NODE_PATH` tới thư mục `node_modules` đã có Playwright; app không cần các thư viện này khi chạy. Test kiểm tra mở mới/cache/offline, tính tiền, reset, dữ liệu nhập sai, sao chép và localStorage bị chặn. `TIKTOK_TEST_ROOT` cho phép đo một bản mã nguồn cũ.

Đo local ngày 17/11/2026, Edge giả lập màn hình 390×844, mạng 1,6 Mbps/độ trễ 150 ms, CPU chậm 4 lần; trung vị 3 lượt mỗi bản: FCP mở mới 444 → 292 ms; cache 60 → 52 ms; offline 60 → 52 ms. DOMContentLoaded mở mới 446 → 417 ms. Đây là mẫu đo nhỏ trên máy tính, không phải thời gian khởi động PWA trên điện thoại thật hoặc production.
