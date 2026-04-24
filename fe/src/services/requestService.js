import { apiFetch } from './api';

export const requestService = {
  submitRequest: (payload) => apiFetch('/request/', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  getAllRequests: () => apiFetch('/request/'),
  getRequestById: (id) => apiFetch(`/request/${id}`),
  updateStatus: (id, status) => apiFetch(`/request/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  }),
};
