const express = require('express');
const router = express.Router();
const newsletterController = require('../controllers/newsletterController');
const { protect, adminOnly } = require('../middleware/auth');

// Public routes
router.post('/subscribe', newsletterController.subscribe);
router.get('/unsubscribe', newsletterController.unsubscribe);

// Admin routes
router.get('/subscribers', protect, adminOnly, newsletterController.getSubscribers);
router.delete('/subscribers/:id', protect, adminOnly, newsletterController.deleteSubscriber);
router.post('/broadcast', protect, adminOnly, newsletterController.broadcast);
router.get('/stats', protect, adminOnly, newsletterController.getStats);

module.exports = router;
