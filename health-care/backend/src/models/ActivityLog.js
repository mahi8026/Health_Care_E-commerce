const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  // User information (snapshot for historical accuracy)
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null // null for guest actions
  },
  userEmail: {
    type: String,
    default: null // Snapshot in case user is deleted later
  },
  userRole: {
    type: String,
    default: null // Snapshot
  },

  // Action details
  action: {
    type: String,
    required: true,
    index: true
  },

  // Target information
  targetModel: {
    type: String,
    index: true // e.g., 'Product', 'Order', 'User'
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId
  },
  targetName: {
    type: String // Snapshot - e.g., product name, order number
  },

  // Change tracking
  changes: {
    before: mongoose.Schema.Types.Mixed,
    after: mongoose.Schema.Types.Mixed
  },

  // Request metadata
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  },

  // Status tracking
  status: {
    type: String,
    enum: ['success', 'failed'],
    default: 'success'
  },
  errorMessage: {
    type: String
  },

  // Additional context
  metadata: mongoose.Schema.Types.Mixed

}, {
  timestamps: { createdAt: true, updatedAt: false } // Only need createdAt
});

// Indexes for efficient querying
activityLogSchema.index({ user: 1, action: 1, createdAt: -1 });
activityLogSchema.index({ action: 1, createdAt: -1 });
activityLogSchema.index({ targetModel: 1, createdAt: -1 });
activityLogSchema.index({ createdAt: -1 });

// TTL index - auto-delete logs older than 90 days (7776000 seconds)
activityLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 });

// Virtual for action category
activityLogSchema.virtual('category').get(function() {
  const action = this.action;
  if (action.startsWith('LOGIN') || action.startsWith('LOGOUT') || action.startsWith('REGISTER') || action.startsWith('PASSWORD')) {
    return 'AUTH';
  } else if (action.startsWith('ORDER')) {
    return 'ORDER';
  } else if (action.startsWith('PRODUCT')) {
    return 'PRODUCT';
  } else if (action.startsWith('CATEGORY')) {
    return 'CATEGORY';
  } else if (action.startsWith('MANUFACTURER')) {
    return 'MANUFACTURER';
  } else if (action.startsWith('COUPON')) {
    return 'COUPON';
  } else if (action.startsWith('REVIEW')) {
    return 'REVIEW';
  } else if (action.startsWith('USER')) {
    return 'USER';
  } else if (action.startsWith('PAYMENT') || action.startsWith('REFUND')) {
    return 'PAYMENT';
  } else if (action.startsWith('BACKUP') || action.startsWith('IMPORT') || action.startsWith('EXPORT')) {
    return 'SYSTEM';
  }
  return 'OTHER';
});

activityLogSchema.set('toJSON', { virtuals: true });
activityLogSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
