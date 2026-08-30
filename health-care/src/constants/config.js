// Frontend configuration constants

export const TIMEOUTS = {
  API_REQUEST: 60000, // 60 seconds — generous enough for Render dyno warm-up & network variance
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
