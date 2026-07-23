const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const analyticsController = require('../controllers/analyticsController');
const { noStore } = require('../middleware/cache');

/**
 * In-memory store for Web Vitals metrics.
 * A lightweight alternative to a full Mongoose model for browser-reported CWV data.
 * Requirements: 10.2
 */
const webVitalsStore = [];

const VALID_METRICS = ['LCP', 'INP', 'CLS', 'FCP', 'TTFB'];

/**
 * POST /api/analytics/web-vitals
 * Public endpoint — called from the browser to report Core Web Vitals.
 * No authentication required.
 * Requirements: 10.2
 */
router.post('/web-vitals', noStore, (req, res) => {
  const { metric, value, path, timestamp } = req.body;

  // Validate metric name
  if (!metric || !VALID_METRICS.includes(metric)) {
    return res.status(400).json({
      success: false,
      message: `metric must be one of: ${VALID_METRICS.join(', ')}`
    });
  }

  // Validate value is a finite number
  if (typeof value !== 'number' || !isFinite(value)) {
    return res.status(400).json({
      success: false,
      message: 'value must be a number'
    });
  }

  const entry = {
    metric,
    value,
    path: path || '/',
    timestamp: timestamp || new Date().toISOString(),
    receivedAt: new Date().toISOString()
  };

  webVitalsStore.push(entry);

  // Keep the in-memory store bounded to the last 1000 entries
  if (webVitalsStore.length > 1000) {
    webVitalsStore.shift();
  }

  return res.status(201).json({
    success: true,
    message: 'Web Vitals metric recorded'
  });
});

// All routes below require authentication and admin/manager role
router.use(protect);
router.use(authorize('admin', 'manager'));

// Sales analytics endpoint
router.get('/sales', analyticsController.getSalesAnalytics);

// Order analytics endpoint
router.get('/orders', analyticsController.getOrderAnalytics);

// Product analytics endpoint
router.get('/products', analyticsController.getProductAnalytics);

// Customer analytics endpoint
router.get('/customers', analyticsController.getCustomerAnalytics);

// Payment analytics endpoint
router.get('/payments', analyticsController.getPaymentAnalytics);

// Real-time metrics endpoint
router.get('/realtime', analyticsController.getRealTimeMetrics);

// Traffic analytics endpoint
router.get('/traffic', analyticsController.getTrafficAnalytics);

module.exports = router;
