/**
 * Store Module for Mail Account Manager - NTQ Solution
 * State Management, LocalStorage Persistence, Audit Logging
 */

const STORAGE_KEYS = {
  ACCOUNTS: 'mam_accounts_v2',
  AUDIT_LOGS: 'mam_audit_logs_v2',
  THEME: 'mam_theme_pref'
};

const Store = {
  accounts: [],
  auditLogs: [],

  // Initialize store from localStorage or mock data
  init() {
    const savedAccounts = localStorage.getItem(STORAGE_KEYS.ACCOUNTS);
    const savedLogs = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);

    if (savedAccounts) {
      try {
        this.accounts = JSON.parse(savedAccounts);
      } catch (e) {
        this.accounts = [...INITIAL_MOCK_ACCOUNTS];
      }
    } else {
      this.accounts = [...INITIAL_MOCK_ACCOUNTS];
      this.saveAccounts();
    }

    if (savedLogs) {
      try {
        this.auditLogs = JSON.parse(savedLogs);
      } catch (e) {
        this.auditLogs = [...INITIAL_AUDIT_LOGS];
      }
    } else {
      this.auditLogs = [...INITIAL_AUDIT_LOGS];
      this.saveLogs();
    }

    // Auto calculate and update expired status on load
    this.refreshExpiredStatuses();
  },

  // Save to localStorage
  saveAccounts() {
    localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(this.accounts));
  },

  saveLogs() {
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(this.auditLogs));
  },

  // Record Audit Log entry
  addAuditLog(accountId, email, action, details, performedBy = "Quang Đặng (quang.dang1@ntq-solution.com.vn)") {
    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    const newLog = {
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      account_id: accountId,
      account_email: email,
      action: action, // CREATE | UPDATE | RENEW | SUSPEND | ACTIVATE | REVOKE | IMPORT
      performed_by: performedBy,
      timestamp: dateStr,
      details: details
    };

    this.auditLogs.unshift(newLog);
    this.saveLogs();
    return newLog;
  },

  // Refresh and tag expired status
  refreshExpiredStatuses() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    this.accounts.forEach(acc => {
      if (acc.status === 'ACTIVE' && acc.expires_at) {
        const exp = new Date(acc.expires_at);
        exp.setHours(0, 0, 0, 0);
      }
    });
  },

  // Get all unique project names
  getProjectList() {
    const projects = new Set();
    this.accounts.forEach(acc => {
      if (acc.project_name && acc.project_name.trim() !== '') {
        projects.add(acc.project_name.trim());
      }
    });
    return Array.from(projects).sort();
  },

  // Get Summary Metrics
  getMetrics() {
    let total = this.accounts.length;
    let active = 0;
    let expiringSoon = 0; // <= 14 days
    let criticalExpiring = 0; // <= 7 days
    let expired = 0; // < 0 days
    let suspended = 0;
    let revoked = 0;

    const countsByType = {
      PROJECT: 0,
      CLIENT: 0,
      PARTNER: 0
    };

    this.accounts.forEach(acc => {
      if (countsByType[acc.type] !== undefined) {
        countsByType[acc.type]++;
      }

      if (acc.status === 'REVOKED') {
        revoked++;
      } else if (acc.status === 'SUSPENDED') {
        suspended++;
      } else {
        // Active
        active++;
        const days = Utils.getDaysRemaining(acc.expires_at);
        if (days !== null) {
          if (days < 0) {
            expired++;
          } else if (days <= 7) {
            criticalExpiring++;
            expiringSoon++;
          } else if (days <= 14) {
            expiringSoon++;
          }
        }
      }
    });

    return {
      total,
      active,
      expiringSoon,
      criticalExpiring,
      expired,
      suspended,
      revoked,
      countsByType
    };
  },

  // Add new account
  addAccount(accountData) {
    const newAccount = {
      id: `acc-${Date.now()}`,
      email: accountData.email.trim().toLowerCase(),
      type: accountData.type || 'PROJECT',
      status: 'ACTIVE',
      project_name: accountData.project_name || '',
      assignee_name: accountData.assignee_name || '',
      assignee_email: accountData.assignee_email || '',
      manager_pic: accountData.manager_pic || 'Quang Đặng (quang.dang1@ntq-solution.com.vn)',
      created_at: accountData.created_at || new Date().toISOString().split('T')[0],
      expires_at: accountData.expires_at || '',
      revoked_at: null,
      revoke_reason: null,
      notes: accountData.notes || '',
      renew_count: 0
    };

    this.accounts.unshift(newAccount);
    this.saveAccounts();

    this.addAuditLog(
      newAccount.id,
      newAccount.email,
      'CREATE',
      `Cấp mới tài khoản cho dự án: ${newAccount.project_name || 'N/A'}, người nhận: ${newAccount.assignee_name || 'N/A'}, hạn: ${Utils.formatDate(newAccount.expires_at)}`
    );

    return newAccount;
  },

  // Update existing account
  updateAccount(id, updateData) {
    const index = this.accounts.findIndex(a => a.id === id);
    if (index === -1) return null;

    const old = this.accounts[index];
    this.accounts[index] = {
      ...old,
      ...updateData
    };
    this.saveAccounts();

    this.addAuditLog(
      id,
      this.accounts[index].email,
      'UPDATE',
      `Cập nhật thông tin tài khoản (Người dùng: ${this.accounts[index].assignee_name}, Dự án: ${this.accounts[index].project_name})`
    );

    return this.accounts[index];
  },

  // Renew / Extend account expiry
  renewAccount(id, newExpiryDate, reason) {
    const account = this.accounts.find(a => a.id === id);
    if (!account) return null;

    const oldExpiry = account.expires_at;
    account.expires_at = newExpiryDate;
    account.renew_count = (account.renew_count || 0) + 1;
    if (account.status === 'SUSPENDED') {
      account.status = 'ACTIVE';
    }
    this.saveAccounts();

    this.addAuditLog(
      id,
      account.email,
      'RENEW',
      `Gia hạn hạn dùng từ ${Utils.formatDate(oldExpiry)} đến ${Utils.formatDate(newExpiryDate)} (Lần ${account.renew_count}). Lý do: ${reason || 'Không ghi chú'}`
    );

    return account;
  },

  // Suspend account
  suspendAccount(id, reason) {
    const account = this.accounts.find(a => a.id === id);
    if (!account) return null;

    account.status = 'SUSPENDED';
    this.saveAccounts();

    this.addAuditLog(
      id,
      account.email,
      'SUSPEND',
      `Tạm khóa tài khoản. Lý do: ${reason || 'Tạm ngưng dịch vụ'}`
    );

    return account;
  },

  // Reactivate suspended account
  activateAccount(id) {
    const account = this.accounts.find(a => a.id === id);
    if (!account) return null;

    account.status = 'ACTIVE';
    this.saveAccounts();

    this.addAuditLog(
      id,
      account.email,
      'ACTIVATE',
      `Kích hoạt lại tài khoản sau khi tạm khóa`
    );

    return account;
  },

  // Revoke account
  revokeAccount(id, reason) {
    const account = this.accounts.find(a => a.id === id);
    if (!account) return null;

    account.status = 'REVOKED';
    account.revoked_at = new Date().toISOString().split('T')[0];
    account.revoke_reason = reason || 'Thu hồi theo yêu cầu';
    this.saveAccounts();

    this.addAuditLog(
      id,
      account.email,
      'REVOKE',
      `Thu hồi tài khoản vĩnh viễn. Lý do: ${account.revoke_reason}`
    );

    return account;
  },

  // Batch revoke all accounts belonging to a project
  batchRevokeByProject(projectName, reason) {
    const affected = [];
    const today = new Date().toISOString().split('T')[0];

    this.accounts.forEach(acc => {
      if (acc.project_name === projectName && acc.status !== 'REVOKED') {
        acc.status = 'REVOKED';
        acc.revoked_at = today;
        acc.revoke_reason = reason || `Thu hồi đồng loạt do đóng dự án ${projectName}`;
        affected.push(acc);
      }
    });

    if (affected.length > 0) {
      this.saveAccounts();
      affected.forEach(acc => {
        this.addAuditLog(
          acc.id,
          acc.email,
          'REVOKE',
          `[Batch Revoke Dự án ${projectName}] Thu hồi do đóng dự án. Lý do: ${reason}`
        );
      });
    }

    return affected;
  },

  // Import multiple accounts from parsed CSV
  importAccounts(accountsList) {
    let importedCount = 0;
    const today = new Date().toISOString().split('T')[0];

    accountsList.forEach(item => {
      if (!item.email) return;

      const newAccount = {
        id: `acc-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        email: item.email.trim().toLowerCase(),
        type: item.type || 'PROJECT',
        status: item.status || 'ACTIVE',
        project_name: item.project_name || '',
        assignee_name: item.assignee_name || '',
        assignee_email: item.assignee_email || '',
        manager_pic: item.manager_pic || 'Quang Đặng (quang.dang1@ntq-solution.com.vn)',
        created_at: item.created_at || today,
        expires_at: item.expires_at || '',
        revoked_at: item.revoked_at || null,
        revoke_reason: item.revoke_reason || null,
        notes: item.notes || 'Import từ CSV',
        renew_count: parseInt(item.renew_count, 10) || 0
      };

      this.accounts.unshift(newAccount);
      importedCount++;
    });

    this.saveAccounts();
    this.addAuditLog(
      'sys-import',
      'multiple',
      'IMPORT',
      `Import thành công ${importedCount} tài khoản từ file CSV`
    );

    return importedCount;
  },

  // Delete account completely
  deleteAccount(id) {
    const index = this.accounts.findIndex(a => a.id === id);
    if (index === -1) return null;

    const removed = this.accounts.splice(index, 1)[0];
    this.saveAccounts();

    this.addAuditLog(
      id,
      removed.email,
      'DELETE',
      `Xóa vĩnh viễn tài khoản ${removed.email} khỏi hệ thống sổ cái (Dự án: ${removed.project_name || 'N/A'})`
    );

    return removed;
  },

  // Reset to initial mock dataset
  resetToMockData() {
    this.accounts = [...INITIAL_MOCK_ACCOUNTS];
    this.auditLogs = [...INITIAL_AUDIT_LOGS];
    this.saveAccounts();
    this.saveLogs();
  }
};
