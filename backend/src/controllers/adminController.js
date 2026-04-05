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
    const pythonCmd = process.platform === 'win32'
      ? 'C:\\Users\\anike\\.conda\\envs\\myenv\\python.exe'
      : 'python3';
    const proc = spawn(pythonCmd, [ML_SCRIPT], { timeout: 15000 });

    let output = '';
    let errorOutput = '';

    proc.stdin.write(JSON.stringify(inputData));
    proc.stdin.end();

    proc.stdout.on('data', (data) => { output += data.toString(); });
    proc.stderr.on('data', (data) => { errorOutput += data.toString(); });

    proc.on('close', () => {
      try {
        if (output.trim()) {
          resolve(JSON.parse(output.trim()));
        } else {
          console.error('Python stderr:', errorOutput);
          resolve({ success: false, error: errorOutput || 'No output from Python' });
        }
      } catch (e) {
        resolve({ success: false, error: `Parse failed: ${output}` });
      }
    });

    proc.on('error', (err) => {
      if (err.code === 'ENOENT') {
        // Try python3 if python not found
        const proc3 = spawn('python3', [ML_SCRIPT]);
        let out3 = '';
        proc3.stdin.write(JSON.stringify(inputData));
        proc3.stdin.end();
        proc3.stdout.on('data', (d) => { out3 += d.toString(); });
        proc3.on('close', () => {
          try { resolve(JSON.parse(out3.trim())); }
          catch { resolve({ success: false, error: 'Python3 also failed' }); }
        });
      } else {
        resolve({ success: false, error: err.message });
      }
    });
  });
};

// ── Simple heuristic fallback ─────────────────────────────────────
const getFallback = (accountAgeMonths, totalSpent, monthlySpend) => {
  let prob, risk;
  if (accountAgeMonths < 3 || totalSpent < 500)          { prob = 0.75; risk = 'high'; }
  else if (accountAgeMonths < 6 || totalSpent < 2000)    { prob = 0.45; risk = 'medium'; }
  else if (accountAgeMonths >= 12 && monthlySpend > 60)  { prob = 0.10; risk = 'low'; }
  else                                                    { prob = 0.20; risk = 'low'; }
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
    success: true, totalUsers, totalProducts, totalOrders, totalSales,
    recentOrders: recentOrders.map(o => ({ ...o, totalPrice: o.totalPrice || o.total || 0 }))
  });
});

// ══════════════════════════════════════════════════════════════════
// 2. CHURN PREDICTIONS — XGBoost v2 Pipeline
// ══════════════════════════════════════════════════════════════════
exports.getChurnPredictions = catchAsync(async (req, res) => {
  const users = await User.find({ role: 'user', isActive: true }).limit(50).lean();

  if (users.length === 0) {
    return res.status(200).json({ success: true, count: 0, predictions: [], users: [] });
  }

  const now = new Date();

  const results = await Promise.all(users.map(async (user) => {
    // ── Order stats ──
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

    // ── Compute features ──
    const accountAgeMonths = Math.max(1,
      Math.floor((now - new Date(user.createdAt)) / (1000 * 60 * 60 * 24 * 30))
    );
    const monthlySpend = parseFloat((stats.totalSpent / accountAgeMonths).toFixed(2));
    const daysSinceLastOrder = stats.lastOrderDate
      ? Math.floor((now - new Date(stats.lastOrderDate)) / (1000 * 60 * 60 * 24))
      : 999;

    // ── XGBoost v2 input — RAW data (Yes/No strings + category strings) ──
    const modelInput = {
      // Numeric
      IsSeniorCitizen:    0,
      AccountAgeMonths:   accountAgeMonths,
      MonthlySpend:       monthlySpend,
      TotalSpend:         parseFloat(stats.totalSpent.toFixed(2)),

      // Binary (Yes/No strings — pipeline encodes)
      HasPartner:           'No',
      HasDependents:        'No',
      HasMobileApp:         'Yes',
      HasTwoFactorAuth:     'No',
      UsesWishlist:         'No',
      HasPurchaseProtection:'No',
      UsesCustomerSupport:  stats.totalOrders > 2 ? 'Yes' : 'No',
      WatchesProductVideos: 'No',
      WatchesLiveStreaming:  'No',
      UsesPaperlessBilling: 'Yes',

      // Multi-category (strings — pipeline encodes)
      Gender:                 'Male',
      UsesMultipleDevices:    stats.totalOrders > 1 ? 'Yes' : 'No',
      PreferredDevice:        'Mobile',
      MembershipType:         accountAgeMonths >= 24 ? 'Two year'
                            : accountAgeMonths >= 12 ? 'One year'
                            : 'Month-to-month',
      PreferredPaymentMethod: 'Credit card',
      // SpendTier will be computed by predict.py from MonthlySpend
    };

    // ── Run prediction ──
    let prediction = await runPrediction(modelInput);
    if (!prediction.success && !prediction.risk_level) {
      prediction = getFallback(accountAgeMonths, stats.totalSpent, monthlySpend);
    }

    // ── Reason string ──
    let reason = 'Active customer with good engagement';
    if (daysSinceLastOrder > 60)      reason = `No order in ${daysSinceLastOrder} days`;
    else if (stats.totalOrders < 2)   reason = 'Only 1 order placed so far';
    else if (monthlySpend < 500)      reason = 'Low monthly spending pattern';
    else if (accountAgeMonths < 3)    reason = 'New customer — retention risk';
    else if (prediction.spend_tier)   reason = `Spend tier: ${prediction.spend_tier}, ` +
                                               `Engagement: ${prediction.engagement_score || 0}/8`;

    return {
      churnRisk:          (prediction.risk_level || 'low').toLowerCase(),
      probability:        prediction.churn_probability || 0,
      reason,
      // User info for table
      userId:             user._id,
      name:               user.name,
      email:              user.email,
      daysSinceLastOrder,
      totalOrders:        stats.totalOrders,
      totalSpent:         stats.totalSpent,
      // Extra model info (useful for debugging)
      modelUsed:          prediction.model || 'unknown',
      engagementScore:    prediction.engagement_score,
      spendTier:          prediction.spend_tier,
    };
  }));

  // Sort by probability (highest risk first)
  results.sort((a, b) => b.probability - a.probability);

  const predictions = results.map(r => ({
    churnRisk:   r.churnRisk,
    probability: r.probability,
    reason:      r.reason,
    modelUsed:   r.modelUsed,
  }));

  const usersData = results.map(r => ({
    _id:               r.userId,
    name:              r.name,
    email:             r.email,
    daysSinceLastOrder: r.daysSinceLastOrder,
    totalOrders:       r.totalOrders,
    totalSpent:        r.totalSpent,
    engagementScore:   r.engagementScore,
    spendTier:         r.spendTier,
  }));

  res.status(200).json({
    success: true,
    count: results.length,
    predictions,
    users: usersData,
  });
});

// ── Placeholders ──────────────────────────────────────────────────
exports.getSystemMetrics      = (req, res) => res.status(200).json({ success: true, system: {} });
exports.getAdminLogs          = (req, res) => res.status(200).json({ success: true, logs: [] });
exports.clearCache            = (req, res) => res.status(200).json({ success: true, message: 'Cache cleared' });
exports.sendSystemNotification = (req, res) => res.status(200).json({ success: true, message: 'Sent' });
exports.backupDatabase        = (req, res) => res.status(200).json({ success: true, message: 'Backup done' });