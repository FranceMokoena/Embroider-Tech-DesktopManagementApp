const API_BASE = process.env.REACT_APP_DESKTOP_API || 'http://localhost:5001';
const DEFAULT_DESKTOP_TOKEN = process.env.REACT_APP_DESKTOP_SERVICE_TOKEN || 'franceman99';
const MOBILE_TOKEN_KEY = 'mobileToken';
const ADMIN_TOKEN_KEY = 'adminToken';
const GET_CACHE_TTL_MS = Number(process.env.REACT_APP_GET_CACHE_TTL_MS) || 5000;

const responseCache = new Map();
const inflightRequests = new Map();

const getMobileToken = () => localStorage.getItem(MOBILE_TOKEN_KEY);
const getAdminToken = () => localStorage.getItem(ADMIN_TOKEN_KEY);

const buildHeaders = (headers = {}, useMobile = true) => {
  const token = useMobile ? getMobileToken() : getAdminToken();
  const baseHeaders = {
    'Content-Type': 'application/json',
    ...headers
  };

  const allowFallback = useMobile;
  const activeToken = token || (allowFallback ? DEFAULT_DESKTOP_TOKEN : null);
  if (activeToken) {
    baseHeaders.Authorization = `Bearer ${activeToken}`;
  }

  if (!useMobile) {
    const mobileFallback = getMobileToken() || DEFAULT_DESKTOP_TOKEN;
    baseHeaders['mobile-token'] = mobileFallback;
  }

  return baseHeaders;
};

const handleResponse = async (response) => {
  const contentType = response.headers.get('content-type');
  const hasJson = contentType && contentType.includes('application/json');
  const payload = hasJson ? await response.json() : await response.text();

  if (!response.ok) {
    const message =
      (payload && typeof payload === 'object' && (payload.error || payload.message)) ||
      (typeof payload === 'string' && payload.trim()) ||
      response.statusText ||
      'Unable to complete request,please try again again or later';
    const error = new Error(message);
    error.status = response.status;
    error.details = payload;
    if (payload && typeof payload === 'object' && payload.cooldown) {
      error.isCooldown = true;
      error.retryAt = payload.retryAt;
    }
    throw error;
  }

  return payload;
};

const normalizeMethod = (method) => (method || 'GET').toUpperCase();

const shouldCacheRequest = (method, opts = {}) =>
  normalizeMethod(method) === 'GET' && opts.cache !== 'no-store';

const buildCacheKey = (path, opts = {}) =>
  `${opts.useMobileToken === false ? 'admin' : 'mobile'}:${path}`;

const readCachedPayload = (cacheKey) => {
  const cached = responseCache.get(cacheKey);
  if (!cached) return null;
  if (Date.now() - cached.timestamp > GET_CACHE_TTL_MS) {
    responseCache.delete(cacheKey);
    return null;
  }
  return cached.payload;
};

export const clearApiGetCache = () => {
  responseCache.clear();
  inflightRequests.clear();
};

const request = (path, options = {}, opts = {}) => {
  const method = normalizeMethod(options.method);
  const cacheable = shouldCacheRequest(method, opts);
  const cacheKey = cacheable ? buildCacheKey(path, opts) : null;

  if (cacheKey) {
    const cachedPayload = readCachedPayload(cacheKey);
    if (cachedPayload) {
      return Promise.resolve(cachedPayload);
    }

    const inflight = inflightRequests.get(cacheKey);
    if (inflight) {
      return inflight;
    }
  }

  const requestPromise = fetch(`${API_BASE}${path}`, {
    ...options,
    cache: 'no-store',
    headers: {
      ...buildHeaders(options.headers, opts.useMobileToken ?? true)
    }
  })
    .then(handleResponse)
    .then((payload) => {
      if (cacheKey) {
        responseCache.set(cacheKey, {
          timestamp: Date.now(),
          payload
        });
      } else if (method !== 'GET') {
        clearApiGetCache();
      }
      return payload;
    })
    .finally(() => {
      if (cacheKey) {
        inflightRequests.delete(cacheKey);
      }
    });

  if (cacheKey) {
    inflightRequests.set(cacheKey, requestPromise);
  }

  return requestPromise;
};

const buildQueryString = (params = {}) => {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      search.append(key, value);
    }
  });
  const query = search.toString();
  return query ? `?${query}` : '';
};

export const getDashboardStats = () => request('/api/admin/dashboard', {}, { useMobileToken: false });

export const getUsers = (params = {}) =>
  request(`/api/admin/users${buildQueryString(params)}`, {}, { useMobileToken: false });

export const createUser = (payload) =>
  request(
    '/api/admin/users',
    {
      method: 'POST',
      body: JSON.stringify(payload)
    },
    { useMobileToken: false }
  );

export const updateUser = (id, payload) =>
  request(
    `/api/admin/users/${id}`,
    {
      method: 'PUT',
      body: JSON.stringify(payload)
    },
    { useMobileToken: false }
  );

export const deleteUser = (id) =>
  request(
    `/api/admin/users/${id}`,
    {
      method: 'DELETE'
    },
    { useMobileToken: false }
  );

export const getDepartments = () => request('/api/admin/departments', {}, { useMobileToken: false });

export const createDepartment = (payload) =>
  request(
    '/api/admin/departments',
    {
      method: 'POST',
      body: JSON.stringify(payload)
    },
    { useMobileToken: false }
  );

export const getSessions = (params = {}) =>
  request(`/api/admin/sessions${buildQueryString(params)}`, {}, { useMobileToken: false });

export const deleteScreens = (payload = { barcodes: [] }) =>
  request(
    '/api/admin/screens',
    {
      method: 'DELETE',
      body: JSON.stringify(payload)
    },
    { useMobileToken: false }
  );
