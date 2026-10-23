import { apiFetch, BASE_URL, getAccessToken } from './api';

export const backupService = {
  /**
   * Tạo backup thủ công
   */
  create: async () => {
    return await apiFetch('/backup/create', {
      method: 'POST'
    });
  },

  /**
   * Lấy tiến trình backup thời gian thực (% và tốc độ)
   */
  getProgress: async () => {
    return await apiFetch('/backup/progress');
  },

  /**
   * Lấy danh sách backup (phân trang)
   */
  getList: async ({ page = 1, limit = 20 } = {}) => {
    return await apiFetch(`/backup/list?page=${page}&limit=${limit}`);
  },

  /**
   * Download file backup
   * - Nếu BE trả redirect (S3 presigned URL) → mở tab mới
   * - Nếu BE stream file (local) → download trực tiếp
   */
  download: async (id, filename) => {
    const token = getAccessToken();
    const url = `${BASE_URL}/backup/download/${id}`;

    // Dùng fetch để lấy response (hỗ trợ cả redirect và stream)
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      throw new Error(json.message || 'Download thất bại');
    }

    // Nếu server redirect sang S3 URL, URL cuối sẽ là S3 presigned URL
    // fetch sẽ follow redirect tự động và trả về content

    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = filename || `backup_${id}.json.gz`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(objectUrl);
  },

  /**
   * Xóa một backup
   */
  delete: async (id) => {
    return await apiFetch(`/backup/${id}`, {
      method: 'DELETE'
    });
  },

  /**
   * Khôi phục dữ liệu từ một bản backup có sẵn
   */
  restore: async (id, { restoreFiles = true, safetyBackup = true } = {}) => {
    return await apiFetch(`/backup/restore/${id}`, {
      method: 'POST',
      body: JSON.stringify({ restoreFiles, safetyBackup })
    });
  },

  /**
   * Khôi phục dữ liệu từ file Full Backup (.zip) upload từ máy
   */
  restoreFromFile: async (file, { restoreFiles = true, safetyBackup = true } = {}) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('restoreFiles', String(restoreFiles));
    formData.append('safetyBackup', String(safetyBackup));
    return await apiFetch('/backup/restore-upload', {
      method: 'POST',
      body: formData
    });
  },

  /**
   * Lấy tiến trình khôi phục thời gian thực
   */
  getRestoreProgress: async () => {
    return await apiFetch('/backup/restore/progress');
  }
};
