import api from './api';

export const musteriService = {
  getAll: (params = {}) => api.get('/musteri', { params }),
  getById: (id) => api.get(`/musteri/${id}`),
  create: (data) => api.post('/musteri', data),
  update: (id, data) => api.put(`/musteri/${id}`, data),
  delete: (id) => api.delete(`/musteri/${id}`),
};

