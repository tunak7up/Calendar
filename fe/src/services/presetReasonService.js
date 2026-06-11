import { apiFetch } from './api';

export const presetReasonService = {
  getAll: async () => {
    return await apiFetch('/preset-reason');
  },
  
  getByType: async (type) => {
    const res = await apiFetch('/preset-reason');
    if (res.success && Array.isArray(res.data)) {
      return {
        ...res,
        data: res.data.filter(r => r.type === type && r.isActive)
      };
    }
    return res;
  },

  create: async (reason) => {
    return await apiFetch('/preset-reason', {
      method: 'POST',
      body: JSON.stringify(reason)
    });
  },

  update: async (id, updatedFields) => {
    return await apiFetch(`/preset-reason/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updatedFields)
    });
  },

  delete: async (id) => {
    return await apiFetch(`/preset-reason/${id}`, {
      method: 'DELETE'
    });
  }
};
