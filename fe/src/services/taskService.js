import { apiFetch } from './api';

export const taskService = {
  getTasks: () => apiFetch('/tasks'),
  createTask: (task) => apiFetch('/tasks', {
    method: 'POST',
    body: JSON.stringify(task),
  }),
  // Add more task-related methods
};
