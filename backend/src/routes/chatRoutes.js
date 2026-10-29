const express = require('express');
const router = express.Router();
const { optionalAuth, authenticate, authorize } = require('../middlewares/auth');
const { handleCustomerChat, handleAdminChat } = require('../controllers/chatController');

// Storefront Customer Assistant — accessible to guests and logged-in shoppers
router.post('/customer', optionalAuth, handleCustomerChat);

// Admin Operations Copilot — strictly restricted to authenticated administrators
router.post('/admin', authenticate, authorize('admin'), handleAdminChat);

module.exports = router;

