const { body, param, query, validationResult } = require('express-validator');

// Validation error handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.path || err.param,
        message: err.msg
      }))
    });
  }
  next();
};

// Product validation rules
const validateProduct = [
  body('name').trim().notEmpty().withMessage('Product name is required')
    .isLength({ min: 3, max: 200 }).withMessage('Product name must be 3-200 characters'),
  body('description').trim().notEmpty().withMessage('Description is required')
    .isLength({ min: 10, max: 5000 }).withMessage('Description must be 10-5000 characters'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('stock').isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
  body('sku').trim().notEmpty().withMessage('SKU is required')
    .matches(/^[A-Z0-9-]+$/).withMessage('SKU must contain only uppercase letters, numbers, and hyphens'),
  body('category').isMongoId().withMessage('Invalid category ID'),
  body('brand').isMongoId().withMessage('Invalid brand ID'),
  body('oldPrice').optional().isFloat({ min: 0 }).withMessage('Old price must be a positive number'),
  body('b2bPrice').optional().isFloat({ min: 0 }).withMessage('B2B price must be a positive number'),
  body('minOrderQty').optional().isInt({ min: 1 }).withMessage('Minimum order quantity must be at least 1'),
  handleValidationErrors
];

// Order validation rules
const validateOrder = [
  body('items').isArray({ min: 1 }).withMessage('Order must contain at least one item'),
  body('items.*.product').isMongoId().withMessage('Invalid product ID'),
  body('items.*.quantity').isInt({ min: 1, max: 1000 }).withMessage('Quantity must be between 1 and 1000'),
  body('deliveryAddress.name').trim().notEmpty().withMessage('Delivery name is required'),
  body('deliveryAddress.phone').trim().notEmpty().withMessage('Phone number is required')
    .matches(/^(\+8801|01)[3-9]\d{8}$/).withMessage('Invalid Bangladesh phone number'),
  body('deliveryAddress.street').trim().notEmpty().withMessage('Street address is required'),
  body('deliveryAddress.district').trim().notEmpty().withMessage('District is required'),
  body('paymentMethod').isIn(['beftn', 'bkash', 'nagad', 'npsb', 'cheque', 'b2b_credit', 'bank_transfer', 'credit_terms', 'card', 'cash'])
    .withMessage('Invalid payment method'),
  body('deliveryType').optional().isIn(['standard', 'express', 'nationwide', 'cold_chain'])
    .withMessage('Invalid delivery type'),
  handleValidationErrors
];

// User registration validation
const validateRegistration = [
  body('name').trim().notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
  body('email').trim().isEmail().withMessage('Valid email is required')
    .normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]/)
    .withMessage('Password must contain uppercase, lowercase, number, and special character'),
  body('phone').trim().notEmpty().withMessage('Phone number is required')
    .matches(/^(\+8801|01)[3-9]\d{8}$/).withMessage('Invalid Bangladesh phone number'),
  body('accountType').optional().isIn(['Retail', 'B2B']).withMessage('Invalid account type'),
  handleValidationErrors
];

// User login validation
const validateLogin = [
  body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
  handleValidationErrors
];

// Payment validation
const validatePayment = [
  body('amount').isFloat({ min: 1 }).withMessage('Amount must be at least 1'),
  body('orderId').isMongoId().withMessage('Invalid order ID'),
  handleValidationErrors
];

// Review validation
const validateReview = [
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('comment').optional().trim().isLength({ max: 1000 }).withMessage('Comment must not exceed 1000 characters'),
  param('productId').isMongoId().withMessage('Invalid product ID'),
  handleValidationErrors
];

// Coupon validation
const validateCoupon = [
  body('code').trim().notEmpty().withMessage('Coupon code is required')
    .isLength({ min: 3, max: 20 }).withMessage('Code must be 3-20 characters')
    .matches(/^[A-Z0-9-]+$/).withMessage('Code must contain only uppercase letters, numbers, and hyphens'),
  body('type').isIn(['percentage', 'fixed', 'buy_x_get_y']).withMessage('Invalid coupon type'),
  body('value').isFloat({ min: 0 }).withMessage('Value must be a positive number'),
  body('startDate').isISO8601().withMessage('Invalid start date'),
  body('endDate').isISO8601().withMessage('Invalid end date'),
  body('minimumOrderAmount').optional().isFloat({ min: 0 }).withMessage('Minimum order amount must be positive'),
  handleValidationErrors
];

// Quote validation
const validateQuote = [
  body('items').isArray({ min: 1 }).withMessage('Quote must contain at least one item'),
  body('items.*.product').isMongoId().withMessage('Invalid product ID'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('message').optional().trim().isLength({ max: 2000 }).withMessage('Message must not exceed 2000 characters'),
  handleValidationErrors
];

// ID parameter validation
const validateMongoId = [
  param('id').isMongoId().withMessage('Invalid ID format'),
  handleValidationErrors
];

// Pagination validation
const validatePagination = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be at least 1'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  validateProduct,
  validateOrder,
  validateRegistration,
  validateLogin,
  validatePayment,
  validateReview,
  validateCoupon,
  validateQuote,
  validateMongoId,
  validatePagination
};
