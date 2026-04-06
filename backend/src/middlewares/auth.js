const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../utils/logger');

const authenticate = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'Please authenticate to access this resource' });
    }

    // ✅ JWT_SECRET — matches authController.js signToken()
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      logger.error('JWT_SECRET not defined!');
      return res.status(500).json({ success: false, message: 'Server configuration error' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, secret);
    } catch (err) {
      return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }

    // ✅ decoded.id — matches authController.js jwt.sign({ id }, ...)
    const user = await User.findById(decoded.id).select('+isActive +role');
    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'User no longer exists or is inactive' });
    }

    req.user     = user;
    req.userId   = user._id;
    req.userRole = user.role;
    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    res.status(500).json({ success: false, message: 'Authentication failed' });
  }
};

const authorize = (...roles) => (req, res, next) => {
  if (!req.userRole || !roles.includes(req.userRole)) {
    return res.status(403).json({ success: false, message: `Access denied. Required roles: ${roles.join(', ')}` });
  }
  next();
};

const optionalAuth = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization?.startsWith('Bearer')) token = req.headers.authorization.split(' ')[1];
    else if (req.cookies?.accessToken) token = req.cookies.accessToken;

    if (token && process.env.JWT_SECRET) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('+isActive +role');
        if (user && user.isActive) {
          req.user = user; req.userId = user._id; req.userRole = user.role;
        }
      } catch (_) {}
    }
    next();
  } catch (error) { next(); }
};

module.exports = { authenticate, authorize, optionalAuth };