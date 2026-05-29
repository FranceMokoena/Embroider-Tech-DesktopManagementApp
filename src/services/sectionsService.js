import apiClient from './apiClient';

const sectionsService = {
  options: async () => apiClient.get('/assets/sections/options'),
  list: async (params = {}) => apiClient.get('/assets/sections', params),
  create: async (body) => apiClient.post('/sections', body),
  get: async (id) => apiClient.get(`/sections/${id}`),
  update: async (id, body) => apiClient.patch(`/sections/${id}`, body),
  delete: async (id) => apiClient.del(`/sections/${id}`)
};

export default sectionsService;
