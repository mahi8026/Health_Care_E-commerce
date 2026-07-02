const { body, param, query, validationResult } = require('express-validator');
const logger = require('../utils/logger');

/**
 * Input Validation Middleware
 * 
 * Comprehensive validation rules for all API endpoints to prevent:
 * - SQL/NoSQL injection
 * - XSS attacks
 * - Path traversal
 * - Business logic bypass
 * 
 * ✅ Security Enhancement: Add input validation to all endpoints
 */

// ── Validation Error Handler ─────────────────────────────────────────────────
exports.handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(err => ({
      field: err.param || err.path,
      message: err.msg,
      value: err.value
    }));
    
    logger.warn('[Validation] Request validation failed', {
      path: req.path,
      method: req.method,
      errors: formattedErrors,
      ip: req.ip
    });
    
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: formattedErrors
    });
  }
  
  next();
};

// ── Authentication Validation ────────────────────────────────────────────────

exports.validateRegister = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters')
    .matches(/^[a-zA-Z\s\u0980-\u09FF.-]+$/).withMessage('Name contains invalid characters'),
  
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email format')
    .normalizeEmail()
    .isLength({ max: 255 }).withMessage('Email too long'),
  
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 8, max: 128 }).withMessage('Password must be 8-128 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]/)
      .withMessage('Password must contain uppercase, lowercase, number, and special character'),
  
  body('phone')
    .optional()
    .trim()
    .matches(/^(\+880|880|0)?1[3-9]\d{8}$/).withMessage('Invalid Bangladesh phone number'),
  
  body('company')
    .optional()
    .trim()
    .isLength({ max: 200 }).withMessage('Company name too long'),
  
  body('accountType')
    .optional()
    .isIn(['Retail', 'B2B']).withMessage('Invalid account type'),
  
  exports.handleValidationErrors
];

exports.validateLogin = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email format')
    .normalizeEmail(),
  
  body('password')
    .notEmpty().withMessage('Password is required'),
  
  exports.handleValidationErrors
];

exports.validatePasswordReset = [
  body('token')
    .notEmpty().withMessage('Reset token is required')
    .isLength({ min: 32, max: 128 }).withMessage('Invalid token format'),
  
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 8, max: 128 }).withMessage('Password must be 8-128 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]/)
      .withMessage('Password must contain uppercase, lowercase, number, and special character'),
  
  exports.handleValidationErrors
];

// ── Order Validation ─────────────────────────────────────────────────────────

exports.validateCreateOrder = [
  body('items')
    .isArray({ min: 1, max: 50 }).withMessage('Order must contain 1-50 items'),
  
  body('items.*.product')
    .notEmpty().withMessage('Product ID is required')
    .isMongoId().withMessage('Invalid product ID'),
  
  body('items.*.qty')
    .isInt({ min: 1, max: 1000 }).withMessage('Quantity must be 1-1000'),
  
  body('idempotencyKey')
    .notEmpty().withMessage('Idempotency key is required')
    .isLength({ min: 10, max: 200 }).withMessage('Invalid idempotency key'),
  
  body('deliveryAddress.name')
    .trim()
    .notEmpty().withMessage('Delivery name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
  
  body('deliveryAddress.phone')
    .trim()
    .notEmpty().withMessage('Phone is required')
    .matches(/^(\+880|880|0)?1[3-9]\d{8}$/).withMessage('Invalid Bangladesh phone number'),
  
  body('deliveryAddress.street')
    .trim()
    .notEmpty().withMessage('Street address is required')
    .isLength({ min: 5, max: 500 }).withMessage('Street address must be 5-500 characters'),
  
  body('deliveryAddress.district')
    .trim()
    .notEmpty().withMessage('District is required')
    .isLength({ max: 100 }).withMessage('District name too long'),
  
  body('deliveryAddress.thana')
    .trim()
    .notEmpty().withMessage('Thana is required')
    .isLength({ min: 2, max: 100 }).withMessage('Thana must be 2-100 characters'),
  
  body('deliveryAddress.postcode')
    .trim()
    .notEmpty().withMessage('Postcode is required')
    .matches(/^\d{4}$/).withMessage('Postcode must be 4 digits'),
  
  body('paymentMethod')
    .isIn(['cod', 'bkash', 'nagad', 'b2b_credit', 'bank_transfer', 'cheque', 'card'])
    .withMessage('Invalid payment method'),
  
  body('deliveryType')
    .optional()
    .isIn(['standard', 'express', 'nationwide', 'cold_chain', 'inside_dhaka', 'dhaka_suburban', 'outside_dhaka'])
    .withMessage('Invalid delivery type'),
  
  body('promoCode')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('Promo code too long')
    .matches(/^[A-Z0-9-]+$/).withMessage('Invalid promo code format'),
  
  exports.handleValidationErrors
];

exports.validateOrderId = [
  param('id')
    .isMongoId().withMessage('Invalid order ID'),
  
  exports.handleValidationErrors
];

// ── Payment Validation ───────────────────────────────────────────────────────

exports.validateBkashPayment = [
  body('orderId')
    .notEmpty().withMessage('Order ID is required')
    .isMongoId().withMessage('Invalid order ID'),
  
  body('amount')
    .isFloat({ min: 10, max: 10000000 }).withMessage('Amount must be between ৳10 and ৳10,000,000'),
  
  exports.handleValidationErrors
];

exports.validateB2BCreditPayment = [
  body('orderId')
    .notEmpty().withMessage('Order ID is required')
    .isMongoId().withMessage('Invalid order ID'),
  
  exports.handleValidationErrors
];

// ── Product Validation ───────────────────────────────────────────────────────

exports.validateCreateProduct = [
  body('name')
    .trim()
    .notEmpty().withMessage('Product name is required')
    .isLength({ min: 3, max: 300 }).withMessage('Name must be 3-300 characters'),
  
  body('description')
    .trim()
    .notEmpty().withMessage('Description is required')
    .isLength({ min: 10, max: 5000 }).withMessage('Description must be 10-5000 characters'),
  
  body('price')
    .isFloat({ min: 0, max: 10000000 }).withMessage('Price must be between ৳0 and ৳10,000,000'),
  
  body('stock')
    .isInt({ min: 0, max: 1000000 }).withMessage('Stock must be 0-1,000,000'),
  
  body('category')
    .notEmpty().withMessage('Category is required')
    .isMongoId().withMessage('Invalid category ID'),
  
  body('sku')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('SKU too long')
    .matches(/^[A-Z0-9-]+$/).withMessage('SKU can only contain uppercase letters, numbers, and hyphens'),
  
  body('brand')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Brand name too long'),
  
  body('images')
    .optional()
    .isArray({ max: 10 }).withMessage('Maximum 10 images allowed'),
  
  body('images.*')
    .optional()
    .isURL().withMessage('Invalid image URL'),
  
  exports.handleValidationErrors
];

exports.validateProductId = [
  param('id')
    .isMongoId().withMessage('Invalid product ID'),
  
  exports.handleValidationErrors
];

// ── User Validation ──────────────────────────────────────────────────────────

exports.validateUpdateProfile = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
  
  body('phone')
    .optional()
    .trim()
    .matches(/^(\+880|880|0)?1[3-9]\d{8}$/).withMessage('Invalid Bangladesh phone number'),
  
  body('companyName')
    .optional()
    .trim()
    .isLength({ max: 200 }).withMessage('Company name too long'),
  
  body('addresses')
    .optional()
    .isArray({ max: 5 }).withMessage('Maximum 5 addresses allowed'),
  
  exports.handleValidationErrors
];

exports.validateChangePassword = [
  body('currentPassword')
    .notEmpty().withMessage('Current password is required'),
  
  body('newPassword')
    .notEmpty().withMessage('New password is required')
    .isLength({ min: 8, max: 128 }).withMessage('Password must be 8-128 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]/)
      .withMessage('Password must contain uppercase, lowercase, number, and special character'),
  
  exports.handleValidationErrors
];

// ── Admin Validation ─────────────────────────────────────────────────────────

exports.validateUpdateCreditLimit = [
  param('userId')
    .isMongoId().withMessage('Invalid user ID'),
  
  body('creditLimit')
    .isFloat({ min: 0, max: 100000000 }).withMessage('Credit limit must be 0-100,000,000'),
  
  body('reason')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Reason too long'),
  
  exports.handleValidationErrors
];

exports.validateUpdateOrderStatus = [
  param('id')
    .isMongoId().withMessage('Invalid order ID'),
  
  body('status')
    .isIn(['placed', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'])
    .withMessage('Invalid order status'),
  
  body('note')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('Note too long'),
  
  exports.handleValidationErrors
];

// ── Search & Pagination Validation ───────────────────────────────────────────

exports.validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1, max: 1000 }).withMessage('Page must be 1-1000'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be 1-100'),
  
  query('sort')
    .optional()
    .isIn(['price', '-price', 'createdAt', '-createdAt', 'name', '-name'])
    .withMessage('Invalid sort parameter'),
  
  exports.handleValidationErrors
];

exports.validateSearch = [
  query('q')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 }).withMessage('Search query must be 1-200 characters')
    .matches(/^[a-zA-Z0-9\s\u0980-\u09FF.-]+$/).withMessage('Search query contains invalid characters'),
  
  query('category')
    .optional()
    .isMongoId().withMessage('Invalid category ID'),
  
  query('minPrice')
    .optional()
    .isFloat({ min: 0 }).withMessage('Minimum price must be >= 0'),
  
  query('maxPrice')
    .optional()
    .isFloat({ min: 0, max: 10000000 }).withMessage('Maximum price must be 0-10,000,000'),
  
  exports.handleValidationErrors
];

// ── File Upload Validation ───────────────────────────────────────────────────

exports.validateFileUpload = (req, res, next) => {
  if (!req.file && !req.files) {
    return res.status(400).json({
      success: false,
      message: 'No file uploaded'
    });
  }
  
  const file = req.file || (req.files && req.files[0]);
  
  // Check file size (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    return res.status(400).json({
      success: false,
      message: 'File size must not exceed 5MB'
    });
  }
  
  // Check file type
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
  if (!allowedMimeTypes.includes(file.mimetype)) {
    return res.status(400).json({
      success: false,
      message: 'Only JPEG, PNG, and WebP images are allowed'
    });
  }
  
  // Check filename for path traversal attempts
  if (file.originalname.includes('..') || file.originalname.includes('/') || file.originalname.includes('\\')) {
    return res.status(400).json({
      success: false,
      message: 'Invalid filename'
    });
  }
  
  next();
};

// ── Coupon Validation ────────────────────────────────────────────────────────

exports.validateApplyCoupon = [
  body('code')
    .trim()
    .notEmpty().withMessage('Coupon code is required')
    .isLength({ max: 50 }).withMessage('Coupon code too long')
    .matches(/^[A-Z0-9-]+$/).withMessage('Invalid coupon code format'),
  
  body('orderTotal')
    .isFloat({ min: 0 }).withMessage('Invalid order total'),
  
  exports.handleValidationErrors
];

module.exports = exports;
