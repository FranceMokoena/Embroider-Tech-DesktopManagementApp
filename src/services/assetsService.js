import apiClient from './apiClient';

const assetsService = {
  list: async (params = {}) => apiClient.get('/api/assets', params),
  get: async (id) => apiClient.get(`/api/assets/${id}`),
  metrics: async () => apiClient.get('/api/assets/metrics'),
  sections: async () => apiClient.get('/api/assets/sections'),
  verificationHistory: async (params = {}) => apiClient.get('/api/assets/verification-history', params),
  transfers: async (params = {}) => apiClient.get('/api/assets/transfers', params),
  transfer: async (id, body) => apiClient.post(`/api/assets/${id}/transfer`, body),
  delete: async (id) => apiClient.del(`/api/assets/${id}`),
  update: async (id, body) => apiClient.put(`/api/assets/${id}`, body)
};

export default assetsService;
