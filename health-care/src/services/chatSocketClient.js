import { io } from 'socket.io-client';

class ChatSocketClient {
  constructor() {
    this.socket = null;
    this.connected = false;
    this.listeners = new Map();
  }

  /**
   * Connect to Socket.IO server
   * @param {String} token - JWT token (optional for authenticated users)
   */
  connect(token = null) {
    if (this.socket && this.connected) {
      return;
    }

    // Get API URL from environment or use relative path
    let socketUrl;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    
    if (apiUrl) {
      // Remove /api suffix if present
      socketUrl = apiUrl.replace('/api', '');
    } else {
      // In production, use current origin
      socketUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5001';
    }

    console.log('Connecting to Socket.IO:', socketUrl);

    this.socket = io(socketUrl, {
      auth: {
        token
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      transports: ['websocket', 'polling'] // Try websocket first, fallback to polling
    });

    // Connection event handlers
    this.socket.on('connect', () => {
      this.connected = true;
      console.log('✅ Socket.IO connected:', this.socket.id);
      this.emit('connected', { socketId: this.socket.id });
    });

    this.socket.on('disconnect', (reason) => {
      this.connected = false;
      console.log('❌ Socket.IO disconnected:', reason);
      this.emit('disconnected', { reason });
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket.IO connection error:', error.message);
      this.emit('error', { error: error.message });
    });

    // Chat event handlers
    this.socket.on('chat:connected', (data) => {
      this.emit('chat:connected', data);
    });

    this.socket.on('chat:joined', (data) => {
      this.emit('chat:joined', data);
    });

    this.socket.on('chat:message', (data) => {
      this.emit('chat:message', data);
    });

    this.socket.on('chat:typing', (data) => {
      this.emit('chat:typing', data);
    });

    this.socket.on('chat:read', (data) => {
      this.emit('chat:read', data);
    });

    this.socket.on('chat:conversation:closed', (data) => {
      this.emit('chat:conversation:closed', data);
    });

    this.socket.on('chat:new:assignment', (data) => {
      this.emit('chat:new:assignment', data);
    });

    this.socket.on('chat:participant:joined', (data) => {
      this.emit('chat:participant:joined', data);
    });

    this.socket.on('chat:error', (data) => {
      this.emit('chat:error', data);
    });

    // Agent-specific events
    this.socket.on('agent:status:changed', (data) => {
      this.emit('agent:status:changed', data);
    });
  }

  /**
   * Disconnect from Socket.IO server
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
      this.listeners.clear();
    }
  }

  /**
   * Join a conversation
   * @param {String} conversationId - Conversation ID
   */
  joinConversation(conversationId) {
    if (!this.socket) {
      throw new Error('Socket not connected');
    }
    this.socket.emit('chat:join', { conversationId });
  }

  /**
   * Send a message
   * @param {String} conversationId - Conversation ID
   * @param {String} content - Message content
   * @param {String} messageType - Message type (text, image, file)
   */
  sendMessage(conversationId, content, messageType = 'text') {
    if (!this.socket) {
      throw new Error('Socket not connected');
    }
    this.socket.emit('chat:message', {
      conversationId,
      content,
      messageType
    });
  }

  /**
   * Send typing indicator start
   * @param {String} conversationId - Conversation ID
   */
  startTyping(conversationId) {
    if (!this.socket) return;
    this.socket.emit('chat:typing:start', { conversationId });
  }

  /**
   * Send typing indicator stop
   * @param {String} conversationId - Conversation ID
   */
  stopTyping(conversationId) {
    if (!this.socket) return;
    this.socket.emit('chat:typing:stop', { conversationId });
  }

  /**
   * Mark messages as read
   * @param {String} conversationId - Conversation ID
   * @param {Array} messageIds - Array of message IDs
   */
  markAsRead(conversationId, messageIds) {
    if (!this.socket) return;
    this.socket.emit('chat:read', { conversationId, messageIds });
  }

  /**
   * Close a conversation
   * @param {String} conversationId - Conversation ID
   * @param {String} closingNotes - Optional closing notes
   */
  closeConversation(conversationId, closingNotes = '') {
    if (!this.socket) {
      throw new Error('Socket not connected');
    }
    this.socket.emit('chat:close', { conversationId, closingNotes });
  }

  /**
   * Update agent status
   * @param {String} status - Status (online, away, busy, offline)
   */
  updateAgentStatus(status) {
    if (!this.socket) return;
    this.socket.emit('agent:status', { status });
  }

  /**
   * Register event listener
   * @param {String} event - Event name
   * @param {Function} callback - Callback function
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  /**
   * Unregister event listener
   * @param {String} event - Event name
   * @param {Function} callback - Callback function
   */
  off(event, callback) {
    if (!this.listeners.has(event)) return;
    
    const callbacks = this.listeners.get(event);
    const index = callbacks.indexOf(callback);
    if (index > -1) {
      callbacks.splice(index, 1);
    }
  }

  /**
   * Emit event to registered listeners
   * @param {String} event - Event name
   * @param {Object} data - Event data
   */
  emit(event, data) {
    if (!this.listeners.has(event)) return;
    
    const callbacks = this.listeners.get(event);
    callbacks.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in event listener for ${event}:`, error);
      }
    });
  }

  /**
   * Check if socket is connected
   * @returns {Boolean}
   */
  isConnected() {
    return this.connected && this.socket && this.socket.connected;
  }
}

// Export singleton instance
const chatSocketClient = new ChatSocketClient();
export default chatSocketClient;
