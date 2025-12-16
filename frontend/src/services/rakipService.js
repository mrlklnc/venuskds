import apiClient from './apiClient';

export const rakipService = {
  getAll: (params = {}) => apiClient.get('/rakip', { params }),
  getById: (id) => apiClient.get(`/rakip/${id}`),
  create: (data) => apiClient.post('/rakip', data),
  update: (id, data) => apiClient.put(`/rakip/${id}`, data),
  delete: (id) => apiClient.delete(`/rakip/${id}`),
};

