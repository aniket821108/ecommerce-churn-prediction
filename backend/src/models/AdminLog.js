const mongoose = require('mongoose');

const adminLogSchema = new mongoose.Schema({
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  action: {
    type: String,
    required: true,
    enum: [
      'login', 'logout', 'create', 'update', 'delete',
      'approve', 'reject', 'export', 'import', 'backup'
    ]
  },
  
  entity: {
    type: String,
    required: true,
    enum: ['user', 'product', 'order', 'category', 'coupon', 'setting']
  },
  
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    index: true
  },
  
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
  ipAddress: String,
  
  userAgent: String,
  
  status: {
    type: String,
    enum: ['success', 'failure'],
    default: 'success'
  },
  
  errorMessage: String,
  
  performedAt: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
adminLogSchema.index({ admin: 1, performedAt: -1 });
adminLogSchema.index({ action: 1, performedAt: -1 });
adminLogSchema.index({ entity: 1, performedAt: -1 });
adminLogSchema.index({ status: 1 });

// Static methods for logging
adminLogSchema.statics.logAction = async function(
  adminId,
  action,
  entity,
  entityId = null,
  details = {},
  ip = null,
  userAgent = null
) {
  try {
    const log = await this.create({
      admin: adminId,
      action,
      entity,
      entityId,
      details,
      ipAddress: ip,
      userAgent,
      performedAt: new Date()
    });
    
    return log;
  } catch (error) {
    console.error('Failed to log admin action:', error);
    return null;
  }
};

// Method to get activity summary
adminLogSchema.statics.getActivitySummary = async function(startDate, endDate) {
  const matchStage = {
    performedAt: {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    }
  };
  
  const summary = await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: {
          action: '$action',
          entity: '$entity'
        },
        count: { $sum: 1 },
        successCount: {
          $sum: { $cond: [{ $eq: ['$status', 'success'] }, 1, 0] }
        },
        failureCount: {
          $sum: { $cond: [{ $eq: ['$status', 'failure'] }, 1, 0] }
        }
      }
    },
    { $sort: { count: -1 } }
  ]);
  
  return summary;
};

module.exports = mongoose.model('AdminLog', adminLogSchema);