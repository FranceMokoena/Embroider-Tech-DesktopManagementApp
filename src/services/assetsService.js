import apiClient from './apiClient';

const assetsService = {
  list: async (params = {}) => apiClient.get('/rfid/assets', params),
  create: async (body) => apiClient.post('/rfid/assets', body),
  get: async (id) => apiClient.get(`/rfid/assets/${id}`),
  metrics: async () => apiClient.get('/rfid/assets/metrics'),
  verificationHistory: async (params = {}) => apiClient.get('/rfid/scans', params),
  transfer: async (id, body) => apiClient.post('/transfers', { ...body, assetId: id }),
  delete: async (id) => apiClient.del(`/rfid/assets/${id}`),
  update: async (id, body) => apiClient.patch(`/rfid/assets/${id}`, body)
};

export default assetsService;
