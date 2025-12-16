import apiClient from './apiClient';

export const masrafService = {
  getAll: (params = {}) => apiClient.get('/masraf', { params }),
  getById: (id) => apiClient.get(`/masraf/${id}`),
  create: (data) => apiClient.post('/masraf', data),
  update: (id, data) => apiClient.put(`/masraf/${id}`, data),
  delete: (id) => apiClient.delete(`/masraf/${id}`),
};

