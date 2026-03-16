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
const { catchAsync } = require('../middlewares/errorHandler');

/* =========================================
   SPECIFIC ROUTES (Must come FIRST)
========================================= */

router.post('/', authenticate, validationSchemas.createOrder, validate, createOrder);
router.post('/from-cart', authenticate, createOrderFromCart);

// User's Own Orders
router.get('/my-orders', authenticate, getMyOrders);

// ✅ User can confirm their own Razorpay payment (no admin required)
router.post('/:id/confirm-payment', authenticate, catchAsync(async (req, res, next) => {
  const { razorpay_payment_id } = req.body;

  // Find order belonging to this user
  const order = await Order.findOne({ _id: req.params.id, user: req.userId });
  if (!order) return next(new Error('Order not found'));

  // Mark payment as completed
  order.payment.status = 'completed';
  order.payment.transactionId = razorpay_payment_id;
  order.payment.paidAt = new Date();
  await order.save();

  res.status(200).json({
    success: true,
    message: 'Payment confirmed successfully',
    order
  });
}));

// Admin Analytics
router.get('/analytics/sales', authenticate, authorize('admin'), getSalesAnalytics);

// Admin: Get All Orders
router.get('/', authenticate, authorize('admin'), getAllOrders);

/* =========================================
   RAZORPAY ROUTES
========================================= */

// Create Razorpay order (called after DB order is created)
router.post('/:id/razorpay/create', authenticate, catchAsync(async (req, res, next) => {
  const order = await Order.findOne({ _id: req.params.id, user: req.userId });
  if (!order) return next(new Error('Order not found'));

  const razorpayData = await paymentService.createRazorpayOrder(order);

  // Save razorpay order id on our order
  order.payment.razorpayOrderId = razorpayData.orderId;
  await order.save();

  res.status(200).json({
    success: true,
    ...razorpayData,
  });
}));

// Verify Razorpay payment after user pays
router.post('/:id/razorpay/verify', authenticate, catchAsync(async (req, res, next) => {
  const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;

  const result = await paymentService.verifyRazorpayPayment(
    razorpay_payment_id,
    razorpay_order_id,
    razorpay_signature
  );

  if (!result.success) {
    return next(new Error('Payment verification failed'));
  }

  const order = await Order.findById(req.params.id);
  if (!order) return next(new Error('Order not found'));

  order.payment.status = 'completed';
  order.payment.transactionId = razorpay_payment_id;
  order.payment.paidAt = new Date();
  await order.save();

  res.status(200).json({ success: true, message: 'Payment verified', order });
}));

/* =========================================
   GENERIC ROUTES (Must come LAST)
========================================= */

router.get('/:id', authenticate, getOrder);
router.put('/:id/cancel', authenticate, cancelOrder);
router.put('/:id/status', authenticate, authorize('admin'), updateOrderStatus);
router.put('/:id/payment', authenticate, authorize('admin'), updatePaymentStatus);

module.exports = router;