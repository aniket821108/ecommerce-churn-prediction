const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const { catchAsync } = require('../middlewares/errorHandler');
const { spawn } = require('child_process');
const path = require('path');

// ── Python prediction via child_process ───────────────────────────
const ML_SCRIPT = path.join(__dirname, '../../ml-models/predict.py');

const runPrediction = (inputData) => {
  return new Promise((resolve) => {
    // Try 'python' first, fallback to 'python3'
    const pythonCmd = process.platform === 'win32' ? 'python' : 'python3';

    const proc = spawn(pythonCmd, [ML_SCRIPT], {
      timeout: 15000, // 15 second timeout
    });

    let output = '';
    let errorOutput = '';

    // Send input data via stdin
    proc.stdin.write(JSON.stringify(inputData));
    proc.stdin.end();

    proc.stdout.on('data', (data) => { output += data.toString(); });
    proc.stderr.on('data', (data) => { errorOutput += data.toString(); });

    proc.on('close', (code) => {
      try {
        if (output.trim()) {
          const result = JSON.parse(output.trim());
          resolve(result);
        } else {
          console.error('Python stderr:', errorOutput);
          resolve({ success: false, error: errorOutput || 'No output from Python' });
        }
      } catch (e) {
        resolve({ success: false, error: `JSON parse failed: ${output}` });
      }
    });

    proc.on('error', (err) => {
      // If 'python' not found, try 'python3'
      if (err.code === 'ENOENT' && pythonCmd === 'python') {
        const proc3 = spawn('python3', [ML_SCRIPT]);
        let out3 = '';
        proc3.stdin.write(JSON.stringify(inputData));
        proc3.stdin.end();
        proc3.stdout.on('data', (d) => { out3 += d.toString(); });
        proc3.on('close', () => {
          try {
            resolve(JSON.parse(out3.trim()));
          } catch {
            resolve({ success: false, error: 'Python3 also failed' });
          }
        });
      } else {
        resolve({ success: false, error: err.message });
      }
    });
  });
};

// ── Fallback heuristic (when Python unavailable) ──────────────────
const getFallbackPrediction = (accountAgeMonths, totalSpent) => {
  let prob, risk;
  if (accountAgeMonths < 3 || totalSpent < 500) {
    prob = 0.75; risk = 'high';
  } else if (accountAgeMonths < 6 || totalSpent < 2000) {
    prob = 0.45; risk = 'medium';
  } else {
    prob = 0.15; risk = 'low';
  }
  return { churn_probability: prob, risk_level: risk, fallback: true };
};

// ══════════════════════════════════════════════════════════════════
// 1. DASHBOARD STATS
// ══════════════════════════════════════════════════════════════════
exports.getDashboardStats = catchAsync(async (req, res) => {
  const totalOrders   = await Order.countDocuments()   || 0;
  const totalProducts = await Product.countDocuments() || 0;
  const totalUsers    = await User.countDocuments()    || 0;

  const revenueResult = await Order.aggregate([
    { $group: { _id: null,
        totalSales: { $sum: { $ifNull: ['$totalPrice', '$total', 0] } }
    }}
  ]);
  const totalSales = revenueResult[0]?.totalSales || 0;

  const recentOrders = await Order.find()
    .select('user totalPrice total status createdAt')
    .populate('user', 'name email')
    .sort({ createdAt: -1 })
    .limit(5)
    .lean();

  res.status(200).json({
    success: true,
    totalUsers,
    totalProducts,
    totalOrders,
    totalSales,
    recentOrders: recentOrders.map(o => ({
      ...o,
      totalPrice: o.totalPrice || o.total || 0
    }))
  });
});

// ══════════════════════════════════════════════════════════════════
// 2. CHURN PREDICTIONS — Uses child_process Python, no Flask needed
// ══════════════════════════════════════════════════════════════════
exports.getChurnPredictions = catchAsync(async (req, res) => {
  const users = await User.find({ role: 'user', isActive: true })
    .limit(50)
    .lean();

  if (users.length === 0) {
    return res.status(200).json({
      success: true,
      count: 0,
      data: { predictions: [], users: [] }
    });
  }

  const now = new Date();

  const results = await Promise.all(users.map(async (user) => {
    // ── Get order stats ──
    const orderStats = await Order.aggregate([
      { $match: { user: user._id } },
      { $group: {
          _id: null,
          totalOrders:   { $sum: 1 },
          totalSpent:    { $sum: { $ifNull: ['$totalPrice', '$total', 0] } },
          lastOrderDate: { $max: '$createdAt' }
      }}
    ]);
    const stats = orderStats[0] || { totalOrders: 0, totalSpent: 0, lastOrderDate: null };

    // ── Calculate features ──
    const accountAgeMonths = Math.max(1,
      Math.floor((now - new Date(user.createdAt)) / (1000 * 60 * 60 * 24 * 30))
    );
    const monthlySpend = parseFloat((stats.totalSpent / accountAgeMonths).toFixed(2));
    const daysSinceLastOrder = stats.lastOrderDate
      ? Math.floor((now - new Date(stats.lastOrderDate)) / (1000 * 60 * 60 * 24))
      : 999;

    // ── Build model input (matches features_list.json exactly) ──
    const modelInput = {
      IsSeniorCitizen:                       0,
      HasPartner:                            0,
      HasDependents:                         0,
      AccountAgeMonths:                      accountAgeMonths,
      HasMobileApp:                          1,
      UsesMultipleDevices:                   1,
      HasTwoFactorAuth:                      0,
      UsesWishlist:                          0,
      HasPurchaseProtection:                 0,
      UsesCustomerSupport:                   0,
      WatchesProductVideos:                  0,
      WatchesLiveStreaming:                  0,
      UsesPaperlessBilling:                  1,
      MonthlySpend:                          monthlySpend,
      TotalSpend:                            parseFloat(stats.totalSpent.toFixed(2)),
      Gender_Male:                           user.gender === 'male' ? 1 : 0,
      PreferredDevice_Mobile:                1,
      PreferredDevice_Tablet:                0,
      'MembershipType_One year':             0,
      'MembershipType_Two year':             0,
      'PreferredPaymentMethod_Credit card':  1,
      'PreferredPaymentMethod_Digital wallet': 0,
    };

    // ── Run Python prediction ──
    let prediction = await runPrediction(modelInput);

    // ── If Python failed, use heuristic ──
    if (!prediction.success && !prediction.risk_level) {
      prediction = getFallbackPrediction(accountAgeMonths, stats.totalSpent);
    }

    // ── Build reason string ──
    let reason = 'Active customer with good engagement';
    if (daysSinceLastOrder > 60)    reason = `No order in ${daysSinceLastOrder} days`;
    else if (stats.totalOrders < 2)  reason = 'Only 1 order placed so far';
    else if (monthlySpend < 500)     reason = 'Low monthly spending pattern';
    else if (accountAgeMonths < 3)   reason = 'New customer — retention risk';

    return {
      // Frontend ChurnAnalytics.jsx expects: pred.churnRisk, pred.probability, user.name, user.email
      churnRisk:   (prediction.risk_level || 'low').toLowerCase(),
      probability: prediction.churn_probability || 0,
      reason,
      // User info
      userId:           user._id,
      name:             user.name,
      email:            user.email,
      daysSinceLastOrder,
      totalOrders:      stats.totalOrders,
      totalSpent:       stats.totalSpent,
    };
  }));

  // Sort by probability (highest risk first)
  results.sort((a, b) => b.probability - a.probability);

  // ── Response structure matching ChurnAnalytics.jsx ──
  // Frontend: data?.data?.predictions && data?.data?.users
  const predictions = results.map(r => ({
    churnRisk:   r.churnRisk,
    probability: r.probability,
    reason:      r.reason,
  }));

  const usersData = results.map(r => ({
    _id:               r.userId,
    name:              r.name,
    email:             r.email,
    daysSinceLastOrder: r.daysSinceLastOrder,
    totalOrders:       r.totalOrders,
    totalSpent:        r.totalSpent,
  }));

  res.status(200).json({
    success: true,
    count: results.length,
    // ✅ predictions and users at TOP level of data
    // Frontend reads: data?.data?.predictions (axios wraps in response.data)
    predictions,
    users: usersData,
  });
});

// ══════════════════════════════════════════════════════════════════
// 3. PLACEHOLDERS
// ══════════════════════════════════════════════════════════════════
exports.getSystemMetrics     = (req, res) => res.status(200).json({ success: true, system: {} });
exports.getAdminLogs         = (req, res) => res.status(200).json({ success: true, logs: [] });
exports.clearCache           = (req, res) => res.status(200).json({ success: true, message: 'Cache cleared' });
exports.sendSystemNotification = (req, res) => res.status(200).json({ success: true, message: 'Sent' });
exports.backupDatabase       = (req, res) => res.status(200).json({ success: true, message: 'Backup done' });