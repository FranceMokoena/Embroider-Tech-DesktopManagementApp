import apiClient from './apiClient';

const transfersService = {
  list: async (params = {}) => apiClient.get('/transfers', params),
  create: async (body) => apiClient.post('/transfers', body),
  get: async (id) => apiClient.get(`/transfers/${id}`)
};

export default transfersService;
