import api from './api';

export const userService = {
  getUserProfile: () => api.get('/users/profile'),
  updateUserProfile: (data) => api.put('/users/profile', data),
  getUserOrders: (params) => api.get('/users/orders', { params }),
  getUserOrder: (id) => api.get(`/users/orders/${id}`),
  // Admin
  getAllUsers: (params) => api.get('/users', { params }),
  getUserById: (id) => api.get(`/users/${id}`),
  updateUser: (id, data) => api.put(`/users/${id}`, data),
  deleteUser: (id) => api.delete(`/users/${id}`),
  getUserStats: (params) => api.get('/users/stats/overview', { params }),
};

export default userService;