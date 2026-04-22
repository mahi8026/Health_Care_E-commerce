const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getDashboard,
  getAnalytics,
  getCustomers,
  updateCustomer,
  manualStockCheck
} = require('../controllers/adminController');
const {
  getAllQuotes,
  updateQuote,
  convertQuoteToOrder
} = require('../controllers/quoteController');

// All admin routes require authentication + admin role
router.use(protect, authorize('admin'));

router.get('/dashboard', getDashboard);
router.get('/analytics', getAnalytics);
router.get('/customers', getCustomers);
router.patch('/customers/:id', updateCustomer);
router.post('/stock-check', manualStockCheck);

// Quote management
router.get('/quotes', getAllQuotes);
router.patch('/quotes/:id', updateQuote);
router.post('/quotes/:id/convert', convertQuoteToOrder);

module.exports = router;
