const mongoose = require('mongoose');

const returnSchema = new mongoose.Schema({
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: [true, 'Order reference is required']
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User reference is required']
  },
  products: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Quantity must be at least 1']
    },
    reason: {
      type: String,
      required: true
    },
    price: {
      type: Number,
      required: true
    }
  }],
  reason: {
    type: String,
    required: [true, 'Return reason is required'],
    enum: {
      values: ['damaged', 'wrong_item', 'defective', 'not_as_described', 'changed_mind', 'other'],
      message: '{VALUE} is not a valid return reason'
    }
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    minlength: [20, 'Description must be at least 20 characters'],
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  images: [{
    url: {
      type: String,
      required: true
    },
    publicId: {
      type: String,
      default: ''
    },
    alt: {
      type: String,
      default: ''
    }
  }],
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'refunded', 'cancelled'],
    default: 'pending'
  },
  adminNotes: {
    type: String,
    maxlength: [1000, 'Admin notes cannot exceed 1000 characters']
  },
  refundAmount: {
    type: Number,
    required: true,
    min: 0
  },
  refundMethod: {
    type: String,
    enum: ['original_payment', 'bank_transfer', 'store_credit']
  },
  refundTransactionId: String,
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: Date,
  refundedAt: Date,
  stockRestored: {
    type: Boolean,
    default: false
  }
}, { 
  timestamps: true 
});

// Indexes for better query performance
returnSchema.index({ order: 1 });
returnSchema.index({ user: 1 });
returnSchema.index({ status: 1 });
returnSchema.index({ createdAt: -1 });
returnSchema.index({ user: 1, status: 1 });

// Virtual for return age in days
returnSchema.virtual('ageInDays').get(function() {
  return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24));
});

// Pre-save hook to validate refund amount
returnSchema.pre('save', function(next) {
  if (this.isNew) {
    // Calculate refund amount from products if not set
    if (!this.refundAmount) {
      this.refundAmount = this.products.reduce((sum, item) => {
        return sum + (item.price * item.quantity);
      }, 0);
    }
  }
  next();
});

module.exports = mongoose.model('Return', returnSchema);
