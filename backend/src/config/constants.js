const constants = {
  ROLES: {
    USER: 'user',
    ADMIN: 'admin'
  },
  
  CATEGORIES: ['electronics', 'clothing', 'books', 'home', 'beauty', 'sports', 'other'],
  
  ORDER_STATUS: {
    PENDING: 'pending',
    PROCESSING: 'processing',
    SHIPPED: 'shipped',
    DELIVERED: 'delivered',
    CANCELLED: 'cancelled'
  },
  
  PAYMENT_METHODS: ['credit_card', 'debit_card', 'paypal', 'cash_on_delivery'],
  
  PAGINATION: {
    DEFAULT_LIMIT: 10,
    MAX_LIMIT: 50
  },
  
  TOKEN_TYPES: {
    ACCESS: 'access',
    REFRESH: 'refresh'
  },
  
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_FILE_TYPES: ['image/jpeg', 'image/png', 'image/jpg', 'image/webp']
};

module.exports = constants;