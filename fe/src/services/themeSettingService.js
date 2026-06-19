import { apiFetch } from './api';

export const themeSettingService = {
  getAll: async () => {
    return await apiFetch('/theme-setting');
  },
  
  update: async (settingsArray) => {
    return await apiFetch('/theme-setting', {
      method: 'PUT',
      body: JSON.stringify(settingsArray)
    });
  }
};
