const express = require('express');
const router = express.Router();

// ✅ 1. Use YOUR working Middleware imports
const { authenticate, authorize } = require('../middlewares/auth');

// ✅ 2. Use MY new Controller imports (Matches the robust controller we just built)
const {
  getDashboardStats,
  getChurnPredictions,
  getSystemMetrics,
  getAdminLogs,
  clearCache,
  sendSystemNotification,
  backupDatabase
} = require('../controllers/adminController');

// ✅ 3. Apply Authentication & Authorization (Using your working syntax)
router.use(authenticate, authorize('admin'));

// ==========================================
// ROUTES
// ==========================================

// Dashboard & Analytics
router.get('/dashboard', getDashboardStats);
router.get('/analytics/churn', getChurnPredictions); // This enables the Churn feature!

// System & Logs
router.get('/metrics', getSystemMetrics);
router.get('/logs', getAdminLogs);

// Admin Actions
router.post('/cache/clear', clearCache);
router.post('/notifications', sendSystemNotification);
router.post('/backup', backupDatabase);

module.exports = router;