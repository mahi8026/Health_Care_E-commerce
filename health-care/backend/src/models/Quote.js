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
  sizeName: String,
  qty: {
    type: Number,
    required: true,
    min: 1
  },
  unitPrice: {
    type: Number,
    required: true
  },
  originalPrice: {
    type: Number,
    default: 0
  },
  discount: {
    type: Number,
    default: 0
  },
  isB2BPrice: {
    type: Boolean,
    default: false
  },
  savings: {
    type: Number,
    default: 0
  },
  lineTotal: {
    type: Number,
    default: 0
  }
}, { _id: false });

const quoteSchema = new mongoose.Schema({
  quoteId: {
    type: String,
    unique: true
  },
  quoteNumber: {
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
  vatAmount: {
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
    enum: ['pending', 'sent', 'approved', 'converted', 'expired', 'rejected'],
    default: 'pending'
  },
  rejectionReason: {
    type: String
  },
  accountManager: {
    type: String
  },
  notes: {
    type: String
  },
  requestedDelivery: {
    type: String
  },
  sentAt: {
    type: Date
  },
  approvedAt: {
    type: Date
  },
  convertedOrderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  }
}, {
  timestamps: true
});

// Auto-generate quoteId + quoteNumber before saving
// D6 — collision-safe: both carry unique indexes, so check-then-generate with
// retries (a bare random draw could 500 on E11000 under concurrency)
quoteSchema.pre('save', async function (next) {
  const year = new Date().getFullYear();
  const maxAttempts = 5;

  if (!this.quoteId) {
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

  if (!this.quoteNumber) {
    const prefix = `QT-${year}-`;
    const last = await this.constructor
      .findOne({ quoteNumber: { $regex: `^${prefix}` } })
      .sort({ quoteNumber: -1 })
      .select('quoteNumber')
      .lean();
    let seq = 1;
    if (last && last.quoteNumber) {
      const match = last.quoteNumber.match(/(\d+)$/);
      seq = match ? parseInt(match[1], 10) + 1 : 1;
    }
    for (let i = 0; i < maxAttempts; i++) {
      const candidate = `${prefix}${String(seq).padStart(4, '0')}`;
      const exists = await this.constructor.findOne({ quoteNumber: candidate }).select('_id').lean();
      if (!exists) {
        this.quoteNumber = candidate;
        break;
      }
      seq += 1;
    }
    if (!this.quoteNumber) {
      throw new Error('Failed to generate a unique quote number');
    }
  }

  // Keep line totals in sync
  this.items.forEach((item) => {
    if (item.lineTotal === undefined || item.lineTotal === 0) {
      item.lineTotal = Math.round(item.unitPrice * item.qty * 100) / 100;
    }
  });

  next();
});

module.exports = mongoose.model('Quote', quoteSchema);