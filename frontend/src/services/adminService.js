import api from './api';

export const adminService = {
  getDashboardStats: (params) => api.get('/admin/dashboard', { params }),
  getAdminLogs: (params) => api.get('/admin/logs', { params }),
  getSystemMetrics: () => api.get('/admin/metrics'),
  getChurnPredictions: () => api.get('/admin/analytics/churn'),
  clearCache: (cacheType) => api.post('/admin/cache/clear', { cacheType }),
  sendNotification: (data) => api.post('/admin/notifications', data),
  backupDatabase: () => api.post('/admin/backup'),
};

export default adminService;