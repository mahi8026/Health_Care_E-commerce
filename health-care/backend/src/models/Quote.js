const mongoose = require('mongoose');

const quoteItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  name: String,
  sku: String,
  brand: String,
  qty: {
    type: Number,
    required: true,
    min: 1
  },
  unitPrice: {
    type: Number,
    required: true
  },
  discount: {
    type: Number,
    default: 0
  }
}, { _id: false });

const quoteSchema = new mongoose.Schema({
  quoteId: {
    type: String,
    unique: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [quoteItemSchema],
  subtotal: {
    type: Number,
    required: true
  },
  discountPct: {
    type: Number,
    default: 0
  },
  discountAmount: {
    type: Number,
    default: 0
  },
  finalAmount: {
    type: Number,
    required: true
  },
  validUntil: {
    type: Date
  },
  paymentTerms: {
    type: Number,
    enum: [30, 60, 90],
    default: 30
  },
  status: {
    type: String,
    enum: ['pending', 'sent', 'approved', 'converted', 'expired'],
    default: 'pending'
  },
  accountManager: {
    type: String
  },
  notes: {
    type: String
  },
  convertedOrderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  }
}, {
  timestamps: true
});

// Auto-generate quoteId before saving
// D6 — collision-safe: quoteId has a unique index, so check-then-generate with
// retries (a bare random draw could 500 on E11000 under concurrency)
quoteSchema.pre('save', async function (next) {
  if (!this.quoteId) {
    const year = new Date().getFullYear();
    const maxAttempts = 5;
    for (let i = 0; i < maxAttempts; i++) {
      const random = Math.floor(1000 + Math.random() * 9000);
      const seq = Math.floor(100 + Math.random() * 900);
      const candidate = `QT-${year}-${random}-${seq}`;
      const exists = await this.constructor.findOne({ quoteId: candidate }).select('_id').lean();
      if (!exists) {
        this.quoteId = candidate;
        break;
      }
    }
    if (!this.quoteId) {
      throw new Error('Failed to generate a unique quote ID');
    }
  }
  next();
});

module.exports = mongoose.model('Quote', quoteSchema);
