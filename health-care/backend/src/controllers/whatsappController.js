const whatsappService = require('../services/whatsappService');
const whatsappBot = require('../services/whatsappBot');
const WhatsAppConversation = require('../models/WhatsAppConversation');
const WhatsAppMessage = require('../models/WhatsAppMessage');
const logger = require('../utils/logger');
const crypto = require('crypto');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/responseHelper');

// S7 — shipped default must never be accepted as a real configuration
const DEFAULT_VERIFY_TOKEN = 'Mediport_whatsapp_verify_token';

function verifyHubSignature(rawBody, appSecret, signatureHeader) {
  const expected = 'sha256=' + crypto.createHmac('sha256', appSecret).update(rawBody).digest('hex');
  if (typeof signatureHeader !== 'string' || signatureHeader.length !== expected.length) {
    return false;
  }
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signatureHeader));
}

function verifyTwilioSignature(req, authToken) {
  const signature = req.headers['x-twilio-signature'];
  if (typeof signature !== 'string') {
    return false;
  }
  const url = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
  const payload = new URLSearchParams(req.body).toString();
  const expected = crypto.createHmac('sha1', authToken).update(url + payload).digest('base64');
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/**
 * @desc    Webhook verification (Meta Cloud API)
 * @route   GET /api/whatsapp/webhook
 * @access  Public
 */
exports.verifyWebhook = async (req, res) => {
  try {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;

    // S7 — if the token is missing or still the shipped default, the webhook is unconfigured
    if (!verifyToken || verifyToken === DEFAULT_VERIFY_TOKEN) {
      return errorResponse(res, 'WhatsApp webhook is not configured', { code: 'WHATSAPP_NOT_CONFIGURED' }, 503);
    }

    if (mode === 'subscribe' && token === verifyToken) {
      logger.info('[WhatsApp] Webhook verified successfully');
      res.status(200).send(challenge);
    } else {
      logger.warn('[WhatsApp] Webhook verification failed');
      return errorResponse(res, 'Verification failed', null, 403);
    }
  } catch (error) {
    logger.error(`[verifyWebhook] ${error.message}`);
    return errorResponse(res, 'Webhook verification error', process.env.ERROR_DETAIL_ENABLED === 'true' ? [error.message] : null, 500);
  }
};

/**
 * @desc    Webhook handler for incoming messages
 * @route   POST /api/whatsapp/webhook
 * @access  Public
 */
exports.handleWebhook = async (req, res) => {
  try {
    const body = req.body;

    // S7 — verify the sender before acknowledging or processing anything
    const isMetaPayload = body?.object === 'whatsapp_business_account';
    const isTwilioPayload = body?.From && body?.Body;

    if (isMetaPayload) {
      const appSecret = process.env.WHATSAPP_APP_SECRET;
      if (!appSecret) {
        return errorResponse(res, 'WhatsApp webhook is not configured', { code: 'WHATSAPP_NOT_CONFIGURED' }, 503);
      }
      const signature = req.headers['x-hub-signature-256'];
      const rawBody = req.rawBody || Buffer.from(JSON.stringify(body));
      if (!verifyHubSignature(rawBody, appSecret, signature)) {
        logger.warn('[WhatsApp] Rejected webhook with invalid signature');
        return errorResponse(res, 'Invalid signature', null, 403);
      }
    } else if (isTwilioPayload) {
      const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
      if (!twilioAuthToken) {
        return errorResponse(res, 'WhatsApp webhook is not configured', { code: 'WHATSAPP_NOT_CONFIGURED' }, 503);
      }
      if (!verifyTwilioSignature(req, twilioAuthToken)) {
        logger.warn('[WhatsApp] Rejected webhook with invalid Twilio signature');
        return errorResponse(res, 'Invalid signature', null, 403);
      }
    } else {
      return errorResponse(res, 'Unrecognized webhook payload', null, 400);
    }

    // Acknowledge receipt immediately
    res.status(200).json({ success: true });

    // Meta Cloud API webhook format
    if (body.object === 'whatsapp_business_account') {
      const entry = body.entry?.[0];
      const changes = entry?.changes?.[0];
      const value = changes?.value;

      if (!value) {
        logger.warn('[WhatsApp] Invalid webhook payload');
        return;
      }

      // Handle messages
      if (value.messages && value.messages.length > 0) {
        for (const message of value.messages) {
          await processIncomingMessage(message, value.metadata);
        }
      }

      // Handle status updates
      if (value.statuses && value.statuses.length > 0) {
        for (const status of value.statuses) {
          await processStatusUpdate(status);
        }
      }
    } else if (req.body.From && req.body.Body) {
      // Twilio webhook format
      await processTwilioMessage(req.body);
    }
  } catch (error) {
    logger.error(`[handleWebhook] ${error.message}`);
  }
};

/**
 * Process incoming message from Meta Cloud API
 */
async function processIncomingMessage(message, _metadata) {
  try {
    const from = message.from;
    const messageId = message.id;

    let text = '';
    const type = message.type;
    const content = {};

    // Extract message content based on type
    switch (type) {
      case 'text':
        text = message.text.body;
        break;
      case 'button':
        text = message.button.text;
        content.buttonId = message.button.payload;
        break;
      case 'interactive':
        if (message.interactive.type === 'button_reply') {
          text = message.interactive.button_reply.title;
          content.buttonId = message.interactive.button_reply.id;
        } else if (message.interactive.type === 'list_reply') {
          text = message.interactive.list_reply.title;
          content.listId = message.interactive.list_reply.id;
        }
        break;
      case 'image':
        text = message.image.caption || '[Image]';
        content.mediaId = message.image.id;
        content.mimeType = message.image.mime_type;
        break;
      case 'document':
        text = message.document.caption || message.document.filename || '[Document]';
        content.mediaId = message.document.id;
        content.mimeType = message.document.mime_type;
        content.filename = message.document.filename;
        break;
      case 'audio':
        text = '[Audio]';
        content.mediaId = message.audio.id;
        content.mimeType = message.audio.mime_type;
        break;
      case 'video':
        text = message.video.caption || '[Video]';
        content.mediaId = message.video.id;
        content.mimeType = message.video.mime_type;
        break;
      case 'location':
        text = '[Location]';
        content.latitude = message.location.latitude;
        content.longitude = message.location.longitude;
        content.locationName = message.location.name;
        content.locationAddress = message.location.address;
        break;
      default:
        text = `[Unsupported message type: ${type}]`;
    }

    logger.info(`[WhatsApp] Received ${type} message from ${from}: ${text}`);

    // Save message to database
    await whatsappService.saveInboundMessage(from, text, messageId, type, content);

    // Mark as read
    await whatsappService.markAsRead(messageId);

    // Process with bot (only for text messages)
    if (type === 'text' || type === 'button' || type === 'interactive') {
      await whatsappBot.processMessage(from, text, messageId);
    }
  } catch (error) {
    logger.error(`[processIncomingMessage] ${error.message}`);
  }
}

/**
 * Process status update from Meta Cloud API
 */
async function processStatusUpdate(status) {
  try {
    const messageId = status.id;
    const newStatus = status.status; // sent, delivered, read, failed

    logger.info(`[WhatsApp] Status update for ${messageId}: ${newStatus}`);

    // Update message status in database
    const updateData = { status: newStatus };

    if (newStatus === 'delivered') {
      updateData.deliveredAt = new Date(status.timestamp * 1000);
    } else if (newStatus === 'read') {
      updateData.readAt = new Date(status.timestamp * 1000);
    } else if (newStatus === 'failed') {
      updateData.errorCode = status.errors?.[0]?.code;
      updateData.errorMessage = status.errors?.[0]?.title;
    }

    await WhatsAppMessage.findOneAndUpdate({ messageId }, updateData);
  } catch (error) {
    logger.error(`[processStatusUpdate] ${error.message}`);
  }
}

/**
 * Process incoming message from Twilio
 */
async function processTwilioMessage(body) {
  try {
    const from = body.From.replace('whatsapp:', '');
    const text = body.Body;
    const messageId = body.MessageSid;

    logger.info(`[WhatsApp] Twilio message from ${from}: ${text}`);

    // Save message
    await whatsappService.saveInboundMessage(from, text, messageId);

    // Process with bot
    await whatsappBot.processMessage(from, text, messageId);
  } catch (error) {
    logger.error(`[processTwilioMessage] ${error.message}`);
  }
}

/**
 * @desc    Send WhatsApp message
 * @route   POST /api/whatsapp/send
 * @access  Private/Admin
 */
exports.sendMessage = async (req, res) => {
  try {
    const { to, text, type, options } = req.body;

    if (!to || !text) {
      return errorResponse(res, 'Phone number and message text are required', null, 400);
    }

    const result = await whatsappService.sendMessage(to, text, {
      type: type || 'text',
      isBot: false,
      sentBy: req.user._id,
      ...options
    });

    if (result.success) {
      return successResponse(res, {
        messageId: result.messageId
      }, 'WhatsApp message sent successfully');
    } else {
      return errorResponse(res, result.error || 'Failed to send WhatsApp message', null, 500);
    }
  } catch (error) {
    logger.error(`[sendMessage] ${error.message}`);
    return errorResponse(res, 'Failed to send message', process.env.ERROR_DETAIL_ENABLED === 'true' ? [error.message] : null, 500);
  }
};

/**
 * @desc    Get all conversations
 * @route   GET /api/whatsapp/conversations
 * @access  Private/Admin
 */
exports.getConversations = async (req, res) => {
  try {
    const {
      status,
      category,
      isBot,
      assignedTo,
      page = 1,
      limit = 20,
      search
    } = req.query;

    const query = {};

    if (status) {
query.status = status;
}
    if (category) {
query.category = category;
}
    if (isBot !== undefined) {
query.isBot = isBot === 'true';
}
    if (assignedTo) {
query.assignedTo = assignedTo;
}
    if (search) {
      const escaped = search.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
      query.$or = [
        { phoneNumber: { $regex: escaped, $options: 'i' } },
        { customerName: { $regex: escaped, $options: 'i' } }
      ];
    }

    const conversations = await WhatsAppConversation.find(query)
      .populate('user', 'name email')
      .populate('assignedTo', 'name email')
      .populate('relatedOrder', 'orderNumber status')
      .populate('relatedQuote', 'quoteNumber status')
      .sort({ lastMessageAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await WhatsAppConversation.countDocuments(query);

    return paginatedResponse(res, conversations, {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
      hasNext: parseInt(page) < Math.ceil(total / parseInt(limit)),
      hasPrev: parseInt(page) > 1
    });
  } catch (error) {
    logger.error(`[getConversations] ${error.message}`);
    return errorResponse(res, 'Failed to fetch conversations', process.env.ERROR_DETAIL_ENABLED === 'true' ? [error.message] : null, 500);
  }
};

/**
 * @desc    Get conversation by ID
 * @route   GET /api/whatsapp/conversations/:id
 * @access  Private/Admin
 */
exports.getConversation = async (req, res) => {
  try {
    const conversation = await WhatsAppConversation.findById(req.params.id)
      .populate('user', 'name email phone')
      .populate('assignedTo', 'name email')
      .populate('relatedOrder')
      .populate('relatedQuote')
      .populate('relatedProducts', 'name brand price');

    if (!conversation) {
      return errorResponse(res, 'Conversation not found', null, 404);
    }

    // Get messages
    const messages = await WhatsAppMessage.find({
      conversationId: conversation.conversationId
    })
      .populate('sentBy', 'name email')
      .sort({ createdAt: 1 });

    return successResponse(res, {
      conversation,
      messages
    });
  } catch (error) {
    logger.error(`[getConversation] ${error.message}`);
    return errorResponse(res, 'Failed to fetch conversation', process.env.ERROR_DETAIL_ENABLED === 'true' ? [error.message] : null, 500);
  }
};

/**
 * @desc    Update conversation
 * @route   PUT /api/whatsapp/conversations/:id
 * @access  Private/Admin
 */
exports.updateConversation = async (req, res) => {
  try {
    const { category } = req.body;

    const conversation = await WhatsAppConversation.findById(req.params.id);

    if (!conversation) {
      return errorResponse(res, 'Conversation not found', null, 404);
    }

    if (category) {
      conversation.category = category;
    }

    await conversation.save();

    return successResponse(res, conversation, 'Conversation updated successfully');
  } catch (error) {
    logger.error(`[updateConversation] ${error.message}`);
    return errorResponse(res, 'Failed to update conversation', process.env.ERROR_DETAIL_ENABLED === 'true' ? [error.message] : null, 500);
  }
};

/**
 * @desc    Assign conversation to agent
 * @route   PUT /api/whatsapp/conversations/:id/assign
 * @access  Private/Admin
 */
exports.assignConversation = async (req, res) => {
  try {
    const { userId } = req.body;

    const conversation = await WhatsAppConversation.findById(req.params.id);

    if (!conversation) {
      return errorResponse(res, 'Conversation not found', null, 404);
    }

    await conversation.assignTo(userId);

    return successResponse(res, conversation, 'Conversation assigned successfully');
  } catch (error) {
    logger.error(`[assignConversation] ${error.message}`);
    return errorResponse(res, 'Failed to assign conversation', process.env.ERROR_DETAIL_ENABLED === 'true' ? [error.message] : null, 500);
  }
};

/**
 * @desc    Update conversation status
 * @route   PUT /api/whatsapp/conversations/:id/status
 * @access  Private/Admin
 */
exports.updateConversationStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const conversation = await WhatsAppConversation.findById(req.params.id);

    if (!conversation) {
      return errorResponse(res, 'Conversation not found', null, 404);
    }

    conversation.status = status;

    if (status === 'resolved') {
      conversation.resolvedAt = new Date();
    } else if (status === 'closed') {
      conversation.closedAt = new Date();
    }

    await conversation.save();

    return successResponse(res, conversation, 'Conversation status updated');
  } catch (error) {
    logger.error(`[updateConversationStatus] ${error.message}`);
    return errorResponse(res, 'Failed to update status', process.env.ERROR_DETAIL_ENABLED === 'true' ? [error.message] : null, 500);
  }
};

/**
 * @desc    Add note to conversation
 * @route   POST /api/whatsapp/conversations/:id/notes
 * @access  Private/Admin
 */
exports.addNote = async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return errorResponse(res, 'Note text is required', null, 400);
    }

    const conversation = await WhatsAppConversation.findById(req.params.id);

    if (!conversation) {
      return errorResponse(res, 'Conversation not found', null, 404);
    }

    await conversation.addNote(text, req.user._id);

    return successResponse(res, conversation, 'Note added successfully');
  } catch (error) {
    logger.error(`[addNote] ${error.message}`);
    return errorResponse(res, 'Failed to add note', process.env.ERROR_DETAIL_ENABLED === 'true' ? [error.message] : null, 500);
  }
};

/**
 * @desc    Get WhatsApp analytics
 * @route   GET /api/whatsapp/analytics
 * @access  Private/Admin
 */
exports.getAnalytics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const dateFilter = {};
    if (startDate) {
dateFilter.$gte = new Date(startDate);
}
    if (endDate) {
dateFilter.$lte = new Date(endDate);
}

    const query = Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {};

    // Total conversations
    const totalConversations = await WhatsAppConversation.countDocuments(query);

    // Conversations by status
    const byStatus = await WhatsAppConversation.aggregate([
      { $match: query },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // Conversations by category
    const byCategory = await WhatsAppConversation.aggregate([
      { $match: query },
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);

    // Bot vs Human
    const botVsHuman = await WhatsAppConversation.aggregate([
      { $match: query },
      { $group: { _id: '$isBot', count: { $sum: 1 } } }
    ]);

    // Total messages
    const totalMessages = await WhatsAppMessage.countDocuments(query);

    // Messages by direction
    const messagesByDirection = await WhatsAppMessage.aggregate([
      { $match: query },
      { $group: { _id: '$direction', count: { $sum: 1 } } }
    ]);

    // Average response time
    const avgResponseTime = await WhatsAppConversation.aggregate([
      { $match: { ...query, responseTime: { $gt: 0 } } },
      { $group: { _id: null, avg: { $avg: '$responseTime' } } }
    ]);

    return successResponse(res, {
      totalConversations,
      byStatus,
      byCategory,
      botVsHuman,
      totalMessages,
      messagesByDirection,
      avgResponseTime: avgResponseTime[0]?.avg || 0
    });
  } catch (error) {
    logger.error(`[getAnalytics] ${error.message}`);
    return errorResponse(res, 'Failed to fetch analytics', process.env.ERROR_DETAIL_ENABLED === 'true' ? [error.message] : null, 500);
  }
};

/**
 * @desc    Test WhatsApp connection
 * @route   POST /api/whatsapp/test
 * @access  Private/Admin
 */
exports.testConnection = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return errorResponse(res, 'Phone number is required', null, 400);
    }

    const message = `🧪 *Test Message from MediportBD*

This is a test message to verify your WhatsApp integration is working correctly.

Sent at: ${new Date().toLocaleString('en-BD')}

If you received this, your WhatsApp automation is ready! 🎉`;

    const result = await whatsappService.sendMessage(phone, message, {
      isBot: false,
      sentBy: req.user._id
    });

    if (result.success) {
      return successResponse(res, {
        messageId: result.messageId
      }, 'Test message sent successfully');
    } else {
      return errorResponse(res, result.error || 'Failed to send test message', null, 500);
    }
  } catch (error) {
    logger.error(`[testConnection] ${error.message}`);
    return errorResponse(res, 'Failed to test connection', process.env.ERROR_DETAIL_ENABLED === 'true' ? [error.message] : null, 500);
  }
};

module.exports = exports;
