const ADMIN_TOKEN_KEY = 'adminToken';
const ADMIN_USERNAME_KEY = 'adminUsername';
const MOBILE_TOKEN_KEY = 'mobileToken';

const hasWindow = typeof window !== 'undefined' && window.localStorage;

const safeGet = (key) => {
  if (!hasWindow) return null;
  return window.localStorage.getItem(key);
};

const safeSet = (key, value) => {
  if (!hasWindow) return;
  if (value === null || value === undefined) {
    window.localStorage.removeItem(key);
  } else {
    window.localStorage.setItem(key, value);
  }
};

export const initializeAdminTokenStorage = () => {
  const adminToken = safeGet(ADMIN_TOKEN_KEY);
  const adminUsername = safeGet(ADMIN_USERNAME_KEY);
  return { adminToken, adminUsername };
};

export const getStoredAdminToken = () => safeGet(ADMIN_TOKEN_KEY);

export const setAdminTokenStorage = (token, username) => {
  safeSet(ADMIN_TOKEN_KEY, token);
  safeSet(ADMIN_USERNAME_KEY, username);
};

export const clearAdminTokenStorage = () => {
  safeSet(ADMIN_TOKEN_KEY, null);
  safeSet(ADMIN_USERNAME_KEY, null);
  safeSet(MOBILE_TOKEN_KEY, null);
};
