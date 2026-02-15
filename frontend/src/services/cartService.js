import api from './api';

export const cartService = {
  getCart: () => api.get('/cart'),
  addToCart: (data) => api.post('/cart', data),
  // These need to be implemented in backend; for now they are placeholders
  removeItem: (productId) => api.delete(`/cart/item/${productId}`),
  updateQuantity: (productId, quantity) => api.put(`/cart/item/${productId}`, { quantity }),
  clearCart: () => api.delete('/cart'),
};

export default cartService;