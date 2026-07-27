const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const {
  subscribe, unsubscribe, updatePreferences, broadcast, getStats,
} = require('../controllers/pushController');

// Customer routes (optional auth — guests can also subscribe)
router.post('/subscribe',    protect, subscribe);
router.delete('/unsubscribe', unsubscribe);
router.patch('/preferences',  updatePreferences);

// Admin routes
router.post('/admin/broadcast', protect, adminOnly, broadcast);
router.get('/admin/stats',      protect, adminOnly, getStats);

module.exports = router;
