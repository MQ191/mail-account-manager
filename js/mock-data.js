/**
 * Mock Data for Mail Account Manager - NTQ Solution
 * Dữ liệu mẫu chuẩn domain @ntq-solution.com.vn
 */

const INITIAL_MOCK_ACCOUNTS = [
  {
    id: "acc-101",
    email: "fintech-core-dev@ntq-solution.com.vn",
    type: "PROJECT",
    status: "ACTIVE",
    project_name: "FinTech Banking App v2",
    assignee_name: "Nguyễn Văn Hùng",
    assignee_email: "hung.nv@ntq-solution.com.vn",
    manager_pic: "Quang Đặng (quang.dang1@ntq-solution.com.vn)",
    created_at: "2026-06-01",
    expires_at: "2026-08-20", // 3 days remaining (<7 days)
    revoked_at: null,
    revoke_reason: null,
    notes: "Tài khoản test gateway thanh toán nội bộ",
    renew_count: 1
  },
  {
    id: "acc-102",
    email: "audit-ey-team@ntq-solution.com.vn",
    type: "CLIENT",
    status: "ACTIVE",
    project_name: "Kiểm toán Tài chính 2026",
    assignee_name: "Trần Thị Mai (EY Vietnam)",
    assignee_email: "mai.tran@ntq-solution.com.vn",
    manager_pic: "Quang Đặng (quang.dang1@ntq-solution.com.vn)",
    created_at: "2026-05-15",
    expires_at: "2026-08-25", // 8 days remaining (<14 days)
    revoked_at: null,
    revoke_reason: null,
    notes: "Cấp quyền truy cập tài liệu kiểm toán",
    renew_count: 0
  },
  {
    id: "acc-103",
    email: "fpt-outsource-lead@ntq-solution.com.vn",
    type: "PARTNER",
    status: "ACTIVE",
    project_name: "Hệ thống CRM v3",
    assignee_name: "Lê Hoàng Nam (FPT Soft)",
    assignee_email: "namlh@ntq-solution.com.vn",
    manager_pic: "Quang Đặng (quang.dang1@ntq-solution.com.vn)",
    created_at: "2026-01-10",
    expires_at: "2026-08-10", // Đã quá hạn 7 ngày
    revoked_at: null,
    revoke_reason: null,
    notes: "Dev lead bên đối tác outsource CRM",
    renew_count: 2
  },
  {
    id: "acc-104",
    email: "vnpay-partner-tech@ntq-solution.com.vn",
    type: "PARTNER",
    status: "ACTIVE",
    project_name: "Tích hợp VNPay QR",
    assignee_name: "Đỗ Quốc Anh (VNPay)",
    assignee_email: "anhdq@ntq-solution.com.vn",
    manager_pic: "Quang Đặng (quang.dang1@ntq-solution.com.vn)",
    created_at: "2026-07-01",
    expires_at: "2026-10-30",
    revoked_at: null,
    revoke_reason: null,
    notes: "Phục vụ sandbox test QR code",
    renew_count: 0
  },
  {
    id: "acc-105",
    email: "security-pentest-2026@ntq-solution.com.vn",
    type: "CLIENT",
    status: "REVOKED",
    project_name: "Audit An toàn Thông tin",
    assignee_name: "Phạm Minh Đức (CyRadar)",
    assignee_email: "ducpm@ntq-solution.com.vn",
    manager_pic: "Quang Đặng (quang.dang1@ntq-solution.com.vn)",
    created_at: "2026-03-01",
    expires_at: "2026-04-01",
    revoked_at: "2026-04-02",
    revoke_reason: "Dự án Pentest kết thúc thành công",
    notes: "Đã thu hồi quyền Google Drive và đổi mật khẩu",
    renew_count: 0
  },
  {
    id: "acc-106",
    email: "ai-chatbot-demo@ntq-solution.com.vn",
    type: "PROJECT",
    status: "SUSPENDED",
    project_name: "AI Customer Support Bot",
    assignee_name: "Vũ Hải Đăng (AI Lab)",
    assignee_email: "dang.vh@ntq-solution.com.vn",
    manager_pic: "Quang Đặng (quang.dang1@ntq-solution.com.vn)",
    created_at: "2026-04-10",
    expires_at: "2026-09-15",
    revoked_at: null,
    revoke_reason: null,
    notes: "Tạm khóa do dừng đợt thử nghiệm Alpha",
    renew_count: 1
  },
  {
    id: "acc-107",
    email: "vietinbank-onboarding@ntq-solution.com.vn",
    type: "CLIENT",
    status: "ACTIVE",
    project_name: "Dự án Core Banking VietinBank",
    assignee_name: "Ngô Quang Huy",
    assignee_email: "huy.nq@ntq-solution.com.vn",
    manager_pic: "Quang Đặng (quang.dang1@ntq-solution.com.vn)",
    created_at: "2026-08-01",
    expires_at: "2026-11-30",
    revoked_at: null,
    revoke_reason: null,
    notes: "Tài khoản liên lạc trực tiếp đầu mối kỹ thuật",
    renew_count: 0
  }
];

const INITIAL_AUDIT_LOGS = [
  {
    id: "log-001",
    account_id: "acc-105",
    account_email: "security-pentest-2026@ntq-solution.com.vn",
    action: "REVOKE",
    performed_by: "Quang Đặng (quang.dang1@ntq-solution.com.vn)",
    timestamp: "2026-04-02 09:30",
    details: "Thu hồi tài khoản. Lý do: Dự án Pentest kết thúc thành công"
  },
  {
    id: "log-002",
    account_id: "acc-101",
    account_email: "fintech-core-dev@ntq-solution.com.vn",
    action: "RENEW",
    performed_by: "Quang Đặng (quang.dang1@ntq-solution.com.vn)",
    timestamp: "2026-07-15 14:20",
    details: "Gia hạn thêm 30 ngày theo yêu cầu PM Hùng"
  },
  {
    id: "log-003",
    account_id: "acc-106",
    account_email: "ai-chatbot-demo@ntq-solution.com.vn",
    action: "SUSPEND",
    performed_by: "Quang Đặng (quang.dang1@ntq-solution.com.vn)",
    timestamp: "2026-07-20 16:00",
    details: "Tạm khóa tài khoản chờ kết quả đánh giá vòng 1"
  },
  {
    id: "log-004",
    account_id: "acc-107",
    account_email: "vietinbank-onboarding@ntq-solution.com.vn",
    action: "CREATE",
    performed_by: "Quang Đặng (quang.dang1@ntq-solution.com.vn)",
    timestamp: "2026-08-01 10:15",
    details: "Cấp mới tài khoản cho dự án VietinBank, hạn dùng đến 30/11/2026"
  }
];
