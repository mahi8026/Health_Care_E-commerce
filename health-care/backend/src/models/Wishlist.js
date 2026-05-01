const mongoose = require('mongoose');

const wishlistSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  products: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }]
}, {
  timestamps: true
});

// Index for faster lookups
// Note: user already has unique: true which creates an index
wishlistSchema.index({ products: 1 });

// Method to add product (toggle)
wishlistSchema.methods.toggleProduct = function(productId) {
  const index = this.products.findIndex(id => id.equals(productId));
  
  if (index > -1) {
    // Remove if exists
    this.products.splice(index, 1);
    return { added: false, message: 'Removed from wishlist' };
  } else {
    // Add if doesn't exist
    this.products.push(productId);
    return { added: true, message: 'Added to wishlist' };
  }
};

// Method to check if product is in wishlist
wishlistSchema.methods.hasProduct = function(productId) {
  return this.products.some(id => id.equals(productId));
};

const Wishlist = mongoose.model('Wishlist', wishlistSchema);

module.exports = Wishlist;
