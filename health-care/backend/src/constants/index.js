/**
 * Backend Application Constants
 * Shared constants used across the backend
 */

module.exports = {
  // Order Statuses
  ORDER_STATUSES: [
    'placed',
    'confirmed',
    'processing',
    'shipped',
    'out_for_delivery',
    'delivered',
    'cancelled',
    'returned'
  ],

  // User Roles
  USER_ROLES: {
    CUSTOMER: 'customer',
    B2B: 'b2b_customer',
    ADMIN: 'admin',
    MANAGER: 'manager',
  },

  // Coupon Types
  COUPON_TYPES: {
    PERCENTAGE: 'percentage',
    FIXED: 'fixed',
    BUY_X_GET_Y: 'buy_x_get_y',
  },

  // Payment Methods
  PAYMENT_METHODS: [
    'stripe',
    'bkash',
    'nagad',
    'bank_transfer',
    'b2b_credit',
    'cheque'
  ],

  // B2B Discount Tiers
  B2B_TIERS: {
    silver: { discount: 10 },
    gold: { discount: 22 },
    platinum: { discount: 30 },
  },

  // Pagination
  PAGINATION: {
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100,
  },

  // Cache TTL (Time To Live in seconds)
  CACHE_TTL: {
    SHORT: 120,    // 2 minutes
    MEDIUM: 300,   // 5 minutes
    LONG: 600,     // 10 minutes
    HOUR: 3600,    // 1 hour
    DAY: 86400,    // 24 hours
  },

  // HTTP Status Codes
  HTTP_STATUS: {
    OK: 200,
    CREATED: 201,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    UNPROCESSABLE: 422,
    TOO_MANY_REQUESTS: 429,
    SERVER_ERROR: 500,
    SERVICE_UNAVAILABLE: 503,
  },

  // Activity Log Actions
  ACTIVITY_ACTIONS: {
    CREATE: 'create',
    UPDATE: 'update',
    DELETE: 'delete',
    LOGIN: 'login',
    LOGOUT: 'logout',
    VIEW: 'view',
    EXPORT: 'export',
  },

  // File Upload Limits
  UPLOAD_LIMITS: {
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
    MAX_FILES: 10,
    ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  },
};
