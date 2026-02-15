const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middlewares/auth');
const { validate, validationSchemas } = require('../middlewares/validation');
const {
  createOrder,
  createOrderFromCart,
  getAllOrders,
  getOrder,
  getMyOrders, // <--- 1. MAKE SURE YOU IMPORT THIS!
  updateOrderStatus,
  updatePaymentStatus,
  cancelOrder,
  getSalesAnalytics
} = require('../controllers/orderController');

/* =========================================
   SPECIFIC ROUTES (Must come FIRST)
========================================= */

// Create Order
router.post(
  '/', 
  authenticate, 
  validationSchemas.createOrder, 
  validate, 
  createOrder
);

router.post('/from-cart', authenticate, createOrderFromCart);

// User's Own Orders (Must be ABOVE /:id)
router.get('/my-orders', authenticate, getMyOrders); 

// Admin Analytics (Must be ABOVE /:id)
router.get('/analytics/sales', authenticate, authorize('admin'), getSalesAnalytics);

// Admin: Get All Orders (Root path is fine here)
router.get('/', authenticate, authorize('admin'), getAllOrders);

/* =========================================
   GENERIC ROUTES (Must come LAST)
========================================= */

// Get Single Order by ID (The "Trap" Route)
router.get('/:id', authenticate, getOrder);

router.put('/:id/cancel', authenticate, cancelOrder);

// Admin Updates
router.put('/:id/status', authenticate, authorize('admin'), updateOrderStatus);
router.put('/:id/payment', authenticate, authorize('admin'), updatePaymentStatus);

module.exports = router;