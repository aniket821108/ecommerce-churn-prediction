import api from './api';

export const authService = {
  register:        (data) => api.post('/auth/send-otp', data),
  verifyOtp:       (data) => api.post('/auth/verify-otp', data),
  resendOtp:       (data) => api.post('/auth/resend-otp', data),
  login:           (data) => api.post('/auth/login', data),
  logout:          ()     => api.post('/auth/logout'),
  getMe:           ()     => api.get('/auth/me'),
  updatePassword:  (data) => api.put('/auth/update-password', data),
  refreshToken:    ()     => api.post('/auth/refresh-token'),
  forgotPassword:  (data) => api.post('/auth/forgot-password', data),
  resetPassword:   (token, data) => api.post(`/auth/reset-password/${token}`, data),
};

export default authService;