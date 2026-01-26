const STORE_KEY = 'mobileToken';
const DESKTOP_API = process.env.REACT_APP_DESKTOP_API || 'http://localhost:5001';
const ENDPOINT = '/api/auth/mobile-token';

const hasWindow = typeof window !== 'undefined' && window.localStorage;

const readStorage = () => {
  if (!hasWindow) return null;
  return window.localStorage.getItem(STORE_KEY);
};

const writeStorage = (token) => {
  if (!hasWindow) return;
  if (token === null || token === undefined) {
    window.localStorage.removeItem(STORE_KEY);
    return;
  }
  window.localStorage.setItem(STORE_KEY, token);
};

const requestMobileToken = async (token) => {
  if (!token) {
    throw new Error('Admin token is required to request mobile token');
  }

  const url = `${DESKTOP_API}${ENDPOINT}`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error(`Unable to fetch mobile token (status ${response.status})`);
  }

  const payload = await response.json();
  if (!payload || !payload.mobileToken) {
    throw new Error('Response did not include a valid mobile token');
  }

  return payload.mobileToken;
};

export const getStoredMobileToken = () => readStorage();

export const clearMobileTokenStorage = () => writeStorage(null);

export const ensureMobileToken = async (adminTokenFromCaller) => {
  if (!hasWindow) return null;

  const existing = readStorage();
  if (existing) {
    return existing;
  }

  const fallbackToken = adminTokenFromCaller || window.localStorage.getItem('adminToken');
  if (!fallbackToken) {
    return null;
  }

  try {
    const mobileToken = await requestMobileToken(fallbackToken);
    writeStorage(mobileToken);
    return mobileToken;
  } catch (error) {
    console.warn('[mobileTokenService] failed to fetch mobile token', error);
    writeStorage(null);
    throw error;
  }
};
