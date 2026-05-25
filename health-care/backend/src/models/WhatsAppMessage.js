const mongoose = require('mongoose');

/**
 * WhatsApp Message Schema
 * Stores individual messages in conversations
 */
const whatsappMessageSchema = new mongoose.Schema({
  // Message identification
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
  
  // Sender/Receiver
  from: {
    type: String,
    required: true,
    trim: true
  },
  to: {
    type: String,
    required: true,
    trim: true
  },
  direction: {
    type: String,
    enum: ['inbound', 'outbound'],
    required: true,
    index: true
  },
  
  // Message content
  type: {
    type: String,
    enum: ['text', 'image', 'document', 'audio', 'video', 'location', 'contact', 'interactive', 'template'],
    default: 'text',
    index: true
  },
  content: {
    text: String,
    caption: String,
    mediaUrl: String,
    mediaId: String,
    mimeType: String,
    filename: String,
    latitude: Number,
    longitude: Number,
    locationName: String,
    locationAddress: String,
    // For interactive messages
    buttonId: String,
    buttonText: String,
    listId: String,
    listTitle: String,
    listDescription: String
  },
  
  // Message status
  status: {
    type: String,
    enum: ['queued', 'sent', 'delivered', 'read', 'failed'],
    default: 'queued',
    index: true
  },
  errorCode: String,
  errorMessage: String,
  
  // Bot vs Human
  isBot: {
    type: Boolean,
    default: false
  },
  botIntent: String,
  botConfidence: Number,
  
  // Human agent
  sentBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Template message
  templateName: String,
  templateLanguage: String,
  templateParams: [String],
  
  // Metadata
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },
  
  // Timestamps
  sentAt: Date,
  deliveredAt: Date,
  readAt: Date
}, {
  timestamps: true
});

// Indexes for performance
whatsappMessageSchema.index({ conversationId: 1, createdAt: -1 });
whatsappMessageSchema.index({ from: 1, createdAt: -1 });
whatsappMessageSchema.index({ status: 1, createdAt: -1 });
whatsappMessageSchema.index({ type: 1, direction: 1 });

// Statics
whatsappMessageSchema.statics.getConversationMessages = function(conversationId, limit = 50) {
  return this.find({ conversationId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('sentBy', 'name email');
};

whatsappMessageSchema.statics.getUnreadCount = function(conversationId) {
  return this.countDocuments({
    conversationId,
    direction: 'inbound',
    status: { $ne: 'read' }
  });
};

// Methods
whatsappMessageSchema.methods.markAsDelivered = function() {
  this.status = 'delivered';
  this.deliveredAt = new Date();
  return this.save();
};

whatsappMessageSchema.methods.markAsRead = function() {
  this.status = 'read';
  this.readAt = new Date();
  return this.save();
};

whatsappMessageSchema.methods.markAsFailed = function(errorCode, errorMessage) {
  this.status = 'failed';
  this.errorCode = errorCode;
  this.errorMessage = errorMessage;
  return this.save();
};

module.exports = mongoose.model('WhatsAppMessage', whatsappMessageSchema);
