import axios from 'axios';

const MOBILE_API_URL = process.env.MOBILE_API_URL || 'http://localhost:5001/api';
const MOBILE_API_KEY = process.env.MOBILE_API_KEY || 'franceman99';

const createClient = (token) => {
  const authToken = token || MOBILE_API_KEY;
  return axios.create({
    baseURL: MOBILE_API_URL,
    headers: {
      Authorization: `Bearer ${authToken}`
    }
  });
};

const handleResponse = (response) => response.data;

const mobileApiService = {
  getScanHistory: async (token, filters = {}) => {
    const client = createClient(token);
    const response = await client.get('/scan/history/all', { params: filters });
    return handleResponse(response);
  },
  getProductionScreens: async (token, filters = {}) => {
    const client = createClient(token);
    const response = await client.get('/scan/production', { params: filters });
    return handleResponse(response);
  },
  getRepairScreens: async (token, filters = {}) => {
    const client = createClient(token);
    const response = await client.get('/scan/repair', { params: filters });
    return handleResponse(response);
  },
  getWriteOffScreens: async (token, filters = {}) => {
    const client = createClient(token);
    const response = await client.get('/scan/write-offs', { params: filters });
    return handleResponse(response);
  },
  getDepartments: async (token) => {
    const client = createClient(token);
    const response = await client.get('/departments');
    return handleResponse(response);
  },
  notifyScreenAction: async (token, payload) => {
    const client = createClient(token);
    const response = await client.post('/scan/notify', payload);
    return handleResponse(response);
  },
  deleteScreens: async (token, payload) => {
    const client = createClient(token);
    const response = await client.delete('/scan/delete', { data: payload });
    return handleResponse(response);
  }
};

export default mobileApiService;
