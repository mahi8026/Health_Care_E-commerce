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

// Public tracking — must be before /:id to avoid conflict
router.get('/track/:orderNumber', trackOrder);

router.post('/', protect, noStore, createOrder);
router.get('/', protect, noStore, getOrders);
router.get('/:id', protect, noStore, getOrder);
router.put('/:id/cancel', protect, noStore, cancelOrder);

// Admin only routes
router.put('/:id/status', protect, authorize('admin'), noStore, updateOrderStatus);
router.patch('/:id/status', protect, authorize('admin'), noStore, updateOrderStatus);
router.patch('/:id/notes', protect, authorize('admin'), noStore, addOrderNote);

module.exports = router;
