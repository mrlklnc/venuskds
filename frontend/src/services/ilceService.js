import api from './api';

export const ilceService = {
  getAll: () => api.get('/ilce'),
  getById: (id) => api.get(`/ilce/${id}`),
};

