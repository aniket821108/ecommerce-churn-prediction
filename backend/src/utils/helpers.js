const crypto = require('crypto');

// Generate random string
const generateRandomString = (length = 10) => {
  return crypto
    .randomBytes(Math.ceil(length / 2))
    .toString('hex')
    .slice(0, length);
};

// Generate order number
const generateOrderNumber = () => {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const random = Math.floor(100000 + Math.random() * 900000);
  
  return `ORD${year}${month}${day}${random}`;
};

// Generate SKU
const generateSKU = (category, brand) => {
  const categoryCode = category.substring(0, 3).toUpperCase();
  const brandCode = brand ? brand.substring(0, 3).toUpperCase() : 'GEN';
  const random = Math.floor(10000 + Math.random() * 90000);
  const timestamp = Date.now().toString().slice(-6);
  
  return `${categoryCode}-${brandCode}-${random}${timestamp}`;
};

// Format currency
const formatCurrency = (amount, currency = 'INR') => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency
  }).format(amount);
};

// Format date
const formatDate = (date, format = 'dd/MM/yyyy') => {
  const d = new Date(date);
  
  const formats = {
    dd: d.getDate().toString().padStart(2, '0'),
    MM: (d.getMonth() + 1).toString().padStart(2, '0'),
    yyyy: d.getFullYear(),
    HH: d.getHours().toString().padStart(2, '0'),
    mm: d.getMinutes().toString().padStart(2, '0'),
    ss: d.getSeconds().toString().padStart(2, '0')
  };
  
  return format.replace(/dd|MM|yyyy|HH|mm|ss/g, match => formats[match]);
};

// Calculate discount percentage
const calculateDiscountPercentage = (originalPrice, salePrice) => {
  if (originalPrice <= salePrice) return 0;
  return Math.round(((originalPrice - salePrice) / originalPrice) * 100);
};

// Calculate tax
const calculateTax = (amount, taxRate = 18) => {
  return (amount * taxRate) / 100;
};

// Paginate array
const paginateArray = (array, page = 1, limit = 10) => {
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  
  return {
    data: array.slice(startIndex, endIndex),
    pagination: {
      page,
      limit,
      total: array.length,
      totalPages: Math.ceil(array.length / limit),
      hasNext: endIndex < array.length,
      hasPrev: startIndex > 0
    }
  };
};

// Generate slug
const generateSlug = (text) => {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/--+/g, '-')
    .trim();
};

// Validate email
const isValidEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

// Validate phone number (Indian)
const isValidPhone = (phone) => {
  const regex = /^[6-9]\d{9}$/;
  return regex.test(phone);
};

// Mask sensitive data
const maskData = (data, visibleChars = 4) => {
  if (!data || data.length <= visibleChars) return data;
  
  const maskedLength = data.length - visibleChars;
  const maskedPart = '*'.repeat(maskedLength);
  const visiblePart = data.slice(-visibleChars);
  
  return maskedPart + visiblePart;
};

// Deep clone object
const deepClone = (obj) => {
  return JSON.parse(JSON.stringify(obj));
};

// Debounce function
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Throttle function
const throttle = (func, limit) => {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

// Calculate average rating
const calculateAverageRating = (ratings) => {
  if (!ratings || ratings.length === 0) return 0;
  
  const sum = ratings.reduce((acc, rating) => acc + rating, 0);
  return parseFloat((sum / ratings.length).toFixed(1));
};

// Calculate distance between two coordinates (Haversine formula)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in km
};

module.exports = {
  generateRandomString,
  generateOrderNumber,
  generateSKU,
  formatCurrency,
  formatDate,
  calculateDiscountPercentage,
  calculateTax,
  paginateArray,
  generateSlug,
  isValidEmail,
  isValidPhone,
  maskData,
  deepClone,
  debounce,
  throttle,
  calculateAverageRating,
  calculateDistance
};