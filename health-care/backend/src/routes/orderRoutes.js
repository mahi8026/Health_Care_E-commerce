const express = require('express');
const router = express.Router();
const {
  createOrder,
  getOrders,
  getOrder,
  updateOrderStatus,
  cancelOrder,
  addOrderNote
} = require('../controllers/orderController');
const { trackOrder } = require('../controllers/trackingController');
const { protect, authorize } = require('../middleware/auth');
const { noStore } = require('../middleware/cache');
const {
  validateOrder,
  validateOrderStatusUpdate,
  validateOrderNote,
  validateMongoId,
  validatePagination
} = require('../middleware/validation');

// Public tracking — must be before /:id to avoid conflict
router.get('/track/:orderNumber', trackOrder);

router.post('/', protect, noStore, validateOrder, createOrder);
router.get('/', protect, noStore, validatePagination, getOrders);
router.get('/:id', protect, noStore, validateMongoId, getOrder);
router.put('/:id/cancel', protect, noStore, validateMongoId, cancelOrder);

// Admin only routes
router.put('/:id/status', protect, authorize('admin'), noStore, validateOrderStatusUpdate, updateOrderStatus);
router.patch('/:id/status', protect, authorize('admin'), noStore, validateOrderStatusUpdate, updateOrderStatus);
router.patch('/:id/notes', protect, authorize('admin'), noStore, validateOrderNote, addOrderNote);

module.exports = router;
