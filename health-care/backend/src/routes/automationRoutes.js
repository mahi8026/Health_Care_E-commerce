/**
 * Automation Routes — consumed by the self-hosted n8n instance only.
 * Auth: X-Automation-Key header (see middleware/automationAuth.js).
 */

const express = require('express');
const router = express.Router();
const { automationAuth } = require('../middleware/automationAuth');
const ctrl = require('../controllers/automationController');

// Every automation endpoint requires the API key
router.use(automationAuth);

router.post('/test', ctrl.testConnection);

router.get('/low-stock', ctrl.getLowStock);
router.get('/abandoned-carts', ctrl.getAbandonedCarts);
router.post('/carts/mark-notified', ctrl.markCartsNotified);
router.get('/customers/segment/:segment', ctrl.getCustomerSegment);
router.post('/customers/apply-segments', ctrl.applySegments);
router.get('/products/:id/recommendations', ctrl.getProductRecommendations);
router.get('/orders/stats', ctrl.getOrderStats);
router.get('/quotes/stale', ctrl.getStaleQuotes);

module.exports = router;
