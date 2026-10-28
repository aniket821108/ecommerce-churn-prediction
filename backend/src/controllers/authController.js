const User    = require('../models/User');
const Otp     = require('../models/Otp');
const bcrypt  = require('bcryptjs');
const crypto  = require('crypto');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../utils/jwt');
const { catchAsync } = require('../middlewares/errorHandler');
const { sendEmail }  = require('../services/emailService');
const logger  = require('../utils/logger');
const { validateEmail, validatePassword, validatePhone } = require('../utils/validators');

// ── Constants ─────────────────────────────────────────
const IS_PROD = process.env.NODE_ENV === 'production';

// ── Cookie options ────────────────────────────────────
const accessCookieOpts = {
  httpOnly: true,
  secure:   IS_PROD,
  sameSite: 'lax',
  path:     '/',
  maxAge:   15 * 60 * 1000, // 15 min
};

const refreshCookieOpts = {
  httpOnly: true,
  secure:   IS_PROD,
  sameSite: 'lax',
  path:     '/',
  maxAge:   7 * 24 * 60 * 60 * 1000, // 7 days
};

// ── JWT helpers ───────────────────────────────────────
const signAccess  = (id, tokenVersion) => signAccessToken(id, tokenVersion);
const signRefresh = (id, tokenVersion) => signRefreshToken(id, tokenVersion);

const setTokenCookies = (res, user, rememberMe = false) => {
  const accessToken  = signAccess(user._id, user.tokenVersion || 0);
  const refreshToken = signRefresh(user._id, user.tokenVersion || 0);

  res.cookie('accessToken', accessToken, accessCookieOpts);

  const rOpts = { ...refreshCookieOpts };
  if (!rememberMe) delete rOpts.maxAge; // session cookie
  res.cookie('refreshToken', refreshToken, rOpts);
};

const clearCookies = (res) => {
  res.clearCookie('accessToken',  { path: '/' });
  res.clearCookie('refreshToken', { path: '/' });
};

// ── OTP helpers (crypto-secure) ───────────────────────
const generateOTP = () => crypto.randomInt(100000, 999999).toString();
const hashOTP     = (otp) => crypto.createHash('sha256').update(otp).digest('hex');

// ── Safe user payload ─────────────────────────────────
const safeUser = (u) => ({
  _id:           u._id,
  name:          u.name,
  email:         u.email,
  role:          u.role,
  phone:         u.phone,
  avatar:        u.avatar,
  emailVerified: u.emailVerified !== false,
});

// ══════════════════════════════════════════════════════
// SEND OTP  (registration step 1)
// POST /api/auth/send-otp
// ══════════════════════════════════════════════════════
exports.sendOtp = catchAsync(async (req, res) => {
  const { name, email, password, phone } = req.body;

  if (!name || !email || !password || !phone) {
    return res.status(400).json({ success: false, message: 'All fields are required' });
  }
  if (!validateEmail(email)) {
    return res.status(400).json({ success: false, message: 'Invalid email format' });
  }
  const pv = validatePassword(password);
  if (!pv.isValid) {
    return res.status(400).json({ success: false, message: Object.values(pv.errors).find(e => e) || 'Invalid password' });
  }
  if (!validatePhone(phone)) {
    return res.status(400).json({ success: false, message: 'Invalid phone number (10 digits starting with 6-9)' });
  }

  // Generic response to prevent user enumeration
  const genericMsg = 'If this email is available, a verification code has been sent.';

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    // Don't reveal the email is taken
    return res.status(200).json({ success: true, message: genericMsg, email });
  }

  await Otp.deleteMany({ email: email.toLowerCase() });

  const hashedPassword = await bcrypt.hash(password, 12);
  const otp       = generateOTP();
  const hashedOtp  = hashOTP(otp);

  await Otp.create({
    email:     email.toLowerCase(),
    otp:       hashedOtp,
    userData:  { name, password: hashedPassword, phone },
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
  });

  await sendEmail(email, 'otpVerification', { name, otp });

  logger.info('OTP sent for registration', { email: email.replace(/(.{2}).*(@.*)/, '$1***$2') });

  res.status(200).json({ success: true, message: genericMsg, email });
});

// ══════════════════════════════════════════════════════
// VERIFY OTP & CREATE ACCOUNT
// POST /api/auth/verify-otp
// ══════════════════════════════════════════════════════
exports.verifyOtp = catchAsync(async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ success: false, message: 'Email and OTP are required' });
  }

  const rec = await Otp.findOne({ email: email.toLowerCase() });
  if (!rec) {
    return res.status(400).json({ success: false, message: 'OTP expired or not found. Please register again.' });
  }
  if (rec.attempts >= 5) {
    await Otp.deleteOne({ _id: rec._id });
    return res.status(429).json({ success: false, message: 'Too many wrong attempts. Please register again.' });
  }
  if (rec.expiresAt < new Date()) {
    await Otp.deleteOne({ _id: rec._id });
    return res.status(400).json({ success: false, message: 'OTP has expired. Please register again.' });
  }

  // Compare SHA-256 hash
  if (rec.otp !== hashOTP(otp.toString())) {
    await Otp.updateOne({ _id: rec._id }, { $inc: { attempts: 1 } });
    const rem = 4 - rec.attempts;
    return res.status(400).json({ success: false, message: `Invalid OTP. ${rem} attempt${rem !== 1 ? 's' : ''} remaining.` });
  }

  const { name, password, phone } = rec.userData;

  // Create user — password is already hashed, skip pre-save hash
  const user     = new User({
    name,
    email:         email.toLowerCase(),
    phone,
    role:          'user',       // NEVER accept role from client
    isActive:      true,
    emailVerified: true,
  });
  user.password        = password; // pre-hashed
  user._skipPasswordHash = true;
  await user.save();

  await Otp.deleteOne({ _id: rec._id });

  try { await sendEmail(email, 'welcome', { name }); }
  catch (e) { logger.warn('Welcome email failed:', e.message); }

  logger.info('New user registered', { userId: user._id });

  setTokenCookies(res, user, true);
  res.status(201).json({ success: true, user: safeUser(user) });
});

// ══════════════════════════════════════════════════════
// RESEND OTP
// POST /api/auth/resend-otp
// ══════════════════════════════════════════════════════
exports.resendOtp = catchAsync(async (req, res) => {
  const { email } = req.body;
  const generic = { success: true, message: 'If a pending registration exists, a new OTP has been sent.' };

  if (!email) return res.status(400).json({ success: false, message: 'Email is required' });

  // Don't reveal whether user/OTP exists
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) return res.status(200).json(generic);

  const old = await Otp.findOne({ email: email.toLowerCase() });
  if (!old) return res.status(200).json(generic);

  const otp      = generateOTP();
  const hashedOtp = hashOTP(otp);
  const name     = old.userData?.name || 'User';

  await Otp.updateOne(
    { email: email.toLowerCase() },
    { otp: hashedOtp, attempts: 0, expiresAt: new Date(Date.now() + 10 * 60 * 1000) }
  );

  await sendEmail(email, 'otpVerification', { name, otp });
  logger.info('OTP resent', { email: email.replace(/(.{2}).*(@.*)/, '$1***$2') });

  res.status(200).json(generic);
});

// ══════════════════════════════════════════════════════
// LOGIN
// POST /api/auth/login
// ══════════════════════════════════════════════════════
exports.login = catchAsync(async (req, res) => {
  const { email, password, rememberMe } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required' });
  }
  if (!validateEmail(email)) {
    return res.status(400).json({ success: false, message: 'Invalid email format' });
  }

  const user = await User.findOne({ email: email.toLowerCase() }).select('+password +tokenVersion');

  if (!user || !user.isActive) {
    return res.status(401).json({ success: false, message: 'Invalid email or password' });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(401).json({ success: false, message: 'Invalid email or password' });
  }

  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  logger.info('User logged in', { userId: user._id });

  setTokenCookies(res, user, !!rememberMe);
  res.status(200).json({ success: true, user: safeUser(user) });
});

// ══════════════════════════════════════════════════════
// REFRESH TOKEN
// POST /api/auth/refresh-token
// ══════════════════════════════════════════════════════
exports.refreshToken = catchAsync(async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (!token) {
    return res.status(401).json({ success: false, message: 'No refresh token', code: 'NO_REFRESH' });
  }

  let decoded;
  try {
    decoded = verifyRefreshToken(token);
  } catch {
    clearCookies(res);
    return res.status(401).json({ success: false, message: 'Invalid or expired refresh token', code: 'REFRESH_EXPIRED' });
  }

  if (decoded.type !== 'refresh') {
    clearCookies(res);
    return res.status(401).json({ success: false, message: 'Invalid token type' });
  }

  const user = await User.findById(decoded.id).select('+tokenVersion');
  if (!user || !user.isActive) {
    clearCookies(res);
    return res.status(401).json({ success: false, message: 'User not found or inactive' });
  }

  if ((user.tokenVersion || 0) !== decoded.tokenVersion) {
    clearCookies(res);
    return res.status(401).json({ success: false, message: 'Token revoked', code: 'TOKEN_REVOKED' });
  }

  setTokenCookies(res, user, true);
  res.status(200).json({ success: true, user: safeUser(user) });
});

// ══════════════════════════════════════════════════════
// GET ME
// GET /api/auth/me
// ══════════════════════════════════════════════════════
exports.getMe = catchAsync(async (req, res) => {
  const user = await User.findById(req.userId);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }
  res.status(200).json({ success: true, user: safeUser(user) });
});

// ══════════════════════════════════════════════════════
// LOGOUT
// POST /api/auth/logout
// ══════════════════════════════════════════════════════
exports.logout = catchAsync(async (req, res) => {
  // Revoke all tokens by incrementing tokenVersion
  if (req.userId) {
    await User.findByIdAndUpdate(req.userId, { $inc: { tokenVersion: 1 } });
  }
  clearCookies(res);
  res.status(200).json({ success: true, message: 'Logged out successfully' });
});

// ══════════════════════════════════════════════════════
// FORGOT PASSWORD
// POST /api/auth/forgot-password
// ══════════════════════════════════════════════════════
exports.forgotPassword = catchAsync(async (req, res) => {
  const { email } = req.body;
  const generic = { success: true, message: 'If an account with that email exists, a password reset link has been sent.' };

  if (!email || !validateEmail(email)) return res.status(200).json(generic);

  const user = await User.findOne({ email: email.toLowerCase(), isActive: true });
  if (!user) return res.status(200).json(generic);

  // Crypto-random token — store only the hash
  const resetToken  = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

  user.passwordResetToken   = hashedToken;
  user.passwordResetExpires = new Date(Date.now() + 30 * 60 * 1000); // 30 min
  await user.save({ validateBeforeSave: false });

  try {
    await sendEmail(email, 'passwordReset', { name: user.name, resetToken });
  } catch (err) {
    user.passwordResetToken   = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    logger.error('Password reset email failed', { userId: user._id });
    return res.status(500).json({ success: false, message: 'Failed to send reset email. Try again.' });
  }

  logger.info('Password reset requested', { userId: user._id });
  res.status(200).json(generic);
});

// ══════════════════════════════════════════════════════
// RESET PASSWORD
// POST /api/auth/reset-password/:token
// ══════════════════════════════════════════════════════
exports.resetPassword = catchAsync(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  if (!token || !password) {
    return res.status(400).json({ success: false, message: 'Token and new password are required' });
  }

  const pv = validatePassword(password);
  if (!pv.isValid) {
    return res.status(400).json({ success: false, message: Object.values(pv.errors).find(e => e) || 'Invalid password' });
  }

  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    passwordResetToken:   hashedToken,
    passwordResetExpires: { $gt: new Date() },
    isActive:             true,
  }).select('+tokenVersion');

  if (!user) {
    return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
  }

  user.password              = await bcrypt.hash(password, 12);
  user.passwordResetToken    = undefined;
  user.passwordResetExpires  = undefined;
  user.passwordChangedAt     = new Date();
  user.tokenVersion          = (user.tokenVersion || 0) + 1; // revoke all sessions
  user._skipPasswordHash     = true;
  await user.save({ validateBeforeSave: false });

  clearCookies(res);

  try { await sendEmail(user.email, 'passwordChanged', { name: user.name }); }
  catch (e) { logger.warn('Password changed email failed:', e.message); }

  logger.info('Password reset successful', { userId: user._id });
  res.status(200).json({ success: true, message: 'Password reset successful. Please login with your new password.' });
});

// ══════════════════════════════════════════════════════
// UPDATE PASSWORD (authenticated user)
// PUT /api/auth/update-password
// ══════════════════════════════════════════════════════
exports.updatePassword = catchAsync(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ success: false, message: 'Current and new password are required' });
  }

  const pv = validatePassword(newPassword);
  if (!pv.isValid) {
    return res.status(400).json({ success: false, message: Object.values(pv.errors).find(e => e) || 'Invalid new password' });
  }

  const user = await User.findById(req.userId).select('+password +tokenVersion');
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });

  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) return res.status(400).json({ success: false, message: 'Current password is incorrect' });

  user.password          = await bcrypt.hash(newPassword, 12);
  user.passwordChangedAt = new Date();
  user.tokenVersion      = (user.tokenVersion || 0) + 1;
  user._skipPasswordHash = true;
  await user.save({ validateBeforeSave: false });

  // Re-issue cookies with new tokenVersion
  setTokenCookies(res, user, true);
  res.status(200).json({ success: true, user: safeUser(user), message: 'Password updated successfully' });
});