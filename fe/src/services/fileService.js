const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

export const fileService = {
  // Upload file attachment
  uploadAttachment: async (file, attachable_type, attachable_id) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('attachable_type', attachable_type);
    formData.append('attachable_id', attachable_id);

    try {
      const response = await fetch(`${API_BASE_URL}/file-attachment/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
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
      const response = await fetch(
        `${API_BASE_URL}/file-attachment/${attachable_type}/${attachable_id}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
          }
        }
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
      const response = await fetch(
        `${API_BASE_URL}/file-attachment/${file_attachment_id}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
          }
        }
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
      const response = await fetch(
        `${API_BASE_URL}/file-attachment/${attachable_type}/${attachable_id}/all`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
          }
        }
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
      'application/zip'
    ];

    if (file.size > MAX_SIZE) {
      return {
        valid: false,
        error: `File size exceeds 50MB limit`
      };
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return {
        valid: false,
        error: `File type ${file.type} is not allowed`
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
