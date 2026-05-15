import { apiFetch } from './api';

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
};
