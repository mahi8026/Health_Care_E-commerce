const Cart = require('../models/Cart');
const Product = require('../models/Product');
const mongoose = require('mongoose');
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
// ─── Guest Cart Recovery: Track Snapshot (public) ─────────────────────────────
// POST /api/cart/track
//
// Guest carts live only in localStorage, so the recovery cron had nothing to
// act on for guests — it filtered on `user: { $exists: true, $ne: null }`.
// This persists a guest cart snapshot keyed by a client-generated sessionId
// together with the email captured at checkout, which is exactly what the
// recovery sweep needs to email the guest back.
//
// Prices are always re-derived from the database; the client snapshot is never
// trusted, so a tampered localStorage cannot inflate the cart shown in email.
const MAX_TRACKED_ITEMS = 50;

exports.trackGuestCart = async (req, res) => {
  try {
    const { sessionId, email, items } = req.body || {};

    // The sessionId is the guest's cart key — keep it opaque, bounded and safe
    // to use as a query value.
    if (typeof sessionId !== 'string' || !/^[A-Za-z0-9_-]{8,64}$/.test(sessionId)) {
      return errorResponse(res, 'A valid sessionId is required', null, 400);
    }

    const contactEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    if (contactEmail && !/^\S+@\S+\.\S+$/.test(contactEmail)) {
      return errorResponse(res, 'A valid email address is required', null, 400);
    }

    if (items !== undefined && !Array.isArray(items)) {
      return errorResponse(res, 'items must be an array', null, 400);
    }

    // Guests are keyed by sessionId only — never touch an account's cart.
    let cart = await Cart.findOne({ sessionId, user: null });
    const isNewCart = !cart;
    if (isNewCart) {
      cart = new Cart({ sessionId, user: null, items: [] });
    }

    // Stays undefined when the client sends no items array, which means
    // "leave the stored items exactly as they are".
    let trackedItems;

    if (Array.isArray(items)) {
      const requested = items.slice(0, MAX_TRACKED_ITEMS);
      const productIds = requested
        .map((i) => i && (i.id || i.productId || i._id))
        .filter((id) => id && mongoose.Types.ObjectId.isValid(String(id)))
        .map(String);

      const dealPriceMap = await getActiveDealPriceMap(productIds);
      const products = await Product.find({ _id: { $in: productIds }, isActive: true })
        .select('price variants')
        .lean();
      const byId = new Map(products.map((p) => [String(p._id), p]));

      const tracked = [];
      for (const item of requested) {
        const id = String((item && (item.id || item.productId || item._id)) || '');
        const product = byId.get(id);
        if (!product) {
          continue; // deleted or inactive product — skip the row
        }

        const quantity = Math.max(1, Math.min(99, parseInt(item.quantity, 10) || 1));

        // Reject a size the product does not offer (stale localStorage snapshot).
        const sizeName = (item.selectedSize && item.selectedSize.name) || item.size || null;
        let sizeAdjustment = 0;
        if (sizeName) {
          const sizeVariant = product.variants?.sizes?.find((s) => s.name === sizeName);
          if (!sizeVariant) {
            continue; // stale size — drop the line
          }
          sizeAdjustment = Number(sizeVariant.priceAdjustment) || 0;
        }

        const dealPrice = dealPriceMap.get(id);
        const basePrice = Number.isFinite(dealPrice) ? dealPrice : (product.price || 0);

        tracked.push({
          product: product._id,
          quantity,
          price: Math.max(0, Math.round((basePrice + sizeAdjustment) * 100) / 100),
          ...(sizeName
            ? { selectedSize: { name: String(sizeName), priceAdjustment: sizeAdjustment } }
            : {}),
        });
      }
      trackedItems = tracked;
    }

    const applySnapshot = (target) => {
      if (trackedItems) {
        target.items = trackedItems;
      }
      // Capturing an email arms recovery. `recoveryEmailSent` is deliberately NOT
      // reset here: suppression is max one recovery email per cart (same rule the
      // n8n WF-03 workflow documents).
      if (contactEmail) {
        target.contactEmail = contactEmail;
      }
      // Every tracking call is activity — this is what "abandoned" is measured against.
      target.lastActivity = new Date();
    };

    applySnapshot(cart);
    try {
      await cart.save();
    } catch (saveErr) {
      // Two concurrent first-track calls for the same sessionId race here; the
      // unique index on sessionId rejects the loser with E11000. Re-load the
      // winner and apply the snapshot to it instead of failing the request or
      // leaving a duplicate guest cart behind.
      if (saveErr?.code !== 11000 || !isNewCart) {
        throw saveErr;
      }
      cart = await Cart.findOne({ sessionId, user: null });
      if (!cart) {
        throw saveErr;
      }
      applySnapshot(cart);
      await cart.save();
    }

    return successResponse(
      res,
      { tracked: cart.items.length, hasEmail: Boolean(cart.contactEmail) },
      'Cart tracked'
    );
  } catch (error) {
    logger.error('Track guest cart error:', error);
    return errorResponse(res, 'Failed to track cart', [error.message], 500);
  }
};

// ─── Guest Cart Recovery: Opt Out (public) ───────────────────────────────────
// GET /api/cart/recovery-optout?token=...
//
// Target of the unsubscribe link in a recovery email. Sets recoveryOptOut so
// the guest is never emailed about this cart again, and marks recoveryEmailSent
// so the recovery sweep stops picking the row up.
//
// No request data is echoed into the HTML, so there is nothing to escape.
function optOutPage(ok, heading, message) {
  const accent = ok ? '#0F766E' : '#B91C1C';
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${heading} — MediportBD</title></head>
<body style="margin:0;background:#F8FAFC;font-family:-apple-system,Segoe UI,Roboto,sans-serif;">
  <div style="max-width:520px;margin:12vh auto;padding:32px;background:#fff;border:1px solid #E5E7EB;border-radius:12px;text-align:center;">
    <h1 style="margin:0 0 10px;font-size:20px;color:${accent};">${heading}</h1>
    <p style="margin:0;font-size:14px;color:#6B7280;line-height:1.6;">${message}</p>
    <p style="margin:24px 0 0;"><a href="/" style="font-size:14px;color:#0B2545;text-decoration:underline;">Continue browsing</a></p>
  </div>
</body></html>`;
}

exports.recoveryOptOut = async (req, res) => {
  try {
    const { token } = req.query;

    if (typeof token !== 'string' || !token) {
      return res.status(400).send(optOutPage(false, 'Invalid link', 'This unsubscribe link is missing its token.'));
    }

    const cart = await Cart.findOne({ recoveryOptOutToken: token });
    if (!cart) {
      return res.status(404).send(optOutPage(
        false,
        'Link not recognised',
        'We could not find this cart. It may have already been cleaned up.'
      ));
    }

    cart.recoveryOptOut = true;
    cart.recoveryEmailSent = true; // ensures the sweep skips it even if the flag is missed
    await cart.save();

    return res.status(200).send(optOutPage(
      true,
      'You are unsubscribed',
      'We will not send you any more reminders about this cart.'
    ));
  } catch (error) {
    logger.error('Cart recovery opt-out error:', error);
    return res.status(500).send(optOutPage(false, 'Something went wrong', 'Please try again later.'));
  }
};

