const User = require('../models/User');
const Order = require('../models/Order');
const { catchAsync, AppError } = require('../middlewares/errorHandler');
const logger = require('../utils/logger');

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
exports.getUserProfile = catchAsync(async (req, res) => {
  const user = await User.findById(req.userId);
  
  res.status(200).json({
    success: true,
    user: user.toSafeObject()
  });
});

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
exports.updateUserProfile = catchAsync(async (req, res, next) => {
  const { name, email, phone, address } = req.body;
  
  // Check if email is being changed and if it's already taken
  if (email && email !== req.user.email) {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(new AppError('Email already in use', 400));
    }
  }
  
  const user = await User.findByIdAndUpdate(
    req.userId,
    {
      name: name || req.user.name,
      email: email || req.user.email,
      phone: phone || req.user.phone,
      address: address || req.user.address
    },
    {
      new: true,
      runValidators: true
    }
  );
  
  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    user: user.toSafeObject()
  });
});

// @desc    Get user orders
// @route   GET /api/users/orders
// @access  Private
exports.getUserOrders = catchAsync(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const status = req.query.status;
  
  const orders = await Order.findByUser(req.userId, { page, limit, status });
  
  res.status(200).json({
    success: true,
    count: orders.length,
    orders
  });
});

// @desc    Get single order
// @route   GET /api/users/orders/:id
// @access  Private
exports.getUserOrder = catchAsync(async (req, res, next) => {
  const order = await Order.findOne({
    _id: req.params.id,
    user: req.userId
  }).populate('items.product', 'name images price');
  
  if (!order) {
    return next(new AppError('Order not found', 404));
  }
  
  res.status(200).json({
    success: true,
    order
  });
});

// @desc    Get all users (Admin only)
// @route   GET /api/users
// @access  Private/Admin
exports.getAllUsers = catchAsync(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;
  
  const query = {};
  
  // Filter by role
  if (req.query.role) {
    query.role = req.query.role;
  }
  
  // Filter by active status
  if (req.query.active !== undefined) {
    query.isActive = req.query.active === 'true';
  }
  
  // Search by name or email
  if (req.query.search) {
    query.$or = [
      { name: { $regex: req.query.search, $options: 'i' } },
      { email: { $regex: req.query.search, $options: 'i' } }
    ];
  }
  
  const [users, total] = await Promise.all([
    User.find(query)
      .select('-password -__v')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    User.countDocuments(query)
  ]);
  
  res.status(200).json({
    success: true,
    count: users.length,
    total,
    pagination: {
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    },
    users
  });
});

// @desc    Get user by ID (Admin only)
// @route   GET /api/users/:id
// @access  Private/Admin
exports.getUserById = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id).select('-password -__v');
  
  if (!user) {
    return next(new AppError('User not found', 404));
  }
  
  // Get user statistics
  const orderStats = await Order.aggregate([
    { $match: { user: user._id } },
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        totalSpent: { $sum: '$total' },
        avgOrderValue: { $avg: '$total' }
      }
    }
  ]);
  
  const stats = orderStats[0] || {
    totalOrders: 0,
    totalSpent: 0,
    avgOrderValue: 0
  };
  
  res.status(200).json({
    success: true,
    user,
    stats
  });
});

// @desc    Update user (Admin only)
// @route   PUT /api/users/:id
// @access  Private/Admin
exports.updateUser = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  
  if (!user) {
    return next(new AppError('User not found', 404));
  }
  
  const { name, email, role, isActive, address, phone } = req.body;
  
  // Prevent self-demotion
  if (role && role !== 'admin' && user._id.toString() === req.userId) {
    return next(new AppError('You cannot remove your own admin privileges', 400));
  }
  
  // Update fields
  if (name !== undefined) user.name = name;
  if (email !== undefined) user.email = email;
  if (role !== undefined) user.role = role;
  if (isActive !== undefined) user.isActive = isActive;
  if (address !== undefined) user.address = address;
  if (phone !== undefined) user.phone = phone;
  
  await user.save();
  
  logger.info(`User updated by admin`, { 
    userId: user._id,
    adminId: req.userId,
    updates: req.body 
  });
  
  res.status(200).json({
    success: true,
    message: 'User updated successfully',
    user: user.toSafeObject()
  });
});

// @desc    Delete user (Admin only)
// @route   DELETE /api/users/:id
// @access  Private/Admin
exports.deleteUser = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  
  if (!user) {
    return next(new AppError('User not found', 404));
  }
  
  // Prevent self-deletion
  if (user._id.toString() === req.userId) {
    return next(new AppError('You cannot delete your own account', 400));
  }
  
  // Soft delete (set isActive to false)
  user.isActive = false;
  await user.save();
  
  // Or hard delete
  // await user.deleteOne();
  
  logger.info(`User deactivated by admin`, { 
    userId: user._id,
    adminId: req.userId 
  });
  
  res.status(200).json({
    success: true,
    message: 'User deactivated successfully'
  });
});

// @desc    Get user statistics (Admin only)
// @route   GET /api/users/stats/overview
// @access  Private/Admin
exports.getUserStats = catchAsync(async (req, res) => {
  const { startDate, endDate } = req.query;
  
  const matchStage = {};
  
  if (startDate || endDate) {
    matchStage.createdAt = {};
    if (startDate) matchStage.createdAt.$gte = new Date(startDate);
    if (endDate) matchStage.createdAt.$lte = new Date(endDate);
  }
  
  const stats = await User.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalUsers: { $sum: 1 },
        activeUsers: {
          $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
        },
        adminUsers: {
          $sum: { $cond: [{ $eq: ['$role', 'admin'] }, 1, 0] }
        },
        newUsersToday: {
          $sum: {
            $cond: [{
              $gte: ['$createdAt', new Date(new Date().setHours(0, 0, 0, 0))]
            }, 1, 0]
          }
        }
      }
    }
  ]);
  
  // Get user growth by date
  const growthStats = await User.aggregate([
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
        },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } },
    { $limit: 30 } // Last 30 days
  ]);
  
  res.status(200).json({
    success: true,
    overview: stats[0] || {
      totalUsers: 0,
      activeUsers: 0,
      adminUsers: 0,
      newUsersToday: 0
    },
    growth: growthStats
  });
});