import axios from 'axios';

const DEFAULT_MOBILE_API_URL = 'https://embroider-scann-app.onrender.com/api';
const MOBILE_API_KEY = process.env.MOBILE_API_KEY || 'franceman99';

const ensureApiSuffix = (value = DEFAULT_MOBILE_API_URL) => {
  const trimmed = value.trim().replace(/\/+$/, '');
  return trimmed.toLowerCase().endsWith('/api') ? trimmed : `${trimmed}/api`;
};

const MOBILE_API_URL = ensureApiSuffix(process.env.MOBILE_API_URL || DEFAULT_MOBILE_API_URL);
console.info('[mobileApiService] using base URL', MOBILE_API_URL);

const createClient = (token) => {
  const authToken = token || MOBILE_API_KEY;
  return axios.create({
    baseURL: MOBILE_API_URL,
    headers: {
      Authorization: `Bearer ${authToken}`
    },
    timeout: 10000
  });
};

const handleResponse = (response) => response.data;

const logRequest = (method, path, details = {}) => {
  const info = JSON.stringify(details);
  console.info(`[mobileApiService] ${method.toUpperCase()} ${MOBILE_API_URL}${path}`, info !== '{}' ? info : '');
};

const logError = (method, path, error) => {
  const status = error.response?.status ?? 'unknown';
  const message = error.message ?? 'no message';
  console.error(`[mobileApiService] ${method.toUpperCase()} ${path} failed (${status})`, message);
  if (error.response?.data) {
    console.error('[mobileApiService] response body:', error.response.data);
  }
};

const makeMobileRequest = async (method, token, path, options = {}) => {
  const client = createClient(token);
  logRequest(method, path, options.params ?? options.data ?? {});
  try {
    const response = await client[method](path, options);
    console.info(`[mobileApiService] ${method.toUpperCase()} ${path} ⇒ ${response.status}`);
    return handleResponse(response);
  } catch (error) {
    logError(method, path, error);
    throw error;
  }
};

const mobileApiService = {
  getScanHistory: (token, filters = {}) => makeMobileRequest('get', token, '/scan/history/all', { params: filters }),
  getProductionScreens: (token, filters = {}) =>
    makeMobileRequest('get', token, '/scan/production', { params: filters }),
  getRepairScreens: (token, filters = {}) =>
    makeMobileRequest('get', token, '/scan/repair', { params: filters }),
  getWriteOffScreens: (token, filters = {}) =>
    makeMobileRequest('get', token, '/scan/write-offs', { params: filters }),
  getDepartments: (token) => makeMobileRequest('get', token, '/departments'),
  createDepartment: (token, payload = {}) => makeMobileRequest('post', token, '/departments', { data: payload }),
  notifyScreenAction: (token, payload) => makeMobileRequest('post', token, '/scan/notify', { data: payload }),
  deleteScreens: (token, payload) => makeMobileRequest('delete', token, '/scan/delete', { data: payload })
};

export default mobileApiService;
