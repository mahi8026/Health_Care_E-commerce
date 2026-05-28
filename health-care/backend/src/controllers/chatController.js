const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const ChatConfig = require('../models/ChatConfig');
const chatSocketService = require('../services/chatSocketService');
const chatRoutingService = require('../services/chatRoutingService');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

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
      return res.status(400).json({
        success: false,
        message: 'Name is required'
      });
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

    res.status(201).json({
      success: true,
      data: conversation
    });
  } catch (error) {
    logger.error(`Error creating conversation: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to create conversation'
    });
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
        .limit(parseInt(limit)),
      Conversation.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: conversations,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error(`Error fetching conversations: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch conversations'
    });
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
      .populate('closedBy', 'name email');

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    // Check access permissions
    if (req.user.role === 'agent' && 
        conversation.assignedTo?._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: conversation
    });
  } catch (error) {
    logger.error(`Error fetching conversation: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch conversation'
    });
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
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    conversation.status = status;
    await conversation.save();

    // Notify via WebSocket
    chatSocketService.io.to(conversation.conversationId).emit('chat:status:changed', {
      conversationId: conversation.conversationId,
      status
    });

    res.json({
      success: true,
      data: conversation
    });
  } catch (error) {
    logger.error(`Error updating conversation status: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to update status'
    });
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
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
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

    res.json({
      success: true,
      data: conversation
    });
  } catch (error) {
    logger.error(`Error closing conversation: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to close conversation'
    });
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
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
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

    res.json({
      success: true,
      data: conversation
    });
  } catch (error) {
    logger.error(`Error transferring conversation: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to transfer conversation'
    });
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
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    conversation.internalNotes.push({
      text,
      addedBy: req.user._id
    });

    await conversation.save();

    res.json({
      success: true,
      data: conversation
    });
  } catch (error) {
    logger.error(`Error adding note: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to add note'
    });
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
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: messages
    });
  } catch (error) {
    logger.error(`Error fetching messages: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch messages'
    });
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
      return res.status(400).json({
        success: false,
        message: 'conversationId and content are required'
      });
    }

    const conversation = await Conversation.findOne({ conversationId });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

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
      content,
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

    res.status(201).json({
      success: true,
      data: message
    });
  } catch (error) {
    logger.error(`Error sending public message: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to send message'
    });
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
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
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

    res.status(201).json({
      success: true,
      data: message
    });
  } catch (error) {
    logger.error(`Error sending message: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to send message'
    });
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
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // File is already uploaded to Cloudinary by multer middleware
    const fileData = {
      fileUrl: req.file.path,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      fileType: req.file.mimetype
    };

    res.json({
      success: true,
      data: fileData
    });
  } catch (error) {
    logger.error(`Error uploading file: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to upload file'
    });
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

    res.json({
      success: true,
      data: {
        overall: stats,
        byAgent: agentStats,
        period: {
          start,
          end
        }
      }
    });
  } catch (error) {
    logger.error(`Error fetching analytics: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics'
    });
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

    res.json({
      success: true,
      data: config
    });
  } catch (error) {
    logger.error(`Error fetching config: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch configuration'
    });
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

    res.json({
      success: true,
      data: config
    });
  } catch (error) {
    logger.error(`Error updating config: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to update configuration'
    });
  }
};
