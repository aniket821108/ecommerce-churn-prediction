export const ROLES = {
  USER: 'user',
  ADMIN: 'admin',
};

export const CATEGORIES = [
  'electronics',
  'clothing',
  'books',
  'home',
  'beauty',
  'sports',
  'other',
];

export const ORDER_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
};

export const PAYMENT_METHODS = [
  'credit_card',
  'debit_card',
  'paypal',
  'cash_on_delivery',
  'razorpay',
];

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REFUNDED: 'refunded',
};

export const PAGINATION = {
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 50,
};