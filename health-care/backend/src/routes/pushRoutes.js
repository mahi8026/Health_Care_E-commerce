const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const {
  subscribe, unsubscribe, updatePreferences, broadcast, sendToUser, getStats,
} = require('../controllers/pushController');

// Customer routes (optional auth — guests can also subscribe)
router.post('/subscribe',    subscribe);  // No auth required - guests can subscribe
router.delete('/unsubscribe', unsubscribe);
router.patch('/preferences',  updatePreferences);

// Admin routes
router.post('/admin/broadcast',   protect, adminOnly, broadcast);
router.post('/admin/send-to-user', protect, adminOnly, sendToUser);
router.get('/admin/stats',        protect, adminOnly, getStats);

module.exports = router;
