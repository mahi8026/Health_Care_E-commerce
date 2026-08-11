const express = require('express');
const router = express.Router();
const {
  createOrder,
  getOrders,
  getOrder,
  updateOrderStatus,
  cancelOrder,
  addOrderNote,
  sendNotification,
} = require('../controllers/orderController');
const { trackOrder } = require('../controllers/trackingController');
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

// ✅ Security Enhancement: Add order rate limiter and comprehensive validation
router.post('/', protect, orderLimiter, noStore, validateCreateOrder, createOrder);
router.get('/', protect, noStore, validatePagination, getOrders);
router.get('/:id', protect, noStore, validateMongoId, getOrder);
router.put('/:id/cancel', protect, noStore, validateMongoId, cancelOrder);

// Admin only routes with admin rate limiter
router.put('/:id/status', protect, authorize('admin'), adminLimiter, noStore, validateOrderStatusUpdate, updateOrderStatus);
router.patch('/:id/status', protect, authorize('admin'), adminLimiter, noStore, validateOrderStatusUpdate, updateOrderStatus);
router.patch('/:id/notes', protect, authorize('admin'), adminLimiter, noStore, validateOrderNote, addOrderNote);
router.post('/:id/notify', protect, authorize('admin'), adminLimiter, noStore, sendNotification);

module.exports = router;
