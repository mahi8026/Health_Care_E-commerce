const Wishlist = require('../models/Wishlist');
const Product = require('../models/Product');
const { successResponse, errorResponse } = require('../utils/responseHelper');

// @desc    Get user's wishlist
// @route   GET /api/wishlist
// @access  Private
exports.getWishlist = async (req, res) => {
  try {
    let wishlist = await Wishlist.findOne({ user: req.user._id })
      .populate({
        path: 'products',
        select: 'name slug price b2bPrice oldPrice discountPct images brand category isActive stock rating reviewsCount',
        populate: [
          { path: 'brand', select: 'name' },
          { path: 'category', select: 'name' }
        ]
      });

    // Create wishlist if doesn't exist
    if (!wishlist) {
      wishlist = await Wishlist.create({
        user: req.user._id,
        products: []
      });
    }

    // Filter out inactive or deleted products
    const activeProducts = wishlist.products.filter(p => p && p.isActive);

    return successResponse(res, {
      products: activeProducts,
      count: activeProducts.length
    });
  } catch (error) {
    console.error('Get wishlist error:', error);
    return errorResponse(res, 'Failed to fetch wishlist', process.env.NODE_ENV === 'development' ? [error.message] : null, 500);
  }
};

// @desc    Add/Remove product from wishlist (toggle)
// @route   POST /api/wishlist/:productId
// @access  Private
exports.toggleProduct = async (req, res) => {
  try {
    const { productId } = req.params;

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return errorResponse(res, 'Product not found', null, 404);
    }

    // Get or create wishlist
    let wishlist = await Wishlist.findOne({ user: req.user._id });
    
    if (!wishlist) {
      wishlist = await Wishlist.create({
        user: req.user._id,
        products: [productId]
      });

      return successResponse(res, {
        added: true,
        count: 1
      }, 'Added to wishlist');
    }

    // Toggle product
    const result = wishlist.toggleProduct(productId);
    await wishlist.save();

    return successResponse(res, {
      added: result.added,
      count: wishlist.products.length
    }, result.message);
  } catch (error) {
    console.error('Toggle wishlist error:', error);
    return errorResponse(res, 'Failed to update wishlist', process.env.NODE_ENV === 'development' ? [error.message] : null, 500);
  }
};

// @desc    Remove product from wishlist
// @route   DELETE /api/wishlist/:productId
// @access  Private
exports.removeProduct = async (req, res) => {
  try {
    const { productId } = req.params;

    const wishlist = await Wishlist.findOne({ user: req.user._id });
    
    if (!wishlist) {
      return errorResponse(res, 'Wishlist not found', null, 404);
    }

    // Remove product
    wishlist.products = wishlist.products.filter(id => !id.equals(productId));
    await wishlist.save();

    return successResponse(res, {
      count: wishlist.products.length
    }, 'Removed from wishlist');
  } catch (error) {
    console.error('Remove from wishlist error:', error);
    return errorResponse(res, 'Failed to remove from wishlist', process.env.NODE_ENV === 'development' ? [error.message] : null, 500);
  }
};

// @desc    Check if product is in wishlist
// @route   GET /api/wishlist/check/:productId
// @access  Private
exports.checkProduct = async (req, res) => {
  try {
    const { productId } = req.params;

    const wishlist = await Wishlist.findOne({ user: req.user._id });
    
    if (!wishlist) {
      return successResponse(res, { inWishlist: false });
    }

    const inWishlist = wishlist.hasProduct(productId);

    return successResponse(res, { inWishlist });
  } catch (error) {
    console.error('Check wishlist error:', error);
    return errorResponse(res, 'Failed to check wishlist', process.env.NODE_ENV === 'development' ? [error.message] : null, 500);
  }
};
