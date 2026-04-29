const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const { protect, adminOnly } = require('../middleware/auth');

// All cart routes require authentication
router.use(protect);

// User cart routes
router.get('/', cartController.getCart);
router.post('/sync', cartController.syncCart);
router.post('/items', cartController.addItem);
router.put('/items/:productId', cartController.updateItem);
router.delete('/items/:productId', cartController.removeItem);
router.delete('/', cartController.clearCart);
router.post('/recover/:cartId', cartController.recoverCart);

// Admin routes
router.get('/admin/stats', adminOnly, cartController.getAbandonedCartStats);

module.exports = router;
