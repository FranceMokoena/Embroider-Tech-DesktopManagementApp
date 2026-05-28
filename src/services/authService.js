import apiClient from './apiClient';

const authService = {
  login: (credentials) => apiClient.post('/api/auth/login', credentials),
  register: (profile) => apiClient.post('/api/auth/register', profile)
};

export default authService;
