# Hướng Dẫn Triển Khai Mail Account Manager trên Ubuntu 24.04 LTS

Tài liệu hướng dẫn triển khai hệ thống **Mail Account Manager (NTQ Solution)** lên máy chủ/máy ảo Ubuntu 24 sử dụng Nginx web server với đầy đủ cơ chế **tự động chạy khi khởi động lại máy chủ (Auto-start on Boot)** và **tự phục hồi khi bị lỗi (Crash Recovery)**.

---

## ⚡ Cách 1: Triển khai nhanh bằng 1 câu lệnh (Khuyên dùng)

Đăng nhập SSH vào máy chủ Ubuntu 24 và chạy lệnh:

```bash
curl -sSL https://raw.githubusercontent.com/MQ191/mail-account-manager/main/deploy.sh | sudo bash
```

*(Nếu repository đặt ở chế độ Private, truyền thêm biến `GITHUB_TOKEN`):*
```bash
curl -sSL https://raw.githubusercontent.com/MQ191/mail-account-manager/main/deploy.sh | sudo GITHUB_TOKEN="<YOUR_TOKEN>" bash
```

Sau khi chạy xong, mở trình duyệt truy cập: `http://<IP_MÁY_CHỦ>/`

---

## 🛠️ Cách 2: Triển khai thủ công từng bước

### Bước 1: Cập nhật hệ thống & cài đặt Nginx, Git
```bash
sudo apt update -y
sudo apt install -y nginx git curl ufw
```

### Bước 2: Tải mã nguồn về thư mục `/var/www/mail-account-manager`
```bash
sudo rm -rf /var/www/mail-account-manager
sudo git clone https://github.com/MQ191/mail-account-manager.git /var/www/mail-account-manager
sudo chown -R www-data:www-data /var/www/mail-account-manager
sudo chmod -R 755 /var/www/mail-account-manager
```

### Bước 3: Cấu hình Virtual Host Nginx
Tạo file cấu hình:
```bash
sudo nano /etc/nginx/sites-available/mail-account-manager
```

Dán nội dung sau vào:
```nginx
server {
    listen 80 default_server;
    listen [::]:80 default_server;

    server_name _;

    root /var/www/mail-account-manager;
    index index.html;

    # Nén Gzip tối ưu tốc độ
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/javascript application/json;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 7d;
        add_header Cache-Control "public, no-transform";
    }

    error_page 404 /index.html;
}
```

Kích hoạt cấu hình:
```bash
sudo rm -f /etc/nginx/sites-enabled/default
sudo ln -sf /etc/nginx/sites-available/mail-account-manager /etc/nginx/sites-enabled/
```

### Bước 4: Cấu hình Tự Động Bật Khi Server Restart & Tự Phục Hồi Khi Crash
Tạo file ghi đè dịch vụ Systemd:
```bash
sudo mkdir -p /etc/systemd/system/nginx.service.d/
sudo cat << 'EOF' > /etc/systemd/system/nginx.service.d/restart.conf
[Service]
Restart=always
RestartSec=5s
EOF
```

Kích hoạt khởi động cùng hệ điều hành:
```bash
sudo systemctl daemon-reload
sudo systemctl unmask nginx
sudo systemctl enable nginx
sudo nginx -t
sudo systemctl restart nginx
```

### Bước 5: Mở Port 80 trên tường lửa UFW
```bash
sudo ufw allow 'Nginx HTTP'
```

---

## 🔄 Hướng Dẫn Cập Nhật Code Mới Sau Này

Khi bạn có chỉnh sửa mới trên GitHub và muốn cập nhật lên server:

```bash
cd /var/www/mail-account-manager
sudo git pull origin main
sudo systemctl restart nginx
```

---

## 📋 Các Lệnh Quản Trị Thường Dùng

- **Kiểm tra trạng thái Nginx**:
  ```bash
  sudo systemctl status nginx
  ```
- **Khởi động lại Nginx**:
  ```bash
  sudo systemctl restart nginx
  ```
- **Kiểm tra cú pháp file cấu hình**:
  ```bash
  sudo nginx -t
  ```
- **Xem nhật ký lỗi (Error Logs)**:
  ```bash
  sudo tail -f /var/log/nginx/error.log
  ```
- **Xem nhật ký truy cập (Access Logs)**:
  ```bash
  sudo tail -f /var/log/nginx/access.log
  ```
