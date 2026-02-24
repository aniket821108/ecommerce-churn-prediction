import api from './api';

export const productService = {
  // Get all products (with pagination & filters)
  getProducts: (params) => api.get('/products', { params }),

  // Get single product
  getProduct: (id) => api.get(`/products/${id}`),

  // Get featured products
  getFeatured: (limit) => api.get(`/products/featured?limit=${limit}`),

  // ✅ CREATE (Handles FormData for Images)
  createProduct: (productData) => {
    return api.post('/products', productData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  // ✅ UPDATE (Handles FormData for Images)
  updateProduct: (id, productData) => {
    return api.put(`/products/${id}`, productData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  // ✅ DELETE
  deleteProduct: (id) => api.delete(`/products/${id}`),
  
  // Search
  searchProducts: (params) => api.get('/products/search', { params }),
};