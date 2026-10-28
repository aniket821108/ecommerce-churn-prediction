const { verifyAccessToken } = require('../utils/jwt');
const User   = require('../models/User');
const logger = require('../utils/logger');

// ── Main auth middleware ──────────────────────────────
const authenticate = async (req, res, next) => {
  try {
    let token;

    // Priority: HttpOnly cookie > Bearer header
    if (req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    } else if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'Please authenticate to access this resource' });
    }

    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        // Frontend should try to refresh
        return res.status(401).json({ success: false, message: 'Token expired', code: 'TOKEN_EXPIRED' });
      }
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }

    const user = await User.findById(decoded.id).select('+isActive +role +tokenVersion');
    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'User no longer exists or is inactive' });
    }

    // Check tokenVersion — revoked if mismatch
    if (decoded.tokenVersion !== undefined && decoded.tokenVersion !== (user.tokenVersion || 0)) {
      return res.status(401).json({ success: false, message: 'Token has been revoked', code: 'TOKEN_REVOKED' });
    }

    // Check if password was changed after this token was issued
    if (user.changedPasswordAfter && user.changedPasswordAfter(decoded.iat)) {
      return res.status(401).json({ success: false, message: 'Password recently changed. Please login again.', code: 'PASSWORD_CHANGED' });
    }

    req.user     = user;
    req.userId   = user._id.toString();
    req.userRole = user.role;
    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    res.status(500).json({ success: false, message: 'Authentication failed' });
  }
};

// ── Role-based authorization — 403 Forbidden ─────────
const authorize = (...roles) => (req, res, next) => {
  if (!req.userRole || !roles.includes(req.userRole)) {
    if (req.userRole === 'admin' && roles.includes('user') && !roles.includes('admin')) {
      return res.status(403).json({
        success: false,
        message: 'Administrative accounts cannot perform customer shopping actions. Please use a standard customer account.',
        code: 'ADMIN_SHOPPING_RESTRICTED'
      });
    }
    return res.status(403).json({ success: false, message: `Access denied. Required roles: ${roles.join(', ')}` });
  }
  next();
};

// ── Optional auth (non-blocking) ─────────────────────
const optionalAuth = async (req, res, next) => {
  try {
    let token;
    if (req.cookies?.accessToken) token = req.cookies.accessToken;
    else if (req.headers.authorization?.startsWith('Bearer')) token = req.headers.authorization.split(' ')[1];

    if (token) {
      try {
        const decoded = verifyAccessToken(token);
        const user = await User.findById(decoded.id).select('+isActive +role +tokenVersion');
        if (user && user.isActive) {
          // Verify tokenVersion
          if (decoded.tokenVersion === undefined || decoded.tokenVersion === (user.tokenVersion || 0)) {
            req.user = user; req.userId = user._id.toString(); req.userRole = user.role;
          }
        }
      } catch (_) { /* silently ignore — optional */ }
    }
    next();
  } catch (error) { next(); }
};

module.exports = { authenticate, authorize, optionalAuth };