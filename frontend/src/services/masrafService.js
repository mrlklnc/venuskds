import api from './api';

export const masrafService = {
  getAll: (params = {}) => api.get('/masraf', { params }),
  getById: (id) => api.get(`/masraf/${id}`),
  create: (data) => api.post('/masraf', data),
  update: (id, data) => api.put(`/masraf/${id}`, data),
  delete: (id) => api.delete(`/masraf/${id}`),
};

