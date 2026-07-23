const express = require('express');
const router = express.Router();
const whatsappController = require('../controllers/whatsappController');
const { protect, authorize } = require('../middleware/auth');

/**
 * WhatsApp Routes
 * Base path: /api/whatsapp
 */

// Webhook routes (public - no auth required)
router.get('/webhook', whatsappController.verifyWebhook);
router.post('/webhook', whatsappController.handleWebhook);

// Protected routes (require authentication)
router.use(protect);

// Send message (admin only)
router.post('/send', authorize('admin', 'manager'), whatsappController.sendMessage);

// Test connection (admin only)
router.post('/test', authorize('admin'), whatsappController.testConnection);

// Conversations
router.get('/conversations', authorize('admin', 'manager', 'support'), whatsappController.getConversations);
router.get('/conversations/:id', authorize('admin', 'manager', 'support'), whatsappController.getConversation);
router.put('/conversations/:id', authorize('admin', 'manager', 'support'), whatsappController.updateConversation);
router.put('/conversations/:id/assign', authorize('admin', 'manager'), whatsappController.assignConversation);
router.put('/conversations/:id/status', authorize('admin', 'manager', 'support'), whatsappController.updateConversationStatus);
router.post('/conversations/:id/notes', authorize('admin', 'manager', 'support'), whatsappController.addNote);

// Analytics (admin only)
router.get('/analytics', authorize('admin', 'manager'), whatsappController.getAnalytics);

module.exports = router;
