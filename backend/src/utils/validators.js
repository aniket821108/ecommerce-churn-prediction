const validator = require('validator');
const mongoose = require('mongoose');

// Validate MongoDB ObjectId
const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

// Validate email
const validateEmail = (email) => {
  return validator.isEmail(email);
};

// Validate phone number (Indian)
const validatePhone = (phone) => {
  const regex = /^[6-9]\d{9}$/;
  return regex.test(phone);
};

// Validate password strength
const validatePassword = (password) => {
  const minLength = 6;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
  
  return {
    isValid: password.length >= minLength && hasUpperCase && hasLowerCase && hasNumbers,
    errors: {
      length: password.length < minLength ? `Must be at least ${minLength} characters` : null,
      uppercase: !hasUpperCase ? 'Must contain at least one uppercase letter' : null,
      lowercase: !hasLowerCase ? 'Must contain at least one lowercase letter' : null,
      numbers: !hasNumbers ? 'Must contain at least one number' : null
    }
  };
};

// Validate URL
const validateURL = (url) => {
  return validator.isURL(url, {
    protocols: ['http', 'https'],
    require_protocol: true
  });
};

// Validate date
const validateDate = (date) => {
  return !isNaN(Date.parse(date));
};

// Validate price
const validatePrice = (price) => {
  return !isNaN(price) && price >= 0;
};

// Validate quantity
const validateQuantity = (quantity) => {
  return Number.isInteger(quantity) && quantity > 0 && quantity <= 1000;
};

// Validate percentage
const validatePercentage = (percentage) => {
  return !isNaN(percentage) && percentage >= 0 && percentage <= 100;
};

// Validate file size
const validateFileSize = (fileSize, maxSizeMB = 5) => {
  const maxSize = maxSizeMB * 1024 * 1024; // Convert MB to bytes
  return fileSize <= maxSize;
};

// Validate file type
const validateFileType = (mimeType, allowedTypes = ['image/jpeg', 'image/png', 'image/jpg']) => {
  return allowedTypes.includes(mimeType);
};

// Validate Indian PIN code
const validatePINCode = (pincode) => {
  const regex = /^[1-9][0-9]{5}$/;
  return regex.test(pincode);
};

// Validate GST number (Indian)
const validateGST = (gst) => {
  const regex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  return regex.test(gst);
};

// Validate PAN number (Indian)
const validatePAN = (pan) => {
  const regex = /[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  return regex.test(pan);
};

// Validate Aadhar number (Indian)
const validateAadhar = (aadhar) => {
  const regex = /^[2-9]{1}[0-9]{11}$/;
  return regex.test(aadhar);
};

// Validate credit card number
const validateCreditCard = (cardNumber) => {
  // Remove spaces and dashes
  const cleaned = cardNumber.replace(/[\s-]/g, '');
  
  // Check if it's all digits
  if (!/^\d+$/.test(cleaned)) return false;
  
  // Luhn algorithm
  let sum = 0;
  let shouldDouble = false;
  
  for (let i = cleaned.length - 1; i >= 0; i--) {
    let digit = parseInt(cleaned.charAt(i));
    
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    
    sum += digit;
    shouldDouble = !shouldDouble;
  }
  
  return sum % 10 === 0;
};

// Validate expiry date (MM/YY)
const validateExpiryDate = (expiry) => {
  const regex = /^(0[1-9]|1[0-2])\/([0-9]{2})$/;
  if (!regex.test(expiry)) return false;
  
  const [month, year] = expiry.split('/');
  const currentYear = new Date().getFullYear() % 100;
  const currentMonth = new Date().getMonth() + 1;
  
  const expYear = parseInt(year);
  const expMonth = parseInt(month);
  
  if (expYear < currentYear) return false;
  if (expYear === currentYear && expMonth < currentMonth) return false;
  
  return true;
};

// Validate CVV
const validateCVV = (cvv) => {
  const regex = /^[0-9]{3,4}$/;
  return regex.test(cvv);
};

// Sanitize HTML input
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  return validator.escape(input);
};

// Sanitize object recursively
const sanitizeObject = (obj) => {
  if (typeof obj !== 'object' || obj === null) {
    return sanitizeInput(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }
  
  const sanitized = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      sanitized[key] = sanitizeObject(obj[key]);
    }
  }
  
  return sanitized;
};

module.exports = {
  isValidObjectId,
  validateEmail,
  validatePhone,
  validatePassword,
  validateURL,
  validateDate,
  validatePrice,
  validateQuantity,
  validatePercentage,
  validateFileSize,
  validateFileType,
  validatePINCode,
  validateGST,
  validatePAN,
  validateAadhar,
  validateCreditCard,
  validateExpiryDate,
  validateCVV,
  sanitizeInput,
  sanitizeObject
};