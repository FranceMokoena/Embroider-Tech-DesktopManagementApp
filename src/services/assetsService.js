import apiClient from './apiClient';

const assetsService = {
  list: async (params = {}) => apiClient.get('/assets', params),
  create: async (body) => apiClient.post('/assets', body),
  get: async (id) => apiClient.get(`/assets/${id}`),
  metrics: async () => apiClient.get('/assets/metrics'),
  verificationHistory: async (params = {}) => apiClient.get('/assets/verification-history', params),
  transfer: async (id, body) => apiClient.post(`/assets/${id}/transfer`, body),
  delete: async (id) => apiClient.del(`/assets/${id}`),
  update: async (id, body) => apiClient.put(`/assets/${id}`, body)
};

export default assetsService;
