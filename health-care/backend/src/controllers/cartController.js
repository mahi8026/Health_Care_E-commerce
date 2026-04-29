const Cart = require('../models/Cart');
const Product = require('../models/Product');
const logger = require('../utils/logger');

// ─── Get Current Cart ────────────────────────────────────────────────────────
exports.getCart = async (req, res) => {
  try {
    const userId = req.user._id;
    
    let cart = await Cart.findOne({ user: userId }).populate('items.product', 'name slug price images brand stock isActive');
    
    if (!cart) {
      // Create empty cart if doesn't exist
      cart = await Cart.create({ user: userId, items: [] });
    }

    // Filter out inactive or deleted products
    const validItems = cart.items.filter(item => item.product && item.product.isActive);
    if (validItems.length !== cart.items.length) {
      cart.items = validItems;
      await cart.save();
    }

    res.json({
      success: true,
      data: cart
    });
  } catch (error) {
    logger.error('Get cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch cart',
      error: error.message
    });
  }
};

// ─── Sync Cart (on login) ────────────────────────────────────────────────────
exports.syncCart = async (req, res) => {
  try {
    const userId = req.user._id;
    const { items } = req.body; // Array from localStorage: [{ id, quantity, price }]

    if (!items || !Array.isArray(items)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid cart items'
      });
    }

    // Find or create user's cart
    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      cart = new Cart({ user: userId, items: [] });
    }

    // Merge logic: for each localStorage item
    for (const localItem of items) {
      const productId = localItem.id || localItem._id;
      if (!productId) continue;

      // Verify product exists and is active
      const product = await Product.findById(productId);
      if (!product || !product.isActive) continue;

      // Check if product already in DB cart
      const existingIndex = cart.items.findIndex(
        item => item.product.toString() === productId.toString()
      );

      if (existingIndex >= 0) {
        // Use higher quantity
        cart.items[existingIndex].quantity = Math.max(
          cart.items[existingIndex].quantity,
          localItem.quantity || 1
        );
        // Update price to current price
        cart.items[existingIndex].price = product.price;
      } else {
        // Add new item from localStorage
        cart.items.push({
          product: productId,
          quantity: localItem.quantity || 1,
          price: product.price
        });
      }
    }

    await cart.save();
    
    // Populate and return merged cart
    await cart.populate('items.product', 'name slug price images brand stock isActive');

    res.json({
      success: true,
      message: 'Cart synced successfully',
      data: cart
    });
  } catch (error) {
    logger.error('Sync cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to sync cart',
      error: error.message
    });
  }
};

// ─── Add Item to Cart ────────────────────────────────────────────────────────
exports.addItem = async (req, res) => {
  try {
    const userId = req.user._id;
    const { productId, quantity = 1 } = req.body;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'Product ID is required'
      });
    }

    // Verify product exists
    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Product not found or inactive'
      });
    }

    // Find or create cart
    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      cart = new Cart({ user: userId, items: [] });
    }

    // Check if item already exists
    const existingIndex = cart.items.findIndex(
      item => item.product.toString() === productId.toString()
    );

    if (existingIndex >= 0) {
      // Update quantity
      cart.items[existingIndex].quantity += quantity;
      cart.items[existingIndex].price = product.price; // Update to current price
    } else {
      // Add new item
      cart.items.push({
        product: productId,
        quantity,
        price: product.price
      });
    }

    await cart.save();
    await cart.populate('items.product', 'name slug price images brand stock isActive');

    res.json({
      success: true,
      message: 'Item added to cart',
      data: cart
    });
  } catch (error) {
    logger.error('Add item error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add item',
      error: error.message
    });
  }
};

// ─── Update Item Quantity ────────────────────────────────────────────────────
exports.updateItem = async (req, res) => {
  try {
    const userId = req.user._id;
    const { productId } = req.params;
    const { quantity } = req.body;

    if (!quantity || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be at least 1'
      });
    }

    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    const itemIndex = cart.items.findIndex(
      item => item.product.toString() === productId.toString()
    );

    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Item not found in cart'
      });
    }

    cart.items[itemIndex].quantity = quantity;
    await cart.save();
    await cart.populate('items.product', 'name slug price images brand stock isActive');

    res.json({
      success: true,
      message: 'Item updated',
      data: cart
    });
  } catch (error) {
    logger.error('Update item error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update item',
      error: error.message
    });
  }
};

// ─── Remove Item from Cart ───────────────────────────────────────────────────
exports.removeItem = async (req, res) => {
  try {
    const userId = req.user._id;
    const { productId } = req.params;

    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    cart.items = cart.items.filter(
      item => item.product.toString() !== productId.toString()
    );

    await cart.save();
    await cart.populate('items.product', 'name slug price images brand stock isActive');

    res.json({
      success: true,
      message: 'Item removed from cart',
      data: cart
    });
  } catch (error) {
    logger.error('Remove item error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove item',
      error: error.message
    });
  }
};

// ─── Clear Cart ──────────────────────────────────────────────────────────────
exports.clearCart = async (req, res) => {
  try {
    const userId = req.user._id;

    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.json({
        success: true,
        message: 'Cart already empty'
      });
    }

    cart.items = [];
    await cart.save();

    res.json({
      success: true,
      message: 'Cart cleared',
      data: cart
    });
  } catch (error) {
    logger.error('Clear cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear cart',
      error: error.message
    });
  }
};

// ─── Mark Cart as Recovered ──────────────────────────────────────────────────
exports.recoverCart = async (req, res) => {
  try {
    const { cartId } = req.params;
    const userId = req.user._id;

    const cart = await Cart.findOne({ _id: cartId, user: userId });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    cart.recoveredAt = new Date();
    cart.isAbandoned = false; // Mark as no longer abandoned
    await cart.save();

    res.json({
      success: true,
      message: 'Cart recovered',
      data: cart
    });
  } catch (error) {
    logger.error('Recover cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to recover cart',
      error: error.message
    });
  }
};

// ─── Admin: Get Abandoned Cart Stats ─────────────────────────────────────────
exports.getAbandonedCartStats = async (req, res) => {
  try {
    // Total abandoned carts
    const totalAbandoned = await Cart.countDocuments({ isAbandoned: true });

    // Total value at risk
    const abandonedCarts = await Cart.find({ isAbandoned: true });
    const totalValueAtRisk = abandonedCarts.reduce((sum, cart) => sum + cart.subtotal, 0);

    // Recovery stats
    const totalRecovered = await Cart.countDocuments({ recoveredAt: { $exists: true } });
    const recoveryRate = totalAbandoned > 0 ? ((totalRecovered / totalAbandoned) * 100).toFixed(2) : 0;

    // Recovery emails sent
    const emailsSent = await Cart.countDocuments({ recoveryEmailSent: true });

    res.json({
      success: true,
      data: {
        totalAbandoned,
        totalValueAtRisk,
        recoveryRate: parseFloat(recoveryRate),
        totalRecovered,
        emailsSent
      }
    });
  } catch (error) {
    logger.error('Get abandoned cart stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch stats',
      error: error.message
    });
  }
};
