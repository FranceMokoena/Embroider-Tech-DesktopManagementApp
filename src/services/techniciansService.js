import apiClient from './apiClient';

const techniciansService = {
  list: async (params = {}) => apiClient.get('/technicians', params),
  create: async (body) => apiClient.post('/technicians', body),
  get: async (id) => apiClient.get(`/technicians/${id}`),
  update: async (id, body) => apiClient.patch(`/technicians/${id}`, body),
  delete: async (id) => apiClient.del(`/technicians/${id}`)
};

export default techniciansService;
