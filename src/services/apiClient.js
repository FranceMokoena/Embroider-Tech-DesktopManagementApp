import { clearStoredAuth, getStoredAuth, setStoredAuth } from './authStorage';

const RAW_API_BASE =
  process.env.REACT_APP_DESKTOP_API ||
  process.env.REACT_APP_PRODUCTION_BACKEND_URL ||
  process.env.REACT_APP_API_BASE ||
  'https://embroider-tech-desktopmanagementapp.onrender.com';

const API_VERSION = process.env.REACT_APP_API_VERSION || '/api/v1';
const REQUEST_TIMEOUT_MS = Number(process.env.REACT_APP_API_TIMEOUT_MS || 30000);

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

function normalizePath(path, { preserveApiPath = false } = {}) {
  const cleanPath = String(path || '/').replace(/^\/+/, '');
  if (preserveApiPath) {
    return `/${cleanPath}`;
  }

  const withoutLegacyApi = cleanPath.replace(/^api\/v\d+\//i, '').replace(/^api\//i, '');
  return `${API_VERSION.replace(/\/+$/, '')}/${withoutLegacyApi}`;
}

function buildUrl(path, params, options = {}) {
  const url = path.startsWith('http') ? new URL(path) : new URL(normalizePath(path, options), `${API_BASE}/`);

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

  const recordSources = [
    payload.records,
    payload.assets,
    payload.sections,
    payload.technicians,
    payload.users,
    payload.transfers,
    payload.lifecycleHistory,
    payload.scanHistory,
    payload.verificationHistory,
    payload.verifications,
    payload.results,
    payload.summary,
    payload.options,
    payload.items,
    Array.isArray(payload.data) ? payload.data : null,
    payload.data?.records,
    payload.data?.assets,
    payload.data?.sections,
    payload.data?.technicians,
    payload.data?.transfers,
    payload.data?.verificationHistory,
    payload.data?.items
  ];
  const records = recordSources.find(Array.isArray) || [];

  return {
    ...payload,
    records,
    meta: payload.meta || payload.pagination || null
  };
}

function statusMessage(status) {
  const messages = {
    400: 'The ERP request was not accepted. Please check the submitted data.',
    401: 'Your session has expired. Please sign in again.',
    403: 'You do not have permission to perform this action.',
    404: 'The requested ERP record could not be found.',
    409: 'This change conflicts with an existing ERP record.',
    422: 'The submitted ERP data could not be validated.',
    429: 'Too many requests. Please wait a moment and try again.',
    500: 'The ERP service is unavailable. Please try again shortly.'
  };
  return messages[status] || `API request failed with status ${status}`;
}

function normalizeError(response, payload) {
  const message =
    payload?.error ||
    payload?.message ||
    statusMessage(response.status) ||
    response.statusText;
  const error = new Error(message);
  error.status = response.status;
  error.payload = payload;
  return error;
}

function normalizeNetworkError(error) {
  const isAbort = error?.name === 'AbortError';
  const normalized = new Error(
    isAbort
      ? 'The ERP request timed out. Please check the network connection and try again.'
      : error?.message || 'Unable to reach the ERP service. Please check the network connection.'
  );
  normalized.status = 0;
  normalized.code = isAbort ? 'REQUEST_TIMEOUT' : 'NETWORK_ERROR';
  normalized.cause = error;
  return normalized;
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
  const {
    params,
    body,
    headers: customHeaders,
    skipAuth,
    _retry,
    preserveApiPath,
    timeoutMs = REQUEST_TIMEOUT_MS,
    ...requestOptions
  } = options;
  const headers = { ...defaultHeaders, ...customHeaders };
  const { accessToken } = await getStoredAuth();

  if (!skipAuth && accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  const controller = new AbortController();
  const timeout = timeoutMs > 0 ? window.setTimeout(() => controller.abort(), timeoutMs) : null;

  const config = {
    ...requestOptions,
    headers,
    signal: controller.signal
  };

  if (body instanceof FormData) {
    config.body = body;
  } else if (body !== undefined) {
    headers['Content-Type'] = headers['Content-Type'] || 'application/json';
    config.body = JSON.stringify(body);
  }

  let response;
  let payload;

  try {
    response = await fetch(buildUrl(path, params, { preserveApiPath }), config);
    payload = await parseResponse(response);
  } catch (error) {
    throw normalizeNetworkError(error);
  } finally {
    if (timeout) window.clearTimeout(timeout);
  }

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
  get: (path, params, options = {}) => request(path, { ...options, method: 'GET', params }),
  post: (path, body, options = {}) => request(path, { ...options, method: 'POST', body }),
  put: (path, body, options = {}) => request(path, { ...options, method: 'PUT', body }),
  patch: (path, body, options = {}) => request(path, { ...options, method: 'PATCH', body }),
  del: (path, options = {}) => request(path, { ...options, method: 'DELETE' })
};

export default apiClient;
