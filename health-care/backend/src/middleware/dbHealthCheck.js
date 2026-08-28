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
    // S13 — origin/CORS decisions belong to the whitelisting cors() middleware
    // alone. The previous hand-rolled header echo reflected ANY Origin with
    // `Allow-Credentials: true`, bypassing the CORS allowlist during outages.

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
