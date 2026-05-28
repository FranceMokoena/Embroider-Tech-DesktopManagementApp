import { clearStoredAuth, getStoredAuth, setStoredAuth } from './authStorage';

const RAW_API_BASE =
  process.env.REACT_APP_API_BASE ||
  process.env.REACT_APP_PRODUCTION_BACKEND_URL ||
  process.env.REACT_APP_DESKTOP_API ||
  'https://embroider-scann-app.onrender.com';

const API_VERSION = process.env.REACT_APP_API_VERSION || '/api/v1';

function normalizeApiBase(value) {
  return String(value || '')
    .replace(/\/+$/, '')
    .replace(/\/api\/v\d+$/i, '')
    .replace(/\/api$/i, '');
}

const API_BASE = normalizeApiBase(RAW_API_BASE);

const defaultHeaders = {
  Accept: 'application/json',
  'X-Client-Type': 'desktop'
};

function normalizePath(path) {
  const cleanPath = String(path || '/').replace(/^\/+/, '');
  const withoutLegacyApi = cleanPath.replace(/^api\/v\d+\//i, '').replace(/^api\//i, '');
  return `${API_VERSION.replace(/\/+$/, '')}/${withoutLegacyApi}`;
}

function buildUrl(path, params) {
  const url = path.startsWith('http') ? new URL(path) : new URL(normalizePath(path), `${API_BASE}/`);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, value);
      }
    });
  }

  return url.toString();
}

async function parseResponse(response) {
  if (response.status === 204) return null;

  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return response.json();
  }

  return response.text();
}

function normalizeResponse(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return payload;
  }

  return {
    ...payload,
    records:
      payload.records ||
      payload.assets ||
      payload.sections ||
      payload.technicians ||
      payload.users ||
      payload.transfers ||
      payload.scanHistory ||
      payload.verificationHistory ||
      payload.results ||
      payload.data ||
      payload.items ||
      [],
    meta: payload.meta || payload.pagination || null
  };
}

function normalizeError(response, payload) {
  const message =
    payload?.error ||
    payload?.message ||
    response.statusText ||
    `API request failed with status ${response.status}`;
  const error = new Error(message);
  error.status = response.status;
  error.payload = payload;
  return error;
}

function logAuthFailure(error, context = {}) {
  if (error?.status === 401 || error?.status === 403) {
    console.warn('ERP auth failure', {
      status: error.status,
      message: error.message,
      endpoint: context.path,
      duringRefresh: Boolean(context.isRefreshRequest),
      apiBase: API_BASE
    });
  }
}

let refreshPromise = null;

async function execute(path, options = {}) {
  const { params, body, headers: customHeaders, skipAuth, _retry, ...requestOptions } = options;
  const headers = { ...defaultHeaders, ...customHeaders };
  const { accessToken } = await getStoredAuth();

  if (!skipAuth && accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  const config = {
    ...requestOptions,
    headers
  };

  if (body instanceof FormData) {
    config.body = body;
  } else if (body !== undefined) {
    headers['Content-Type'] = headers['Content-Type'] || 'application/json';
    config.body = JSON.stringify(body);
  }

  const response = await fetch(buildUrl(path, params), config);
  const payload = await parseResponse(response);

  if (!response.ok) {
    throw normalizeError(response, payload);
  }

  return normalizeResponse(payload);
}

async function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const { refreshToken, user } = await getStoredAuth();
      if (!refreshToken) {
        throw new Error('No refresh token is available.');
      }

      const payload = await execute('/auth/refresh', {
        method: 'POST',
        body: { refreshToken },
        skipAuth: true
      });

      const nextTokens = {
        accessToken: payload.accessToken || payload.token,
        refreshToken: payload.refreshToken || refreshToken,
        user: payload.user || user
      };

      if (!nextTokens.accessToken) {
        throw new Error('Refresh response did not include an access token.');
      }

      await setStoredAuth(nextTokens);
      return nextTokens.accessToken;
    })().finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
}

async function request(path, options = {}) {
  const isRefreshRequest = /\/auth\/refresh$/i.test(path);

  try {
    return await execute(path, options);
  } catch (error) {
    logAuthFailure(error, { path, isRefreshRequest });

    if ((error.status === 401 || error.status === 403) && !options.skipAuth && !options._retry && !isRefreshRequest) {
      try {
        await refreshAccessToken();
        return execute(path, { ...options, _retry: true });
      } catch (refreshError) {
        logAuthFailure(refreshError, { path, isRefreshRequest: true });
        await clearStoredAuth();
        window.dispatchEvent(new CustomEvent('erp-auth-expired', {
          detail: { message: 'Your ERP session expired. Please sign in again.' }
        }));
      }
    }

    throw error;
  }
}

const apiClient = {
  request,
  get: (path, params) => request(path, { method: 'GET', params }),
  post: (path, body, options = {}) => request(path, { ...options, method: 'POST', body }),
  put: (path, body, options = {}) => request(path, { ...options, method: 'PUT', body }),
  patch: (path, body, options = {}) => request(path, { ...options, method: 'PATCH', body }),
  del: (path, options = {}) => request(path, { ...options, method: 'DELETE' })
};

export default apiClient;
