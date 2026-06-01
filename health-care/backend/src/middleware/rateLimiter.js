const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const { getRedisClient, isRedisConnected } = require('../services/redisCache');
const logger = require('../utils/logger');

/**
 * Build a rate-limiter with an optional Redis store.
 *
 * Falls back to the default in-memory store when Redis is unavailable so the
 * server keeps running even without a cache connection.
 *
 * Rate-limit headers sent on every response:
 *   X-RateLimit-Limit     – maximum requests allowed in the window
 *   X-RateLimit-Remaining – requests remaining in the current window
 *   X-RateLimit-Reset     – UTC epoch seconds when the window resets
 *
 * @param {object} options
 * @param {number}  options.windowMs          - Window length in milliseconds
 * @param {number}  options.max               - Max requests per window per key
 * @param {string}  options.message           - Human-readable rejection message
 * @param {string}  options.keyPrefix         - Redis key prefix (e.g. 'rl:auth:')
 * @param {boolean} [options.skipInDev=false] - Skip limiting in development mode
 * @param {Function} [options.keyGenerator]   - Custom key generator
 * @returns {import('express').RequestHandler}
 */
function createLimiter({
  windowMs,
  max,
  message,
  keyPrefix,
  skipInDev = false,
  keyGenerator
}) {
  /** @type {import('express-rate-limit').Options} */
  const config = {
    windowMs,
    max,
    // Disable standard headers - we'll set custom X-RateLimit-* headers manually
    standardHeaders: false,
    legacyHeaders: false,
    message: { success: false, message },
    skip: skipInDev ? () => process.env.NODE_ENV === 'development' : undefined,
    keyGenerator: keyGenerator || ((req) => {
      // Respect reverse-proxy forwarded IP, fall back to socket address
      return (
        req.headers['x-forwarded-for']?.split(',')[0].trim() ||
        req.headers['x-real-ip'] ||
        req.ip ||
        req.socket?.remoteAddress
      );
    }),
    // Custom handler to set X-RateLimit-* headers as required by task 1.2
    handler: (req, res, next, options) => {
      // Set custom X-RateLimit-* headers (Requirements 10.1, 10.2)
      res.setHeader('X-RateLimit-Limit', options.max);
      res.setHeader('X-RateLimit-Remaining', 0);
      res.setHeader('X-RateLimit-Reset', Math.ceil(Date.now() / 1000) + Math.ceil(windowMs / 1000));
      
      logger.warn(`[RateLimit] Limit exceeded — IP: ${req.ip}, path: ${req.path}`);
      res.status(429).json({
        success: false,
        message,
        retryAfter: Math.ceil(windowMs / 1000)
      });
    },
    // Add custom headers on every request
    onLimitReached: (req, res, options) => {
      logger.warn(`[RateLimit] Limit reached — IP: ${req.ip}, path: ${req.path}`);
    }
  };

  // Attach Redis store when the client is ready
  if (isRedisConnected()) {
    try {
      const client = getRedisClient();
      config.store = new RedisStore({
        // ioredis client — rate-limit-redis v4 uses sendCommand
        sendCommand: (...args) => client.call(...args),
        prefix: keyPrefix || 'rl:'
      });
      logger.info(`[RateLimit] Redis store attached (prefix: ${keyPrefix || 'rl:'})`);
    } catch (err) {
      logger.warn(`[RateLimit] Redis store init failed, using memory store: ${err.message}`);
    }
  } else {
    logger.warn('[RateLimit] Redis not connected — using in-memory store');
  }

  // Create the rate limiter with a skip function that adds headers
  const baseLimiter = rateLimit(config);
  
  // Wrap the rate limiter to add custom X-RateLimit-* headers on every response
  return (req, res, next) => {
    // Call the base limiter first
    baseLimiter(req, res, (err) => {
      if (err) return next(err);
      
      // After rate limiter runs, add custom X-RateLimit-* headers
      // The rate limiter sets req.rateLimit with limit, current, and remaining
      if (req.rateLimit) {
        res.setHeader('X-RateLimit-Limit', req.rateLimit.limit || max);
        res.setHeader('X-RateLimit-Remaining', req.rateLimit.remaining ?? 0);
        
        // Calculate reset time based on window
        const resetTime = Math.ceil(Date.now() / 1000) + Math.ceil(windowMs / 1000);
        res.setHeader('X-RateLimit-Reset', resetTime);
      } else {
        // Fallback if req.rateLimit is not set
        res.setHeader('X-RateLimit-Limit', max);
        res.setHeader('X-RateLimit-Remaining', max - 1);
        const resetTime = Math.ceil(Date.now() / 1000) + Math.ceil(windowMs / 1000);
        res.setHeader('X-RateLimit-Reset', resetTime);
      }
      
      next();
    });
  };
}

/**
 * Auth rate limiter — 10 requests per 15 minutes per IP.
 *
 * Applied to: POST /api/auth/login, POST /api/auth/register
 * Requirement: 10.1
 * 
 * Key prefix changed to v2 to invalidate old Redis cache.
 */
const authLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many authentication attempts. Please try again in 15 minutes.',
  keyPrefix: 'rl:auth:v2:'
});

/**
 * General API rate limiter — 1000 requests per 15 minutes per IP.
 *
 * Applied to: all /api/* routes
 * Requirement: 10.2
 * 
 * Note: Homepage makes 14+ API calls on load. With caching, most users
 * will make 20-50 requests per session. 1000/15min = ~67 req/min allows
 * normal browsing while still protecting against abuse.
 * 
 * Key prefix changed to v2 to invalidate old Redis cache with 100 limit.
 */
const apiLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: 'Too many requests from this IP. Please try again later.',
  keyPrefix: 'rl:api:v2:'
});

/**
 * Review rate limiter — 5 reviews per 24 hours per user/IP.
 */
const reviewRateLimiter = createLimiter({
  windowMs: 24 * 60 * 60 * 1000,
  max: 5,
  message: 'You have reached the daily review limit (5 reviews per day).',
  keyPrefix: 'rl:review:',
  keyGenerator: (req) => req.user?._id?.toString() || req.ip
});

module.exports = { authLimiter, apiLimiter, reviewRateLimiter };
