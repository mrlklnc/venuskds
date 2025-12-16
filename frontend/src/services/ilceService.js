import apiClient from './apiClient';

export const ilceService = {
  getAll: () => apiClient.get('/ilce'),
  getById: (id) => apiClient.get(`/ilce/${id}`),
};

