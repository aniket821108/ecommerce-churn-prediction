const path = require('path');
const mongoose = require('mongoose');

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
