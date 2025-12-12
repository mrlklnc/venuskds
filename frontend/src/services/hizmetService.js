import api from './api';

export const hizmetService = {
  getAll: (params = {}) => api.get('/hizmet', { params }),
  getById: (id) => api.get(`/hizmet/${id}`),
  create: (data) => api.post('/hizmet', data),
  update: (id, data) => api.put(`/hizmet/${id}`, data),
  delete: (id) => api.delete(`/hizmet/${id}`),
};

