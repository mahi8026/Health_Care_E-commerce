const ActivityLog = require('../models/ActivityLog');
const logger = require('./logger');

// Action constants organized by category
const ACTIONS = {
  AUTH: {
    LOGIN: 'LOGIN',
    LOGOUT: 'LOGOUT',
    REGISTER: 'REGISTER',
    PASSWORD_RESET: 'PASSWORD_RESET',
    PASSWORD_CHANGE: 'PASSWORD_CHANGE'
  },
  ORDER: {
    PLACED: 'ORDER_PLACED',
    CANCELLED: 'ORDER_CANCELLED',
    STATUS_CHANGED: 'ORDER_STATUS_CHANGED'
  },
  PRODUCT: {
    CREATED: 'PRODUCT_CREATED',
    UPDATED: 'PRODUCT_UPDATED',
    DELETED: 'PRODUCT_DELETED'
  },
  CATEGORY: {
    CREATED: 'CATEGORY_CREATED',
    UPDATED: 'CATEGORY_UPDATED',
    DELETED: 'CATEGORY_DELETED'
  },
  MANUFACTURER: {
    CREATED: 'MANUFACTURER_CREATED',
    UPDATED: 'MANUFACTURER_UPDATED',
    DELETED: 'MANUFACTURER_DELETED'
  },
  COUPON: {
    CREATED: 'COUPON_CREATED',
    UPDATED: 'COUPON_UPDATED',
    DELETED: 'COUPON_DELETED',
    APPLIED: 'COUPON_APPLIED'
  },
  REVIEW: {
    CREATED: 'REVIEW_CREATED',
    APPROVED: 'REVIEW_APPROVED',
    REJECTED: 'REVIEW_REJECTED',
    DELETED: 'REVIEW_DELETED'
  },
  USER: {
    UPDATED: 'USER_UPDATED',
    DEACTIVATED: 'USER_DEACTIVATED',
    ROLE_CHANGED: 'USER_ROLE_CHANGED'
  },
  PAYMENT: {
    RECEIVED: 'PAYMENT_RECEIVED',
    FAILED: 'PAYMENT_FAILED',
    VERIFIED: 'PAYMENT_VERIFIED',
    REFUND_PROCESSED: 'REFUND_PROCESSED'
  },
  SYSTEM: {
    BACKUP_CREATED: 'BACKUP_CREATED',
    IMPORT_COMPLETED: 'IMPORT_COMPLETED',
    EXPORT_COMPLETED: 'EXPORT_COMPLETED'
  }
};

/**
 * Extract IP address from request, handling proxies
 * @param {Object} req - Express request object
 * @returns {String} IP address
 */
function getIpAddress(req) {
  if (!req) {
return null;
}
  
  // Check for proxy headers
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    // x-forwarded-for can be a comma-separated list, take the first one
    return forwarded.split(',')[0].trim();
  }
  
  // Check other common proxy headers
  return req.headers['x-real-ip'] || 
         req.connection?.remoteAddress || 
         req.socket?.remoteAddress ||
         req.ip ||
         null;
}

/**
 * Extract user agent from request
 * @param {Object} req - Express request object
 * @returns {String} User agent string
 */
function getUserAgent(req) {
  if (!req || !req.headers) {
return null;
}
  return req.headers['user-agent'] || null;
}

/**
 * Log user activity to database
 * This function is fire-and-forget and will never throw errors
 * 
 * @param {Object} options - Activity log options
 * @param {Object} options.user - User object from req.user
 * @param {String} options.action - Action constant from ACTIONS
 * @param {String} options.targetModel - Model name (e.g., 'Product', 'Order')
 * @param {ObjectId} options.targetId - ID of affected document
 * @param {String} options.targetName - Name/identifier of target
 * @param {Object} options.changes - Before/after values { before: {}, after: {} }
 * @param {Object} options.req - Express request object
 * @param {String} options.status - 'success' or 'failed'
 * @param {String} options.errorMessage - Error message if status is failed
 * @param {Object} options.metadata - Additional context
 */
async function logActivity({
  user,
  action,
  targetModel,
  targetId,
  targetName,
  changes,
  req,
  status = 'success',
  errorMessage,
  metadata
}) {
  try {
    // Build activity log entry
    const logEntry = {
      action,
      status,
      errorMessage,
      metadata
    };

    // Add user information (snapshot)
    if (user) {
      logEntry.user = user._id || user.id;
      logEntry.userEmail = user.email;
      logEntry.userRole = user.role;
    }

    // Add target information
    if (targetModel) {
logEntry.targetModel = targetModel;
}
    if (targetId) {
logEntry.targetId = targetId;
}
    if (targetName) {
logEntry.targetName = targetName;
}

    // Add changes
    if (changes) {
logEntry.changes = changes;
}

    // Extract request metadata
    if (req) {
      logEntry.ipAddress = getIpAddress(req);
      logEntry.userAgent = getUserAgent(req);
    }

    // Save to database (non-blocking)
    await ActivityLog.create(logEntry);

  } catch (error) {
    // Never throw - just log to Winston
    logger.error('Failed to log activity', {
      error: error.message,
      action,
      user: user?.email
    });
  }
}

/**
 * Fire-and-forget version of logActivity
 * Use this when you don't want to await the logging operation
 */
function logActivityAsync(options) {
  logActivity(options).catch(error => {
    logger.error('Activity logging failed (async)', {
      error: error.message,
      action: options.action
    });
  });
}

module.exports = {
  logActivity,
  logActivityAsync,
  ACTIONS
};
