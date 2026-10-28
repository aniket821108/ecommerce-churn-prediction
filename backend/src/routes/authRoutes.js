const express   = require('express');
const router    = express.Router();
const rateLimit = require('express-rate-limit');
const { authenticate, optionalAuth } = require('../middlewares/auth');
const {
  sendOtp,
  verifyOtp,
  resendOtp,
  login,
  logout,
  getMe,
  updatePassword,
  refreshToken,
  forgotPassword,
  resetPassword,
} = require('../controllers/authController');

// ── Auth-specific rate limits ─────────────────────────
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 min
  max: 5,                     // 5 attempts
  message: { success: false, message: 'Too many login attempts. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const forgotLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  message: { success: false, message: 'Too many reset requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { success: false, message: 'Too many OTP requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ── OTP Registration Flow ─────────────────────────────
router.post('/send-otp',   otpLimiter, sendOtp);
router.post('/verify-otp', otpLimiter, verifyOtp);
router.post('/resend-otp', otpLimiter, resendOtp);

// ── Standard Auth ─────────────────────────────────────
router.post('/login',          loginLimiter, login);
router.post('/logout',         optionalAuth, logout);
router.get('/me',              authenticate, getMe);
router.put('/update-password', authenticate, updatePassword);

// ── Token Refresh ─────────────────────────────────────
router.post('/refresh-token', refreshToken);

// ── Forgot / Reset Password ───────────────────────────
router.post('/forgot-password',        forgotLimiter, forgotPassword);
router.post('/reset-password/:token',  resetPassword);

module.exports = router;