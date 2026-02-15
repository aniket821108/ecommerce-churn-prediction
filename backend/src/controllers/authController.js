const User = require('../models/User');
const { generateTokens } = require('../middlewares/auth');
const { catchAsync, AppError } = require('../middlewares/errorHandler');
const logger = require('../utils/logger');

// Generate and send token response
const sendTokenResponse = (user, statusCode, res) => {
  const tokens = generateTokens(user._id, user.role);
  
  // Cookie options
  const cookieOptions = {
    expires: new Date(
      Date.now() + (process.env.JWT_COOKIE_EXPIRE || 7) * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  };
  
  // Set cookies
  res.cookie('accessToken', tokens.accessToken, cookieOptions);
  res.cookie('refreshToken', tokens.refreshToken, {
    ...cookieOptions,
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
  });
  
  // Remove password from output
  user.password = undefined;
  
  res.status(statusCode).json({
    success: true,
    tokens: {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: process.env.JWT_ACCESS_EXPIRE || '15m'
    },
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      address: user.address,
      avatar: user.avatar,
      isActive: user.isActive,
      createdAt: user.createdAt
    }
  });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = catchAsync(async (req, res, next) => {
  const { name, email, password, phone } = req.body;
  
  // Check if user exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(new AppError('User already exists with this email', 400));
  }
  
  // Create user
  const user = await User.create({
    name,
    email,
    password,
    phone,
    role: (email === process.env.ADMIN_EMAIL) ? 'admin' : 'user'
  });
  
  // Log registration
  logger.info(`New user registered: ${email}`, { userId: user._id });
  
  sendTokenResponse(user, 201, res);
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  
  // Check if email and password exist
  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }
  
  // Find user and include password
  const user = await User.findOne({ email }).select('+password');
  
  // Check if user exists and password is correct
  if (!user || !(await user.comparePassword(password))) {
    return next(new AppError('Invalid email or password', 401));
  }
  
  // Check if user is active
  if (!user.isActive) {
    return next(new AppError('Your account has been deactivated', 403));
  }
  
  // Update last login
  user.lastLogin = Date.now();
  await user.save();
  
  // Log login
  logger.info(`User logged in: ${email}`, { userId: user._id });
  
  sendTokenResponse(user, 200, res);
});

// @desc    Logout user
// @route   GET /api/auth/logout
// @access  Private
exports.logout = catchAsync(async (req, res) => {
  res.cookie('accessToken', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });
  
  res.cookie('refreshToken', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });
  
  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
});

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = catchAsync(async (req, res) => {
  const user = await User.findById(req.userId);
  
  res.status(200).json({
    success: true,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      address: user.address,
      avatar: user.avatar,
      isActive: user.isActive,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin
    }
  });
});

// @desc    Update user details
// @route   PUT /api/auth/update
// @access  Private
exports.updateDetails = catchAsync(async (req, res, next) => {
  const { name, email, phone, address } = req.body;
  
  // Check if email is being changed and if it's already taken
  if (email && email !== req.user.email) {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(new AppError('Email already in use', 400));
    }
  }
  
  const updatedFields = {};
  if (name) updatedFields.name = name;
  if (email) updatedFields.email = email;
  if (phone) updatedFields.phone = phone;
  if (address) updatedFields.address = address;
  
  const user = await User.findByIdAndUpdate(
    req.userId,
    updatedFields,
    {
      new: true,
      runValidators: true
    }
  );
  
  res.status(200).json({
    success: true,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      address: user.address,
      avatar: user.avatar,
      isActive: user.isActive,
      createdAt: user.createdAt
    }
  });
});

// @desc    Update password
// @route   PUT /api/auth/update-password
// @access  Private
exports.updatePassword = catchAsync(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;
  
  // Get user with password
  const user = await User.findById(req.userId).select('+password');
  
  // Check current password
  if (!(await user.comparePassword(currentPassword))) {
    return next(new AppError('Current password is incorrect', 401));
  }
  
  // Update password
  user.password = newPassword;
  user.passwordChangedAt = Date.now();
  await user.save();
  
  // Log password change
  logger.info(`Password changed for user: ${user.email}`, { userId: user._id });
  
  sendTokenResponse(user, 200, res);
});

// @desc    Refresh token
// @route   POST /api/auth/refresh
// @access  Public
exports.refreshToken = catchAsync(async (req, res, next) => {
  const { refreshToken } = req.body;
  
  if (!refreshToken) {
    return next(new AppError('Refresh token is required', 400));
  }
  
  // Verify refresh token
  const jwt = require('jsonwebtoken');
  let decoded;
  
  try {
    decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key-change-this');
  } catch (error) {
    return next(new AppError('Invalid refresh token', 401));
  }
  
  // Check if user still exists
  const user = await User.findById(decoded.userId);
  if (!user) {
    return next(new AppError('User no longer exists', 401));
  }
  
  // Generate new tokens
  const tokens = generateTokens(user._id, user.role);
  
  res.status(200).json({
    success: true,
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken
  });
});