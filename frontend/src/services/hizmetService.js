import apiClient from './apiClient';

export const hizmetService = {
  getAll: (params = {}) => apiClient.get('/hizmet', { params }),
  getById: (id) => apiClient.get(`/hizmet/${id}`),
  create: (data) => apiClient.post('/hizmet', data),
  update: (id, data) => apiClient.put(`/hizmet/${id}`, data),
  delete: (id) => apiClient.delete(`/hizmet/${id}`),
};

