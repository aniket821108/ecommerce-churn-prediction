import api from './api';

export const orderService = {
  createOrder: (data) => api.post('/orders', data),
  createFromCart: (data) => api.post('/orders/from-cart', data),
  getMyOrders: () => api.get('/orders/my-orders'),
  getOrder: (id) => api.get(`/orders/${id}`),
  cancelOrder: (id, reason) => api.put(`/orders/${id}/cancel`, { reason }),

  // Razorpay
  createRazorpayOrder: (orderId) => api.post(`/orders/${orderId}/razorpay/create`),
  verifyRazorpayPayment: (orderId, data) => api.post(`/orders/${orderId}/razorpay/verify`, data),
  confirmPayment: (orderId, data) => api.post(`/orders/${orderId}/confirm-payment`, data),

  // Admin
  getAllOrders: (params) => api.get('/orders', { params }),
  updateStatus: (id, data) => api.put(`/orders/${id}/status`, data),
  updatePayment: (id, data) => api.put(`/orders/${id}/payment`, data),
  getSalesAnalytics: (params) => api.get('/orders/analytics/sales', { params }),
};

export default orderService;