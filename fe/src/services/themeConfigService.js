import { apiFetch } from './api';

export const themeConfigService = {
  getAll: async () => {
    return await apiFetch('/theme-config');
  },

  save: async (payload) => {
    return await apiFetch('/theme-config', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  reset: async () => {
    return await apiFetch('/theme-config', {
      method: 'DELETE'
    });
  }
};
