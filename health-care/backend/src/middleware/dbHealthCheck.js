/**
 * Database health check middleware.
 * Checks MongoDB connection status before processing requests.
 * Returns 503 Service Unavailable when database is disconnected.
 */
const mongoose = require('mongoose');

const dbHealthCheck = (req, res, next) => {
  // Mongoose connection states:
  // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      success: false,
      error: 'Database temporarily unavailable. Please try again shortly.',
      code: 'DB_UNAVAILABLE',
      retryAfter: 5
    });
  }
  next();
};

module.exports = { dbHealthCheck };
