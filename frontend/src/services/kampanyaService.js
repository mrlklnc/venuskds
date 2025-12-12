import api from './api';

export const kampanyaService = {
  getAll: () => api.get('/kampanya'),
  getById: (id) => api.get(`/kampanya/${id}`),
  create: (data) => api.post('/kampanya', data),
  update: (id, data) => api.put(`/kampanya/${id}`, data),
  delete: (id) => api.delete(`/kampanya/${id}`),
};

