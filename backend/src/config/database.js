const mongoose = require('mongoose');
const logger = require('../utils/logger');

const connectDB = async () => {
  try {
    // 1. Debug: Check if the function is even running
    console.log("--> Attempting to connect to MongoDB...");

    // 2. Debug: Check if the URI exists (Don't log the full password!)
    if (!process.env.MONGODB_URI) {
      console.error("--> FATAL ERROR: MONGODB_URI is undefined in .env file");
      process.exit(1);
    }
    
    console.log(`--> Connection String found (starts with): ${process.env.MONGODB_URI.substring(0, 15)}...`);

    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // Fail fast if IP is blocked
    });
    
    // 3. Success
    logger.info(`MongoDB Connected: ${conn.connection.host}`);
    
  } catch (error) {
    // 4. Catch Errors
    console.error("--> MONGODB CONNECTION ERROR:", error.message);
    
    // Common error help
    if (error.message.includes('buffering timed out')) {
      console.error("--> HINT: Check your MongoDB Atlas Network Access (IP Whitelist).");
    }
    process.exit(1);
  }
};

module.exports = connectDB;