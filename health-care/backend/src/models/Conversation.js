const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  conversationId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  customer: {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },
    isAuthenticated: {
      type: Boolean,
      default: false
    }
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  status: {
    type: String,
    enum: ['active', 'waiting', 'closed', 'resolved'],
    default: 'waiting',
    index: true
  },
  channel: {
    type: String,
    enum: ['live_chat', 'whatsapp'],
    default: 'live_chat',
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
    default: 'general'
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  language: {
    type: String,
    enum: ['en', 'bn'],
    default: 'en'
  },
  metadata: {
    currentPageUrl: String,
    userAgent: String,
    ipAddress: String,
    referrer: String,
    sessionId: String
  },
  messageCount: {
    type: Number,
    default: 0
  },
  lastMessageAt: {
    type: Date,
    default: Date.now
  },
  firstResponseAt: {
    type: Date,
    default: null
  },
  closedAt: {
    type: Date,
    default: null
  },
  closedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  closingNotes: {
    type: String,
    default: ''
  },
  satisfactionScore: {
    type: Number,
    min: 1,
    max: 5,
    default: null
  },
  satisfactionFeedback: {
    type: String,
    default: ''
  },
  tags: [{
    type: String,
    trim: true
  }],
  internalNotes: [{
    text: {
      type: String,
      required: true
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  transferHistory: [{
    from: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    to: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    reason: String,
    transferredAt: {
      type: Date,
      default: Date.now
    }
  }],
  isProactive: {
    type: Boolean,
    default: false
  },
  proactiveTrigger: {
    type: String,
    enum: ['time_on_page', 'cart_abandonment', 'exit_intent', 'manual', null],
    default: null
  }
}, {
  timestamps: true
});

// Indexes for performance
conversationSchema.index({ 'customer.email': 1 });
conversationSchema.index({ assignedTo: 1, status: 1 });
conversationSchema.index({ createdAt: -1 });
conversationSchema.index({ lastMessageAt: -1 });
conversationSchema.index({ channel: 1, status: 1 });

// Virtual for response time calculation
conversationSchema.virtual('responseTime').get(function() {
  if (this.firstResponseAt && this.createdAt) {
    return Math.floor((this.firstResponseAt - this.createdAt) / 1000); // in seconds
  }
  return null;
});

// Method to check if conversation is active
conversationSchema.methods.isActive = function() {
  return this.status === 'active' || this.status === 'waiting';
};

// Method to check if conversation is stale (no activity for 15 minutes)
conversationSchema.methods.isStale = function() {
  const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
  return this.lastMessageAt < fifteenMinutesAgo;
};

// Static method to find conversations by agent
conversationSchema.statics.findByAgent = function(agentId, status = null) {
  const query = { assignedTo: agentId };
  if (status) {
    query.status = status;
  }
  return this.find(query).sort({ lastMessageAt: -1 });
};

// Static method to find waiting conversations
conversationSchema.statics.findWaiting = function() {
  return this.find({ status: 'waiting' }).sort({ createdAt: 1 });
};

// Static method to get conversation statistics
conversationSchema.statics.getStatistics = async function(startDate, endDate) {
  const stats = await this.aggregate([
    {
      $match: {
        createdAt: {
          $gte: startDate,
          $lte: endDate
        }
      }
    },
    {
      $group: {
        _id: null,
        totalConversations: { $sum: 1 },
        avgSatisfactionScore: { $avg: '$satisfactionScore' },
        totalMessages: { $sum: '$messageCount' },
        resolvedConversations: {
          $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] }
        },
        avgResponseTime: {
          $avg: {
            $cond: [
              { $ne: ['$firstResponseAt', null] },
              { $subtract: ['$firstResponseAt', '$createdAt'] },
              null
            ]
          }
        }
      }
    }
  ]);

  return stats[0] || {
    totalConversations: 0,
    avgSatisfactionScore: 0,
    totalMessages: 0,
    resolvedConversations: 0,
    avgResponseTime: 0
  };
};

module.exports = mongoose.model('Conversation', conversationSchema);
