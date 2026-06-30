import { apiFetch } from './api';

export const aiAgentService = {
  getAll: async () => {
    return await apiFetch('/ai-agent');
  },
  
  getById: async (id) => {
    return await apiFetch(`/ai-agent/${id}`);
  },

  update: async (id, updatedFields) => {
    return await apiFetch(`/ai-agent/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updatedFields)
    });
  },

  analyzePerformance: async (personId) => {
    return await apiFetch('/ai-performance/analyze', {
      method: 'POST',
      body: JSON.stringify({ personId })
    });
  },

  analyzeCompanyMonthly: async (month, year) => {
    return await apiFetch('/ai-performance/analyze-company', {
      method: 'POST',
      body: JSON.stringify({ month, year })
    });
  },

  parseScheduleRequest: async (inputText) => {
    return await apiFetch('/ai-request-parser/parse-schedule', {
      method: 'POST',
      body: JSON.stringify({ inputText })
    });
  }
};
