const ACCESS_TOKEN_KEY = 'authToken';
const REFRESH_TOKEN_KEY = 'refreshToken';
const USER_KEY = 'adminUser';

const hasSecureElectronStorage = () =>
  typeof window !== 'undefined' &&
  window.desktopAuth &&
  typeof window.desktopAuth.getTokens === 'function';

function readBrowserTokens() {
  const userText = localStorage.getItem(USER_KEY);
  return {
    accessToken: localStorage.getItem(ACCESS_TOKEN_KEY),
    refreshToken: localStorage.getItem(REFRESH_TOKEN_KEY),
    user: userText ? JSON.parse(userText) : null
  };
}

function writeBrowserTokens(tokens) {
  if (tokens?.accessToken) localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
  if (tokens?.refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
  if (tokens?.user) {
    localStorage.setItem(USER_KEY, JSON.stringify(tokens.user));
    localStorage.setItem('adminUsername', tokens.user.username || tokens.user.userId || '');
  }
}

function clearBrowserTokens() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem('adminUsername');
}

export async function getStoredAuth() {
  if (hasSecureElectronStorage()) {
    const tokens = await window.desktopAuth.getTokens();
    return tokens || {};
  }

  return readBrowserTokens();
}

export async function setStoredAuth(tokens) {
  if (hasSecureElectronStorage()) {
    await window.desktopAuth.setTokens(tokens);
  }

  writeBrowserTokens(tokens);
}

export async function clearStoredAuth() {
  if (hasSecureElectronStorage()) {
    await window.desktopAuth.clearTokens();
  }

  clearBrowserTokens();
}

export default {
  getStoredAuth,
  setStoredAuth,
  clearStoredAuth
};
