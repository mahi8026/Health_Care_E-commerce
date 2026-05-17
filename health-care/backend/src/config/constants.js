// Application-wide constants

// Cart configuration
const CART_CONFIG = {
  MAX_ITEMS: parseInt(process.env.MAX_CART_ITEMS) || 50,
  MAX_QUANTITY_PER_ITEM: parseInt(process.env.MAX_QUANTITY_PER_ITEM) || 1000,
};

// Delivery fees (in BDT)
const DELIVERY_FEES = {
  standard: parseInt(process.env.DELIVERY_FEE_STANDARD) || 150,
  express: parseInt(process.env.DELIVERY_FEE_EXPRESS) || 300,
  nationwide: parseInt(process.env.DELIVERY_FEE_NATIONWIDE) || 200,
  cold_chain: parseInt(process.env.DELIVERY_FEE_COLD_CHAIN) || 500,
};

// B2B configuration
const B2B_CONFIG = {
  DEFAULT_DISCOUNT_PCT: parseInt(process.env.B2B_DEFAULT_DISCOUNT) || 8,
  PAYMENT_TERMS_OPTIONS: [30, 60, 90],
  TIERS: ['Silver', 'Gold', 'Platinum'],
};

// Pagination defaults
const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
};

// File upload limits
const UPLOAD_LIMITS = {
  IMAGE_MAX_SIZE: parseInt(process.env.IMAGE_MAX_SIZE) || 5 * 1024 * 1024, // 5MB
  DOCUMENT_MAX_SIZE: parseInt(process.env.DOCUMENT_MAX_SIZE) || 10 * 1024 * 1024, // 10MB
  MAX_FILES: parseInt(process.env.MAX_FILES_PER_UPLOAD) || 10,
};

// Request timeouts (in milliseconds)
const TIMEOUTS = {
  API_REQUEST: parseInt(process.env.API_TIMEOUT) || 30000, // 30 seconds
  PAYMENT_GATEWAY: parseInt(process.env.PAYMENT_TIMEOUT) || 60000, // 60 seconds
  EMAIL_SEND: parseInt(process.env.EMAIL_TIMEOUT) || 10000, // 10 seconds
  SMS_SEND: parseInt(process.env.SMS_TIMEOUT) || 5000, // 5 seconds
};

// Currency
const CURRENCY = {
  CODE: process.env.CURRENCY_CODE || 'BDT',
  SYMBOL: process.env.CURRENCY_SYMBOL || '৳',
};

// Order status flow
const ORDER_STATUS_FLOW = {
  placed: ['confirmed', 'cancelled'],
  confirmed: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['out_for_delivery', 'delivered'],
  out_for_delivery: ['delivered'],
  delivered: [],
  cancelled: [],
};

// Payment methods
const PAYMENT_METHODS = [
  'beftn',
  'bkash',
  'nagad',
  'npsb',
  'cheque',
  'b2b_credit',
  'bank_transfer',
  'credit_terms',
  'card',
  'cash',
];

// Delivery types
const DELIVERY_TYPES = ['standard', 'express', 'nationwide', 'cold_chain'];

module.exports = {
  CART_CONFIG,
  DELIVERY_FEES,
  B2B_CONFIG,
  PAGINATION,
  UPLOAD_LIMITS,
  TIMEOUTS,
  CURRENCY,
  ORDER_STATUS_FLOW,
  PAYMENT_METHODS,
  DELIVERY_TYPES,
};
