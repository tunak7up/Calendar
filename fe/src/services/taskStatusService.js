import { apiFetch } from './api';

export const taskStatusService = {
  getAllStatuses: () => apiFetch('/task-status'),
  
  createStatus: (statusData) => apiFetch('/task-status', {
    method: 'POST',
    body: JSON.stringify(statusData)
  }),
  
  deleteStatus: (name) => apiFetch(`/task-status/${name}`, {
    method: 'DELETE'
  })
};
