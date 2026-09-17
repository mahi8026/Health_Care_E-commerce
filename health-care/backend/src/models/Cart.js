const mongoose = require('mongoose');
const crypto = require('crypto');

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
  // ── WAVE-GUEST-RECOVERY ────────────────────────────────────────────────────
  // Guest carts have no `user`, so recovery needs an email captured during
  // checkout. Stored lowercase+trimmed to match User.email.
  contactEmail: {
    type: String,
    lowercase: true,
    trim: true,
    sparse: true,
    index: true
  },
  // Set when the guest clicks the unsubscribe link in a recovery email.
  recoveryOptOut: {
    type: Boolean,
    default: false
  },
  // Opaque token for the public opt-out link (mirrors Newsletter.unsubscribeToken).
  recoveryOptOutToken: {
    type: String,
    sparse: true,
    unique: true
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

// Mint the opt-out token the first time a contact email is captured, so the
// recovery email always carries a working unsubscribe link.
cartSchema.pre('save', function(next) {
  if (this.contactEmail && !this.recoveryOptOutToken) {
    this.recoveryOptOutToken = crypto.randomUUID();
  }
  next();
});

module.exports = mongoose.model('Cart', cartSchema);
