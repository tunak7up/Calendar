import { apiFetch } from './api';

export const scheduleService = {
  createSchedule: (scheduleData) => apiFetch('/schedule', {
    method: 'POST',
    body: JSON.stringify(scheduleData),
  }),

  getAllSchedules: () => apiFetch('/schedule'),

  getSchedulesByRange: (start, end) => apiFetch(`/schedule/range?start=${start}&end=${end}`),

  getScheduleByPersonId: (personId) => apiFetch(`/schedule/person/${personId}`),

  updateSchedule: (id, scheduleData) => apiFetch(`/schedule/${id}`, {
    method: 'PUT',
    body: JSON.stringify(scheduleData),
  }),

  deleteSchedule: (id) => apiFetch(`/schedule/${id}`, {
    method: 'DELETE',
  }),
};
