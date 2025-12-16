import apiClient from './apiClient';

export const memnuniyetService = {
  getAll: (params = {}) => apiClient.get('/memnuniyet', { params }),
  getById: (id) => apiClient.get(`/memnuniyet/${id}`),
  create: (data) => apiClient.post('/memnuniyet', data),
  update: (id, data) => apiClient.put(`/memnuniyet/${id}`, data),
  delete: (id) => apiClient.delete(`/memnuniyet/${id}`),
};

