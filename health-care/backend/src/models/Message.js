const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  messageId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  conversationId: {
    type: String,
    required: true,
    index: true
  },
  conversation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true,
    index: true
  },
  sender: {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    name: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['customer', 'agent', 'system'],
      required: true
    }
  },
  messageType: {
    type: String,
    enum: ['text', 'file', 'image', 'system', 'typing', 'read_receipt'],
    default: 'text',
    required: true
  },
  content: {
    text: {
      type: String,
      maxlength: 10000
    },
    fileUrl: String,
    fileName: String,
    fileSize: Number,
    fileType: String,
    thumbnailUrl: String
  },
  status: {
    type: String,
    enum: ['queued', 'sent', 'delivered', 'read', 'failed'],
    default: 'queued',
    index: true
  },
  deliveredAt: {
    type: Date,
    default: null
  },
  readAt: {
    type: Date,
    default: null
  },
  errorMessage: {
    type: String,
    default: null
  },
  metadata: {
    ipAddress: String,
    userAgent: String,
    clientTimestamp: Date
  },
  isInternal: {
    type: Boolean,
    default: false
  },
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
    default: null
  }
}, {
  timestamps: true
});

// Indexes for performance
messageSchema.index({ conversationId: 1, createdAt: 1 });
messageSchema.index({ 'sender.userId': 1 });
messageSchema.index({ status: 1 });
messageSchema.index({ createdAt: -1 });

// Virtual for delivery time
messageSchema.virtual('deliveryTime').get(function() {
  if (this.deliveredAt && this.createdAt) {
    return Math.floor((this.deliveredAt - this.createdAt) / 1000); // in seconds
  }
  return null;
});

// Method to mark as delivered
messageSchema.methods.markAsDelivered = function() {
  this.status = 'delivered';
  this.deliveredAt = new Date();
  return this.save();
};

// Method to mark as read
messageSchema.methods.markAsRead = function() {
  this.status = 'read';
  this.readAt = new Date();
  return this.save();
};

// Method to mark as failed
messageSchema.methods.markAsFailed = function(errorMessage) {
  this.status = 'failed';
  this.errorMessage = errorMessage;
  return this.save();
};

// Static method to find messages by conversation
messageSchema.statics.findByConversation = function(conversationId, limit = 100) {
  return this.find({ conversationId })
    .sort({ createdAt: 1 })
    .limit(limit)
    .populate('sender.userId', 'name email role');
};

// Static method to count unread messages
messageSchema.statics.countUnread = function(conversationId, userType) {
  const query = {
    conversationId,
    'sender.type': { $ne: userType },
    status: { $ne: 'read' }
  };
  return this.countDocuments(query);
};

// Static method to get recent messages
messageSchema.statics.getRecent = function(conversationId, count = 50) {
  return this.find({ conversationId })
    .sort({ createdAt: -1 })
    .limit(count)
    .populate('sender.userId', 'name email');
};

// Pre-save hook to validate content based on message type
messageSchema.pre('save', function(next) {
  if (this.messageType === 'text' && !this.content.text) {
    return next(new Error('Text message must have content.text'));
  }
  if (this.messageType === 'file' && !this.content.fileUrl) {
    return next(new Error('File message must have content.fileUrl'));
  }
  next();
});

module.exports = mongoose.model('Message', messageSchema);
