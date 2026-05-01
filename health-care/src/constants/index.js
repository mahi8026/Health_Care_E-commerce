/**
 * Application Constants
 * Shared constants used across the frontend
 */

export const ORDER_STATUSES = [
  'placed',
  'confirmed',
  'processing',
  'shipped',
  'out_for_delivery',
  'delivered',
  'cancelled',
  'returned'
];

export const ORDER_STATUS_LABELS = {
  placed: 'Order Placed',
  confirmed: 'Confirmed',
  processing: 'Processing',
  shipped: 'Shipped',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  returned: 'Returned',
};

export const USER_ROLES = {
  customer: 'customer',
  b2b: 'b2b_customer',
  admin: 'admin',
  manager: 'manager',
};

export const COUPON_TYPES = {
  percentage: 'percentage',
  fixed: 'fixed',
  buyXGetY: 'buy_x_get_y',
};

export const PAYMENT_METHODS = [
  'stripe',
  'bkash',
  'nagad',
  'bank_transfer',
  'b2b_credit',
  'cheque'
];

export const PAYMENT_METHOD_LABELS = {
  stripe: 'Credit/Debit Card',
  bkash: 'bKash',
  nagad: 'Nagad',
  bank_transfer: 'Bank Transfer',
  b2b_credit: 'B2B Credit',
  cheque: 'Cheque',
};

export const B2B_TIERS = {
  silver: { discount: 10, minOrder: 0 },
  gold: { discount: 22, minOrder: 100000 },
  platinum: { discount: 30, minOrder: 500000 },
};

export const PAGINATION = {
  defaultLimit: 20,
  maxLimit: 100,
};

export const POPULAR_SEARCHES = [
  'ECG Machine',
  'N95 Mask',
  'HbA1c Kit',
  'Trocar Set',
  'Pulse Oximeter',
  'Centrifuge'
];

export const VAT_RATE = 0.05; // 5%

export const PHONE_REGEX = /^(\+88)?01[3-9]\d{8}$/;

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
