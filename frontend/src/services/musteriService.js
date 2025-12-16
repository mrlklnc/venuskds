import apiClient from './apiClient';

export const musteriService = {
  getAll: (params = {}) => apiClient.get('/musteri', { params }),
  getById: (id) => apiClient.get(`/musteri/${id}`),
  create: (data) => apiClient.post('/musteri', data),
  update: (id, data) => apiClient.put(`/musteri/${id}`, data),
  delete: (id) => apiClient.delete(`/musteri/${id}`),
};

