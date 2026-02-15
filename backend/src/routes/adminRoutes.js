const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { authenticate, authorize } = require('../middlewares/auth');
const { adminRateLimiter, logAdminAction } = require('../middlewares/admin');
const {
  getDashboardStats,
  getAdminLogs,
  getSystemMetrics,
  clearCache,
  sendSystemNotification,
  backupDatabase,
  getChurnPredictions
} = require('../controllers/adminController');

// Apply rate limiting to admin routes
const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later'
});

// All admin routes require authentication and admin role
router.use(authenticate, authorize('admin'));
router.use(adminLimiter);

// Dashboard routes
router.get('/dashboard', getDashboardStats);
router.get('/logs', getAdminLogs);
router.get('/metrics', getSystemMetrics);
router.get('/analytics/churn', getChurnPredictions);

// Admin actions
router.post('/cache/clear', clearCache);
router.post('/notifications', sendSystemNotification);
router.post('/backup', backupDatabase);

module.exports = router;