const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const ChatConfig = require('../models/ChatConfig');
const chatSocketService = require('../services/chatSocketService');
const chatRoutingService = require('../services/chatRoutingService');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/responseHelper');

/**
 * @desc    Create a new conversation
 * @route   POST /api/chat/conversations
 * @access  Public
 */
exports.createConversation = async (req, res) => {
  try {
    // Support both flat { name, email } and nested { customer: { name, email } }
    const name = req.body.name || req.body.customer?.name;
    const email = req.body.email || req.body.customer?.email;
    const phone = req.body.phone || req.body.customer?.phone;
    const userId = req.body.userId || req.body.customer?.userId || req.user?._id || null;
    const { metadata, source } = req.body;

    // Validate - only name is required, email is optional for guests
    if (!name) {
      return errorResponse(res, 'Name is required', null, 400);
    }

    // Check if user is authenticated
    const isAuthenticated = !!req.user;

    // Create conversation
    const conversation = await Conversation.create({
      conversationId: uuidv4(),
      customer: {
        userId,
        name,
        email: email || null,
        phone: phone || null,
        isAuthenticated
      },
      metadata: {
        ...metadata,
        source: source || 'website',
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      },
      status: 'waiting',
      channel: 'live_chat'
    });

    // Try to assign to an available agent
    const assignedAgent = await chatRoutingService.assignConversation(conversation);

    if (assignedAgent) {
      conversation.assignedTo = assignedAgent._id;
      conversation.status = 'active';
      await conversation.save();

      // Notify agent via WebSocket
      chatSocketService.sendToUser(assignedAgent._id, 'chat:new:assignment', {
        conversation: conversation.toObject()
      });
    }

    logger.info(`New conversation created: ${conversation.conversationId}`);

    return successResponse(res, conversation, null, 201);
  } catch (error) {
    logger.error(`Error creating conversation: ${error.message}`);
    return errorResponse(res, 'Failed to create conversation', process.env.NODE_ENV === 'development' ? [error.message] : null, 500);
  }
};

/**
 * @desc    Get all conversations
 * @route   GET /api/chat/conversations
 * @access  Private (Admin/Agent)
 */
exports.getConversations = async (req, res) => {
  try {
    const { status, assignedTo, channel, page = 1, limit = 20 } = req.query;

    // Build query
    const query = {};
    if (status) query.status = status;
    if (assignedTo) query.assignedTo = assignedTo;
    if (channel) query.channel = channel;

    // If agent (not admin), only show their conversations
    if (req.user.role === 'agent') {
      query.assignedTo = req.user._id;
    }

    const skip = (page - 1) * limit;

    const [conversations, total] = await Promise.all([
      Conversation.find(query)
        .populate('assignedTo', 'name email')
        .populate('customer.userId', 'name email')
        .sort({ lastMessageAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Conversation.countDocuments(query)
    ]);

    return paginatedResponse(res, conversations, {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: parseInt(page) < Math.ceil(total / limit),
      hasPrev: parseInt(page) > 1
    });
  } catch (error) {
    logger.error(`Error fetching conversations: ${error.message}`);
    return errorResponse(res, 'Failed to fetch conversations', process.env.NODE_ENV === 'development' ? [error.message] : null, 500);
  }
};

/**
 * @desc    Get single conversation
 * @route   GET /api/chat/conversations/:id
 * @access  Private
 */
exports.getConversation = async (req, res) => {
  try {
    const conversation = await Conversation.findOne({
      conversationId: req.params.id
    })
      .populate('assignedTo', 'name email role')
      .populate('customer.userId', 'name email phone role')
      .populate('closedBy', 'name email')
      .lean();

    if (!conversation) {
      return errorResponse(res, 'Conversation not found', null, 404);
    }

    // Check access permissions
    if (req.user.role === 'agent' && 
        conversation.assignedTo?._id.toString() !== req.user._id.toString()) {
      return errorResponse(res, 'Access denied', null, 403);
    }

    return successResponse(res, conversation);
  } catch (error) {
    logger.error(`Error fetching conversation: ${error.message}`);
    return errorResponse(res, 'Failed to fetch conversation', process.env.NODE_ENV === 'development' ? [error.message] : null, 500);
  }
};

/**
 * @desc    Update conversation status
 * @route   PUT /api/chat/conversations/:id/status
 * @access  Private (Admin/Agent)
 */
exports.updateConversationStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const conversation = await Conversation.findOne({
      conversationId: req.params.id
    });

    if (!conversation) {
      return errorResponse(res, 'Conversation not found', null, 404);
    }

    conversation.status = status;
    await conversation.save();

    // Notify via WebSocket
    chatSocketService.io.to(conversation.conversationId).emit('chat:status:changed', {
      conversationId: conversation.conversationId,
      status
    });

    return successResponse(res, conversation);
  } catch (error) {
    logger.error(`Error updating conversation status: ${error.message}`);
    return errorResponse(res, 'Failed to update status', process.env.NODE_ENV === 'development' ? [error.message] : null, 500);
  }
};

/**
 * @desc    Close conversation
 * @route   POST /api/chat/conversations/:id/close
 * @access  Private
 */
exports.closeConversation = async (req, res) => {
  try {
    const { closingNotes, satisfactionScore, satisfactionFeedback } = req.body;

    const conversation = await Conversation.findOne({
      conversationId: req.params.id
    });

    if (!conversation) {
      return errorResponse(res, 'Conversation not found', null, 404);
    }

    conversation.status = 'closed';
    conversation.closedAt = new Date();
    conversation.closedBy = req.user._id;
    conversation.closingNotes = closingNotes || '';
    
    if (satisfactionScore) {
      conversation.satisfactionScore = satisfactionScore;
      conversation.satisfactionFeedback = satisfactionFeedback || '';
    }

    await conversation.save();

    // Notify via WebSocket
    chatSocketService.io.to(conversation.conversationId).emit('chat:conversation:closed', {
      conversationId: conversation.conversationId,
      closedAt: conversation.closedAt
    });

    return successResponse(res, conversation);
  } catch (error) {
    logger.error(`Error closing conversation: ${error.message}`);
    return errorResponse(res, 'Failed to close conversation', process.env.NODE_ENV === 'development' ? [error.message] : null, 500);
  }
};

/**
 * @desc    Transfer conversation to another agent
 * @route   POST /api/chat/conversations/:id/transfer
 * @access  Private (Admin/Agent)
 */
exports.transferConversation = async (req, res) => {
  try {
    const { toAgentId, reason } = req.body;

    const conversation = await Conversation.findOne({
      conversationId: req.params.id
    });

    if (!conversation) {
      return errorResponse(res, 'Conversation not found', null, 404);
    }

    // Add to transfer history
    conversation.transferHistory.push({
      from: conversation.assignedTo,
      to: toAgentId,
      reason: reason || 'No reason provided'
    });

    conversation.assignedTo = toAgentId;
    await conversation.save();

    // Notify both agents via WebSocket
    chatSocketService.sendToUser(toAgentId, 'chat:new:assignment', {
      conversation: conversation.toObject()
    });

    chatSocketService.io.to(conversation.conversationId).emit('chat:transferred', {
      conversationId: conversation.conversationId,
      newAgentId: toAgentId
    });

    return successResponse(res, conversation);
  } catch (error) {
    logger.error(`Error transferring conversation: ${error.message}`);
    return errorResponse(res, 'Failed to transfer conversation', process.env.NODE_ENV === 'development' ? [error.message] : null, 500);
  }
};

/**
 * @desc    Add internal note
 * @route   POST /api/chat/conversations/:id/notes
 * @access  Private (Admin/Agent)
 */
exports.addInternalNote = async (req, res) => {
  try {
    const { text } = req.body;

    const conversation = await Conversation.findOne({
      conversationId: req.params.id
    });

    if (!conversation) {
      return errorResponse(res, 'Conversation not found', null, 404);
    }

    conversation.internalNotes.push({
      text,
      addedBy: req.user._id
    });

    await conversation.save();

    return successResponse(res, conversation);
  } catch (error) {
    logger.error(`Error adding note: ${error.message}`);
    return errorResponse(res, 'Failed to add note', process.env.NODE_ENV === 'development' ? [error.message] : null, 500);
  }
};

/**
 * @desc    Get conversation messages (public - by conversationId)
 * @route   GET /api/chat/messages/:conversationId
 * @access  Public
 */
exports.getConversationMessages = async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    const conversationId = req.params.id || req.params.conversationId;

    const messages = await Message.find({ conversationId })
      .sort({ createdAt: 1 })
      .limit(parseInt(limit))
      .lean();

    return successResponse(res, messages);
  } catch (error) {
    logger.error(`Error fetching messages: ${error.message}`);
    return errorResponse(res, 'Failed to fetch messages', process.env.NODE_ENV === 'development' ? [error.message] : null, 500);
  }
};

/**
 * @desc    Send message publicly (no auth required for customers)
 * @route   POST /api/chat/messages
 * @access  Public
 */
exports.sendPublicMessage = async (req, res) => {
  try {
    const { conversationId, content, messageType = 'text', sender } = req.body;

    if (!conversationId || !content) {
      return errorResponse(res, 'conversationId and content are required', null, 400);
    }

    const conversation = await Conversation.findOne({ conversationId });

    if (!conversation) {
      return errorResponse(res, 'Conversation not found', null, 404);
    }

    // Build content object based on message type
    const contentObj = messageType === 'text'
      ? { text: typeof content === 'string' ? content : content.text }
      : { fileUrl: content.fileUrl || content, fileName: content.fileName, fileSize: content.fileSize };

    const message = await Message.create({
      messageId: uuidv4(),
      conversationId,
      conversation: conversation._id,
      sender: {
        userId: sender?.userId || null,
        name: sender?.name || conversation.customer.name || 'Guest',
        type: sender?.type || 'customer'
      },
      messageType,
      content: contentObj,
      status: 'sent',
      deliveredAt: new Date()
    });

    // Update conversation
    conversation.messageCount += 1;
    conversation.lastMessageAt = new Date();
    await conversation.save();

    // Broadcast via WebSocket if available
    try {
      if (chatSocketService.io) {
        chatSocketService.io.to(conversationId).emit('chat:message', {
          message: message.toObject()
        });
      }
    } catch (e) {
      // Silent fail - WebSocket is optional
    }

    return successResponse(res, message, null, 201);
  } catch (error) {
    logger.error(`Error sending public message: ${error.message}`);
    return errorResponse(res, 'Failed to send message', process.env.NODE_ENV === 'development' ? [error.message] : null, 500);
  }
};

/**
 * @desc    Send message (fallback for non-WebSocket)
 * @route   POST /api/chat/conversations/:id/messages
 * @access  Private
 */
exports.sendMessage = async (req, res) => {
  try {
    const { content, messageType = 'text' } = req.body;

    const conversation = await Conversation.findOne({
      conversationId: req.params.id
    });

    if (!conversation) {
      return errorResponse(res, 'Conversation not found', null, 404);
    }

    const message = await Message.create({
      messageId: uuidv4(),
      conversationId: conversation.conversationId,
      conversation: conversation._id,
      sender: {
        userId: req.user._id,
        name: req.user.name,
        type: req.user.role === 'admin' || req.user.role === 'agent' ? 'agent' : 'customer'
      },
      messageType,
      content,
      status: 'sent',
      deliveredAt: new Date()
    });

    // Update conversation
    conversation.messageCount += 1;
    conversation.lastMessageAt = new Date();
    await conversation.save();

    // Broadcast via WebSocket
    chatSocketService.io.to(conversation.conversationId).emit('chat:message', {
      message: message.toObject()
    });

    return successResponse(res, message, null, 201);
  } catch (error) {
    logger.error(`Error sending message: ${error.message}`);
    return errorResponse(res, 'Failed to send message', process.env.NODE_ENV === 'development' ? [error.message] : null, 500);
  }
};

/**
 * @desc    Upload chat file
 * @route   POST /api/chat/upload
 * @access  Private
 */
exports.uploadChatFile = async (req, res) => {
  try {
    if (!req.file) {
      return errorResponse(res, 'No file uploaded', null, 400);
    }

    // File is already uploaded to Cloudinary by multer middleware
    const fileData = {
      fileUrl: req.file.path,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      fileType: req.file.mimetype
    };

    return successResponse(res, fileData);
  } catch (error) {
    logger.error(`Error uploading file: ${error.message}`);
    return errorResponse(res, 'Failed to upload file', process.env.NODE_ENV === 'development' ? [error.message] : null, 500);
  }
};

/**
 * @desc    Get chat analytics
 * @route   GET /api/chat/analytics
 * @access  Private (Admin)
 */
exports.getAnalytics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    const stats = await Conversation.getStatistics(start, end);

    // Get agent statistics
    const agentStats = await Conversation.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
          assignedTo: { $ne: null }
        }
      },
      {
        $group: {
          _id: '$assignedTo',
          conversationCount: { $sum: 1 },
          avgSatisfactionScore: { $avg: '$satisfactionScore' },
          totalMessages: { $sum: '$messageCount' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'agent'
        }
      },
      {
        $unwind: '$agent'
      },
      {
        $project: {
          agentId: '$_id',
          agentName: '$agent.name',
          conversationCount: 1,
          avgSatisfactionScore: 1,
          totalMessages: 1
        }
      }
    ]);

    return successResponse(res, {
      overall: stats,
      byAgent: agentStats,
      period: {
        start,
        end
      }
    });
  } catch (error) {
    logger.error(`Error fetching analytics: ${error.message}`);
    return errorResponse(res, 'Failed to fetch analytics', process.env.NODE_ENV === 'development' ? [error.message] : null, 500);
  }
};

/**
 * @desc    Get chat configuration
 * @route   GET /api/chat/config
 * @access  Public
 */
exports.getChatConfig = async (req, res) => {
  try {
    const config = await ChatConfig.getActiveConfig();

    return successResponse(res, config);
  } catch (error) {
    logger.error(`Error fetching config: ${error.message}`);
    return errorResponse(res, 'Failed to fetch configuration', process.env.NODE_ENV === 'development' ? [error.message] : null, 500);
  }
};

/**
 * @desc    Update chat configuration
 * @route   PUT /api/chat/config
 * @access  Private (Admin)
 */
exports.updateChatConfig = async (req, res) => {
  try {
    let config = await ChatConfig.getActiveConfig();

    // Update fields
    Object.keys(req.body).forEach(key => {
      if (req.body[key] !== undefined) {
        config[key] = req.body[key];
      }
    });

    config.lastModifiedBy = req.user._id;
    await config.save();

    return successResponse(res, config);
  } catch (error) {
    logger.error(`Error updating config: ${error.message}`);
    return errorResponse(res, 'Failed to update configuration', process.env.NODE_ENV === 'development' ? [error.message] : null, 500);
  }
};
