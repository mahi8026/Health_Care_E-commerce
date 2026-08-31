/**
 * API Configuration and Endpoints
 * Centralized API URL management
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export const API = API_BASE;

// Contact Information
export const CONTACT = {
  // WhatsApp Business Number (without + or spaces)
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '8801646886795',
  phone: '+880 1646-886795',
  email: 'mediportbdofficial@gmail.com',
  supportEmail: 'mediportbdofficial@gmail.com',
};

export const ENDPOINTS = {
  // Auth
  login: `${API_BASE}/auth/login`,
  register: `${API_BASE}/auth/register`,
  logout: `${API_BASE}/auth/logout`,
  me: `${API_BASE}/auth/me`,
  forgotPassword: `${API_BASE}/auth/forgot-password`,
  resetPassword: `${API_BASE}/auth/reset-password`,
  verifyOTP: `${API_BASE}/auth/verify-otp`,
  
  // Products
  products: `${API_BASE}/products`,
  featuredProducts: `${API_BASE}/products/featured`,
  categoryCounts: `${API_BASE}/products/category-counts`,
  
  // Categories & Manufacturers
  categories: `${API_BASE}/categories`,
  manufacturers: `${API_BASE}/manufacturers`,
  
  // Orders
  orders: `${API_BASE}/orders`,
  
  // Cart & Wishlist
  cart: `${API_BASE}/cart`,
  wishlist: `${API_BASE}/wishlist`,
  
  // Reviews
  reviews: `${API_BASE}/reviews`,
  
  // Coupons
  coupons: `${API_BASE}/coupons`,
  activePromo: `${API_BASE}/coupons/active-promo`,
  validateCoupon: `${API_BASE}/coupons/validate`,
  
  // Newsletter
  newsletter: `${API_BASE}/newsletter`,
  
  // Payments
  payments: `${API_BASE}/payments`,
  
  // Stats
  stats: `${API_BASE}/stats`,
  
  // Search
  search: `${API_BASE}/search`,
  trending: `${API_BASE}/search/trending`,
  
  // Admin
  admin: `${API_BASE}/admin`,
  analytics: `${API_BASE}/analytics`,
  activityLogs: `${API_BASE}/activity-logs`,
  
  // Settings
  settings: `${API_BASE}/settings`,
  
  // Returns
  returns: `${API_BASE}/returns`,
  
  // Quotes
  quotes: `${API_BASE}/quotes`,
};

export default API_BASE;
