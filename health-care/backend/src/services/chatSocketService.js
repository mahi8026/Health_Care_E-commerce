const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

class ChatSocketService {
  constructor() {
    this.io = null;
    this.connectedClients = new Map(); // socketId -> { userId, conversationId, userType }
    this.agentStatus = new Map(); // userId -> { status, socketId, lastActivity }
    this.typingUsers = new Map(); // conversationId -> Set of userIds
  }

  /**
   * S3/S4 — membership check for HTTP + socket chat access.
   * Staff: admins unrestricted; agents only when assigned.
   * Customers: only their own conversation. Guest-created rooms (no linked
   * customer.userId) remain accessible anonymously by design — conversationId
   * is an unguessable UUID v4, which is the shared secret in that flow.
   */
  canAccessConversation(conversation, reqOrSocket) {
    const userId = reqOrSocket.userId;
    const role = reqOrSocket.userRole || reqOrSocket.role || null;

    if (role === 'admin') return true;
    if (role === 'agent') {
      const assigned = conversation.assignedTo;
      const assignedId = assigned?._id ? String(assigned._id) : (assigned ? String(assigned) : null);
      return !!assignedId && assignedId === String(userId);
    }
    if (userId) {
      const owner = conversation.customer?.userId;
      const ownerId = owner?._id ? String(owner._id) : (owner ? String(owner) : null);
      return !!ownerId && ownerId === String(userId);
    }
    // anonymous (guest widget) — only rooms without a registered owner
    return !conversation.customer?.userId;
  }

  isStaffSocket(socket) {
    return socket.userType === 'agent';
  }

  /**
   * S3 — strip internal-only fields before returning a conversation to a
   * customer (works on both Mongoose docs and lean objects).
   */
  sanitizeForCustomer(conversation) {
    const doc = typeof conversation.toObject === 'function' ? conversation.toObject() : { ...conversation };
    delete doc.internalNotes;
    delete doc.internalNotesHistory;
    if (doc.metadata) {
      delete doc.metadata.ip;
      delete doc.metadata.userAgent;
    }
    return doc;
  }

  /**
   * Initialize Socket.IO server
   * @param {Object} httpServer - HTTP server instance
   */
  initialize(httpServer) {
    // CORS configuration for Socket.IO
    const allowedOrigins = [
      process.env.FRONTEND_URL,
      'http://localhost:3000',
      'http://localhost:3001',
      'https://health-care-e-commerce-murex.vercel.app'
    ].filter(Boolean);

    this.io = new Server(httpServer, {
      cors: {
        origin: (origin, callback) => {
          // Allow Vercel preview URLs
          if (origin && origin.includes('.vercel.app')) {
            return callback(null, true);
          }
          // Allow configured origins
          if (!origin || allowedOrigins.includes(origin)) {
            return callback(null, true);
          }
          callback(new Error('Not allowed by CORS'));
        },
        methods: ['GET', 'POST'],
        credentials: true
      },
      pingTimeout: 60000,
      pingInterval: 25000
    });

    // Authentication middleware
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        
        if (token) {
          // Verify JWT token for authenticated users
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          socket.userId = decoded.id;
          socket.userRole = decoded.role || 'customer';
          socket.userType = decoded.role === 'admin' || decoded.role === 'agent' ? 'agent' : 'customer';
        } else {
          // Allow anonymous connections for customers
          socket.userId = null;
          socket.userRole = null;
          socket.userType = 'customer';
        }
        
        next();
      } catch (error) {
        logger.error(`Socket authentication error: ${error.message}`);
        next(new Error('Authentication failed'));
      }
    });

    // Connection handler
    this.io.on('connection', (socket) => {
      this.handleConnection(socket);
    });

    logger.info('✅ Socket.IO server initialized');
  }

  /**
   * Handle new socket connection
   * @param {Object} socket - Socket instance
   */
  handleConnection(socket) {
    logger.info(`New socket connection: ${socket.id} (${socket.userType})`);

    // Store connection info
    this.connectedClients.set(socket.id, {
      userId: socket.userId,
      userType: socket.userType,
      connectedAt: new Date()
    });

    // Register event handlers
    socket.on('chat:join', (data) => this.handleJoinConversation(socket, data));
    socket.on('chat:message', (data) => this.handleSendMessage(socket, data));
    socket.on('chat:typing:start', (data) => this.handleTypingStart(socket, data));
    socket.on('chat:typing:stop', (data) => this.handleTypingStop(socket, data));
    socket.on('chat:read', (data) => this.handleMarkAsRead(socket, data));
    socket.on('chat:close', (data) => this.handleCloseConversation(socket, data));
    socket.on('agent:status', (data) => this.handleAgentStatus(socket, data));
    socket.on('disconnect', () => this.handleDisconnect(socket));

    // Send connection acknowledgment
    socket.emit('chat:connected', {
      socketId: socket.id,
      userId: socket.userId,
      userType: socket.userType
    });
  }

  /**
   * Handle joining a conversation
   * @param {Object} socket - Socket instance
   * @param {Object} data - { conversationId }
   */
  async handleJoinConversation(socket, data) {
    try {
      const { conversationId } = data;

      // Verify conversation exists
      const conversation = await Conversation.findOne({ conversationId });
      if (!conversation) {
        socket.emit('chat:error', { message: 'Conversation not found' });
        return;
      }

      // S3/S4 — membership check before joining the room
      if (!this.canAccessConversation(conversation, socket)) {
        logger.warn(`[chat] join denied: socket=${socket.id} conv=${conversationId}`);
        socket.emit('chat:error', { message: 'Access denied' });
        return;
      }

      // Join conversation room
      socket.join(conversationId);
      
      // Update client info
      const clientInfo = this.connectedClients.get(socket.id);
      if (clientInfo) {
        clientInfo.conversationId = conversationId;
      }

      // Load recent messages
      const messages = await Message.findByConversation(conversationId, 50);

      socket.emit('chat:joined', {
        conversationId,
        // S3 — never leak internal notes / IP metadata to customers
        conversation: this.isStaffSocket(socket) ? conversation : this.sanitizeForCustomer(conversation),
        messages
      });

      // Notify other participants
      socket.to(conversationId).emit('chat:participant:joined', {
        userId: socket.userId,
        userType: socket.userType
      });

      logger.info(`Socket ${socket.id} joined conversation ${conversationId}`);
    } catch (error) {
      logger.error(`Error joining conversation: ${error.message}`);
      socket.emit('chat:error', { message: 'Failed to join conversation' });
    }
  }

  /**
   * Handle sending a message
   * @param {Object} socket - Socket instance
   * @param {Object} data - { conversationId, content, messageType }
   */
  async handleSendMessage(socket, data) {
    try {
      const { conversationId, content, messageType = 'text' } = data;

      // Verify conversation exists
      const conversation = await Conversation.findOne({ conversationId });
      if (!conversation) {
        socket.emit('chat:error', { message: 'Conversation not found' });
        return;
      }

      // S4 — same membership rule as join: no cross-room writes
      if (!this.canAccessConversation(conversation, socket)) {
        socket.emit('chat:error', { message: 'Access denied' });
        return;
      }

      // Get sender info
      const clientInfo = this.connectedClients.get(socket.id);
      const senderName = clientInfo.userType === 'agent' 
        ? 'Support Agent' 
        : conversation.customer.name;

      // Create message
      const message = await Message.create({
        messageId: uuidv4(),
        conversationId,
        conversation: conversation._id,
        sender: {
          userId: socket.userId,
          name: senderName,
          type: clientInfo.userType
        },
        messageType,
        content,
        status: 'sent',
        deliveredAt: new Date()
      });

      // Update conversation
      conversation.messageCount += 1;
      conversation.lastMessageAt = new Date();
      
      // Set first response time if this is agent's first message
      if (clientInfo.userType === 'agent' && !conversation.firstResponseAt) {
        conversation.firstResponseAt = new Date();
      }
      
      await conversation.save();

      // Broadcast message to all participants in the conversation
      this.io.to(conversationId).emit('chat:message', {
        message: message.toObject(),
        conversation: {
          messageCount: conversation.messageCount,
          lastMessageAt: conversation.lastMessageAt
        }
      });

      logger.info(`Message sent in conversation ${conversationId} by ${clientInfo.userType}`);
    } catch (error) {
      logger.error(`Error sending message: ${error.message}`);
      socket.emit('chat:error', { message: 'Failed to send message' });
    }
  }

  /**
   * Handle typing indicator start
   * @param {Object} socket - Socket instance
   * @param {Object} data - { conversationId }
   */
  handleTypingStart(socket, data) {
    const { conversationId } = data;
    const clientInfo = this.connectedClients.get(socket.id);

    if (!this.typingUsers.has(conversationId)) {
      this.typingUsers.set(conversationId, new Set());
    }

    this.typingUsers.get(conversationId).add(socket.userId || socket.id);

    // Broadcast to other participants
    socket.to(conversationId).emit('chat:typing', {
      userId: socket.userId,
      userType: clientInfo.userType,
      isTyping: true
    });
  }

  /**
   * Handle typing indicator stop
   * @param {Object} socket - Socket instance
   * @param {Object} data - { conversationId }
   */
  handleTypingStop(socket, data) {
    const { conversationId } = data;
    const clientInfo = this.connectedClients.get(socket.id);

    if (this.typingUsers.has(conversationId)) {
      this.typingUsers.get(conversationId).delete(socket.userId || socket.id);
    }

    // Broadcast to other participants
    socket.to(conversationId).emit('chat:typing', {
      userId: socket.userId,
      userType: clientInfo.userType,
      isTyping: false
    });
  }

  /**
   * Handle marking messages as read
   * @param {Object} socket - Socket instance
   * @param {Object} data - { conversationId, messageIds }
   */
  async handleMarkAsRead(socket, data) {
    try {
      const { conversationId, messageIds } = data;

      // Update message status
      await Message.updateMany(
        {
          messageId: { $in: messageIds },
          conversationId
        },
        {
          $set: {
            status: 'read',
            readAt: new Date()
          }
        }
      );

      // Broadcast read receipts
      socket.to(conversationId).emit('chat:read', {
        messageIds,
        readBy: socket.userId,
        readAt: new Date()
      });
    } catch (error) {
      logger.error(`Error marking messages as read: ${error.message}`);
    }
  }

  /**
   * Handle closing a conversation
   * @param {Object} socket - Socket instance
   * @param {Object} data - { conversationId, closingNotes }
   */
  async handleCloseConversation(socket, data) {
    try {
      const { conversationId, closingNotes } = data;

      const conversation = await Conversation.findOne({ conversationId });
      if (!conversation) {
        socket.emit('chat:error', { message: 'Conversation not found' });
        return;
      }

      // S6 — only participants (staff assigned/admin or the owner) may close
      if (!this.canAccessConversation(conversation, socket)) {
        socket.emit('chat:error', { message: 'Access denied' });
        return;
      }

      conversation.status = 'closed';
      conversation.closedAt = new Date();
      conversation.closedBy = socket.userId;
      conversation.closingNotes = closingNotes || '';
      await conversation.save();

      // Notify all participants
      this.io.to(conversationId).emit('chat:conversation:closed', {
        conversationId,
        closedAt: conversation.closedAt,
        closedBy: socket.userId
      });

      logger.info(`Conversation ${conversationId} closed by ${socket.userId}`);
    } catch (error) {
      logger.error(`Error closing conversation: ${error.message}`);
      socket.emit('chat:error', { message: 'Failed to close conversation' });
    }
  }

  /**
   * Handle agent status change
   * @param {Object} socket - Socket instance
   * @param {Object} data - { status }
   */
  handleAgentStatus(socket, data) {
    const { status } = data;

    if (socket.userType !== 'agent') {
      return;
    }

    this.agentStatus.set(socket.userId, {
      status,
      socketId: socket.id,
      lastActivity: new Date()
    });

    // Broadcast status to admin dashboard
    this.io.to('admin-dashboard').emit('agent:status:changed', {
      agentId: socket.userId,
      status,
      timestamp: new Date()
    });

    logger.info(`Agent ${socket.userId} status changed to ${status}`);
  }

  /**
   * Handle socket disconnection
   * @param {Object} socket - Socket instance
   */
  handleDisconnect(socket) {
    const clientInfo = this.connectedClients.get(socket.id);

    if (clientInfo && clientInfo.userType === 'agent') {
      // Update agent status to offline
      this.agentStatus.set(socket.userId, {
        status: 'offline',
        socketId: null,
        lastActivity: new Date()
      });

      // Broadcast to admin dashboard
      this.io.to('admin-dashboard').emit('agent:status:changed', {
        agentId: socket.userId,
        status: 'offline',
        timestamp: new Date()
      });
    }

    this.connectedClients.delete(socket.id);
    logger.info(`Socket disconnected: ${socket.id}`);
  }

  /**
   * Get online agents
   * @returns {Array} List of online agent IDs
   */
  getOnlineAgents() {
    const onlineAgents = [];
    for (const [userId, info] of this.agentStatus.entries()) {
      if (info.status === 'online') {
        onlineAgents.push(userId);
      }
    }
    return onlineAgents;
  }

  /**
   * Get agent status
   * @param {String} agentId - Agent user ID
   * @returns {Object} Agent status info
   */
  getAgentStatus(agentId) {
    return this.agentStatus.get(agentId) || { status: 'offline', socketId: null };
  }

  /**
   * Send notification to specific user
   * @param {String} userId - User ID
   * @param {String} event - Event name
   * @param {Object} data - Event data
   */
  sendToUser(userId, event, data) {
    for (const [socketId, clientInfo] of this.connectedClients.entries()) {
      if (clientInfo.userId === userId) {
        this.io.to(socketId).emit(event, data);
      }
    }
  }

  /**
   * Broadcast to all agents
   * @param {String} event - Event name
   * @param {Object} data - Event data
   */
  broadcastToAgents(event, data) {
    this.io.to('admin-dashboard').emit(event, data);
  }
}

// Export singleton instance
module.exports = new ChatSocketService();
