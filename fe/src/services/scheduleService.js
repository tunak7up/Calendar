import { apiFetch } from './api';

export const scheduleService = {
  getPersonSchedule: (personId) => apiFetch(`/schedule/person/${personId}`),
  // Add more schedule-related methods as needed
};
