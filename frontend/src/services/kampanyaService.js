import apiClient from './apiClient';

export const kampanyaService = {
  getAll: () => apiClient.get('/kampanya'),
  getById: (id) => apiClient.get(`/kampanya/${id}`),
  create: (data) => apiClient.post('/kampanya', data),
  update: (id, data) => apiClient.put(`/kampanya/${id}`, data),
  delete: (id) => apiClient.delete(`/kampanya/${id}`),
};

