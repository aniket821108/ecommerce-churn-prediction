const path = require('path');
const mongoose = require('mongoose');
const { spawn } = require('child_process');

// ===============================
// Load Environment Variables
// ===============================
require('dotenv').config({
  path: path.resolve(__dirname, '.env')
});

console.log("📦 ENV Loaded");
console.log("🔎 MONGODB_URI:", process.env.MONGODB_URI || "❌ Not Found");

// ===============================
// Set Mongo URI (Env OR Fallback)
// ===============================
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/ecommerce";

if (process.env.MONGODB_URI) {
  console.log("✅ Using MongoDB URI from .env");
} else {
  console.log("⚠️ Using fallback MongoDB URI");
}

const app = require('./app');

// ===============================
// Handle Uncaught Exceptions
// ===============================
process.on('uncaughtException', (err) => {
  console.error('❌ UNCAUGHT EXCEPTION!');
  console.error(err.name, err.message);
  process.exit(1);
});

// ===============================
// Python ML Warmup
// ===============================
const warmupPython = () => {
  const script = path.join(__dirname, '../ml-models/predict.py');

  const proc = spawn('python', [script]);

  proc.stdin.write(JSON.stringify({
    AccountAgeMonths: 6,
    TotalSpend: 1000,
    MonthlySpend: 166,
    IsSeniorCitizen: 0,
    HasPartner: 0,
    HasDependents: 0,
    HasMobileApp: 1,
    UsesMultipleDevices: 1,
    HasTwoFactorAuth: 0,
    UsesWishlist: 0,
    HasPurchaseProtection: 0,
    UsesCustomerSupport: 0,
    WatchesProductVideos: 0,
    WatchesLiveStreaming: 0,
    UsesPaperlessBilling: 1,
    Gender_Male: 0,
    PreferredDevice_Mobile: 1,
    PreferredDevice_Tablet: 0,
    'MembershipType_One year': 0,
    'MembershipType_Two year': 0,
    'PreferredPaymentMethod_Credit card': 1,
    'PreferredPaymentMethod_Digital wallet': 0,
  }));
  proc.stdin.end();

  proc.stdout.on('data', (data) => {
    try {
      const result = JSON.parse(data.toString().trim());
      if (result.success) {
        console.log('✅ Python ML model warmed up successfully');
      } else {
        console.log('⚠️ Python warmup ran but returned error:', result.error);
      }
    } catch {
      console.log('✅ Python ML process started');
    }
  });

  proc.stderr.on('data', (data) => {
    // Ignore stderr warnings (sklearn version warnings etc.)
  });

  proc.on('error', (err) => {
    // Try python3 if python not found
    if (err.code === 'ENOENT') {
      const proc3 = spawn('python3', [script]);
      proc3.stdin.write(JSON.stringify({ AccountAgeMonths: 6, TotalSpend: 1000, MonthlySpend: 166 }));
      proc3.stdin.end();
      proc3.stdout.on('data', () => console.log('✅ Python3 ML model warmed up'));
      proc3.on('error', () => console.log('⚠️ Python not found — ML fallback heuristic will be used'));
    } else {
      console.log('⚠️ Python warmup failed:', err.message);
    }
  });
};

// ===============================
// Start Server
// ===============================
const startServer = async () => {
  try {
    console.log("➡️ Connecting to MongoDB...");

    const conn = await mongoose.connect(MONGODB_URI);

    console.log("✅ MongoDB Connected");
    console.log("📍 Host:", conn.connection.host);
    console.log("📂 Database:", conn.connection.name);

    const PORT = process.env.PORT || 5000;

    const server = app.listen(PORT, () => {
      console.log("=================================");
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🌍 Mode: ${process.env.NODE_ENV || 'development'}`);
      console.log("=================================");

      // ✅ Warm up Python ML model on server start
      warmupPython();
    });

    process.on('unhandledRejection', (err) => {
      console.error('❌ UNHANDLED REJECTION!');
      console.error(err.name, err.message);
      server.close(() => process.exit(1));
    });

  } catch (error) {
    console.error('❌ MongoDB Connection Failed:', error.message);
    process.exit(1);
  }
};

startServer();