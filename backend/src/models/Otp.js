const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  otp: {
    type: String,
    required: true,
  },
  // Temporarily store registration data until OTP verified
  userData: {
    name:     { type: String },
    password: { type: String }, // already hashed
    phone:    { type: String },
  },
  expiresAt: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
  },
  verified: {
    type: Boolean,
    default: false,
  },
  attempts: {
    type: Number,
    default: 0,
  },
}, { timestamps: true });

// Auto-delete expired OTPs using MongoDB TTL index
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
// Index on email for fast lookup
otpSchema.index({ email: 1 });

module.exports = mongoose.model('Otp', otpSchema);