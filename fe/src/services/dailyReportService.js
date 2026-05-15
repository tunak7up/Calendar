import { apiFetch } from './api';

export const dailyReportService = {
  getAllDailyReportsInRange: async (startDate, endDate) => {
    return apiFetch(`/daily-report/range?start=${startDate}&end=${endDate}`);
  },
  getDailyReportByDate: async (date) => {
    return apiFetch(`/daily-report/date/${date}`);
  },
  getDailyReportByPersonId: async (personId) => {
    return apiFetch(`/daily-report/person/${personId}`);
  }
};
