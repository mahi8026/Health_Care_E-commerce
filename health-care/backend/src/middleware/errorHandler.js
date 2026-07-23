/**
 * Centralised error handler middleware.
 * Must be registered AFTER all routes in server.js.
 *
 * Responsibilities:
 *  - Extract HTTP status code from the error object (err.status / err.statusCode) or default to 500
 *  - Log every error with Winston including requestId, method, path, message, and stack trace
 *  - Forward 5xx errors to Sentry for alerting
 *  - Return a user-friendly JSON response that never leaks internal details on 5xx
 *
 * Requirements: 11.1, 11.2, 11.3, 11.9, 11.10
 */
const logger = require('../utils/logger');
const { Sentry } = require('../config/sentry');

/**
 * Express error-handling middleware (4-argument signature required by Express).
 *
 * @param {Error} err - The error object thrown or passed to next(err)
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const errorHandler = (err, req, res, next) => {
  // ── 1. Determine HTTP status code ─────────────────────────────────────────
  // Normalise common error-type overrides first, then fall back to the status
  // already set on the error object, and finally default to 500.
  let statusCode = err.statusCode || err.status || 500;
  let message = err.message || 'Internal Server Error';

  // ── Multer errors (file upload) ──────────────────────────────────────────
  if (err.name === 'MulterError') {
    statusCode = 400;
    const messages = {
      LIMIT_FILE_SIZE:       'Image too large. Maximum size is 5MB per image.',
      LIMIT_FILE_COUNT:      'Too many images. Maximum is 5 images per product.',
      LIMIT_UNEXPECTED_FILE: 'Unexpected field name. Use "images" as the field name.',
    };
    message = messages[err.code] || `Upload error: ${err.message}`;
  }

  // ── Cloudinary / image format errors ──────────────────────────────────────
  if (err.message && err.message.toLowerCase().includes('only jpg')) {
    statusCode = 400;
    message = 'Invalid file type. Only JPG, PNG and WebP images are allowed.';
  }

  // ── Mongoose bad ObjectId → 400 ───────────────────────────────────────────
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  }

  // ── Mongoose duplicate key → 400 ─────────────────────────────────────────
  if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyValue || {})[0];
    message = `Duplicate value for field: ${field}`;
  }

  // ── Mongoose validation error → 400 ──────────────────────────────────────
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors).map(e => e.message).join(', ');
  }

  // ── JWT errors → 401 ─────────────────────────────────────────────────────
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }

  // ── 2. Structured Winston logging (Req 11.2, 11.3) ───────────────────────
  // Log every error with full context so it can be correlated via requestId.
  logger.error('Request error', {
    requestId: req.id,
    error:     err.message,
    stack:     err.stack,
    method:    req.method,
    path:      req.path,
    status:    statusCode,
  });

  // ── 3. Forward 5xx errors to Sentry (Req 11.9) ───────────────────────────
  // Only server-side errors are sent to Sentry; client errors (4xx) are not.
  if (statusCode >= 500 && process.env.SENTRY_DSN) {
    Sentry.captureException(err);
  }

  // ── 4. User-friendly response (Req 11.1, 11.10) ──────────────────────────
  // Never expose internal error details (stack traces, DB messages) on 5xx.
  res.status(statusCode).json({
    success:   false,
    message:   statusCode >= 500 ? 'Internal server error' : message,
    requestId: req.id,
    // Include stack trace in development for easier debugging
    ...(process.env.NODE_ENV === 'development' && statusCode >= 500 && { stack: err.stack }),
  });
};

module.exports = errorHandler;
