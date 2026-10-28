const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middlewares/auth');
const { validate, validationSchemas } = require('../middlewares/validation');
const {
  createOrder,
  createOrderFromCart,
  getAllOrders,
  getOrder,
  getMyOrders,
  updateOrderStatus,
  updatePaymentStatus,
  cancelOrder,
  getSalesAnalytics
} = require('../controllers/orderController');

const paymentService = require('../services/paymentService');
const Order = require('../models/Order');
const { catchAsync, AppError } = require('../middlewares/errorHandler');

/* =========================================
   SPECIFIC ROUTES (Must come FIRST)
========================================= */

// Customer Shopping Operations (Role: 'user' only)
router.post('/', authenticate, authorize('user'), validationSchemas.createOrder, validate, createOrder);
router.post('/from-cart', authenticate, authorize('user'), createOrderFromCart);

// User's Own Orders
router.get('/my-orders', authenticate, authorize('user'), getMyOrders);

// Admin Analytics
router.get('/analytics/sales', authenticate, authorize('admin'), getSalesAnalytics);

// Admin: Get All Orders
router.get('/', authenticate, authorize('admin'), getAllOrders);

/* =========================================
   RAZORPAY CRYPTOGRAPHIC PAYMENT ROUTES
========================================= */

// Create server-side Razorpay order
router.post('/:id/razorpay/create', authenticate, authorize('user'), catchAsync(async (req, res, next) => {
  const order = await Order.findOne({ _id: req.params.id, user: req.userId });
  if (!order) return next(new AppError('Order not found', 404));

  if (order.payment.status === 'completed') {
    return next(new AppError('Order is already paid', 400));
  }

  const razorpayData = await paymentService.createRazorpayOrder(order);

  // Save razorpay order id on our order
  order.payment.razorpayOrderId = razorpayData.orderId;
  await order.save();

  res.status(200).json({
    success: true,
    ...razorpayData,
  });
}));

// Verify Razorpay payment via cryptographic HMAC-SHA256 signature
router.post('/:id/razorpay/verify', authenticate, authorize('user'), catchAsync(async (req, res, next) => {
  const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;

  if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
    return next(new AppError('Missing required payment verification details (payment_id, order_id, signature)', 400));
  }

  const result = await paymentService.verifyRazorpayPayment(
    razorpay_payment_id,
    razorpay_order_id,
    razorpay_signature
  );

  if (!result.success) {
    return next(new AppError('Cryptographic payment verification failed. Invalid signature.', 400));
  }

  const order = await Order.findOne({ _id: req.params.id, user: req.userId });
  if (!order) return next(new AppError('Order not found', 404));

  order.payment.status = 'completed';
  order.payment.transactionId = razorpay_payment_id;
  order.payment.paidAt = new Date();
  order.status = 'processing';
  await order.save();

  res.status(200).json({
    success: true,
    message: 'Payment verified and confirmed successfully',
    order
  });
}));

/* =========================================
   GENERIC ROUTES (Must come LAST)
========================================= */

router.get('/:id', authenticate, getOrder);
router.put('/:id/cancel', authenticate, authorize('user'), cancelOrder);
router.put('/:id/status', authenticate, authorize('admin'), updateOrderStatus);
router.put('/:id/payment', authenticate, authorize('admin'), updatePaymentStatus);

module.exports = router;