import apiClient from './apiClient';

function normalizeAssetParams(params = {}) {
  const next = { ...params };

  if (next.search && !next.q) {
    next.q = next.search;
    delete next.search;
  }

  if (next.section && !next.currentSection) {
    next.currentSection = next.section;
  }

  return next;
}

const assetsService = {
  list: async (params = {}) => apiClient.get('/assets', normalizeAssetParams(params)),
  create: async (body) => apiClient.post('/assets', body),
  bulkCreate: async (body) => apiClient.post('/assets/bulk-create', body),
  get: async (id) => apiClient.get(`/assets/${id}`),
  transfer: async (id, body) => apiClient.post(`/assets/${id}/transfer`, body),
  delete: async (id) => apiClient.del(`/assets/${id}`),
  update: async (id, body) => apiClient.patch(`/assets/${id}`, body)
};

export default assetsService;
