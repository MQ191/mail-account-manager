#!/usr/bin/env bash

# ==============================================================================
# Script Tự Động Triển Khai Mail Account Manager trên Ubuntu 24.04 LTS
# Hỗ trợ: Auto-Start khi Server Restart / Reboot & Auto-Restart khi Process bị Crash
# Web Server: Nginx
# ==============================================================================

set -e

# Màu sắc thông báo
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}==================================================================${NC}"
echo -e "${BLUE}    BẮT ĐẦU CÀI ĐẶT VÀ TRIỂN KHAI MAIL ACCOUNT MANAGER (NTQ)      ${NC}"
echo -e "${BLUE}==================================================================${NC}"

# 1. Kiểm tra quyền root (sudo)
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}[LỖI] Vui lòng chạy script này với quyền root hoặc sudo: sudo bash deploy.sh${NC}"
  exit 1
fi

# 2. Cấu hình biến môi trường
GITHUB_TOKEN="${GITHUB_TOKEN:-}"
if [ -n "$GITHUB_TOKEN" ]; then
  REPO_URL="https://${GITHUB_TOKEN}@github.com/MQ191/mail-account-manager.git"
else
  REPO_URL="https://github.com/MQ191/mail-account-manager.git"
fi
WEB_DIR="/var/www/mail-account-manager"
NGINX_CONF="/etc/nginx/sites-available/mail-account-manager"

# 3. Cập nhật hệ điều hành và cài đặt Nginx, Git, Curl
echo -e "\n${YELLOW}[1/6] Đang cập nhật hệ thống và cài đặt Nginx, Git...${NC}"
apt update -y
apt install -y nginx git curl ufw

# 4. Tải hoặc cập nhật mã nguồn từ GitHub
echo -e "\n${YELLOW}[2/6] Đang tải mã nguồn từ GitHub về ${WEB_DIR}...${NC}"
if [ -d "$WEB_DIR/.git" ]; then
  echo -e "Thư mục đã tồn tại, đang tiến hành kéo code mới nhất (git pull)..."
  cd "$WEB_DIR"
  git fetch --all
  git reset --hard origin/main
else
  rm -rf "$WEB_DIR"
  git clone "$REPO_URL" "$WEB_DIR"
fi

# 5. Phân quyền thư mục web
echo -e "\n${YELLOW}[3/6] Đang thiết lập phân quyền thư mục cho Nginx...${NC}"
chown -R www-data:www-data "$WEB_DIR"
chmod -R 755 "$WEB_DIR"

# 6. Tạo cấu hình Virtual Host Nginx
echo -e "\n${YELLOW}[4/6] Đang cấu hình Nginx Server Block...${NC}"
cat > "$NGINX_CONF" << 'EOF'
server {
    listen 80 default_server;
    listen [::]:80 default_server;

    server_name _;

    root /var/www/mail-account-manager;
    index index.html;

    # Gzip Compression tối ưu tốc độ tải trang
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml application/javascript application/json;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache file tĩnh (CSS, JS)
    location ~* \.(css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf)$ {
        expires 7d;
        add_header Cache-Control "public, no-transform";
    }

    error_page 404 /index.html;
}
EOF

# Kích hoạt cấu hình Nginx và hủy bỏ default cũ nếu có
rm -f /etc/nginx/sites-enabled/default
ln -sf "$NGINX_CONF" /etc/nginx/sites-enabled/

# 7. Cấu hình tự động khởi chạy khi Server Reboot & Tự phục hồi khi Crash
echo -e "\n${YELLOW}[5/6] Đang cấu hình Systemd Auto-Start & Crash-Recovery...${NC}"
mkdir -p /etc/systemd/system/nginx.service.d/
cat > /etc/systemd/system/nginx.service.d/restart.conf << 'EOF'
[Service]
Restart=always
RestartSec=5s
EOF

# Reload Systemd daemon
systemctl daemon-reload

# Kích hoạt Nginx tự động chạy cùng hệ thống (Auto-start on boot)
systemctl unmask nginx || true
systemctl enable nginx

# Kiểm tra cú pháp Nginx và khởi động
nginx -t
systemctl restart nginx

# 8. Mở Port tường lửa UFW (Port 80 HTTP)
echo -e "\n${YELLOW}[6/6] Đang mở tường lửa Port 80 (HTTP)...${NC}"
ufw allow 'Nginx HTTP' || true

# Lấy địa chỉ IP Public của máy chủ
SERVER_IP=$(curl -s -4 ifconfig.me || hostname -I | awk '{print $1}')

echo -e "\n${GREEN}==================================================================${NC}"
echo -e "${GREEN}    🎉 TRIỂN KHAI THÀNH CÔNG MAIL ACCOUNT MANAGER TRÊN UBUNTU!     ${NC}"
echo -e "${GREEN}==================================================================${NC}"
echo -e "👉 Địa chỉ truy cập ứng dụng: ${YELLOW}http://${SERVER_IP}/${NC}"
echo -e "👉 Thư mục mã nguồn: ${BLUE}${WEB_DIR}${NC}"
echo -e "👉 Trạng thái khởi động cùng hệ điều hành: ${GREEN}ĐÃ BẬT (Auto-Start on Boot & Crash-Recovery)${NC}"
echo -e "👉 Lệnh cập nhật code mới: ${BLUE}cd ${WEB_DIR} && sudo git pull && sudo systemctl restart nginx${NC}"
echo -e "${GREEN}==================================================================${NC}\n"
