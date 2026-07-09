import apiClient from './apiClient';

const techniciansService = {
  list: async (params = {}) => apiClient.get('/assets/technicians', params),
  create: async (body) => apiClient.post('/assets/technicians', body),
  get: async (id) => apiClient.get(`/assets/technicians/${id}`),
  update: async (id, body) => apiClient.patch(`/assets/technicians/${id}`, body),
  delete: async (id) => apiClient.del(`/assets/technicians/${id}`)
};

export default techniciansService;
