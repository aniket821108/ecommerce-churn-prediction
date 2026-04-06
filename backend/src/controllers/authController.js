const User    = require('../models/User');
const Otp     = require('../models/Otp');
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const { catchAsync } = require('../middlewares/errorHandler');
const { sendEmail }  = require('../services/emailService');
const logger  = require('../utils/logger');

// ── JWT Helper ────────────────────────────────────────
const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '7d' });

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  const userObj = {
    _id:    user._id,
    name:   user.name,
    email:  user.email,
    role:   user.role,
    phone:  user.phone,
    avatar: user.avatar,
  };
  res.status(statusCode).json({ success: true, token, user: userObj });
};

// ── OTP Generator ─────────────────────────────────────
const generateOTP = () =>
  Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit

// ══════════════════════════════════════════════════════
// STEP 1 — SEND OTP (first step of registration)
// POST /api/auth/send-otp
// ══════════════════════════════════════════════════════
exports.sendOtp = catchAsync(async (req, res) => {
  const { name, email, password, phone } = req.body;

  // ── Validate required fields ──
  if (!name || !email || !password || !phone) {
    return res.status(400).json({ success: false, message: 'All fields are required' });
  }
  if (password.length < 6) {
    return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
  }
  if (!/^\d{10}$/.test(phone)) {
    return res.status(400).json({ success: false, message: 'Phone must be exactly 10 digits' });
  }

  // ── Check if email already registered ──
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    return res.status(409).json({ success: false, message: 'Email already registered. Please login.' });
  }

  // ── Delete any previous OTP for this email ──
  await Otp.deleteMany({ email: email.toLowerCase() });

  // ── Hash password early (store in OTP doc temporarily) ──
  const hashedPassword = await bcrypt.hash(password, 12);

  // ── Generate OTP ──
  const otp = generateOTP();

  // ── Save OTP + userData to DB ──
  await Otp.create({
    email:    email.toLowerCase(),
    otp,
    userData: { name, password: hashedPassword, phone },
    expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
  });

  // ── Send OTP email ──
  await sendEmail(email, 'otpVerification', { name, otp });

  logger.info(`OTP sent to ${email}`);

  res.status(200).json({
    success: true,
    message: `OTP sent to ${email}. Valid for 10 minutes.`,
    email,
  });
});

// ══════════════════════════════════════════════════════
// STEP 2 — VERIFY OTP & CREATE ACCOUNT
// POST /api/auth/verify-otp
// ══════════════════════════════════════════════════════
exports.verifyOtp = catchAsync(async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ success: false, message: 'Email and OTP are required' });
  }

  // ── Find OTP record ──
  const otpRecord = await Otp.findOne({ email: email.toLowerCase() });

  if (!otpRecord) {
    return res.status(400).json({ success: false, message: 'OTP expired or not found. Please register again.' });
  }

  // ── Check max attempts (prevent brute force) ──
  if (otpRecord.attempts >= 5) {
    await Otp.deleteOne({ _id: otpRecord._id });
    return res.status(429).json({ success: false, message: 'Too many wrong attempts. Please register again.' });
  }

  // ── Check expiry ──
  if (otpRecord.expiresAt < new Date()) {
    await Otp.deleteOne({ _id: otpRecord._id });
    return res.status(400).json({ success: false, message: 'OTP has expired. Please register again.' });
  }

  // ── Verify OTP ──
  if (otpRecord.otp !== otp.toString()) {
    // Increment attempts
    await Otp.updateOne({ _id: otpRecord._id }, { $inc: { attempts: 1 } });
    const remaining = 4 - otpRecord.attempts;
    return res.status(400).json({
      success: false,
      message: `Invalid OTP. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`
    });
  }

  // ── OTP correct — create user ──
  const { name, password, phone } = otpRecord.userData;

  const user = await User.create({
    name,
    email: email.toLowerCase(),
    password,
    phone,
    isActive: true,
  });

  // ── Delete OTP record ──
  await Otp.deleteOne({ _id: otpRecord._id });

  // ── Send welcome email ──
  try {
    await sendEmail(email, 'welcome', { name });
  } catch (e) {
    logger.warn('Welcome email failed:', e.message);
  }

  logger.info(`New user registered: ${email}`);

  // ── Send token ──
  createSendToken(user, 201, res);
});

// ══════════════════════════════════════════════════════
// RESEND OTP
// POST /api/auth/resend-otp
// ══════════════════════════════════════════════════════
exports.resendOtp = catchAsync(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, message: 'Email is required' });
  }

  // ── Check if user already exists ──
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    return res.status(409).json({ success: false, message: 'Email already registered.' });
  }

  // ── Find old OTP to preserve userData ──
  const oldOtp = await Otp.findOne({ email: email.toLowerCase() });
  if (!oldOtp) {
    return res.status(400).json({ success: false, message: 'No pending registration found. Please register again.' });
  }

  const otp = generateOTP();
  const name = oldOtp.userData?.name || 'User';

  // ── Update OTP with fresh code and reset attempts ──
  await Otp.updateOne(
    { email: email.toLowerCase() },
    {
      otp,
      attempts: 0,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    }
  );

  await sendEmail(email, 'otpVerification', { name, otp });

  logger.info(`OTP resent to ${email}`);

  res.status(200).json({
    success: true,
    message: `New OTP sent to ${email}.`,
  });
});

// ══════════════════════════════════════════════════════
// LOGIN (unchanged)
// POST /api/auth/login
// ══════════════════════════════════════════════════════
exports.login = catchAsync(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required' });
  }

  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user || !user.isActive) {
    return res.status(401).json({ success: false, message: 'Invalid email or password' });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(401).json({ success: false, message: 'Invalid email or password' });
  }

  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  logger.info(`User logged in: ${email}`, { userId: user._id });
  createSendToken(user, 200, res);
});

// ══════════════════════════════════════════════════════
// GET ME (unchanged)
// GET /api/auth/me
// ══════════════════════════════════════════════════════
exports.getMe = catchAsync(async (req, res) => {
  const user = await User.findById(req.userId);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }
  res.status(200).json({ success: true, user });
});

// ══════════════════════════════════════════════════════
// LOGOUT
// GET /api/auth/logout
// ══════════════════════════════════════════════════════
exports.logout = catchAsync(async (req, res) => {
  res.status(200).json({ success: true, message: 'Logged out successfully' });
});

// ══════════════════════════════════════════════════════
// UPDATE PASSWORD
// PUT /api/auth/update-password
// ══════════════════════════════════════════════════════
exports.updatePassword = catchAsync(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.userId).select('+password');
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) {
    return res.status(400).json({ success: false, message: 'Current password is incorrect' });
  }

  user.password = await bcrypt.hash(newPassword, 12);
  await user.save({ validateBeforeSave: false });

  createSendToken(user, 200, res);
});