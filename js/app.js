/**
 * App Main Controller for Mail Account Manager - NTQ Solution
 * UI Event Listeners, Table Rendering, Filter Logic, and Modals
 */

const App = {
  activeTab: 'ALL',
  statusFilter: 'ALL',
  projectFilter: 'ALL',
  searchKeyword: '',
  sortColumn: 'expires_at',
  sortDirection: 'asc',
  selectedAccountId: null,
  parsedImportData: [],

  init() {
    Store.init();
    this.initTheme();
    this.initEventListeners();
    this.renderAll();
  },

  // Initialize Theme preference
  initTheme() {
    const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME) || 'dark';
    if (savedTheme === 'light') {
      document.body.classList.add('light-theme');
    }
  },

  toggleTheme() {
    document.body.classList.toggle('light-theme');
    const isLight = document.body.classList.contains('light-theme');
    localStorage.setItem(STORAGE_KEYS.THEME, isLight ? 'light' : 'dark');
    Utils.showToast(`Đã chuyển sang giao diện ${isLight ? 'Sáng' : 'Tối'}`);
  },

  // Setup all UI event listeners
  initEventListeners() {
    // Theme toggle
    document.getElementById('themeToggleBtn')?.addEventListener('click', () => this.toggleTheme());

    // Search input
    document.getElementById('searchInput')?.addEventListener('input', (e) => {
      this.searchKeyword = e.target.value.trim().toLowerCase();
      this.renderTable();
    });

    // Category Tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.activeTab = btn.getAttribute('data-tab');
        this.renderTable();
      });
    });

    // Status Filter dropdown
    document.getElementById('statusFilterSelect')?.addEventListener('change', (e) => {
      this.statusFilter = e.target.value;
      this.renderTable();
    });

    // Project Filter dropdown
    document.getElementById('projectFilterSelect')?.addEventListener('change', (e) => {
      this.projectFilter = e.target.value;
      this.renderTable();
    });

    // Add Account Button
    document.getElementById('btnNewAccount')?.addEventListener('click', () => {
      this.openAccountModal();
    });

    // Batch Revoke Project Button
    document.getElementById('btnBatchRevoke')?.addEventListener('click', () => {
      this.openBatchRevokeModal();
    });

    // Export CSV Button
    document.getElementById('btnExportCSV')?.addEventListener('click', () => {
      const filtered = this.getFilteredAccounts();
      if (filtered.length === 0) {
        Utils.showToast("Không có dữ liệu để xuất!", "warning");
        return;
      }
      CSVHandler.exportToCSV(filtered, `danh_sach_mail_ntq_${new Date().toISOString().split('T')[0]}.csv`);
      Utils.showToast(`Đã xuất ${filtered.length} tài khoản ra file CSV!`);
    });

    // Import CSV Button
    document.getElementById('btnImportCSV')?.addEventListener('click', () => {
      this.openImportModal();
    });

    // Download CSV Template Button
    document.getElementById('btnDownloadTemplate')?.addEventListener('click', () => {
      CSVHandler.downloadTemplate();
      Utils.showToast("Đã tải xuống file CSV mẫu NTQ!");
    });

    // Reset Data Button
    document.getElementById('btnResetData')?.addEventListener('click', () => {
      if (confirm("Khôi phục toàn bộ dữ liệu về danh sách mẫu ban đầu của NTQ Solution?")) {
        Store.resetToMockData();
        this.renderAll();
        Utils.showToast("Đã khôi phục dữ liệu mẫu NTQ!");
      }
    });

    // Modal Close Buttons
    document.querySelectorAll('[data-close-modal]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const modalId = btn.getAttribute('data-close-modal');
        this.closeModal(modalId);
      });
    });

    // Form Submissions
    document.getElementById('accountForm')?.addEventListener('submit', (e) => this.handleSaveAccount(e));
    document.getElementById('renewForm')?.addEventListener('submit', (e) => this.handleSaveRenew(e));
    document.getElementById('revokeForm')?.addEventListener('submit', (e) => this.handleSaveRevoke(e));
    document.getElementById('batchRevokeForm')?.addEventListener('submit', (e) => this.handleSaveBatchRevoke(e));

    // Delete Button in Edit Modal
    document.getElementById('btnDeleteInModal')?.addEventListener('click', () => {
      if (this.selectedAccountId) {
        this.closeModal('accountModal');
        this.handleDeleteAccount(this.selectedAccountId);
      }
    });

    // File Input for CSV
    const csvFileInput = document.getElementById('csvFileInput');
    csvFileInput?.addEventListener('change', (e) => this.handleCSVFileSelected(e));

    // Drag and drop CSV upload
    const dropZone = document.getElementById('csvDropZone');
    if (dropZone) {
      ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, (e) => {
          e.preventDefault();
          dropZone.classList.add('dragover');
        });
      });
      ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, (e) => {
          e.preventDefault();
          dropZone.classList.remove('dragover');
        });
      });
      dropZone.addEventListener('drop', (e) => {
        const files = e.dataTransfer.files;
        if (files && files[0]) {
          this.readCSVFile(files[0]);
        }
      });
    }

    // Confirm Import Button
    document.getElementById('btnConfirmImport')?.addEventListener('click', () => {
      if (this.parsedImportData.length === 0) return;
      const count = Store.importAccounts(this.parsedImportData);
      this.closeModal('importModal');
      this.renderAll();
      Utils.showToast(`Import thành công ${count} tài khoản!`);
    });

    // Sorting Headers
    document.querySelectorAll('th.sortable').forEach(th => {
      th.addEventListener('click', () => {
        const col = th.getAttribute('data-sort');
        if (this.sortColumn === col) {
          this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
          this.sortColumn = col;
          this.sortDirection = 'asc';
        }
        this.renderTable();
      });
    });
  },

  // Render everything
  renderAll() {
    this.renderDashboard();
    this.renderProjectOptions();
    this.renderTable();
  },

  // Render KPI Metrics
  renderDashboard() {
    const metrics = Store.getMetrics();
    
    document.getElementById('kpiTotal').textContent = metrics.total;
    document.getElementById('kpiActive').textContent = metrics.active;
    document.getElementById('kpiExpiringSoon').textContent = metrics.expiringSoon;
    document.getElementById('kpiExpired').textContent = metrics.expired;

    // Update tab counts
    document.getElementById('tabCountAll').textContent = metrics.total;
    document.getElementById('tabCountProject').textContent = metrics.countsByType.PROJECT || 0;
    document.getElementById('tabCountClient').textContent = metrics.countsByType.CLIENT || 0;
    document.getElementById('tabCountPartner').textContent = metrics.countsByType.PARTNER || 0;
  },

  // Render project options in filter dropdowns
  renderProjectOptions() {
    const projects = Store.getProjectList();
    const select = document.getElementById('projectFilterSelect');
    const batchSelect = document.getElementById('batchProjectSelect');

    if (select) {
      const currentVal = select.value;
      select.innerHTML = `<option value="ALL">Tất cả dự án (${projects.length})</option>`;
      projects.forEach(p => {
        select.innerHTML += `<option value="${p}">${p}</option>`;
      });
      select.value = currentVal || 'ALL';
    }

    if (batchSelect) {
      batchSelect.innerHTML = `<option value="">-- Chọn dự án cần đóng --</option>`;
      projects.forEach(p => {
        const count = Store.accounts.filter(a => a.project_name === p && a.status !== 'REVOKED').length;
        if (count > 0) {
          batchSelect.innerHTML += `<option value="${p}">${p} (${count} mail đang cấp)</option>`;
        }
      });
    }
  },

  // Filter and sort accounts
  getFilteredAccounts() {
    return Store.accounts.filter(acc => {
      // 1. Tab category filter
      if (this.activeTab !== 'ALL' && acc.type !== this.activeTab) {
        return false;
      }

      // 2. Project filter
      if (this.projectFilter !== 'ALL' && acc.project_name !== this.projectFilter) {
        return false;
      }

      // 3. Status filter
      const days = Utils.getDaysRemaining(acc.expires_at);
      if (this.statusFilter === 'ACTIVE' && acc.status !== 'ACTIVE') return false;
      if (this.statusFilter === 'SUSPENDED' && acc.status !== 'SUSPENDED') return false;
      if (this.statusFilter === 'REVOKED' && acc.status !== 'REVOKED') return false;
      if (this.statusFilter === 'EXPIRING_7') {
        if (acc.status !== 'ACTIVE' || days === null || days > 7 || days < 0) return false;
      }
      if (this.statusFilter === 'EXPIRING_14') {
        if (acc.status !== 'ACTIVE' || days === null || days > 14 || days < 0) return false;
      }
      if (this.statusFilter === 'OVERDUE') {
        if (acc.status !== 'ACTIVE' || days === null || days >= 0) return false;
      }

      // 4. Keyword search
      if (this.searchKeyword) {
        const fullText = `${acc.email} ${acc.project_name} ${acc.assignee_name} ${acc.assignee_email} ${acc.notes} ${acc.manager_pic}`.toLowerCase();
        if (!fullText.includes(this.searchKeyword)) return false;
      }

      return true;
    }).sort((a, b) => {
      let valA = a[this.sortColumn];
      let valB = b[this.sortColumn];

      if (this.sortColumn === 'expires_at' || this.sortColumn === 'created_at') {
        const timeA = valA ? new Date(valA).getTime() : (this.sortDirection === 'asc' ? Infinity : -Infinity);
        const timeB = valB ? new Date(valB).getTime() : (this.sortDirection === 'asc' ? Infinity : -Infinity);
        return this.sortDirection === 'asc' ? timeA - timeB : timeB - timeA;
      }

      // String comparison with Vietnamese collation
      const strA = String(valA || '').trim();
      const strB = String(valB || '').trim();
      const cmp = strA.localeCompare(strB, 'vi', { sensitivity: 'base', numeric: true });
      return this.sortDirection === 'asc' ? cmp : -cmp;
    });
  },

  // Render Table content
  renderTable() {
    const tableBody = document.getElementById('accountTableBody');
    const tableCountInfo = document.getElementById('tableCountInfo');
    const filtered = this.getFilteredAccounts();

    // Update active sort indicator on headers
    document.querySelectorAll('th.sortable').forEach(th => {
      th.classList.remove('sorted-asc', 'sorted-desc');
      if (th.getAttribute('data-sort') === this.sortColumn) {
        th.classList.add(this.sortDirection === 'asc' ? 'sorted-asc' : 'sorted-desc');
      }
    });

    if (tableCountInfo) {
      tableCountInfo.textContent = `Hiển thị ${filtered.length} / ${Store.accounts.length} tài khoản`;
    }

    if (filtered.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="7">
            <div class="empty-state">
              <div class="empty-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              </div>
              <p style="font-weight: 600;">Không tìm thấy tài khoản email phù hợp</p>
              <p style="font-size: 0.8rem;">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
            </div>
          </td>
        </tr>
      `;
      return;
    }

    let html = '';
    filtered.forEach(acc => {
      const expBadge = Utils.getExpiryBadge(acc);
      const days = Utils.getDaysRemaining(acc.expires_at);

      // Status Badge
      let statusBadgeHtml = '';
      if (acc.status === 'REVOKED') {
        statusBadgeHtml = `<span class="badge badge-revoked"><span class="badge-dot"></span>Đã thu hồi</span>`;
      } else if (acc.status === 'SUSPENDED') {
        statusBadgeHtml = `<span class="badge badge-suspended"><span class="badge-dot"></span>Tạm khóa</span>`;
      } else if (days !== null && days < 0) {
        statusBadgeHtml = `<span class="badge badge-expired"><span class="badge-dot"></span>Quá hạn</span>`;
      } else {
        statusBadgeHtml = `<span class="badge badge-active"><span class="badge-dot"></span>Active</span>`;
      }

      // Type Badge
      let typeBadgeClass = 'type-tag-project';
      let typeLabel = 'Dự án';
      if (acc.type === 'CLIENT') {
        typeBadgeClass = 'type-tag-client';
        typeLabel = 'Khách hàng';
      } else if (acc.type === 'PARTNER') {
        typeBadgeClass = 'type-tag-partner';
        typeLabel = 'Đối tác';
      }

      html += `
        <tr>
          <td>
            <div class="cell-email">
              <span>${acc.email}</span>
              <button class="email-copy-btn" title="Sao chép Email" onclick="Utils.copyToClipboard('${acc.email}', 'Đã sao chép email ${acc.email}')">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
              </button>
            </div>
          </td>
          <td>
            <span class="type-tag ${typeBadgeClass}">${typeLabel}</span>
          </td>
          <td>
            <div class="cell-project">${acc.project_name || '—'}</div>
            <div style="font-size: 0.725rem; color: var(--text-muted);">PIC: ${acc.manager_pic || 'Quang Đặng (quang.dang1@ntq-solution.com.vn)'}</div>
          </td>
          <td>
            <div class="cell-assignee">
              <span class="assignee-name">${acc.assignee_name || 'Chưa gán'}</span>
              <span class="assignee-email">${acc.assignee_email || '—'}</span>
            </div>
          </td>
          <td>
            ${statusBadgeHtml}
          </td>
          <td>
            <div class="expiry-indicator">
              <span class="expiry-date">${Utils.formatDate(acc.expires_at)}</span>
              <span class="expiry-countdown ${expBadge.class}">${expBadge.label}</span>
            </div>
          </td>
          <td>
            <div class="row-actions">
              ${acc.status !== 'REVOKED' ? `
                <button class="btn-action btn-action-text btn-action-renew" title="Gia hạn thời gian" onclick="App.openRenewModal('${acc.id}')">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"></polyline><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg>
                  <span>Gia hạn</span>
                </button>
              ` : ''}

              ${acc.status === 'ACTIVE' ? `
                <button class="btn-action btn-action-text btn-action-suspend" title="Tạm khóa tài khoản" onclick="App.handleQuickSuspend('${acc.id}')">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
                  <span>Khóa</span>
                </button>
              ` : ''}

              ${acc.status === 'SUSPENDED' ? `
                <button class="btn-action btn-action-text btn-action-activate text-success" title="Mở khóa tài khoản" onclick="App.handleQuickActivate('${acc.id}')">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                  <span>Mở lại</span>
                </button>
              ` : ''}

              ${acc.status !== 'REVOKED' ? `
                <button class="btn-action btn-action-text btn-action-revoke" title="Thu hồi vĩnh viễn" onclick="App.openRevokeModal('${acc.id}')">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
                  <span>Thu hồi</span>
                </button>
              ` : `
                <button class="btn-action btn-action-text btn-action-delete" title="Xóa vĩnh viễn khỏi sổ cái" onclick="App.handleDeleteAccount('${acc.id}')">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                  <span>Xóa</span>
                </button>
              `}

              <button class="btn-action btn-action-icon" title="Copy mẫu bàn giao" onclick="App.copyHandoverSnippet('${acc.id}')">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg>
              </button>

              <button class="btn-action btn-action-icon" title="Xem lịch sử Audit Log & Chi tiết" onclick="App.openAuditModal('${acc.id}')">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
              </button>

              <button class="btn-action btn-action-icon" title="Chỉnh sửa thông tin" onclick="App.openAccountModal('${acc.id}')">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
              </button>
            </div>
          </td>
        </tr>
      `;
    });

    tableBody.innerHTML = html;
  },

  // Modal Controls
  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  },

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    }
  },

  // Add / Edit Account Modal
  openAccountModal(accountId = null) {
    this.selectedAccountId = accountId;
    const modal = document.getElementById('accountModal');
    const title = document.getElementById('accountModalTitle');
    const form = document.getElementById('accountForm');
    const deleteBtn = document.getElementById('btnDeleteInModal');
    form.reset();

    if (accountId) {
      const acc = Store.accounts.find(a => a.id === accountId);
      if (acc) {
        title.textContent = 'Chỉnh Sửa Tài Khoản Email';
        document.getElementById('accEmail').value = acc.email;
        document.getElementById('accType').value = acc.type;
        document.getElementById('accProject').value = acc.project_name || '';
        document.getElementById('accAssigneeName').value = acc.assignee_name || '';
        document.getElementById('accAssigneeEmail').value = acc.assignee_email || '';
        document.getElementById('accManagerPic').value = acc.manager_pic || 'Quang Đặng (quang.dang1@ntq-solution.com.vn)';
        document.getElementById('accExpiresAt').value = acc.expires_at || '';
        document.getElementById('accNotes').value = acc.notes || '';
      }
      if (deleteBtn) deleteBtn.style.display = 'inline-flex';
    } else {
      title.textContent = 'Cấp Mới Tài Khoản Email';
      document.getElementById('accManagerPic').value = 'Quang Đặng (quang.dang1@ntq-solution.com.vn)';
      // Default expiry date: 3 months from today
      const defaultExp = new Date();
      defaultExp.setMonth(defaultExp.getMonth() + 3);
      document.getElementById('accExpiresAt').value = defaultExp.toISOString().split('T')[0];
      if (deleteBtn) deleteBtn.style.display = 'none';
    }

    this.openModal('accountModal');
  },

  handleSaveAccount(e) {
    e.preventDefault();
    const data = {
      email: document.getElementById('accEmail').value,
      type: document.getElementById('accType').value,
      project_name: document.getElementById('accProject').value,
      assignee_name: document.getElementById('accAssigneeName').value,
      assignee_email: document.getElementById('accAssigneeEmail').value,
      manager_pic: document.getElementById('accManagerPic').value,
      expires_at: document.getElementById('accExpiresAt').value,
      notes: document.getElementById('accNotes').value
    };

    if (this.selectedAccountId) {
      Store.updateAccount(this.selectedAccountId, data);
      Utils.showToast("Cập nhật thông tin thành công!");
    } else {
      Store.addAccount(data);
      Utils.showToast("Đã cấp mới tài khoản thành công!");
    }

    this.closeModal('accountModal');
    this.renderAll();
  },

  // Open Renew Modal
  openRenewModal(accountId) {
    this.selectedAccountId = accountId;
    const acc = Store.accounts.find(a => a.id === accountId);
    if (!acc) return;

    document.getElementById('renewAccountEmail').textContent = acc.email;
    document.getElementById('renewCurrentExpiry').textContent = Utils.formatDate(acc.expires_at);
    document.getElementById('renewReason').value = '';

    // Calculate default +30 days from current expiry or today
    const baseDate = acc.expires_at ? new Date(acc.expires_at) : new Date();
    baseDate.setDate(baseDate.getDate() + 30);
    document.getElementById('renewNewDate').value = baseDate.toISOString().split('T')[0];

    // Quick extend buttons (+30, +60, +90)
    document.querySelectorAll('.btn-quick-extend').forEach(btn => {
      btn.onclick = () => {
        const addDays = parseInt(btn.getAttribute('data-days'), 10);
        const newD = acc.expires_at ? new Date(acc.expires_at) : new Date();
        newD.setDate(newD.getDate() + addDays);
        document.getElementById('renewNewDate').value = newD.toISOString().split('T')[0];
      };
    });

    this.openModal('renewModal');
  },

  handleSaveRenew(e) {
    e.preventDefault();
    const newDate = document.getElementById('renewNewDate').value;
    const reason = document.getElementById('renewReason').value;

    if (!newDate) {
      Utils.showToast("Vui lòng chọn ngày hết hạn mới!", "warning");
      return;
    }

    Store.renewAccount(this.selectedAccountId, newDate, reason);
    this.closeModal('renewModal');
    this.renderAll();
    Utils.showToast("Gia hạn tài khoản thành công!");
  },

  // Open Revoke Modal
  openRevokeModal(accountId) {
    this.selectedAccountId = accountId;
    const acc = Store.accounts.find(a => a.id === accountId);
    if (!acc) return;

    document.getElementById('revokeAccountEmail').textContent = acc.email;
    document.getElementById('revokeReason').value = '';
    this.openModal('revokeModal');
  },

  handleSaveRevoke(e) {
    e.preventDefault();
    const reason = document.getElementById('revokeReason').value;
    Store.revokeAccount(this.selectedAccountId, reason);
    this.closeModal('revokeModal');
    this.renderAll();
    Utils.showToast("Đã thu hồi tài khoản thành công!");
  },

  // Delete account completely
  handleDeleteAccount(accountId) {
    const acc = Store.accounts.find(a => a.id === accountId);
    if (!acc) return;

    if (confirm(`Bạn có chắc chắn muốn XÓA VĨNH VIỄN tài khoản "${acc.email}" khỏi hệ thống sổ cái?\n\nLưu ý: Thao tác này sẽ loại bỏ hoàn toàn tài khoản khỏi danh sách.`)) {
      Store.deleteAccount(accountId);
      this.renderAll();
      Utils.showToast(`Đã xóa vĩnh viễn tài khoản ${acc.email}`);
    }
  },

  // Quick suspend/activate
  handleQuickSuspend(accountId) {
    if (confirm("Tạm khóa tài khoản này? (Có thể mở lại bất cứ lúc nào)")) {
      Store.suspendAccount(accountId, "Tạm khóa qua nút nhanh");
      this.renderAll();
      Utils.showToast("Đã tạm khóa tài khoản!");
    }
  },

  handleQuickActivate(accountId) {
    Store.activateAccount(accountId);
    this.renderAll();
    Utils.showToast("Đã kích hoạt lại tài khoản!");
  },

  // Batch Revoke Project Modal
  openBatchRevokeModal() {
    this.renderProjectOptions();
    this.openModal('batchRevokeModal');
  },

  handleSaveBatchRevoke(e) {
    e.preventDefault();
    const projectName = document.getElementById('batchProjectSelect').value;
    const reason = document.getElementById('batchRevokeReason').value;

    if (!projectName) {
      Utils.showToast("Vui lòng chọn dự án!", "warning");
      return;
    }

    const affected = Store.batchRevokeByProject(projectName, reason);
    this.closeModal('batchRevokeModal');
    this.renderAll();
    Utils.showToast(`Đã thu hồi thành công ${affected.length} tài khoản thuộc dự án ${projectName}!`);
  },

  // Audit Log & Details Modal
  openAuditModal(accountId) {
    const acc = Store.accounts.find(a => a.id === accountId);
    if (!acc) return;

    document.getElementById('auditAccountEmail').textContent = acc.email;
    
    // Details summary
    document.getElementById('auditDetailProject').textContent = acc.project_name || 'N/A';
    document.getElementById('auditDetailAssignee').textContent = `${acc.assignee_name || 'N/A'} (${acc.assignee_email || 'N/A'})`;
    document.getElementById('auditDetailStatus').textContent = acc.status;
    document.getElementById('auditDetailExpiry').textContent = Utils.formatDate(acc.expires_at);
    document.getElementById('auditDetailRenewCount').textContent = `${acc.renew_count || 0} lần`;
    document.getElementById('auditDetailNotes').textContent = acc.notes || 'Không có';

    // Render timeline logs for this account
    const accountLogs = Store.auditLogs.filter(l => l.account_id === accountId);
    const timelineContainer = document.getElementById('auditTimeline');

    if (accountLogs.length === 0) {
      timelineContainer.innerHTML = `<p style="color: var(--text-muted); font-size: 0.85rem;">Chưa có lịch sử thao tác chi tiết</p>`;
    } else {
      let timelineHtml = '<div class="timeline">';
      accountLogs.forEach(log => {
        timelineHtml += `
          <div class="timeline-item">
            <div class="timeline-dot"></div>
            <div class="timeline-header">
              <span class="timeline-action">[${log.action}] ${log.performed_by}</span>
              <span class="timeline-time">${log.timestamp}</span>
            </div>
            <div class="timeline-desc">${log.details}</div>
          </div>
        `;
      });
      timelineHtml += '</div>';
      timelineContainer.innerHTML = timelineHtml;
    }

    this.openModal('auditModal');
  },

  // Copy handover snippet
  copyHandoverSnippet(accountId) {
    const acc = Store.accounts.find(a => a.id === accountId);
    if (!acc) return;
    const text = Utils.generateHandoverText(acc);
    Utils.copyToClipboard(text, `Đã sao chép mẫu bàn giao cho email ${acc.email}!`);
  },

  // Import CSV Modal & Handlers
  openImportModal() {
    this.parsedImportData = [];
    document.getElementById('importPreviewSection').style.display = 'none';
    document.getElementById('btnConfirmImport').style.display = 'none';
    document.getElementById('csvFileInput').value = '';
    this.openModal('importModal');
  },

  handleCSVFileSelected(e) {
    const file = e.target.files[0];
    if (file) {
      this.readCSVFile(file);
    }
  },

  readCSVFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const parsed = CSVHandler.parseCSV(text);
      this.parsedImportData = parsed;
      this.renderImportPreview(parsed);
    };
    reader.readAsText(file);
  },

  renderImportPreview(items) {
    const previewSection = document.getElementById('importPreviewSection');
    const tbody = document.getElementById('importPreviewTbody');
    const countLabel = document.getElementById('importCountLabel');
    const confirmBtn = document.getElementById('btnConfirmImport');

    if (items.length === 0) {
      Utils.showToast("Không tìm thấy dòng dữ liệu hợp lệ trong file CSV!", "warning");
      return;
    }

    countLabel.textContent = `Tìm thấy ${items.length} tài khoản hợp lệ sẵn sàng import:`;
    let html = '';
    items.slice(0, 5).forEach((item, idx) => {
      html += `
        <tr>
          <td>${idx + 1}</td>
          <td><b>${item.email}</b></td>
          <td>${item.type || 'PROJECT'}</td>
          <td>${item.project_name || '—'}</td>
          <td>${item.assignee_name || '—'}</td>
          <td>${Utils.formatDate(item.expires_at)}</td>
        </tr>
      `;
    });

    if (items.length > 5) {
      html += `<tr><td colspan="6" style="text-align: center; color: var(--text-muted);">... và ${items.length - 5} dòng khác</td></tr>`;
    }

    tbody.innerHTML = html;
    previewSection.style.display = 'block';
    confirmBtn.style.display = 'inline-flex';
  }
};

// Start application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
