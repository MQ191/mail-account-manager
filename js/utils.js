/**
 * Utility Functions for Mail Account Manager
 */

const Utils = {
  // Format Date String to DD/MM/YYYY
  formatDate(dateStr) {
    if (!dateStr) return "—";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    } catch (e) {
      return dateStr;
    }
  },

  // Calculate days difference from today (Positive = future days remaining, Negative = past/overdue)
  getDaysRemaining(expiryDateStr) {
    if (!expiryDateStr) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const expiry = new Date(expiryDateStr);
    expiry.setHours(0, 0, 0, 0);
    
    const diffTime = expiry.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  },

  // Get Expiry Status Object (color class, label, tag)
  getExpiryBadge(account) {
    if (account.status === 'REVOKED') {
      return {
        class: 'text-muted',
        label: 'Đã thu hồi',
        type: 'revoked'
      };
    }
    if (account.status === 'SUSPENDED') {
      return {
        class: 'text-warning',
        label: 'Đang tạm khóa',
        type: 'suspended'
      };
    }

    const days = this.getDaysRemaining(account.expires_at);
    if (days === null) return { class: 'text-muted', label: 'Không có hạn', type: 'none' };

    if (days < 0) {
      return {
        class: 'text-danger',
        label: `Quá hạn ${Math.abs(days)} ngày`,
        type: 'expired'
      };
    } else if (days === 0) {
      return {
        class: 'text-danger',
        label: 'Hết hạn hôm nay',
        type: 'today'
      };
    } else if (days <= 7) {
      return {
        class: 'text-danger',
        label: `Còn ${days} ngày (Gấp)`,
        type: 'critical'
      };
    } else if (days <= 14) {
      return {
        class: 'text-warning',
        label: `Còn ${days} ngày`,
        type: 'warning'
      };
    } else {
      return {
        class: 'text-success',
        label: `Còn ${days} ngày`,
        type: 'good'
      };
    }
  },

  // Generate Handover Text Template
  generateHandoverText(account) {
    const days = this.getDaysRemaining(account.expires_at);
    const timeInfo = days !== null 
      ? `${this.formatDate(account.expires_at)} (${days >= 0 ? `Còn ${days} ngày` : `Đã quá hạn ${Math.abs(days)} ngày`})` 
      : 'Không thời hạn';

    return `========================================
[THÔNG BÁO BÀN GIAO TÀI KHOẢN EMAIL DỰ ÁN]
========================================
• Địa chỉ Email: ${account.email}
• Phân loại: ${account.type === 'PROJECT' ? 'Dự án nội bộ' : account.type === 'CLIENT' ? 'Khách hàng' : 'Đối tác Outsource'}
• Dự án / Hợp đồng: ${account.project_name || 'N/A'}
• Người sử dụng: ${account.assignee_name || 'N/A'} (${account.assignee_email || 'N/A'})
• Hạn sử dụng: ${timeInfo}
• Đơn vị cấp / Quản lý: ${account.manager_pic || 'IT Admin'}

* LƯU Ý BẢO MẬT & QUY ĐỊNH:
1. Bật xác thực 2 bước (2FA) ngay khi đăng nhập lần đầu.
2. Tài khoản sẽ tự động khóa và thu hồi khi hết hạn. Nếu cần gia hạn, vui lòng gửi yêu cầu trước ít nhất 7 ngày.
========================================`;
  },

  // Copy to clipboard with visual toast
  copyToClipboard(text, successMessage = "Đã sao chép vào bộ nhớ tạm!") {
    navigator.clipboard.writeText(text).then(() => {
      this.showToast(successMessage, "success");
    }).catch(err => {
      console.error("Copy failed", err);
      this.showToast("Không thể sao chép tự động", "danger");
    });
  },

  // Show Toast Message
  showToast(message, type = "success") {
    let container = document.getElementById("toastContainer");
    if (!container) {
      container = document.createElement("div");
      container.id = "toastContainer";
      container.className = "toast-container";
      document.body.appendChild(container);
    }

    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    
    let iconSvg = '';
    if (type === 'success') {
      iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
    } else if (type === 'warning') {
      iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`;
    } else {
      iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2.5"><circle cx="12" cy="12" r="10"></line><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`;
    }

    toast.innerHTML = `
      ${iconSvg}
      <span>${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add("show");
    }, 10);

    setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }
};
