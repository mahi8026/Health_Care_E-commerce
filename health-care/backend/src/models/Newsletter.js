const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const newsletterSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
  },
  name: {
    type: String,
    trim: true
  },
  isSubscribed: {
    type: Boolean,
    default: true,
    index: true
  },
  subscribedAt: {
    type: Date,
    default: Date.now
  },
  unsubscribedAt: {
    type: Date
  },
  unsubscribeToken: {
    type: String,
    unique: true,
    default: () => uuidv4(),
    index: true
  },
  source: {
    type: String,
    enum: ['footer', 'popup', 'checkout', 'manual'],
    default: 'footer'
  },
  tags: [{
    type: String,
    trim: true
  }]
}, {
  timestamps: true
});

// Indexes for efficient queries
// Note: email and unsubscribeToken already have unique: true which creates indexes
// Note: isSubscribed already has index: true in the field definition
newsletterSchema.index({ source: 1 });
newsletterSchema.index({ tags: 1 });

// Ensure unsubscribeToken is always set
newsletterSchema.pre('save', function(next) {
  if (!this.unsubscribeToken) {
    this.unsubscribeToken = uuidv4();
  }
  next();
});

module.exports = mongoose.model('Newsletter', newsletterSchema);
