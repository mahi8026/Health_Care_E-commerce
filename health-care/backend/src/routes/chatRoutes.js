const express = require('express');
const router = express.Router();
const {
  createConversation,
  getConversations,
  getConversation,
  updateConversationStatus,
  closeConversation,
  transferConversation,
  addInternalNote,
  getConversationMessages,
  sendMessage,
  uploadChatFile,
  getAnalytics,
  getChatConfig,
  updateChatConfig
} = require('../controllers/chatController');
const { protect, authorize } = require('../middleware/auth');
const { authLimiter } = require('../middleware/enhancedRateLimiter');
const upload = require('../middleware/upload');

/**
 * @swagger
 * /chat/conversations:
 *   post:
 *     summary: Create a new chat conversation
 *     tags: [Chat]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               metadata:
 *                 type: object
 *     responses:
 *       201:
 *         description: Conversation created successfully
 */
router.post('/conversations', authLimiter, createConversation);

/**
 * @swagger
 * /chat/conversations:
 *   get:
 *     summary: Get all conversations (agents only)
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, waiting, closed, resolved]
 *       - in: query
 *         name: assignedTo
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of conversations
 */
router.get('/conversations', protect, authorize('admin', 'agent'), getConversations);

/**
 * @swagger
 * /chat/conversations/{id}:
 *   get:
 *     summary: Get a single conversation
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Conversation details
 */
router.get('/conversations/:id', protect, getConversation);

/**
 * @swagger
 * /chat/conversations/{id}/status:
 *   put:
 *     summary: Update conversation status
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [active, waiting, closed, resolved]
 *     responses:
 *       200:
 *         description: Status updated successfully
 */
router.put('/conversations/:id/status', protect, authorize('admin', 'agent'), updateConversationStatus);

/**
 * @swagger
 * /chat/conversations/{id}/close:
 *   post:
 *     summary: Close a conversation
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               closingNotes:
 *                 type: string
 *               satisfactionScore:
 *                 type: number
 *     responses:
 *       200:
 *         description: Conversation closed successfully
 */
router.post('/conversations/:id/close', protect, closeConversation);

/**
 * @swagger
 * /chat/conversations/{id}/transfer:
 *   post:
 *     summary: Transfer conversation to another agent
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - toAgentId
 *             properties:
 *               toAgentId:
 *                 type: string
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Conversation transferred successfully
 */
router.post('/conversations/:id/transfer', protect, authorize('admin', 'agent'), transferConversation);

/**
 * @swagger
 * /chat/conversations/{id}/notes:
 *   post:
 *     summary: Add internal note to conversation
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - text
 *             properties:
 *               text:
 *                 type: string
 *     responses:
 *       200:
 *         description: Note added successfully
 */
router.post('/conversations/:id/notes', protect, authorize('admin', 'agent'), addInternalNote);

/**
 * @swagger
 * /chat/conversations/{id}/messages:
 *   get:
 *     summary: Get messages for a conversation
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *     responses:
 *       200:
 *         description: List of messages
 */
router.get('/conversations/:id/messages', protect, getConversationMessages);

/**
 * @swagger
 * /chat/conversations/{id}/messages:
 *   post:
 *     summary: Send a message (fallback for non-WebSocket)
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: object
 *               messageType:
 *                 type: string
 *     responses:
 *       201:
 *         description: Message sent successfully
 */
router.post('/conversations/:id/messages', protect, authLimiter, sendMessage);

/**
 * @swagger
 * /chat/upload:
 *   post:
 *     summary: Upload a file for chat
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               conversationId:
 *                 type: string
 *     responses:
 *       200:
 *         description: File uploaded successfully
 */
router.post('/upload', protect, upload.single('file'), uploadChatFile);

/**
 * @swagger
 * /chat/analytics:
 *   get:
 *     summary: Get chat analytics
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Analytics data
 */
router.get('/analytics', protect, authorize('admin'), getAnalytics);

/**
 * @swagger
 * /chat/config:
 *   get:
 *     summary: Get chat widget configuration
 *     tags: [Chat]
 *     responses:
 *       200:
 *         description: Chat configuration
 */
router.get('/config', getChatConfig);

/**
 * @swagger
 * /chat/config:
 *   put:
 *     summary: Update chat widget configuration
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Configuration updated successfully
 */
router.put('/config', protect, authorize('admin'), updateChatConfig);

module.exports = router;
