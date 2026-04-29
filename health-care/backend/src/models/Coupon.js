const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  // Basic Info
  code: {
    type: String,
    required: [true, 'Coupon code is required'],
    uppercase: true,
    trim: true,
    minlength: [3, 'Coupon code must be at least 3 characters'],
    maxlength: [50, 'Coupon code cannot exceed 50 characters']
  },
  
  type: {
    type: String,
    enum: {
      values: ['percentage', 'fixed', 'buy_x_get_y'],
      message: '{VALUE} is not a valid coupon type'
    },
    required: [true, 'Coupon type is required']
  },
  
  value: {
    type: Number,
    required: [true, 'Coupon value is required'],
    min: [0, 'Value cannot be negative']
  },
  
  // Buy X Get Y specific fields
  buyQuantity: {
    type: Number,
    min: [1, 'Buy quantity must be at least 1'],
    validate: {
      validator: function(v) {
        // Only required if type is buy_x_get_y
        if (this.type === 'buy_x_get_y') {
          return v != null && v > 0;
        }
        return true;
      },
      message: 'Buy quantity is required for buy_x_get_y coupons'
    }
  },
  
  getQuantity: {
    type: Number,
    min: [1, 'Get quantity must be at least 1'],
    validate: {
      validator: function(v) {
        // Only required if type is buy_x_get_y
        if (this.type === 'buy_x_get_y') {
          return v != null && v > 0;
        }
        return true;
      },
      message: 'Get quantity is required for buy_x_get_y coupons'
    }
  },
  
  // Conditions
  minimumOrderAmount: {
    type: Number,
    default: 0,
    min: [0, 'Minimum order amount cannot be negative']
  },
  
  maximumDiscount: {
    type: Number,
    min: [0, 'Maximum discount cannot be negative'],
    validate: {
      validator: function(v) {
        // Only applicable for percentage coupons
        if (this.type === 'percentage' && v != null) {
          return v > 0;
        }
        return true;
      },
      message: 'Maximum discount must be greater than 0'
    }
  },
  
  // Targeting
  applicableProducts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  
  applicableCategories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  }],
  
  applicableUserRoles: [{
    type: String,
    enum: {
      values: ['customer', 'b2b_customer', 'admin'],
      message: '{VALUE} is not a valid user role'
    }
  }],
  
  // Usage Limits
  usageLimit: {
    type: Number,
    default: 0, // 0 = unlimited
    min: [0, 'Usage limit cannot be negative']
  },
  
  usageCount: {
    type: Number,
    default: 0,
    min: [0, 'Usage count cannot be negative']
  },
  
  usedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  isFirstOrderOnly: {
    type: Boolean,
    default: false
  },
  
  // Validity Period
  startDate: {
    type: Date,
    required: [true, 'Start date is required']
  },
  
  endDate: {
    type: Date,
    required: [true, 'End date is required'],
    validate: {
      validator: function(v) {
        return v > this.startDate;
      },
      message: 'End date must be after start date'
    }
  },
  
  // Status & Meta
  isActive: {
    type: Boolean,
    default: true
  },
  
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Creator is required']
  }
}, {
  timestamps: true
});

// Indexes for performance
couponSchema.index({ code: 1 }, { unique: true });
couponSchema.index({ isActive: 1, startDate: 1, endDate: 1 });
couponSchema.index({ type: 1 });
couponSchema.index({ createdBy: 1 });

// Virtual for checking if coupon is currently valid (date-wise)
couponSchema.virtual('isCurrentlyValid').get(function() {
  const now = new Date();
  return this.isActive && this.startDate <= now && this.endDate >= now;
});

// Virtual for remaining uses
couponSchema.virtual('remainingUses').get(function() {
  if (this.usageLimit === 0) return Infinity;
  return Math.max(0, this.usageLimit - this.usageCount);
});

// Method to check if user has already used this coupon
couponSchema.methods.hasBeenUsedBy = function(userId) {
  return this.usedBy.some(id => id.toString() === userId.toString());
};

// Method to increment usage
couponSchema.methods.incrementUsage = async function(userId) {
  this.usageCount += 1;
  if (userId && !this.hasBeenUsedBy(userId)) {
    this.usedBy.push(userId);
  }
  return this.save();
};

// Ensure virtuals are included in JSON
couponSchema.set('toJSON', { virtuals: true });
couponSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Coupon', couponSchema);
