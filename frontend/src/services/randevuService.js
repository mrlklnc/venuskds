import apiClient from './apiClient';

export const randevuService = {
  getAll: (params = {}) => apiClient.get('/randevu', { params }),
  getById: (id) => apiClient.get(`/randevu/${id}`),
  create: (data) => apiClient.post('/randevu', data),
  update: (id, data) => apiClient.put(`/randevu/${id}`, data),
  delete: (id) => apiClient.delete(`/randevu/${id}`),
};

