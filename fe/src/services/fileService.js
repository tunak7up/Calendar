import { getAccessToken, setAccessToken, BASE_URL, refreshAccessToken } from './api';
import { saveAuthRedirect } from '../utils/authRedirect';

const API_BASE_URL = BASE_URL;

// Helper to handle token refresh on 401/403
const makeAuthenticatedFetch = async (url, options = {}) => {
  let accessToken = getAccessToken();
  
  const headers = {
    ...options.headers,
  };

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  let fetchOptions = {
    ...options,
    headers,
    credentials: 'include'
  };

  let response = await fetch(url, fetchOptions);

  // Auto-refresh on 401 or 403
  if (response.status === 401 || response.status === 403) {
    try {
      accessToken = await refreshAccessToken();

      // Retry with new token
      headers['Authorization'] = `Bearer ${accessToken}`;
      fetchOptions.headers = headers;
      response = await fetch(url, fetchOptions);
    } catch {
      setAccessToken(null);
      saveAuthRedirect(window.location.pathname + window.location.search + window.location.hash);
      window.location.href = '/login?error=session_expired';
      throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
    }
  }

  return response;
};

export const fileService = {
  // Upload file attachment
  uploadAttachment: async (file, attachable_type, attachable_id) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('attachable_type', attachable_type);
    formData.append('attachable_id', attachable_id);

    try {
      const response = await makeAuthenticatedFetch(`${API_BASE_URL}/file-attachment/upload`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Upload failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  },

  // Get attachments for entity
  getAttachments: async (attachable_type, attachable_id) => {
    try {
      const response = await makeAuthenticatedFetch(
        `${API_BASE_URL}/file-attachment/${attachable_type}/${attachable_id}`,
        { method: 'GET' }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch attachments');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching attachments:', error);
      throw error;
    }
  },

  // Delete single attachment
  deleteAttachment: async (file_attachment_id) => {
    try {
      const response = await makeAuthenticatedFetch(
        `${API_BASE_URL}/file-attachment/${file_attachment_id}`,
        { method: 'DELETE' }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Delete failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Error deleting attachment:', error);
      throw error;
    }
  },

  // Delete all attachments for entity
  deleteAttachmentsByEntity: async (attachable_type, attachable_id) => {
    try {
      const response = await makeAuthenticatedFetch(
        `${API_BASE_URL}/file-attachment/${attachable_type}/${attachable_id}/all`,
        { method: 'DELETE' }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Delete failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Error deleting attachments:', error);
      throw error;
    }
  },

  // Validate file
  validateFile: (file) => {
    const MAX_SIZE = 50 * 1024 * 1024; // 50MB
    const ALLOWED_TYPES = [
      'application/pdf',
      'image/png',
      'image/jpeg',
      'image/jpg',
      'image/gif',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv',
      'text/plain',
      'application/zip',
      'application/x-zip-compressed',
      'multipart/x-zip',
      'application/x-rar-compressed',
      'application/vnd.rar',
      'application/rar',
      'application/x-7z-compressed',
      'application/x-msdownload',
      'application/x-dosexec',
      'application/octet-stream',
      'application/x-executable'
    ];
    const ALLOWED_EXTS = ['.pdf', '.png', '.jpeg', '.jpg', '.gif', '.doc', '.docx', '.xls', '.xlsx', '.csv', '.txt', '.zip', '.rar', '.7z', '.exe', '.apk', '.dmg', '.iso', '.bin'];

    // 1. Kiểm tra định dạng file trước (Instant check)
    const ext = file.name ? file.name.substring(file.name.lastIndexOf('.')).toLowerCase() : '';
    if (!ALLOWED_TYPES.includes(file.type) && !ALLOWED_EXTS.includes(ext)) {
      return {
        valid: false,
        error: `Định dạng file ${ext || file.type} không được hỗ trợ`
      };
    }

    // 2. Kiểm tra dung lượng file sau (Instant check)
    if (file.size > MAX_SIZE) {
      return {
        valid: false,
        error: `Dung lượng file vượt quá giới hạn 50MB`
      };
    }

    return {
      valid: true
    };
  },

  // Format file size for display
  formatFileSize: (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  },

  // Get file icon based on type
  getFileIcon: (fileType) => {
    if (fileType.includes('pdf')) return '?';
    if (fileType.includes('image')) return '??';
    if (fileType.includes('word') || fileType.includes('document')) return '?';
    if (fileType.includes('sheet') || fileType.includes('excel')) return '?';
    if (fileType.includes('zip')) return '??';
    return '?';
  }
};
