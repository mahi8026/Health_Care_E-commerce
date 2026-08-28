const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'Product is required'],
    index: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required'],
    index: true
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    // F8 — nullable so unverified ("pending" moderation) reviews can be
    // submitted without a delivered order; verified reviews always set it.
    default: null
  },
  rating: {
    type: Number,
    required: [true, 'Rating is required'],
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating must be at most 5'],
    validate: {
      validator: Number.isInteger,
      message: 'Rating must be an integer'
    },
    index: true
  },
  title: {
    type: String,
    required: [true, 'Review title is required'],
    trim: true,
    maxlength: [100, 'Title must not exceed 100 characters']
  },
  comment: {
    type: String,
    required: [true, 'Review comment is required'],
    trim: true,
    maxlength: [1000, 'Comment must not exceed 1000 characters']
  },
  images: [{
    url: {
      type: String,
      required: true
    },
    publicId: {
      type: String,
      required: true
    },
    alt: {
      type: String,
      default: 'Review image'
    }
  }],
  verifiedPurchase: {
    type: Boolean,
    default: true
  },
  helpful: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  helpfulCount: {
    type: Number,
    default: 0,
    index: true
  },
  reported: {
    type: Boolean,
    default: false,
    index: true
  },
  reportReason: {
    type: String,
    trim: true
  },
  reportedBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: String,
    reportedAt: {
      type: Date,
      default: Date.now
    }
  }],
  adminResponse: {
    type: String,
    trim: true,
    maxlength: [500, 'Admin response must not exceed 500 characters']
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
    index: true
  },
  rejectionReason: {
    type: String,
    trim: true
  },
  isEdited: {
    type: Boolean,
    default: false
  },
  editedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Compound indexes
reviewSchema.index({ product: 1, user: 1 }, { unique: true });
reviewSchema.index({ product: 1, status: 1 });
reviewSchema.index({ createdAt: -1 });
reviewSchema.index({ helpfulCount: -1 });
reviewSchema.index({ status: 1, createdAt: -1 }); // global approved-reviews listing sorted by date (homepage testimonials)
// Optimization spec indexes (Requirements 4.1, 4.2)
reviewSchema.index({ product: 1, createdAt: -1 }); // product review listing sorted by date

// Virtual: Check if a specific user marked this review as helpful
reviewSchema.methods.isHelpful = function(userId) {
  return this.helpful.some(id => id.equals(userId));
};

// Method: Toggle helpful status
reviewSchema.methods.toggleHelpful = async function(userId) {
  const index = this.helpful.findIndex(id => id.equals(userId));
  
  if (index > -1) {
    // Remove from helpful
    this.helpful.splice(index, 1);
    this.helpfulCount = Math.max(0, this.helpfulCount - 1);
  } else {
    // Add to helpful
    this.helpful.push(userId);
    this.helpfulCount += 1;
  }
  
  await this.save();
  return index === -1; // Return true if added, false if removed
};

// Method: Add report
reviewSchema.methods.addReport = async function(userId, reason) {
  // Check if user already reported
  const alreadyReported = this.reportedBy.some(r => r.user.equals(userId));
  if (alreadyReported) {
    throw new Error('You have already reported this review');
  }
  
  this.reportedBy.push({
    user: userId,
    reason: reason,
    reportedAt: new Date()
  });
  
  // Auto-hide if more than 5 reports
  if (this.reportedBy.length >= 5) {
    this.reported = true;
    this.status = 'pending'; // Send back to moderation
  }
  
  await this.save();
};

// Static: Get product rating stats
reviewSchema.statics.getProductStats = async function(productId) {
  const stats = await this.aggregate([
    {
      $match: {
        product: new mongoose.Types.ObjectId(productId),
        status: 'approved'
      }
    },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 },
        rating5: { $sum: { $cond: [{ $eq: ['$rating', 5] }, 1, 0] } },
        rating4: { $sum: { $cond: [{ $eq: ['$rating', 4] }, 1, 0] } },
        rating3: { $sum: { $cond: [{ $eq: ['$rating', 3] }, 1, 0] } },
        rating2: { $sum: { $cond: [{ $eq: ['$rating', 2] }, 1, 0] } },
        rating1: { $sum: { $cond: [{ $eq: ['$rating', 1] }, 1, 0] } }
      }
    }
  ]);
  
  if (stats.length === 0) {
    return {
      averageRating: 0,
      totalReviews: 0,
      distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    };
  }
  
  const result = stats[0];
  return {
    averageRating: Math.round(result.averageRating * 10) / 10, // 1 decimal
    totalReviews: result.totalReviews,
    distribution: {
      5: result.rating5,
      4: result.rating4,
      3: result.rating3,
      2: result.rating2,
      1: result.rating1
    }
  };
};

// Pre-save: Validate images count
reviewSchema.pre('save', function(next) {
  if (this.images && this.images.length > 5) {
    return next(new Error('Maximum 5 images allowed per review'));
  }
  next();
});

// Post-save: Update product rating stats
// B5 — recompute on ANY save, not just 'approved': rejecting a review (or the
// auto-report flow setting status back to 'pending') must immediately drop the
// product's average. getProductStats() only aggregates approved reviews, so
// recomputing on non-approved saves is exact.
reviewSchema.post('save', async function(doc) {
  await updateProductRating(doc.product);
});

// Post-remove: Update product rating stats
reviewSchema.post('remove', async function(doc) {
  await updateProductRating(doc.product);
});

// Helper function to update product rating
async function updateProductRating(productId) {
  const Product = mongoose.model('Product');
  const Review = mongoose.model('Review');
  
  const stats = await Review.getProductStats(productId);
  
  await Product.findByIdAndUpdate(productId, {
    'rating.average': stats.averageRating,
    'rating.count': stats.totalReviews,
    'rating.distribution': stats.distribution,
    reviewsCount: stats.totalReviews,
    // P9 — keep the legacy alias in sync so UI paths reading either field
    // never disagree.
    reviewCount: stats.totalReviews
  });
}

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
