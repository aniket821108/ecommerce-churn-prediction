const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const AdminLog = require('../models/AdminLog');
const { catchAsync, AppError } = require('../middlewares/errorHandler');
const logger = require('../utils/logger');

// @desc    Get dashboard statistics
// @route   GET /api/admin/dashboard
// @access  Private/Admin
exports.getDashboardStats = catchAsync(async (req, res) => {
  const { startDate, endDate = new Date() } = req.query;
  
  const dateFilter = {};
  if (startDate) {
    dateFilter.$gte = new Date(startDate);
    dateFilter.$lte = new Date(endDate);
  }
  
  // Parallel execution of all statistics
  const [
    userStats,
    productStats,
    orderStats,
    revenueStats,
    recentOrders,
    adminLogs
  ] = await Promise.all([
    // User statistics
    User.aggregate([
      {
        $match: dateFilter.$gte ? { createdAt: dateFilter } : {}
      },
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          newUsers: {
            $sum: {
              $cond: [dateFilter.$gte ? 
                { $and: [
                  { $gte: ['$createdAt', dateFilter.$gte] },
                  { $lte: ['$createdAt', dateFilter.$lte] }
                ]} : { $gte: ['$createdAt', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)] },
                1, 0
              ]
            }
          }
        }
      }
    ]),
    
    // Product statistics
    Product.aggregate([
      {
        $match: dateFilter.$gte ? { createdAt: dateFilter } : {}
      },
      {
        $group: {
          _id: null,
          totalProducts: { $sum: 1 },
          activeProducts: {
            $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
          },
          outOfStock: {
            $sum: { $cond: [{ $lte: ['$stock', 0] }, 1, 0] }
          },
          lowStock: {
            $sum: { $cond: [{ $and: [
              { $gt: ['$stock', 0] },
              { $lte: ['$stock', 10] }
            ]}, 1, 0] }
          }
        }
      }
    ]),
    
    // Order statistics
    Order.aggregate([
      {
        $match: dateFilter.$gte ? { createdAt: dateFilter } : {}
      },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          pendingOrders: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          },
          processingOrders: {
            $sum: { $cond: [{ $eq: ['$status', 'processing'] }, 1, 0] }
          },
          deliveredOrders: {
            $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] }
          },
          cancelledOrders: {
            $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
          }
        }
      }
    ]),
    
    // Revenue statistics
    Order.aggregate([
      {
        $match: {
          status: 'delivered',
          ...(dateFilter.$gte ? { createdAt: dateFilter } : {})
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$total' },
          avgOrderValue: { $avg: '$total' },
          orderCount: { $sum: 1 }
        }
      }
    ]),
    
    // Recent orders
    Order.find(dateFilter.$gte ? { createdAt: dateFilter } : {})
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('user', 'name email')
      .select('orderNumber user total status createdAt'),
    
    // Recent admin activities
    AdminLog.find()
      .sort({ performedAt: -1 })
      .limit(10)
      .populate('admin', 'name email')
  ]);
  
  // Get sales data for chart (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const salesData = await Order.aggregate([
    {
      $match: {
        status: 'delivered',
        createdAt: { $gte: thirtyDaysAgo }
      }
    },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
        },
        totalSales: { $sum: '$total' },
        orderCount: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);
  
  // Get top selling products
  const topProducts = await Order.aggregate([
    {
      $match: dateFilter.$gte ? { createdAt: dateFilter } : {}
    },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.product',
        totalQuantity: { $sum: '$items.quantity' },
        totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
      }
    },
    { $sort: { totalQuantity: -1 } },
    { $limit: 5 }
  ]);
  
  // Populate product names for top products
  const topProductsWithDetails = await Promise.all(
    topProducts.map(async (product) => {
      const productDetails = await Product.findById(product._id).select('name images');
      return {
        ...product,
        product: productDetails
      };
    })
  );
  
  res.status(200).json({
    success: true,
    stats: {
      users: userStats[0] || { totalUsers: 0, newUsers: 0 },
      products: productStats[0] || { totalProducts: 0, activeProducts: 0, outOfStock: 0, lowStock: 0 },
      orders: orderStats[0] || { totalOrders: 0, pendingOrders: 0, processingOrders: 0, deliveredOrders: 0, cancelledOrders: 0 },
      revenue: revenueStats[0] || { totalRevenue: 0, avgOrderValue: 0, orderCount: 0 }
    },
    recentOrders,
    adminActivities: adminLogs,
    salesChartData: salesData,
    topProducts: topProductsWithDetails
  });
});

// @desc    Get admin logs
// @route   GET /api/admin/logs
// @access  Private/Admin
exports.getAdminLogs = catchAsync(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;
  
  const { action, entity, status, adminId, startDate, endDate } = req.query;
  
  const query = {};
  
  if (action) query.action = action;
  if (entity) query.entity = entity;
  if (status) query.status = status;
  if (adminId) query.admin = adminId;
  
  if (startDate || endDate) {
    query.performedAt = {};
    if (startDate) query.performedAt.$gte = new Date(startDate);
    if (endDate) query.performedAt.$lte = new Date(endDate);
  }
  
  const [logs, total] = await Promise.all([
    AdminLog.find(query)
      .populate('admin', 'name email')
      .sort({ performedAt: -1 })
      .skip(skip)
      .limit(limit),
    AdminLog.countDocuments(query)
  ]);
  
  res.status(200).json({
    success: true,
    count: logs.length,
    total,
    pagination: {
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    },
    logs
  });
});

// @desc    Get system metrics
// @route   GET /api/admin/metrics
// @access  Private/Admin
exports.getSystemMetrics = catchAsync(async (req, res) => {
  const os = require('os');
  
  // System metrics
  const systemMetrics = {
    platform: os.platform(),
    arch: os.arch(),
    cpus: os.cpus().length,
    totalMemory: (os.totalmem() / 1024 / 1024 / 1024).toFixed(2) + ' GB',
    freeMemory: (os.freemem() / 1024 / 1024 / 1024).toFixed(2) + ' GB',
    memoryUsage: ((1 - os.freemem() / os.totalmem()) * 100).toFixed(2) + '%',
    uptime: (os.uptime() / 3600).toFixed(2) + ' hours',
    loadAverage: os.loadavg()
  };
  
  // Process metrics
  const processMetrics = {
    nodeVersion: process.version,
    pid: process.pid,
    uptime: (process.uptime() / 3600).toFixed(2) + ' hours',
    memoryUsage: {
      rss: (process.memoryUsage().rss / 1024 / 1024).toFixed(2) + ' MB',
      heapTotal: (process.memoryUsage().heapTotal / 1024 / 1024).toFixed(2) + ' MB',
      heapUsed: (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2) + ' MB',
      external: (process.memoryUsage().external / 1024 / 1024).toFixed(2) + ' MB'
    }
  };
  
  // Database metrics
  const mongoose = require('mongoose');
  const db = mongoose.connection.db;
  
  const dbStats = await db.stats();
  const dbMetrics = {
    database: dbStats.db,
    collections: dbStats.collections,
    documents: dbStats.objects,
    dataSize: (dbStats.dataSize / 1024 / 1024).toFixed(2) + ' MB',
    storageSize: (dbStats.storageSize / 1024 / 1024).toFixed(2) + ' MB',
    indexSize: (dbStats.indexSize / 1024 / 1024).toFixed(2) + ' MB'
  };
  
  res.status(200).json({
    success: true,
    system: systemMetrics,
    process: processMetrics,
    database: dbMetrics
  });
});

// @desc    Clear cache
// @route   POST /api/admin/cache/clear
// @access  Private/Admin
exports.clearCache = catchAsync(async (req, res) => {
  const { cacheType } = req.body;
  
  // This is a placeholder for actual cache clearing logic
  // You would integrate with Redis or another cache system here
  
  logger.info(`Cache cleared by admin`, { 
    adminId: req.userId,
    cacheType 
  });
  
  res.status(200).json({
    success: true,
    message: `Cache cleared successfully`
  });
});

// @desc    Send system notification
// @route   POST /api/admin/notifications
// @access  Private/Admin
exports.sendSystemNotification = catchAsync(async (req, res, next) => {
  const { title, message, type, recipients } = req.body;
  
  if (!title || !message) {
    return next(new AppError('Title and message are required', 400));
  }
  
  // Here you would implement actual notification logic
  // For example: email notifications, push notifications, in-app notifications
  
  logger.info(`System notification sent by admin`, {
    adminId: req.userId,
    title,
    type,
    recipients: recipients || 'all'
  });
  
  res.status(200).json({
    success: true,
    message: 'Notification sent successfully'
  });
});

// @desc    Backup database
// @route   POST /api/admin/backup
// @access  Private/Admin
exports.backupDatabase = catchAsync(async (req, res) => {
  // This is a placeholder for actual backup logic
  // You would use mongodump or similar tool here
  
  const backupInfo = {
    timestamp: new Date(),
    size: '0 MB',
    filename: `backup-${Date.now()}.gz`,
    status: 'completed'
  };
  
  logger.info(`Database backup initiated by admin`, { 
    adminId: req.userId,
    backupInfo 
  });
  
  res.status(200).json({
    success: true,
    message: 'Backup completed successfully',
    backup: backupInfo
  });
});

// @desc    Get churn prediction data
// @route   GET /api/admin/analytics/churn
// @access  Private/Admin
exports.getChurnPredictions = catchAsync(async (req, res) => {
  const { mlIntegrationService } = require('../services/mlIntegrationService');
  
  // Get users with their order history
  const users = await User.find({ role: 'user', isActive: true })
    .limit(50)
    .lean();
  
  // Get order data for churn prediction
  const usersWithData = await Promise.all(
    users.map(async (user) => {
      const orders = await Order.find({ user: user._id })
        .sort({ createdAt: -1 })
        .limit(10);
      
      const orderStats = await Order.aggregate([
        { $match: { user: user._id } },
        {
          $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            totalSpent: { $sum: '$total' },
            avgOrderValue: { $avg: '$total' },
            lastOrderDate: { $max: '$createdAt' }
          }
        }
      ]);
      
      const stats = orderStats[0] || {
        totalOrders: 0,
        totalSpent: 0,
        avgOrderValue: 0,
        lastOrderDate: null
      };
      
      // Calculate days since last order
      const daysSinceLastOrder = stats.lastOrderDate ? 
        Math.floor((Date.now() - stats.lastOrderDate) / (1000 * 60 * 60 * 24)) : 
        null;
      
      return {
        userId: user._id,
        name: user.name,
        email: user.email,
        joinedDate: user.createdAt,
        totalOrders: stats.totalOrders,
        totalSpent: stats.totalSpent,
        avgOrderValue: stats.avgOrderValue,
        lastOrderDate: stats.lastOrderDate,
        daysSinceLastOrder,
        // Add more features for ML model
        features: {
          totalOrders: stats.totalOrders,
          totalSpent: stats.totalSpent,
          avgOrderFrequency: stats.totalOrders > 0 ? 
            (Date.now() - user.createdAt) / (stats.totalOrders * 1000 * 60 * 60 * 24) : 0,
          daysSinceLastOrder: daysSinceLastOrder || 0
        }
      };
    })
  );
  
  // Get predictions from ML service
  let predictions = [];
  try {
    predictions = await mlIntegrationService.predictChurn(usersWithData);
  } catch (error) {
    logger.error('Failed to get ML predictions:', error);
    // Fallback to simple heuristic
    predictions = usersWithData.map(user => ({
      userId: user.userId,
      churnRisk: user.daysSinceLastOrder > 30 ? 'high' : 
                 user.daysSinceLastOrder > 15 ? 'medium' : 'low',
      probability: user.daysSinceLastOrder > 30 ? 0.8 : 
                   user.daysSinceLastOrder > 15 ? 0.5 : 0.2,
      reason: user.daysSinceLastOrder > 30 ? 
        'Inactive for more than 30 days' : 
        user.daysSinceLastOrder > 15 ? 
        'Inactive for 15-30 days' : 'Active customer'
    }));
  }
  
  res.status(200).json({
    success: true,
    count: usersWithData.length,
    users: usersWithData,
    predictions
  });
});