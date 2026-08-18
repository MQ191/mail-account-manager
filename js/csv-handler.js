/**
 * CSV Handler Module for Mail Account Manager - NTQ Solution
 * Import, Export, Validation, and Template Generation
 */

const CSVHandler = {
  // Parse CSV text to array of objects
  parseCSV(text) {
    const lines = text.split(/\r\n|\n/).filter(line => line.trim() !== '');
    if (lines.length < 2) return [];

    // Parse header
    const headers = this.parseCSVLine(lines[0]).map(h => h.trim().toLowerCase());

    const result = [];
    for (let i = 1; i < lines.length; i++) {
      const currentline = this.parseCSVLine(lines[i]);
      if (currentline.length === 0 || currentline.every(c => c === '')) continue;

      const obj = {};
      headers.forEach((header, index) => {
        let val = currentline[index] ? currentline[index].trim() : '';
        // Map common header variations
        if (header.includes('email') && !header.includes('assignee')) obj.email = val;
        else if (header.includes('type') || header.includes('loại')) {
          const typeUpper = val.toUpperCase();
          if (typeUpper.includes('KH') || typeUpper.includes('CLIENT')) obj.type = 'CLIENT';
          else if (typeUpper.includes('ĐỐI TÁC') || typeUpper.includes('PARTNER')) obj.type = 'PARTNER';
          else obj.type = 'PROJECT';
        }
        else if (header.includes('project') || header.includes('dự án')) obj.project_name = val;
        else if (header.includes('assignee_name') || header.includes('người dùng') || header.includes('tên người')) obj.assignee_name = val;
        else if (header.includes('assignee_email') || header.includes('mail người')) obj.assignee_email = val;
        else if (header.includes('expires') || header.includes('hạn')) obj.expires_at = val;
        else if (header.includes('pic') || header.includes('quản lý')) obj.manager_pic = val;
        else if (header.includes('note') || header.includes('ghi chú')) obj.notes = val;
        else obj[header] = val;
      });

      if (obj.email) {
        result.push(obj);
      }
    }

    return result;
  },

  // Parse a single CSV line with support for quotes
  parseCSVLine(line) {
    const values = [];
    let insideQuote = false;
    let entry = '';

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (insideQuote && line[i + 1] === '"') {
          entry += '"';
          i++; // skip next quote
        } else {
          insideQuote = !insideQuote;
        }
      } else if (char === ',' && !insideQuote) {
        values.push(entry);
        entry = '';
      } else {
        entry += char;
      }
    }
    values.push(entry);
    return values;
  },

  // Export array of accounts to CSV file download (with UTF-8 BOM)
  exportToCSV(accounts, filename = "danh_sach_mail_ntq.csv") {
    const headers = [
      "Email",
      "PhanLoai (PROJECT/CLIENT/PARTNER)",
      "TrangThai",
      "DuAn",
      "NguoiSuDung",
      "EmailLienHe",
      "IT_PhuTrach",
      "NgayCap",
      "NgayHetHan",
      "GiaHanSoLan",
      "NgayThuHoi",
      "LyDoThuHoi",
      "GhiChu"
    ];

    const rows = accounts.map(acc => [
      acc.email,
      acc.type,
      acc.status,
      acc.project_name || "",
      acc.assignee_name || "",
      acc.assignee_email || "",
      acc.manager_pic || "",
      acc.created_at || "",
      acc.expires_at || "",
      acc.renew_count || 0,
      acc.revoked_at || "",
      acc.revoke_reason || "",
      acc.notes || ""
    ]);

    let csvContent = headers.map(this.escapeCSVCell).join(",") + "\r\n";
    rows.forEach(row => {
      csvContent += row.map(this.escapeCSVCell).join(",") + "\r\n";
    });

    // Add UTF-8 BOM so Excel opens Vietnamese characters correctly
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  // Download template CSV file
  downloadTemplate() {
    const sampleData = [
      {
        email: "sample-dev@ntq-solution.com.vn",
        type: "PROJECT",
        status: "ACTIVE",
        project_name: "Dự án Demo NTQ",
        assignee_name: "Nguyễn Văn Mẫu",
        assignee_email: "mau.nv@ntq-solution.com.vn",
        manager_pic: "Quang Đặng (quang.dang1@ntq-solution.com.vn)",
        created_at: "2026-08-17",
        expires_at: "2026-11-17",
        renew_count: 0,
        revoked_at: "",
        revoke_reason: "",
        notes: "Mẫu dữ liệu chuẩn để import"
      }
    ];

    this.exportToCSV(sampleData, "mau_danh_sach_cap_mail_ntq.csv");
  },

  // Escape cell value for CSV
  escapeCSVCell(cell) {
    if (cell === null || cell === undefined) return '""';
    const str = String(cell);
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return `"${str}"`;
  }
};
