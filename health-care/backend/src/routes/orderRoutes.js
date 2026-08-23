const express = require('express');
const router = express.Router();
const {
  createOrder,
  getOrders,
  getOrder,
  updateOrderStatus,
  verifyOrderPayment,
  cancelOrder,
  addOrderNote,
  sendNotification,
  shipViaSteadfast,
  getSteadfastBalance,
  bulkShipViaSteadfast,
  checkSteadfastFraud,
} = require('../controllers/orderController');
const { trackOrder, steadfastWebhook } = require('../controllers/trackingController');
const { protect, authorize } = require('../middleware/auth');
const { noStore } = require('../middleware/cache');
const { orderLimiter, adminLimiter } = require('../middleware/rateLimiter');
const {
  validateOrderStatusUpdate,
  validateOrderNote,
  validateMongoId,
  validatePagination,
  validateCreateOrder
} = require('../middleware/validation');

// Public tracking — must be before /:id to avoid conflict
router.get('/track/:orderNumber', trackOrder);

// Public SteadFast courier callback (status updates on consignment changes).
// Unauthenticated by design — protected by STEADFAST_WEBHOOK_SECRET when set,
// and the consignment lookup prevents arbitrary order tampering.
router.post('/webhooks/steadfast', noStore, express.json({ limit: '10kb' }), steadfastWebhook);

// GET answers with a liveness confirmation so the endpoint can be verified
// by opening it in a browser; SteadFast itself always POSTs.
router.get('/webhooks/steadfast', noStore, (_req, res) => {
  res.json({ success: true, message: 'SteadFast webhook endpoint is live. Expects POST status updates from the courier.' });
});

// ? Security Enhancement: Add order rate limiter and comprehensive validation
router.post('/', protect, orderLimiter, noStore, validateCreateOrder, createOrder);
router.get('/', protect, noStore, validatePagination, getOrders);
router.get('/:id', protect, noStore, validateMongoId, getOrder);
router.put('/:id/cancel', protect, noStore, validateMongoId, cancelOrder);

// Admin only routes with admin rate limiter — SteadFast must be declared
// before '/:id' to avoid path conflicts
router.get('/steadfast/balance', protect, authorize('admin'), adminLimiter, noStore, getSteadfastBalance);
router.get('/steadfast/fraud/:phone', protect, authorize('admin'), adminLimiter, noStore, checkSteadfastFraud);
router.post('/steadfast/bulk-ship', protect, authorize('admin'), adminLimiter, noStore, bulkShipViaSteadfast);
router.post('/:id/steadfast/ship', protect, authorize('admin'), adminLimiter, noStore, validateMongoId, shipViaSteadfast);
router.put('/:id/status', protect, authorize('admin'), adminLimiter, noStore, validateOrderStatusUpdate, updateOrderStatus);
router.patch('/:id/status', protect, authorize('admin'), adminLimiter, noStore, validateOrderStatusUpdate, updateOrderStatus);
router.patch('/:id/verify-payment', protect, authorize('admin'), adminLimiter, noStore, validateMongoId, verifyOrderPayment);
router.patch('/:id/notes', protect, authorize('admin'), adminLimiter, noStore, validateOrderNote, addOrderNote);
router.post('/:id/notify', protect, authorize('admin'), adminLimiter, noStore, sendNotification);

module.exports = router;
