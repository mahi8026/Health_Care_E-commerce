const Wishlist = require('../models/Wishlist');
const Product = require('../models/Product');

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

    res.json({
      success: true,
      data: {
        products: activeProducts,
        count: activeProducts.length
      }
    });
  } catch (error) {
    console.error('Get wishlist error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch wishlist'
    });
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
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Get or create wishlist
    let wishlist = await Wishlist.findOne({ user: req.user._id });
    
    if (!wishlist) {
      wishlist = await Wishlist.create({
        user: req.user._id,
        products: [productId]
      });

      return res.json({
        success: true,
        message: 'Added to wishlist',
        data: {
          added: true,
          count: 1
        }
      });
    }

    // Toggle product
    const result = wishlist.toggleProduct(productId);
    await wishlist.save();

    res.json({
      success: true,
      message: result.message,
      data: {
        added: result.added,
        count: wishlist.products.length
      }
    });
  } catch (error) {
    console.error('Toggle wishlist error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update wishlist'
    });
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
      return res.status(404).json({
        success: false,
        message: 'Wishlist not found'
      });
    }

    // Remove product
    wishlist.products = wishlist.products.filter(id => !id.equals(productId));
    await wishlist.save();

    res.json({
      success: true,
      message: 'Removed from wishlist',
      data: {
        count: wishlist.products.length
      }
    });
  } catch (error) {
    console.error('Remove from wishlist error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove from wishlist'
    });
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
      return res.json({
        success: true,
        data: {
          inWishlist: false
        }
      });
    }

    const inWishlist = wishlist.hasProduct(productId);

    res.json({
      success: true,
      data: {
        inWishlist
      }
    });
  } catch (error) {
    console.error('Check wishlist error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check wishlist'
    });
  }
};
