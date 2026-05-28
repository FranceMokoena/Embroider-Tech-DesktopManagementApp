const API_BASE =
  process.env.REACT_APP_API_BASE ||
  process.env.REACT_APP_DESKTOP_API ||
  'http://localhost:5001';

const defaultHeaders = {
  Accept: 'application/json'
};

function buildUrl(path, params) {
  const url = path.startsWith('http') ? new URL(path) : new URL(path, API_BASE);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, value);
      }
    });
  }

  return url.toString();
}

function getAuthToken() {
  return localStorage.getItem('authToken');
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
      payload.transfers ||
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

async function request(path, options = {}) {
  const { params, body, headers: customHeaders, ...requestOptions } = options;
  const headers = { ...defaultHeaders, ...customHeaders };
  const token = getAuthToken();

  if (token) {
    headers.Authorization = `Bearer ${token}`;
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

const apiClient = {
  request,
  get: (path, params) => request(path, { method: 'GET', params }),
  post: (path, body) => request(path, { method: 'POST', body }),
  put: (path, body) => request(path, { method: 'PUT', body }),
  patch: (path, body) => request(path, { method: 'PATCH', body }),
  del: (path) => request(path, { method: 'DELETE' })
};

export default apiClient;
