const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  selectedSize: {
    name: String,
    priceAdjustment: { type: Number, default: 0 }
  }
}, { _id: false });

const cartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    sparse: true, // Allow null for guest carts (though we won't use them)
    index: true   // P6 — sparse does NOT create an index; getCart by user needs one
  },
  sessionId: {
    type: String,
    sparse: true, // For guest users (future use)
    index: true
  },
  items: [cartItemSchema],
  subtotal: {
    type: Number,
    default: 0,
    min: 0
  },
  isAbandoned: {
    type: Boolean,
    default: false,
    index: true
  },
  abandonedAt: {
    type: Date
  },
  recoveryEmailSent: {
    type: Boolean,
    default: false
  },
  recoveryEmailSentAt: {
    type: Date
  },
  recoveredAt: {
    type: Date
  },
  lastActivity: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
// user and sessionId are indexed by `index: true` (P6); compound indexes below
cartSchema.index({ isAbandoned: 1, lastActivity: 1 });
cartSchema.index({ isAbandoned: 1, recoveryEmailSent: 1 });

// Calculate subtotal before saving
cartSchema.pre('save', function(next) {
  if (this.items && this.items.length > 0) {
    this.subtotal = this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  } else {
    this.subtotal = 0;
  }
  next();
});

// Update lastActivity on any modification
cartSchema.pre('save', function(next) {
  if (this.isModified('items')) {
    this.lastActivity = new Date();
  }
  next();
});

module.exports = mongoose.model('Cart', cartSchema);
