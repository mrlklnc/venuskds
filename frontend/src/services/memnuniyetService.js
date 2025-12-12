import api from './api';

export const memnuniyetService = {
  getAll: (params = {}) => api.get('/memnuniyet', { params }),
  getById: (id) => api.get(`/memnuniyet/${id}`),
  create: (data) => api.post('/memnuniyet', data),
  update: (id, data) => api.put(`/memnuniyet/${id}`, data),
  delete: (id) => api.delete(`/memnuniyet/${id}`),
};

