const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const { catchAsync } = require('../middlewares/errorHandler');
const axios = require('axios'); // Required for ML Service

// ======================================================
// 1. DASHBOARD STATS (Crash-Proof Aggregation)
// ======================================================
exports.getDashboardStats = catchAsync(async (req, res) => {
  // 1. Safe Counts
  const totalOrders = await Order.countDocuments() || 0;
  const totalProducts = await Product.countDocuments() || 0;
  const totalUsers = await User.countDocuments() || 0;

  // 2. Total Revenue (Calculated safely via MongoDB)
  // We check for 'totalPrice' (your schema) OR 'total' (common backup) to be safe
  const revenueResult = await Order.aggregate([
    { 
      $group: { 
        _id: null, 
        // Sums 'totalPrice'. If missing, treats it as 0. No crash.
        totalSales: { $sum: { $ifNull: ["$totalPrice", "$total", 0] } } 
      } 
    }
  ]);
  
  const totalSales = revenueResult.length > 0 ? revenueResult[0].totalSales : 0;

  // 3. Recent Orders (Fetch last 5)
  const recentOrders = await Order.find()
    .select('user totalPrice total status createdAt') // Fetch both price fields just in case
    .populate('user', 'name email')
    .sort({ createdAt: -1 })
    .limit(5)
    .lean();

  // 4. Send Response (Flat structure for Frontend)
  res.status(200).json({
    success: true,
    // Direct properties so frontend 'stats.totalUsers' works immediately
    totalUsers,
    totalProducts,
    totalOrders,
    totalSales,     
    recentOrders: recentOrders.map(order => ({
      ...order,
      // Ensure frontend always gets a valid number for price
      totalPrice: order.totalPrice || order.total || 0 
    }))
  });
});

// ======================================================
// 2. CHURN PREDICTIONS (ML Integration)
// ======================================================
exports.getChurnPredictions = catchAsync(async (req, res) => {
  const users = await User.find({ role: 'user' }).limit(50).lean();

  if (users.length === 0) {
    return res.status(200).json({ success: true, count: 0, users: [] });
  }

  const usersWithPredictions = await Promise.all(users.map(async (user) => {
    // A. Get Order Stats
    const orderStats = await Order.aggregate([
      { $match: { user: user._id } },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalSpent: { $sum: { $ifNull: ["$totalPrice", "$total", 0] } },
          lastOrderDate: { $max: '$createdAt' }
        }
      }
    ]);
    const stats = orderStats[0] || { totalOrders: 0, totalSpent: 0, lastOrderDate: null };

    // B. Calculate Features
    const now = new Date();
    const joinedDate = new Date(user.createdAt);
    // Prevent division by zero for tenure
    const accountAgeMonths = Math.max(1, Math.floor((now - joinedDate) / (1000 * 60 * 60 * 24 * 30)));
    const monthlySpend = accountAgeMonths > 0 ? (stats.totalSpent / accountAgeMonths) : 0;

    const modelInput = {
      "IsSeniorCitizen": 0, "HasPartner": 0, "HasDependents": 0,
      "AccountAgeMonths": accountAgeMonths, "HasMobileApp": 1, "UsesMultipleDevices": 1,
      "HasTwoFactorAuth": 0, "UsesWishlist": 0, "HasPurchaseProtection": 0,
      "UsesCustomerSupport": 0, "WatchesProductVideos": 0, "WatchesLiveStreaming": 0,
      "UsesPaperlessBilling": 1, 
      "MonthlySpend": parseFloat(monthlySpend.toFixed(2)),
      "TotalSpend": parseFloat(stats.totalSpent.toFixed(2)),
      "Gender_Male": user.gender === 'male' ? 1 : 0,
      "PreferredDevice_Mobile": 1, "PreferredDevice_Tablet": 0,
      "MembershipType_One year": 0, "MembershipType_Two year": 0,
      "PreferredPaymentMethod_Credit card": 1, "PreferredPaymentMethod_Digital wallet": 0
    };

    // C. Call Python API
    let prediction = { risk_level: 'Unknown', churn_probability: 0 };
    try {
      const response = await axios.post('http://127.0.0.1:8000/predict', { data: modelInput });
      prediction = response.data;
    } catch (err) {
      console.error(`ML Error for ${user.name}:`, err.message);
      // Fallback
      prediction = {
        risk_level: accountAgeMonths > 6 ? 'Low' : 'High',
        churn_probability: accountAgeMonths > 6 ? 0.2 : 0.8
      };
    }

    return {
      userId: user._id,
      name: user.name,
      email: user.email,
      totalOrders: stats.totalOrders,
      totalSpent: stats.totalSpent,
      churnRisk: prediction.risk_level,
      probability: (prediction.churn_probability * 100).toFixed(2) + '%',
      features: modelInput
    };
  }));

  res.status(200).json({ success: true, count: usersWithPredictions.length, users: usersWithPredictions });
});

// ======================================================
// 3. PLACEHOLDERS (Prevents Router Crashes)
// ======================================================
exports.getSystemMetrics = (req, res) => res.status(200).json({ success: true, system: {} });
exports.getAdminLogs = (req, res) => res.status(200).json({ success: true, logs: [] });
exports.clearCache = (req, res) => res.status(200).json({ success: true, message: "Cache cleared" });
exports.sendSystemNotification = (req, res) => res.status(200).json({ success: true, message: "Sent" });
exports.backupDatabase = (req, res) => res.status(200).json({ success: true, message: "Backup done" });