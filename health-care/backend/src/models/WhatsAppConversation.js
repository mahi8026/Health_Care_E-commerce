const mongoose = require('mongoose');

/**
 * WhatsApp Conversation Schema
 * Tracks all WhatsApp conversations with customers
 */
const whatsappConversationSchema = new mongoose.Schema({
  // Customer identification
  phoneNumber: {
    type: String,
    required: true,
    index: true,
    trim: true
  },
  customerName: {
    type: String,
    trim: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  
  // Conversation metadata
  conversationId: {
    type: String,
    unique: true,
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['active', 'resolved', 'pending', 'escalated', 'closed'],
    default: 'active',
    index: true
  },
  category: {
    type: String,
    enum: [
      'product_inquiry',
      'order_status',
      'quote_request',
      'complaint',
      'support',
      'general',
      'b2b_inquiry',
      'payment_issue',
      'delivery_issue',
      'return_request',
      'other'
    ],
    default: 'general',
    index: true
  },
  
  // Bot interaction
  isBot: {
    type: Boolean,
    default: true
  },
  botStage: {
    type: String,
    enum: [
      'greeting',
      'menu',
      'product_search',
      'order_tracking',
      'quote_collection',
      'support_ticket',
      'human_handoff',
      'completed'
    ],
    default: 'greeting'
  },
  context: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
  // Assignment
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  assignedAt: Date,
  
  // Related entities
  relatedOrder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  },
  relatedQuote: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quote'
  },
  relatedProducts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  
  // Metrics
  messageCount: {
    type: Number,
    default: 0
  },
  lastMessageAt: {
    type: Date,
    default: Date.now
  },
  responseTime: {
    type: Number, // in seconds
    default: 0
  },
  
  // Tags for filtering
  tags: [{
    type: String,
    trim: true
  }],
  
  // Notes for human agents
  notes: [{
    text: String,
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Timestamps
  resolvedAt: Date,
  closedAt: Date
}, {
  timestamps: true
});

// Indexes for performance
whatsappConversationSchema.index({ phoneNumber: 1, status: 1 });
whatsappConversationSchema.index({ createdAt: -1 });
whatsappConversationSchema.index({ category: 1, status: 1 });
whatsappConversationSchema.index({ assignedTo: 1, status: 1 });

// Virtual for messages
whatsappConversationSchema.virtual('messages', {
  ref: 'WhatsAppMessage',
  localField: 'conversationId',
  foreignField: 'conversationId'
});

// Methods
whatsappConversationSchema.methods.addNote = function(text, userId) {
  this.notes.push({
    text,
    addedBy: userId,
    addedAt: new Date()
  });
  return this.save();
};

whatsappConversationSchema.methods.assignTo = function(userId) {
  this.assignedTo = userId;
  this.assignedAt = new Date();
  this.isBot = false;
  return this.save();
};

whatsappConversationSchema.methods.resolve = function() {
  this.status = 'resolved';
  this.resolvedAt = new Date();
  return this.save();
};

whatsappConversationSchema.methods.close = function() {
  this.status = 'closed';
  this.closedAt = new Date();
  return this.save();
};

module.exports = mongoose.model('WhatsAppConversation', whatsappConversationSchema);
