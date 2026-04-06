const express = require('express');
const router  = express.Router();
const { authenticate } = require('../middlewares/auth');
const {
  sendOtp,
  verifyOtp,
  resendOtp,
  login,
  logout,
  getMe,
  updatePassword,
} = require('../controllers/authController');

// ── OTP Registration Flow ─────────────────────────────
router.post('/send-otp',   sendOtp);    // Step 1: Send OTP
router.post('/verify-otp', verifyOtp);  // Step 2: Verify OTP → create account
router.post('/resend-otp', resendOtp);  // Resend OTP

// ── Standard Auth ─────────────────────────────────────
router.post('/login',  login);
router.get('/logout',  authenticate, logout);
router.get('/me',      authenticate, getMe);
router.put('/update-password', authenticate, updatePassword);

module.exports = router;