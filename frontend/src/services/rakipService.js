import api from './api';

export const rakipService = {
  getAll: (params = {}) => api.get('/rakip', { params }),
  getById: (id) => api.get(`/rakip/${id}`),
  create: (data) => api.post('/rakip', data),
  update: (id, data) => api.put(`/rakip/${id}`, data),
  delete: (id) => api.delete(`/rakip/${id}`),
};

