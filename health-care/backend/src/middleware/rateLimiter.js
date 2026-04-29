const rateLimit = require('express-rate-limit');

/**
 * Strict rate limiter for auth endpoints — 5 requests per 15 minutes.
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: {
    success: false,
    message: 'Too many login attempts. Please try again in 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'development'
});

/**
 * General API rate limiter — 200 requests per 15 minutes.
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'development'
});

/**
 * Review rate limiter — 5 reviews per day per user.
 */
const reviewRateLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 5,
  message: {
    success: false,
    message: 'You have reached the daily review limit (5 reviews per day).'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'development',
  keyGenerator: (req) => req.user?._id?.toString() || req.ip
});

module.exports = { authLimiter, apiLimiter, reviewRateLimiter };
