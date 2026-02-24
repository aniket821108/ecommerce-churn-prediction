const User = require('../models/User');
const Order = require('../models/Order');
const { catchAsync, AppError } = require('../middlewares/errorHandler');
const logger = require('../utils/logger');
// ✅ IMPORT CLOUDINARY UPLOAD FUNCTION
const { uploadToCloudinary } = require('../config/cloudinary');

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
exports.getUserProfile = catchAsync(async (req, res) => {
  const user = await User.findById(req.userId);
  
  res.status(200).json({
    success: true,
    user: user.toSafeObject ? user.toSafeObject() : user // Fallback if method missing
  });
});

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
exports.updateUserProfile = catchAsync(async (req, res, next) => {
  const { name, email, phone, address } = req.body;
  const user = await User.findById(req.userId);

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  // 1. Check if email is being changed and if it's already taken
  if (email && email !== user.email) {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(new AppError('Email already in use', 400));
    }
  }

  // ✅ 2. HANDLE IMAGE UPLOAD (If a file was sent)
  if (req.file) {
    try {
      const uploadResult = await uploadToCloudinary(req.file.path, 'avatars');
      
      // Update avatar field
      user.avatar = {
        url: uploadResult.url,
        publicId: uploadResult.public_id
      };
    } catch (error) {
      console.error("Profile Image Upload Failed:", error);
      return next(new AppError('Failed to upload profile image', 500));
    }
  }

  // 3. Update Text Fields
  if (name) user.name = name;
  if (email) user.email = email;
  if (phone) user.phone = phone;
  
  // Handle nested address object carefully
  if (address) {
    // If address is sent as a string (JSON), parse it
    // If sent as individual fields via FormData (e.g., address[city]), Express handles it differently
    // This logic supports both JSON body and FormData structure
    if (typeof address === 'string') {
        try {
            user.address = JSON.parse(address);
        } catch (e) {
             // If parsing fails, it might just be a simple string assignment or invalid
             console.error("Address parsing error", e);
        }
    } else {
        // Merge existing address with new updates
        user.address = { ...user.address, ...address };
    }
  }

  await user.save();

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    user: user.toSafeObject ? user.toSafeObject() : user
  });
});

// @desc    Get user orders
// @route   GET /api/users/orders
// @access  Private
exports.getUserOrders = catchAsync(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const status = req.query.status;
  
  // Assuming Order.findByUser is a static method you created. 
  // If not, use Order.find({ user: req.userId })
  const orders = Order.findByUser 
    ? await Order.findByUser(req.userId, { page, limit, status })
    : await Order.find({ user: req.userId }).sort({ createdAt: -1 }).limit(limit).skip((page - 1) * limit);

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
        totalSpent: { $sum: '$total' }, // Check if your schema uses 'total' or 'totalPrice'
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
    user: user.toSafeObject ? user.toSafeObject() : user
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