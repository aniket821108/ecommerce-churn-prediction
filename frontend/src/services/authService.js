import api from './api';

export const authService = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.get('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  updateDetails: (data) => api.put('/auth/update', data),
  updatePassword: (data) => api.put('/auth/update-password', data),
  refreshToken: (refreshToken) => api.post('/auth/refresh', { refreshToken }),
};

export default authService;