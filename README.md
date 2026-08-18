# Mail Account Manager - NTQ Solution

Hệ thống sổ cái trung tâm (IT Ledger) dành cho IT Admin để quản lý, cấp phát, theo dõi hạn sử dụng, gia hạn, tạm khóa, thu hồi và kiểm toán các tài khoản email (`@ntq-solution.com.vn`) cấp cho Dự án, Khách hàng và Đối tác Outsource.

![Dashboard Preview](https://via.placeholder.com/1200x600/0b0f19/6366f1?text=Mail+Account+Manager+-+NTQ+Solution)

---

## 🌟 Tính Năng Nổi Bật

- **📊 Dashboard KPI Thông Minh**: Thống kê thời gian thực Tổng số mail, Số mail Active, Sắp hết hạn (<14 ngày, <7 ngày) và Quá hạn chưa thu hồi.
- **🏷️ Phân Loại Đa Dạng**: Quản lý 3 nhóm đối tượng: *Dự Án Nội Bộ*, *Khách Hàng (Client)*, *Đối Tác (Partner)*.
- **🔍 Bộ Lọc & Tìm Kiếm Tức Thì**: Lọc đa tầng theo trạng thái, theo từng Dự án và tìm kiếm theo từ khóa.
- **🔄 Quy Trình Vòng Đời Hoàn Chỉnh**:
  - **Cấp mới / Chỉnh sửa**: Ghi nhận thông tin người dùng (Assignee), ngày hết hạn, IT phụ trách (PIC).
  - **Gia hạn (Renew)**: Chọn nhanh +30/+60/+90 ngày, ghi nhận số lần gia hạn và lý do vào nhật ký.
  - **Tạm khóa (Suspend) & Mở lại (Activate)**: 1-click thao tác khi cần tạm ngưng dịch vụ.
  - **Thu hồi (Revoke) & Kill-Switch Dự án (Batch Revoke)**: Thu hồi đồng loạt toàn bộ tài khoản thuộc 1 dự án khi dự án kết thúc.
  - **Mẫu Bàn Giao (One-Click Handover)**: Sao chép nhanh mẫu tin nhắn bàn giao kèm lưu ý bảo mật 2FA.
- **📜 Nhật Ký Hành Động (Audit Log Timeline)**: Lưu vết chi tiết mọi thao tác (Ai làm, lúc nào, lý do gì).
- **📁 Import & Export CSV**: Kéo thả file CSV xem trước dữ liệu trước khi nạp; Xuất danh sách chuẩn Excel UTF-8 BOM.
- **🌓 Giao Diện Hiện Đại**: Hỗ trợ chuyển đổi Chế độ Sáng / Tối (Dark / Light Theme).

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy Trực Tiếp

### Cách 1: Mở trực tiếp với trình duyệt
Chỉ cần nhấp đúp vào file `index.html` hoặc mở bằng trình duyệt (Chrome, Edge, Firefox, Safari).

### Cách 2: Chạy qua Live Server / Python
```bash
# Sử dụng Python
python -m http.server 8080

# Mở trình duyệt tại địa chỉ
http://localhost:8080
```

---

## 📂 Cấu Trúc Dự Án

```text
├── index.html          # Giao diện chính, Dashboard, Modals
├── css/
│   └── style.css       # Design System, Theme Tokens, Animations
├── js/
│   ├── app.js          # Logic điều phối UI, bảng dữ liệu, modal
│   ├── store.js        # State Management, LocalStorage, Audit Log
│   ├── csv-handler.js  # Import / Export CSV và Validation
│   ├── mock-data.js    # Dữ liệu mẫu chuẩn NTQ Solution
│   └── utils.js        # Tiện ích format, tính ngày, handover snippet
└── README.md
```

---

## 👤 Tác Giả & Bản Quyền
- **Phát triển bởi**: Quang Đặng (quang.dang1@ntq-solution.com.vn)
- **Đơn vị**: NTQ Solution
- **Giấy phép**: MIT License
