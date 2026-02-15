const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middlewares/auth');
const { validate } = require('../middlewares/validation');
const {
  getUserProfile,
  updateUserProfile,
  getUserOrders,
  getUserOrder,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  getUserStats
} = require('../controllers/userController');

// User profile routes
router.get('/profile', authenticate, getUserProfile);
router.put('/profile', authenticate, updateUserProfile);

// User order routes
router.get('/orders', authenticate, getUserOrders);
router.get('/orders/:id', authenticate, getUserOrder);

// Admin user management routes
router.get('/', authenticate, authorize('admin'), getAllUsers);
router.get('/stats/overview', authenticate, authorize('admin'), getUserStats);
router.get('/:id', authenticate, authorize('admin'), getUserById);
router.put('/:id', authenticate, authorize('admin'), updateUser);
router.delete('/:id', authenticate, authorize('admin'), deleteUser);

module.exports = router;