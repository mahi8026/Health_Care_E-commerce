const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const { protect, adminOnly } = require('../middleware/auth');
const { cartTrackLimiter } = require('../middleware/rateLimiter');

// ── Public routes ────────────────────────────────────────────────────────────
// Guest cart recovery needs both of these to work without an account, so they
// MUST stay above router.use(protect).
//   POST /track            — persist a guest cart snapshot + checkout email
//   GET  /recovery-optout  — unsubscribe link target from a recovery email
router.post('/track', cartTrackLimiter, cartController.trackGuestCart);
router.get('/recovery-optout', cartController.recoveryOptOut);

// All remaining cart routes require authentication
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
