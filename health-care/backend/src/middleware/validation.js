const { body, param, query, validationResult } = require('express-validator');

// Accepts: 01XXXXXXXXX  |  +8801XXXXXXXXX  |  8801XXXXXXXXX  (digit after country prefix must be 3-9)
const BD_PHONE_REGEX = /^(\+880|880|0)?1[3-9]\d{8}$/;

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
    .matches(/^[A-Z0-9\-/.]+$/).withMessage('SKU must contain only uppercase letters, numbers, hyphens, slashes, and dots'),
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
  body('items.*').custom((item) => {
    const qty = item.quantity ?? item.qty;
    if (!Number.isInteger(qty) || qty < 1 || qty > 1000) {
      throw new Error('Quantity must be between 1 and 1000');
    }
    return true;
  }),
  body('deliveryAddress.name').trim().notEmpty().withMessage('Delivery name is required'),
  body('deliveryAddress.phone').trim().notEmpty().withMessage('Phone number is required')
    .matches(BD_PHONE_REGEX).withMessage('Invalid Bangladesh phone number (e.g. 01XXXXXXXXX)'),
  body('deliveryAddress.street').trim().notEmpty().withMessage('Street address is required'),
  body('deliveryAddress.district').trim().notEmpty().withMessage('District is required'),
  body('paymentMethod').isIn(['cod', 'beftn', 'bkash', 'nagad', 'npsb', 'cheque', 'b2b_credit', 'bank_transfer', 'credit_terms', 'card', 'cash'])
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
    .matches(BD_PHONE_REGEX).withMessage('Invalid Bangladesh phone number (e.g. 01XXXXXXXXX)'),
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

// Product query/filter validation (GET /products)
const validateProductQuery = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be at least 1').toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100').toInt(),
  query('minPrice').optional().isFloat({ min: 0 }).withMessage('minPrice must be a non-negative number').toFloat(),
  query('maxPrice').optional().isFloat({ min: 0 }).withMessage('maxPrice must be a non-negative number').toFloat(),
  query('category').optional().trim().escape(),
  query('brand').optional().trim().escape(),
  query('search').optional().trim().escape().isLength({ max: 200 }).withMessage('Search term too long'),
  query('slug').optional().trim(),
  query('sort').optional().isIn(['price_asc', 'price_desc', 'name_asc', 'name_desc', 'newest', 'rating'])
    .withMessage('Invalid sort option'),
  query('fields').optional().trim().matches(/^[a-zA-Z0-9_,\s-]+$/).withMessage('Invalid fields parameter'),
  handleValidationErrors
];

// Product create validation (all required fields must be present)
const validateProductCreate = [
  ...validateProduct.slice(0, -1), // reuse rules without the trailing handleValidationErrors
  body('images').optional().isArray().withMessage('Images must be an array'),
  // Images can be either a plain URL string or an object with a url property
  body('images.*').optional().custom((img) => {
    if (typeof img === 'string') {
      try {
        new URL(img);
        return true;
      } catch {
        throw new Error('Each image must be a valid URL');
      }
    }
    if (typeof img === 'object' && img !== null && typeof img.url === 'string') {
      return true; // object with url property (uploaded image)
    }
    throw new Error('Each image must be a URL string or an object with a url property');
  }),
  body('isActive').optional().isBoolean({ strict: true }).withMessage('isActive must be a boolean'),
  body('isFeatured').optional().isBoolean({ strict: true }).withMessage('isFeatured must be a boolean'),
  body('tags').optional().isArray().withMessage('Tags must be an array'),
  body('tags.*').optional().trim().escape().isLength({ max: 50 }).withMessage('Each tag must be at most 50 characters'),
  handleValidationErrors
];

// Product update validation (all fields optional ΓÇö only validate what is sent)
const validateProductUpdate = [
  body('name').optional().trim().notEmpty().withMessage('Product name cannot be empty')
    .isLength({ min: 3, max: 200 }).withMessage('Product name must be 3-200 characters'),
  body('description').optional().trim().notEmpty().withMessage('Description cannot be empty')
    .isLength({ min: 10, max: 5000 }).withMessage('Description must be 10-5000 characters'),
  body('price').optional().isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('stock').optional().isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
  body('sku').optional().trim().notEmpty().withMessage('SKU cannot be empty')
    .matches(/^[A-Z0-9\-/.]+$/).withMessage('SKU must contain only uppercase letters, numbers, hyphens, slashes, and dots'),
  body('category').optional().isMongoId().withMessage('Invalid category ID'),
  body('brand').optional().isMongoId().withMessage('Invalid brand ID'),
  body('oldPrice').optional().isFloat({ min: 0 }).withMessage('Old price must be a positive number'),
  body('b2bPrice').optional().isFloat({ min: 0 }).withMessage('B2B price must be a positive number'),
  body('minOrderQty').optional().isInt({ min: 1 }).withMessage('Minimum order quantity must be at least 1'),
  body('images').optional().isArray().withMessage('Images must be an array'),
  body('images.*').optional().custom((img) => {
    if (typeof img === 'string') {
      try {
        new URL(img);
        return true;
      } catch {
        throw new Error('Each image must be a valid URL');
      }
    }
    if (typeof img === 'object' && img !== null && typeof img.url === 'string') {
      return true;
    }
    throw new Error('Each image must be a URL string or an object with a url property');
  }),
  body('isActive').optional().isBoolean({ strict: true }).withMessage('isActive must be a boolean'),
  body('isFeatured').optional().isBoolean({ strict: true }).withMessage('isFeatured must be a boolean'),
  body('tags').optional().isArray().withMessage('Tags must be an array'),
  body('tags.*').optional().trim().escape().isLength({ max: 50 }).withMessage('Each tag must be at most 50 characters'),
  handleValidationErrors
];

// Order status update validation (admin)
// NOTE: must stay in sync with the controller's validStatuses list — including
// 'placed' and 'out_for_delivery', which the admin UI offers for the first and
// second-to-last transitions.
const validateOrderStatusUpdate = [
  param('id').isMongoId().withMessage('Invalid order ID'),
  body('status').trim().isIn([
    'pending', 'placed', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'refunded', 'returned'
  ]).withMessage('Invalid order status'),
  body('note').optional().trim().escape().isLength({ max: 500 }).withMessage('Note must not exceed 500 characters'),
  handleValidationErrors
];

// Order note validation (admin)
const validateOrderNote = [
  param('id').isMongoId().withMessage('Invalid order ID'),
  body('note').trim().notEmpty().withMessage('Note is required')
    .escape().isLength({ max: 1000 }).withMessage('Note must not exceed 1000 characters'),
  handleValidationErrors
];

// Profile update validation
const validateProfileUpdate = [
  body('name').optional().trim().escape()
    .isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
  body('phone').optional().trim()
    .matches(BD_PHONE_REGEX).withMessage('Invalid Bangladesh phone number (e.g. 01XXXXXXXXX)'),
  body('address').optional().trim().escape()
    .isLength({ max: 500 }).withMessage('Address must not exceed 500 characters'),
  body('company').optional().trim().escape()
    .isLength({ max: 200 }).withMessage('Company name must not exceed 200 characters'),
  body('avatar').optional().trim().isURL().withMessage('Avatar must be a valid URL'),
  handleValidationErrors
];

// Password change validation
const validatePasswordChange = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]/)
    .withMessage('New password must contain uppercase, lowercase, number, and special character'),
  body('confirmPassword').optional().custom((value, { req }) => {
    if (value && value !== req.body.newPassword) {
      throw new Error('Passwords do not match');
    }
    return true;
  }),
  handleValidationErrors
];

// Forgot password validation
const validateForgotPassword = [
  body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
  handleValidationErrors
];

// Reset password validation
const validateResetPassword = [
  body('token').trim().notEmpty().withMessage('Reset token is required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]/)
    .withMessage('Password must contain uppercase, lowercase, number, and special character'),
  handleValidationErrors
];

// Phone OTP validation
const validateSendPhoneOTP = [
  body('phone').trim().notEmpty().withMessage('Phone number is required')
    .matches(BD_PHONE_REGEX).withMessage('Invalid Bangladesh phone number (e.g. 01XXXXXXXXX)'),
  handleValidationErrors
];

const validateVerifyPhoneOTP = [
  body('phone').trim().notEmpty().withMessage('Phone number is required')
    .matches(BD_PHONE_REGEX).withMessage('Invalid Bangladesh phone number (e.g. 01XXXXXXXXX)'),
  body('otp').trim().notEmpty().withMessage('OTP is required')
    .isLength({ min: 4, max: 8 }).withMessage('Invalid OTP length')
    .isNumeric().withMessage('OTP must be numeric'),
  handleValidationErrors
];

// 2FA validation
const validate2FASetup = [
  handleValidationErrors
];

const validate2FAEnable = [
  body('token').trim().notEmpty().withMessage('2FA token is required')
    .isLength({ min: 6, max: 6 }).withMessage('Token must be 6 digits')
    .isNumeric().withMessage('Token must be numeric'),
  handleValidationErrors
];

const validate2FAVerify = [
  body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('token').trim().notEmpty().withMessage('2FA token is required')
    .isLength({ min: 6, max: 6 }).withMessage('Token must be 6 digits')
    .isNumeric().withMessage('Token must be numeric'),
  handleValidationErrors
];

// Notification preferences validation
const validateNotificationPreferences = [
  body('emailNotifications').optional().isBoolean().withMessage('emailNotifications must be a boolean'),
  body('smsNotifications').optional().isBoolean().withMessage('smsNotifications must be a boolean'),
  body('orderUpdates').optional().isBoolean().withMessage('orderUpdates must be a boolean'),
  body('promotions').optional().isBoolean().withMessage('promotions must be a boolean'),
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  validateProduct,
  validateProductCreate,
  validateProductUpdate,
  validateProductQuery,
  validateOrder,
  validateCreateOrder: [
    // ✅ Security Fix #4: Validates idempotency key to prevent double charging
    body('items').isArray({ min: 1, max: 50 }).withMessage('Order must contain 1-50 items'),
    body('items.*.product').isMongoId().withMessage('Invalid product ID'),
    body('items.*').custom((item) => {
      const qty = item.quantity ?? item.qty;
      if (!Number.isInteger(qty) || qty < 1 || qty > 1000) {
        throw new Error('Quantity must be between 1 and 1000');
      }
      return true;
    }),
    body('idempotencyKey')
      .notEmpty().withMessage('Idempotency key is required')
      .isLength({ min: 10, max: 200 }).withMessage('Invalid idempotency key'),
    body('deliveryAddress.name').trim().notEmpty().withMessage('Delivery name is required'),
    body('deliveryAddress.phone').trim().notEmpty().withMessage('Phone number is required')
      .matches(BD_PHONE_REGEX).withMessage('Invalid Bangladesh phone number (e.g. 01XXXXXXXXX)'),
    body('deliveryAddress.street').trim().notEmpty().withMessage('Street address is required'),
    body('deliveryAddress.district').trim().notEmpty().withMessage('District is required'),
    body('paymentMethod').isIn(['cod', 'beftn', 'bkash', 'nagad', 'npsb', 'cheque', 'b2b_credit', 'bank_transfer', 'credit_terms', 'card', 'cash'])
      .withMessage('Invalid payment method'),
    body('deliveryType').optional().isIn(['standard', 'express', 'nationwide', 'cold_chain', 'inside_dhaka', 'dhaka_suburban', 'outside_dhaka'])
      .withMessage('Invalid delivery type'),
    handleValidationErrors
  ],
  validateOrderStatusUpdate,
  validateOrderNote,
  validateRegistration,
  validateLogin,
  validateForgotPassword,
  validateResetPassword,
  validateSendPhoneOTP,
  validateVerifyPhoneOTP,
  validate2FASetup,
  validate2FAEnable,
  validate2FAVerify,
  validateProfileUpdate,
  validatePasswordChange,
  validateNotificationPreferences,
  validatePayment,
  validateReview,
  validateCoupon,
  validateQuote,
  validateMongoId,
  validatePagination
};
