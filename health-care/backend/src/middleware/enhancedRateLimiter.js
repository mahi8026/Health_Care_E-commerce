const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const { getRedisClient, isRedisConnected } = require('../services/redisCache');
const logger = require('../utils/logger');

/**
 * Create rate limiter with Redis store (falls back to memory if Redis unavailable)
 */
function createRateLimiter(options = {}) {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes
    max = 100, // Max requests per window
    message = 'Too many requests, please try again later',
    skipSuccessfulRequests = false,
    skipFailedRequests = false,
    keyGenerator = undefined,
    handler = undefined
  } = options;

  const limiterConfig = {
    windowMs,
    max,
    message: { success: false, message },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests,
    skipFailedRequests,
    keyGenerator: keyGenerator || ((req) => {
      // S2 — req.ip honours app.set('trust proxy'); raw forwarding headers are
      // client-spoofable and must never seed rate-limit buckets.
      return req.ip || req.socket?.remoteAddress;
    }),
    handler: handler || ((req, res) => {
      logger.warn(`[RateLimit] Limit exceeded for ${req.ip} on ${req.path}`);
      res.status(429).json({
        success: false,
        message,
        retryAfter: Math.ceil(windowMs / 1000)
      });
    })
  };

  // Use Redis store if available
  if (isRedisConnected()) {
    try {
      limiterConfig.store = new RedisStore({
        client: getRedisClient(),
        prefix: 'rl:',
        sendCommand: (...args) => getRedisClient().call(...args)
      });
      logger.info('[RateLimit] Using Redis store');
    } catch (error) {
      logger.warn(`[RateLimit] Redis store failed, using memory store: ${error.message}`);
    }
  } else {
    logger.warn('[RateLimit] Redis not connected, using memory store');
  }

  return rateLimit(limiterConfig);
}

/**
 * Strict rate limiter for authentication endpoints
 * Development: 50 requests per 15 minutes
 * Production: 5 requests per 15 minutes per IP
 */
const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'development' ? 50 : 5,
  message: 'Too many authentication attempts, please try again after 15 minutes',
  skipSuccessfulRequests: false,
  skipFailedRequests: false
});

/**
 * Login rate limiter
 * Development: 50 attempts per 15 minutes
 * Production: 5 login attempts per 15 minutes per IP
 */
const loginLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'development' ? 50 : 5,
  message: 'Too many login attempts, please try again after 15 minutes',
  skipSuccessfulRequests: true, // Don't count successful logins
  skipFailedRequests: false
});

/**
 * Register rate limiter
 * Development: 20 registrations per hour
 * Production: 3 registrations per hour per IP
 */
const registerLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: process.env.NODE_ENV === 'development' ? 20 : 3,
  message: 'Too many registration attempts, please try again after 1 hour'
});

/**
 * Password reset rate limiter
 * 3 requests per hour per IP
 */
const passwordResetLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: 'Too many password reset requests, please try again after 1 hour'
});

/**
 * OTP rate limiter
 * 3 OTP requests per hour per user
 */
const otpLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: 'Too many OTP requests, please try again after 1 hour',
  keyGenerator: (req) => {
    // Use user ID if authenticated, otherwise IP
    return req.user?.id || req.ip;
  }
});

/**
 * API rate limiter (general)
 * 100 requests per 15 minutes per IP
 */
const apiLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many API requests, please try again later',
  skipSuccessfulRequests: false
});

/**
 * Strict API rate limiter for sensitive operations
 * 20 requests per 15 minutes per IP
 */
const strictApiLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: 'Rate limit exceeded for this operation'
});

/**
 * Admin API rate limiter (more lenient)
 * 200 requests per 15 minutes per IP
 */
const adminApiLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: 'Admin API rate limit exceeded'
});

/**
 * File upload rate limiter
 * 100 uploads per hour per IP — admin users batch-upload product images
 */
const uploadLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 100,
  message: 'Too many file uploads, please try again after 1 hour'
});

/**
 * Payment rate limiter
 * 5 payment attempts per hour per user
 */
const paymentLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: 'Too many payment attempts, please try again after 1 hour',
  keyGenerator: (req) => {
    return req.user?.id || req.ip;
  }
});

/**
 * Create custom rate limiter with specific options
 */
function customRateLimiter(windowMinutes, maxRequests, message) {
  return createRateLimiter({
    windowMs: windowMinutes * 60 * 1000,
    max: maxRequests,
    message: message || `Too many requests, please try again after ${windowMinutes} minutes`
  });
}

module.exports = {
  createRateLimiter,
  authLimiter,
  loginLimiter,
  registerLimiter,
  passwordResetLimiter,
  otpLimiter,
  apiLimiter,
  strictApiLimiter,
  adminApiLimiter,
  uploadLimiter,
  paymentLimiter,
  customRateLimiter
};
