import api from './api';

export const randevuService = {
  getAll: (params = {}) => api.get('/randevu', { params }),
  getById: (id) => api.get(`/randevu/${id}`),
  create: (data) => api.post('/randevu', data),
  update: (id, data) => api.put(`/randevu/${id}`, data),
  delete: (id) => api.delete(`/randevu/${id}`),
};

