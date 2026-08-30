// Frontend configuration constants

export const TIMEOUTS = {
  API_REQUEST: 60000, // 60 seconds — generous enough for Render dyno warm-up & network variance
  ORDER_CREATION: 90000, // 90 seconds — extended for Render free tier cold start (30-60s)
  PAYMENT_REQUEST: 60000, // 60 seconds — payment gateway processing
  IMAGE_UPLOAD: 120000, // 120 seconds — large file uploads
  AUTH_CHECK: 8000, // 8 seconds
};

export const CART_CONFIG = {
  MAX_ITEMS: 50,
  MAX_QUANTITY_PER_ITEM: 1000,
};

export const PAGINATION = {
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
};

export const CURRENCY = {
  CODE: 'BDT',
  SYMBOL: '৳',
};
