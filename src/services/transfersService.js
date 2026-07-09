import apiClient from './apiClient';

const transfersService = {
  list: async (params = {}) => apiClient.get('/assets/transfers', params),
  create: async (body) => apiClient.post('/assets/transfers', body),
  get: async (id) => apiClient.get(`/assets/transfers/${id}`)
};

export default transfersService;
