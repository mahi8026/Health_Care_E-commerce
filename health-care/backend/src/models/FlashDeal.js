const mongoose = require('mongoose');

const flashDealSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    default: 'Deal of the Day'
  },
  description: {
    type: String,
    default: 'Limited time offer - grab it before it\'s gone!'
  },
  products: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    discountPercentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    discountAmount: {
      type: Number,
      default: 0
    },
    finalPrice: {
      type: Number,
      required: true
    },
    stockLimit: {
      type: Number,
      default: null // null = unlimited
    },
    soldCount: {
      type: Number,
      default: 0
    }
  }],
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['scheduled', 'active', 'expired', 'cancelled'],
    default: 'scheduled'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  displayOrder: {
    type: Number,
    default: 0
  },
  badge: {
    text: {
      type: String,
      default: 'FLASH DEAL'
    },
    color: {
      type: String,
      default: '#E11D48'
    }
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Index for efficient queries
flashDealSchema.index({ startTime: 1, endTime: 1 });
flashDealSchema.index({ status: 1, isActive: 1 });

// Virtual for checking if deal is currently active
flashDealSchema.virtual('isCurrentlyActive').get(function() {
  const now = new Date();
  return this.status === 'active' && 
         this.isActive && 
         now >= this.startTime && 
         now <= this.endTime;
});

// Virtual for time remaining
flashDealSchema.virtual('timeRemaining').get(function() {
  const now = new Date();
  if (now > this.endTime) {
return 0;
}
  return Math.max(0, this.endTime - now);
});

// Method to update status based on time
flashDealSchema.methods.updateStatus = function() {
  const now = new Date();
  
  if (now < this.startTime) {
    this.status = 'scheduled';
  } else if (now >= this.startTime && now <= this.endTime) {
    this.status = 'active';
  } else {
    this.status = 'expired';
  }
  
  return this.save();
};

// Static method to get active deals
flashDealSchema.statics.getActiveDeals = function() {
  const now = new Date();
  return this.find({
    isActive: true,
    status: 'active',
    startTime: { $lte: now },
    endTime: { $gte: now }
  })
  .populate('products.product')
  .sort({ displayOrder: 1, createdAt: -1 });
};

// Pre-save hook to calculate discount amounts
flashDealSchema.pre('save', function(next) {
  this.products.forEach(item => {
    if (item.product && item.product.price) {
      const originalPrice = item.product.price;
      item.discountAmount = Math.round(originalPrice * (item.discountPercentage / 100));
      item.finalPrice = originalPrice - item.discountAmount;
    }
  });
  next();
});

module.exports = mongoose.model('FlashDeal', flashDealSchema);
