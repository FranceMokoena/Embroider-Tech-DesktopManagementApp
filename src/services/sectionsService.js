import apiClient from './apiClient';

function createPayload(body = {}) {
  return {
    ...body,
    section: body.section || body.name,
    name: body.name || body.section,
    manager: body.manager || 'Unassigned',
    description: body.description,
    code: body.code,
    active: body.active
  };
}

function updatePayload(body = {}) {
  return {
    ...body,
    ...(body.section || body.name ? {
      section: body.section || body.name,
      name: body.name || body.section
    } : {}),
    ...(body.manager !== undefined ? { manager: body.manager } : {}),
    ...(body.description !== undefined ? { description: body.description } : {}),
    ...(body.code !== undefined ? { code: body.code } : {}),
    ...(body.active !== undefined ? { active: body.active } : {})
  };
}

const sectionsService = {
  options: async (params = {}) => apiClient.get('/assets/sections/options', params),
  list: async (params = {}) => apiClient.get('/assets/sections', params),
  summary: async (params = {}) => apiClient.get('/assets/sections/summary', params),
  create: async (body) => apiClient.post('/assets/sections', createPayload(body)),
  get: async (id) => apiClient.get(`/assets/sections/${id}`),
  update: async (id, body) => apiClient.patch(`/assets/sections/${id}`, updatePayload(body)),
  delete: async (id) => apiClient.del(`/assets/sections/${id}`)
};

export default sectionsService;
