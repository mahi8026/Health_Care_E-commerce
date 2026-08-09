/**
 * Database health check middleware.
 * Checks MongoDB connection status before processing requests.
 * Returns 503 Service Unavailable when database is disconnected.
 */
const mongoose = require('mongoose');
const logger = require('../utils/logger');

const dbHealthCheck = (req, res, next) => {
  // Mongoose connection states:
  // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
  // Allow state 1 (connected) and 2 (connecting) — connecting means DB is coming up
  const state = mongoose.connection.readyState;
  if (state !== 1 && state !== 2) {
    const origin = req.headers.origin;
    if (origin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    }

    logger.warn(`[dbHealthCheck] Database unavailable (state: ${state})`);
    
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
