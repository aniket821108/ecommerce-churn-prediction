const express = require('express');
const router = express.Router();
const { optionalAuth, authenticate, authorize } = require('../middlewares/auth');
const {
  handleCustomerChat,
  handleAdminChat,
  handleAdminSendEmail,
  handleAdminSendWhatsapp
} = require('../controllers/chatController');

// Storefront Customer Assistant — accessible to guests and logged-in shoppers
router.post('/customer', optionalAuth, handleCustomerChat);

// Admin Operations Copilot — strictly restricted to authenticated administrators
router.post('/admin', authenticate, authorize('admin'), handleAdminChat);

// Admin Confirmed CRM Outreach Email Dispatch — strictly restricted to authenticated administrators
router.post('/admin/send-email', authenticate, authorize('admin'), handleAdminSendEmail);

// Admin Confirmed CRM WhatsApp Deal Dispatch — strictly restricted to authenticated administrators
router.post('/admin/send-whatsapp', authenticate, authorize('admin'), handleAdminSendWhatsapp);

module.exports = router;
