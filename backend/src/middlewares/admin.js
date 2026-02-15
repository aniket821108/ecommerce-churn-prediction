const AdminLog = require('../models/AdminLog');

// Admin authentication and logging middleware
const adminAuth = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required'
    });
  }
  next();
};

// Admin action logger middleware
const logAdminAction = (action, entity) => {
  return async (req, res, next) => {
    // Store original function
    const originalJson = res.json;
    
    // Override res.json to log after response
    res.json = function(data) {
      // Log admin action
      AdminLog.logAction(
        req.user._id,
        action,
        entity,
        req.params.id || req.body._id || null,
        {
          method: req.method,
          endpoint: req.originalUrl,
          body: req.body,
          params: req.params,
          query: req.query,
          response: data
        },
        req.ip,
        req.get('user-agent')
      ).catch(err => {
        console.error('Failed to log admin action:', err);
      });
      
      // Call original function
      originalJson.call(this, data);
    };
    
    next();
  };
};

// Rate limiting for admin endpoints
const adminRateLimiter = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later'
};

// Validate admin permissions
const validateAdminPermissions = (requiredPermissions = []) => {
  return (req, res, next) => {
    // This would check against admin permissions in the database
    // For now, we'll just check role
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }
    
    // TODO: Implement permission checking logic here
    // if (!requiredPermissions.every(perm => req.user.permissions.includes(perm))) {
    //   return res.status(403).json({
    //     success: false,
    //     message: 'Insufficient permissions'
    //   });
    // }
    
    next();
  };
};

module.exports = {
  adminAuth,
  logAdminAction,
  adminRateLimiter,
  validateAdminPermissions
};