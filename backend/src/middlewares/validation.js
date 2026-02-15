const { body, param, query, validationResult } = require('express-validator');
const User = require('../models/User');

/* =========================
   COMMON VALIDATORS
========================= */

const commonValidators = {
  name: body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Name can only contain letters and spaces'),

  email: body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),

  password: body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      'Password must contain at least one uppercase, one lowercase, and one number'
    ),

  phone: body('phone')
    .optional({ checkFalsy: true })
    .matches(/^[0-9]{10}$/)
    .withMessage('Please provide a valid 10-digit phone number')
};

/* =========================
   VALIDATION SCHEMAS
========================= */

const validationSchemas = {
  // Auth
  register: [
    commonValidators.name,
    commonValidators.email,
    commonValidators.password,
    commonValidators.phone,

    body('confirmPassword')
      .custom((value, { req }) => {
        if (value !== req.body.password) {
          throw new Error('Passwords do not match');
        }
        return true;
      }),

    body('email').custom(async (email) => {
      const user = await User.findOne({ email });
      if (user) {
        throw new Error('Email already in use');
      }
      return true;
    })
  ],

  login: [
    commonValidators.email,
    body('password').notEmpty().withMessage('Password is required')
  ],

  // Products
  createProduct: [
    body('name')
      .trim()
      .isLength({ min: 3, max: 200 })
      .withMessage('Product name must be between 3 and 200 characters'),

    body('description')
      .trim()
      .isLength({ min: 10, max: 2000 })
      .withMessage('Description must be between 10 and 2000 characters'),

    body('price')
      .isFloat({ min: 0 })
      .withMessage('Price must be a positive number'),

    body('category')
      .isIn(['electronics', 'clothing', 'books', 'home', 'beauty', 'sports', 'other'])
      .withMessage('Invalid category'),

    body('stock')
      .isInt({ min: 0 })
      .withMessage('Stock must be a non-negative integer')
  ],

  updateProduct: [
    param('id')
      .isMongoId()
      .withMessage('Invalid product ID'),

    body('name')
      .optional()
      .trim()
      .isLength({ min: 3, max: 200 })
      .withMessage('Product name must be between 3 and 200 characters'),

    body('price')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Price must be a positive number')
  ],

  createOrder: [
    body('shippingAddress.street')
      .notEmpty().withMessage('Street address is required'),
    
    body('shippingAddress.city')
      .notEmpty().withMessage('City is required'),
    
    body('shippingAddress.state')
      .notEmpty().withMessage('State is required'),
    
    body('shippingAddress.zipCode')
      .notEmpty().withMessage('ZIP code is required')
      .matches(/^\d{6}$/).withMessage('Invalid ZIP code'),
    
    body('shippingAddress.phone')
      .notEmpty().withMessage('Phone number is required')
      .matches(/^[0-9]{10}$/).withMessage('Invalid phone number'),
    
    body('items')
      .isArray({ min: 1 }).withMessage('At least one item is required'),
    
    body('paymentMethod')
      .isIn(['credit_card', 'debit_card', 'paypal', 'cash_on_delivery', 'razorpay'])
      .withMessage('Invalid payment method')
  ],

  // Pagination
  pagination: [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .toInt()
      .withMessage('Page must be a positive integer'),

    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .toInt()
      .withMessage('Limit must be between 1 and 100')
  ]
};

/* =========================
   FILE VALIDATION
========================= */

const validateFile = (req, res, next) => {
  const files = req.files || (req.file ? [req.file] : []);
  
  if (files.length === 0) return next();

  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
  const maxSize = 5 * 1024 * 1024; // 5MB

  for (const file of files) {
    if (!allowedTypes.includes(file.mimetype)) {
      return res.status(400).json({
        success: false,
        message: `Invalid file type: ${file.mimetype}. Allowed types: ${allowedTypes.join(', ')}`
      });
    }

    if (file.size > maxSize) {
      return res.status(400).json({
        success: false,
        message: `File size too large: ${file.originalname}. Max size is 5MB`
      });
    }
  }

  next();
};

/* =========================
   RESULT HANDLER (FIXED)
========================= */

const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array().map(err => ({
        field: err.path || err.param, // Handles both styles of error reporting
        message: err.msg
      }))
    });
  }

  next();
};

/* =========================
   EXPORTS
========================= */

module.exports = {
  commonValidators,
  validationSchemas,
  validateFile,
  validate
};