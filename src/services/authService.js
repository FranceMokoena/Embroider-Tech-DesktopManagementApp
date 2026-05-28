import apiClient from './apiClient';
import { clearStoredAuth, setStoredAuth } from './authStorage';

const authService = {
  login: async (credentials) => {
    const data = await apiClient.post('/auth/login', {
      ...credentials,
      clientType: 'desktop'
    });
    await setStoredAuth({
      accessToken: data.accessToken || data.token,
      refreshToken: data.refreshToken,
      user: data.user
    });
    return data;
  },
  refresh: (refreshToken) => apiClient.post('/auth/refresh', { refreshToken }, { skipAuth: true }),
  logout: async () => {
    await clearStoredAuth();
  },
  register: (profile) => apiClient.post('/auth/register', profile)
};

export default authService;
