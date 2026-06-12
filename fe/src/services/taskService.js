import { apiFetch } from './api';

const downloadWithAuth = async (endpoint, fileName) => {
  const { BASE_URL, getAccessToken, refreshAccessToken, setAccessToken } = await import('./api');

  const url = `${BASE_URL}${endpoint}`;
  let accessToken = getAccessToken();
  const headers = {};

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  let response = await fetch(url, {
    method: 'GET',
    headers,
    credentials: 'include',
  });

  if (response.status === 401 || response.status === 403) {
    try {
      accessToken = await refreshAccessToken();
      headers['Authorization'] = `Bearer ${accessToken}`;
      response = await fetch(url, {
        method: 'GET',
        headers,
        credentials: 'include',
      });
    } catch {
      setAccessToken(null);
      localStorage.removeItem('user');
      const { saveAuthRedirect } = await import('../utils/authRedirect');
      saveAuthRedirect(window.location.pathname + window.location.search + window.location.hash);
      window.location.href = '/login';
      throw new Error('Phi?n ??ng nh?p ?? h?t h?n. Vui l?ng ??ng nh?p l?i.');
    }
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Download failed: ${response.status}`);
  }

  const blob = await response.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(downloadUrl);
};

export const taskService = {
  // --- Create ---
  createTask: (taskData) => apiFetch('/task', {
    method: 'POST',
    body: JSON.stringify(taskData),
  }),

  createSubTask: (parentId, taskData) => apiFetch(`/task/${parentId}`, {
    method: 'POST',
    body: JSON.stringify(taskData),
  }),

  createTaskAttachment: (attachmentData) => apiFetch('/task/attachment', {
    method: 'POST',
    body: JSON.stringify(attachmentData),
  }),

  addParticipant: (taskId, participantData) => apiFetch(`/task/${taskId}/participant`, {
    method: 'POST',
    body: JSON.stringify(participantData),
  }),

  updateParticipant: (taskId, participantId, data) => apiFetch(`/task/${taskId}/participant/${participantId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),

  removeParticipant: (taskId, participantId) => apiFetch(`/task/${taskId}/participant/${participantId}`, {
    method: 'DELETE',
  }),

  // --- Read ---
  getAllTasks: () => apiFetch('/task'),

  getTaskById: (id) => apiFetch(`/task/${id}`),

  getChildTasksByParentId: (parentId) => apiFetch(`/task/parent/${parentId}`),

  getAllTasksByParticipantId: (participantId) => apiFetch(`/task/participant/${participantId}`),

  getTasksByTimeRange: (startTime, endTime) => apiFetch(`/task/time-range?startTime=${startTime}&endTime=${endTime}`),

  getAttachmentsByTaskId: (taskId) => apiFetch(`/task/attachment/${taskId}`),

  // --- Update ---
  updateTask: (id, taskData) => apiFetch(`/task/${id}`, {
    method: 'PUT',
    body: JSON.stringify(taskData),
  }),

  updateTaskTitleOrDescription: (id, taskData) => apiFetch(`/task/update-title-description/${id}`, {
    method: 'PUT',
    body: JSON.stringify(taskData),
  }),

  // --- Delete ---
  deleteTask: (id) => apiFetch(`/task/${id}`, {
    method: 'DELETE',
  }),

  // --- Export / Import ---
  exportTasks: async () => {
    await downloadWithAuth('/task/export', 'tasks.xlsx');
  },

  exportTemplate: async () => {
    await downloadWithAuth('/task/import-template', 'import_template.xlsx');
  },

  importTasks: (formData) => apiFetch('/task/import', {
    method: 'POST',
    body: formData,
  }),
};
