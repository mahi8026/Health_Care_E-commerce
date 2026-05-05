const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getDashboard,
  getAnalytics,
  getCustomers,
  updateCustomer,
  manualStockCheck,
  getBadges
} = require('../controllers/adminController');
const {
  getAllQuotes,
  updateQuote,
  convertQuoteToOrder
} = require('../controllers/quoteController');
const { adminApiLimiter } = require('../middleware/enhancedRateLimiter');

// All admin routes require authentication + admin role + rate limiting
router.use(protect, authorize('admin'), adminApiLimiter);

router.get('/dashboard', getDashboard);
router.get('/analytics', getAnalytics);
router.get('/badges', getBadges);
router.get('/customers', getCustomers);
router.patch('/customers/:id', updateCustomer);
router.post('/stock-check', manualStockCheck);

// Quote management
router.get('/quotes', getAllQuotes);
router.patch('/quotes/:id', updateQuote);
router.post('/quotes/:id/convert', convertQuoteToOrder);

module.exports = router;
