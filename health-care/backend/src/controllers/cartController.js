const Cart = require('../models/Cart');
const Product = require('../models/Product');
const logger = require('../utils/logger');
const { successResponse, errorResponse } = require('../utils/responseHelper');
const { getActiveDealPriceMap } = require('../services/flashDealPricing');

// ─── Get Current Cart ────────────────────────────────────────────────────────
exports.getCart = async (req, res) => {
  try {
    const userId = req.user._id;

    let cart = await Cart.findOne({ user: userId }).populate('items.product', 'name slug price images brand stock isActive variants');

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

    // Re-price line items so flash-deal discounts appear/disappear in step
    // with the advertised deal window (checkout re-prices server-side anyway).
    if (cart.items.length > 0) {
      // F5 — items.product here is a POPULATED document; deal lookup expects ids.
      const dealPriceMap = await getActiveDealPriceMap(
        cart.items.map(i => (i.product && i.product._id ? i.product._id : i.product))
      );
      let changed = false;
      for (const item of cart.items) {
        const dealPrice = dealPriceMap.get(String(item.product._id));
        const base = Number.isFinite(dealPrice) ? dealPrice : (item.product.price || 0);
        const sizeAdj = item.selectedSize?.name && item.product.variants?.sizes?.length > 0
          ? Number(item.product.variants.sizes.find(s => s.name === item.selectedSize.name)?.priceAdjustment) || 0
          : 0;
        const price = Math.max(0, Math.round((base + sizeAdj) * 100) / 100);
        if (item.price !== price) {
          item.price = price;
          changed = true;
        }
      }
      if (changed) {
        await cart.save();
      }
    }

    return successResponse(res, cart);
  } catch (error) {
    logger.error('Get cart error:', error);
    return errorResponse(res, 'Failed to fetch cart', [error.message], 500);
  }
};

// ─── Sync Cart (on login) ────────────────────────────────────────────────────
exports.syncCart = async (req, res) => {
  try {
    const userId = req.user._id;
    const { items } = req.body; // Array from localStorage: [{ id, quantity, price }]

    if (!items || !Array.isArray(items)) {
      return errorResponse(res, 'Invalid cart items', null, 400);
    }

    // Find or create user's cart
    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      cart = new Cart({ user: userId, items: [] });
    }

    // Merge logic: for each localStorage item
    const productIds = items.map(i => i.id || i._id).filter(Boolean);
    const dealPriceMap = await getActiveDealPriceMap(productIds);

    for (const localItem of items) {
      const productId = localItem.id || localItem._id;
      if (!productId) {
continue;
}

      // F3 — carry the chosen size through the sync, same keying as addItem.
      const localSize = localItem.selectedSize?.name
        ? { name: String(localItem.selectedSize.name), priceAdjustment: Number(localItem.selectedSize.priceAdjustment) || 0 }
        : (localItem.size ? { name: String(localItem.size), priceAdjustment: 0 } : null);

      // Verify product exists and is active
      const product = await Product.findById(productId).lean();
      if (!product || !product.isActive) {
continue;
}

      // Validate the size against server data instead of trusting localStorage.
      let serverSizeAdjustment = 0;
      if (localSize) {
        const sizeVariant = product.variants?.sizes?.find(s => s.name === localSize.name);
        if (!sizeVariant) {
          continue; // stale/invalid size from old snapshot — skip the row
        }
        serverSizeAdjustment = Number(sizeVariant.priceAdjustment) || 0;
      } else if (product.variants?.sizes?.length > 0) {
        // Sized product synced without a size choice cannot be ordered later — drop it.
        continue;
      }

      // Active flash-deal price (falls back to the regular product price)
      const dealPrice = dealPriceMap.get(String(productId));
      const basePrice = Number.isFinite(dealPrice) ? dealPrice : product.price;
      const syncPrice = Math.max(0, Math.round((basePrice + serverSizeAdjustment) * 100) / 100);

      const safeQty = Math.max(1, Math.floor(Number(localItem.quantity) || 1));

      // Check if product already in DB cart — matched on product+size like addItem
      const existingIndex = cart.items.findIndex(item => {
        if (item.product.toString() !== productId.toString()) {
          return false;
        }
        return localSize
          ? item.selectedSize?.name === localSize.name
          : !item.selectedSize?.name;
      });

      if (existingIndex >= 0) {
        // Use higher quantity
        cart.items[existingIndex].quantity = Math.max(
          cart.items[existingIndex].quantity,
          safeQty
        );
        // Update price to current (deal-aware) price
        cart.items[existingIndex].price = syncPrice;
        if (localSize) {
          cart.items[existingIndex].selectedSize = localSize;
        }
      } else {
        // Add new item from localStorage
        const syncItem = { product: productId, quantity: safeQty, price: syncPrice };
        if (localSize) {
          syncItem.selectedSize = localSize;
        }
        cart.items.push(syncItem);
      }
    }

    await cart.save();
    
    // Populate and return merged cart
    await cart.populate('items.product', 'name slug price images brand stock isActive variants');

    return successResponse(res, cart, 'Cart synced successfully');
  } catch (error) {
    logger.error('Sync cart error:', error);
    return errorResponse(res, 'Failed to sync cart', [error.message], 500);
  }
};

// ─── Add Item to Cart ────────────────────────────────────────────────────────
exports.addItem = async (req, res) => {
  try {
    const userId = req.user._id;
    const { productId, quantity = 1, selectedSize } = req.body;

    if (!productId) {
      return errorResponse(res, 'Product ID is required', null, 400);
    }

    // Verify product exists
    const product = await Product.findById(productId).lean();
    if (!product || !product.isActive) {
      return errorResponse(res, 'Product not found or inactive', null, 404);
    }

    // Validate size if product has size variants
    let serverSizeAdjustment = 0;
    if (product.variants?.sizes && product.variants.sizes.length > 0) {
      if (!selectedSize || !selectedSize.name) {
        return errorResponse(res, 'Size selection is required for this product', null, 400);
      }

      // Verify selected size exists and is available
      const sizeVariant = product.variants.sizes.find(s => s.name === selectedSize.name);
      if (!sizeVariant) {
        return errorResponse(res, 'Invalid size selection', null, 400);
      }
      if (!sizeVariant.isAvailable || sizeVariant.stock < quantity) {
        return errorResponse(res, `Size ${selectedSize.name} is not available or out of stock`, null, 400);
      }
      serverSizeAdjustment = Number(sizeVariant.priceAdjustment) || 0;
    }

    // Find or create cart
    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      cart = new Cart({ user: userId, items: [] });
    }

    // For products with sizes, each size is a separate cart item
    const existingIndex = cart.items.findIndex(item => {
      const isSameProduct = item.product.toString() === productId.toString();
      if (!selectedSize) {
return isSameProduct;
}

      // Match both product and size
      return isSameProduct && item.selectedSize?.name === selectedSize.name;
    });

    // Active flash-deal price (falls back to the regular product price),
    // plus the server-side size price adjustment — client prices are never trusted.
    const dealPriceMap = await getActiveDealPriceMap([productId]);
    const dealPrice = dealPriceMap.get(String(productId));
    const basePrice = Number.isFinite(dealPrice) ? dealPrice : product.price;
    const finalPrice = Math.max(0, Math.round((basePrice + serverSizeAdjustment) * 100) / 100);

    if (existingIndex >= 0) {
      // Update quantity
      cart.items[existingIndex].quantity += quantity;
      cart.items[existingIndex].price = finalPrice;
      if (selectedSize) {
        cart.items[existingIndex].selectedSize = selectedSize;
      }
    } else {
      // Add new item
      const newItem = {
        product: productId,
        quantity,
        price: finalPrice
      };
      if (selectedSize) {
        newItem.selectedSize = selectedSize;
      }
      cart.items.push(newItem);
    }

    await cart.save();
    await cart.populate('items.product', 'name slug price images brand stock isActive variants');

    return successResponse(res, cart, 'Item added to cart');
  } catch (error) {
    logger.error('Add item error:', error);
    return errorResponse(res, 'Failed to add item', [error.message], 500);
  }
};

// ─── Update Item Quantity ────────────────────────────────────────────────────
exports.updateItem = async (req, res) => {
  try {
    const userId = req.user._id;
    const { productId } = req.params;
    const { quantity, selectedSize } = req.body;

    if (!quantity || quantity < 1) {
      return errorResponse(res, 'Quantity must be at least 1', null, 400);
    }

    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return errorResponse(res, 'Cart not found', null, 404);
    }

    const itemIndex = cart.items.findIndex(item => {
      const isSameProduct = item.product.toString() === productId.toString();
      if (!selectedSize) {
return isSameProduct;
}
      
      // Match both product and size
      return isSameProduct && item.selectedSize?.name === selectedSize.name;
    });

    if (itemIndex === -1) {
      return errorResponse(res, 'Item not found in cart', null, 404);
    }

    // Verify stock for size variant
    if (selectedSize) {
      const product = await Product.findById(productId).lean();
      const sizeVariant = product?.variants?.sizes?.find(s => s.name === selectedSize.name);
      if (sizeVariant && quantity > sizeVariant.stock) {
        return errorResponse(res, `Only ${sizeVariant.stock} units available for size ${selectedSize.name}`, null, 400);
      }
    }

    cart.items[itemIndex].quantity = quantity;
    await cart.save();
    await cart.populate('items.product', 'name slug price images brand stock isActive variants');

    return successResponse(res, cart, 'Item updated');
  } catch (error) {
    logger.error('Update item error:', error);
    return errorResponse(res, 'Failed to update item', [error.message], 500);
  }
};

// ─── Remove Item from Cart ───────────────────────────────────────────────────
// F6 — for sized products a cart row is identified by product+size; callers
// pass ?size=M (or body.selectedSize). Without size, ALL variants of the
// product are removed (legacy behaviour).
exports.removeItem = async (req, res) => {
  try {
    const userId = req.user._id;
    const { productId } = req.params;
    const sizeName = req.query.size || req.body?.selectedSize?.name || null;

    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return errorResponse(res, 'Cart not found', null, 404);
    }

    cart.items = cart.items.filter(item => {
      if (item.product.toString() !== productId.toString()) {
        return true; // keep — different product
      }
      if (sizeName) {
        return item.selectedSize?.name !== String(sizeName); // keep other sizes
      }
      return false; // no size given → remove every variant of this product
    });

    await cart.save();
    await cart.populate('items.product', 'name slug price images brand stock isActive');

    return successResponse(res, cart, 'Item removed from cart');
  } catch (error) {
    logger.error('Remove item error:', error);
    return errorResponse(res, 'Failed to remove item', [error.message], 500);
  }
};

// ─── Clear Cart ──────────────────────────────────────────────────────────────
exports.clearCart = async (req, res) => {
  try {
    const userId = req.user._id;

    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return successResponse(res, null, 'Cart already empty');
    }

    cart.items = [];
    await cart.save();

    return successResponse(res, cart, 'Cart cleared');
  } catch (error) {
    logger.error('Clear cart error:', error);
    return errorResponse(res, 'Failed to clear cart', [error.message], 500);
  }
};

// ─── Mark Cart as Recovered ──────────────────────────────────────────────────
exports.recoverCart = async (req, res) => {
  try {
    const { cartId } = req.params;
    const userId = req.user._id;

    const cart = await Cart.findOne({ _id: cartId, user: userId });
    if (!cart) {
      return errorResponse(res, 'Cart not found', null, 404);
    }

    cart.recoveredAt = new Date();
    cart.isAbandoned = false; // Mark as no longer abandoned
    await cart.save();

    return successResponse(res, cart, 'Cart recovered');
  } catch (error) {
    logger.error('Recover cart error:', error);
    return errorResponse(res, 'Failed to recover cart', [error.message], 500);
  }
};

// ─── Admin: Get Abandoned Cart Stats ─────────────────────────────────────────
exports.getAbandonedCartStats = async (req, res) => {
  try {
    // Total abandoned carts
    const totalAbandoned = await Cart.countDocuments({ isAbandoned: true });

    // Total value at risk
    const abandonedCarts = await Cart.find({ isAbandoned: true }).limit(500).lean();
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
