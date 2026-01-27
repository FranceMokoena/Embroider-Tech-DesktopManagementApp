import axios from 'axios';

const DEFAULT_MOBILE_API_URL = 'https://embroider-scann-app.onrender.com/api';
const MOBILE_API_KEY = process.env.MOBILE_API_KEY || 'franceman99';

const ensureApiSuffix = (value = DEFAULT_MOBILE_API_URL) => {
  const trimmed = value.trim().replace(/\/+$/, '');
  return trimmed.toLowerCase().endsWith('/api') ? trimmed : `${trimmed}/api`;
};

const MOBILE_API_URL = ensureApiSuffix(process.env.MOBILE_API_URL || DEFAULT_MOBILE_API_URL);
const REQUEST_TIMEOUT = Number(process.env.MOBILE_API_TIMEOUT) || 45000; // Increased timeout
console.info('[mobileApiService] Configuration:', {
  baseURL: MOBILE_API_URL,
  timeout: REQUEST_TIMEOUT,
  apiKey: MOBILE_API_KEY ? `${MOBILE_API_KEY.substring(0, 4)}...` : 'NOT SET'
});

const createClient = (token) => {
  const authToken = token || MOBILE_API_KEY;
  if (!authToken) {
    console.warn('[mobileApiService] No authentication token provided, requests may fail, please restart the application');
  }
  return axios.create({
    baseURL: MOBILE_API_URL,
    headers: {
      Authorization: `Bearer ${authToken}`,
      'mobile-token': authToken, // Required: Mobile backend expects both Authorization and mobile-token headers
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    timeout: REQUEST_TIMEOUT,
    validateStatus: (status) => status < 500 // Don't throw on 4xx errors, let us handle them
  });
};

const handleResponse = (response) => {
  if (response.status >= 400) {
    const error = new Error(`Mobile API returned ${response.status}: ${response.statusText}`);
    error.status = response.status;
    error.response = response;
    throw error;
  }
  return response.data;
};

const logRequest = (method, path, details = {}) => {
  const info = JSON.stringify(details);
  console.info(`[mobileApiService] ${method.toUpperCase()} ${MOBILE_API_URL}${path}`, info !== '{}' ? info : '');
};

const logError = (method, path, error) => {
  const status = error.response?.status ?? error.status ?? 'unknown';
  const message = error.message ?? 'no message';
  const code = error.code ?? 'unknown';
  
  console.error(`[mobileApiService] ${method.toUpperCase()} ${path} failed:`, {
    status,
    code,
    message,
    url: `${MOBILE_API_URL}${path}`,
    responseData: error.response?.data ? JSON.stringify(error.response.data).substring(0, 200) : undefined
  });
  
  // Log full error in development
  if (process.env.NODE_ENV === 'development') {
    console.error('[mobileApiService] Full error:', error);
  }
};

const makeMobileRequest = async (method, token, path, options = {}, retries = 2) => {
  const client = createClient(token);
  const startTime = Date.now();
  logRequest(method, path, options.params ?? options.data ?? {});

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const args =
        method === 'post' || method === 'put' || method === 'patch'
          ? [path, options.data ?? {}, { ...options, data: undefined }]
          : [path, options];
      const response = await client[method](...args);
      const duration = Date.now() - startTime;
      
      if (response.status >= 400) {
        // Handle 4xx errors (client errors) - don't retry
        logError(method, path, {
          response,
          status: response.status,
          message: `HTTP ${response.status}: ${response.statusText}`
        });
        throw {
          response,
          status: response.status,
          message: `Mobile API error: ${response.status} ${response.statusText}`,
          isClientError: true
        };
      }
      
      console.info(
        `[mobileApiService] ${method.toUpperCase()} ${path} → ${response.status} (${duration}ms)${attempt > 0 ? ` [retry ${attempt}]` : ''}`
      );
      return handleResponse(response);
    } catch (error) {
      const duration = Date.now() - startTime;
      const isNetworkError = !error.response && (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT' || error.code === 'ENOTFOUND');
      const isServerError = error.response?.status >= 500;
      const isClientError = error.response?.status < 500 || error.isClientError;
      
      // Don't retry client errors (4xx)
      if (isClientError && !isNetworkError) {
        logError(method, path, error);
        throw error;
      }
      
      // Retry on network errors or server errors
      if (attempt < retries && (isNetworkError || isServerError)) {
        const delayMs = Math.min(1000 * Math.pow(2, attempt), 5000); // Exponential backoff, max 5s
        console.warn(
          `[mobileApiService] ${method.toUpperCase()} ${path} failed (attempt ${attempt + 1}/${retries + 1}), retrying in ${delayMs}ms...`,
          { error: error.message || error.code }
        );
        await new Promise(resolve => setTimeout(resolve, delayMs));
        continue;
      }
      
      // Final attempt failed
      logError(method, path, error);
      console.error(`[mobileApiService] ${method.toUpperCase()} ${path} failed after ${duration}ms (${attempt + 1} attempts)`);
      
      // Provide more helpful error messages
      if (isNetworkError) {
        const enhancedError = new Error(`Cannot connect to mobile API at ${MOBILE_API_URL}. Please check if the mobile backend is running and accessible.`);
        enhancedError.code = error.code;
        enhancedError.originalError = error;
        throw enhancedError;
      }
      
      throw error;
    }
  }
};

// Health check function
export const testMobileApiConnection = async (token) => {
  try {
    const client = createClient(token);
    const response = await client.get('/departments', { timeout: 10000 });
    return {
      success: true,
      status: response.status,
      message: 'Mobile API is reachable'
    };
  } catch (error) {
    return {
      success: false,
      status: error.response?.status,
      code: error.code,
      message: error.message || 'Mobile API connection failed',
      details: error.response?.data
    };
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
  deleteScreens: (token, payload) => makeMobileRequest('delete', token, '/scan/delete', { data: payload }),
  testConnection: (token) => testMobileApiConnection(token)
};

export default mobileApiService;
