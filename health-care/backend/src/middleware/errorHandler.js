/**
 * Centralised error handler middleware.
 * Must be registered AFTER all routes in server.js.
 */
const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || err.status || 500;
  let message = err.message || 'Internal Server Error';

  // ── Multer errors (file upload) ──────────────────────────────────────────
  if (err.name === 'MulterError') {
    const messages = {
      LIMIT_FILE_SIZE:  'Image too large. Maximum size is 5MB per image.',
      LIMIT_FILE_COUNT: 'Too many images. Maximum is 5 images per product.',
      LIMIT_UNEXPECTED_FILE: 'Unexpected field name. Use "images" as the field name.',
    };
    return res.status(400).json({
      success: false,
      message: messages[err.code] || `Upload error: ${err.message}`,
    });
  }

  // ── Cloudinary / image format errors ──────────────────────────────────────
  if (err.message && err.message.toLowerCase().includes('only jpg')) {
    return res.status(400).json({
      success: false,
      message: 'Invalid file type. Only JPG, PNG and WebP images are allowed.',
    });
  }

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyValue || {})[0];
    message = `Duplicate value for field: ${field}`;
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors).map(e => e.message).join(', ');
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }

  if (statusCode >= 500) {
    logger.error(`[errorHandler] ${req.method} ${req.originalUrl} — ${err.message}`);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = errorHandler;
