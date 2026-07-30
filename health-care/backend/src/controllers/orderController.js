const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const CacheService = require('../services/cacheService');
const logger = require('../utils/logger');
const { logActivityAsync, ACTIONS } = require('../utils/activityLogger');
const mongoose = require('mongoose');
const { DELIVERY_FEES } = require('../config/constants');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/responseHelper');
const emailService = require('../services/emailService');
const { sendToUser, sendToAdmins, notifications } = require('../utils/oneSignalService');

const cacheService = new CacheService();

// Generate a human-friendly branded order number: MC-YYMMDD-XXXX
// Example: MC-260623-4231  (14 chars, readable, unique per day)
async function generateOrderNumber() {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const datePart = `${yy}${mm}${dd}`;

  const maxAttempts = 10;
  for (let i = 0; i < maxAttempts; i++) {
    const rand = Math.floor(Math.random() * 9000) + 1000; // 1000-9999
    const orderNumber = `MC-${datePart}-${rand}`;
    const exists = await Order.findOne({ orderNumber }).lean();
    if (!exists) return orderNumber;
  }
  throw new Error('Failed to generate unique order number');
}

/**
 * Create new order with transaction support.
 * 
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Promise<void>}
 * 
 * @route POST /api/orders
 * @access Private
 */
exports.createOrder = async (req, res) => {
  // Start a session for atomic transactions.
  // Falls back to no-session if the MongoDB instance doesn't support replica-set transactions.
  let session = null;
  let useTransaction = false;
  try {
    session = await mongoose.startSession();
    session.startTransaction();
    useTransaction = true;
  } catch {
    // Standalone MongoDB (no replica set) � proceed without transactions
    session = null;
    useTransaction = false;
  }

  const withSession = (q) => (session ? q.session(session) : q);
  const sessionOpt = session ? { session } : {};

  const abortAndError = async (res, msg, code = 400) => {
    if (useTransaction && session) await session.abortTransaction();
    return errorResponse(res, msg, null, code);
  };


  try {
    const { items, deliveryAddress, deliveryMethod, deliveryType, paymentMethod, promoCode, notes, poNumber, loyaltyPointsToRedeem, idempotencyKey, b2bDiscount: clientB2BDiscount, isB2BOrder } = req.body;

    // ? Security Fix #4: Validate idempotency key to prevent double charging
    if (!idempotencyKey || typeof idempotencyKey !== 'string') {
      return abortAndError(res, 'Idempotency key required. Please refresh and try again.', 400);
    }

    // ? Check for duplicate order with same idempotency key
    const existingOrder = await Order.findOne({
      user: req.user.id,
      'metadata.idempotencyKey': idempotencyKey
    }).lean();

    if (existingOrder) {
      logger.info(`[createOrder] Duplicate request detected - idempotency key: ${idempotencyKey}, user: ${req.user.email}`);
      return res.status(200).json({
        success: true,
        message: 'Order already created',
        order: existingOrder,
        isDuplicate: true
      });
    }

    if (!items || !items.length) {
      return abortAndError(res, 'Order must contain at least one item', 400);
    }

    let subtotal = 0;
    let totalB2BSavings = 0; // Track total B2B savings across all items
    const orderItems = [];

    // Validate all items and check stock atomically
    for (const item of items) {
      const product = await withSession(Product.findById(item.product));
      if (!product) {
        return abortAndError(res, `Product not found: ${item.product}`, 404);
      }
      const qty = item.qty || item.quantity || 1;
      
      // Use B2B price if provided from frontend
      const itemPrice = item.price || product.price;
      const isItemB2BPrice = item.isB2BPrice || false;
      const itemB2BSavings = item.b2bSavings || 0;
      totalB2BSavings += itemB2BSavings * qty;
      
      // Check if product has size variants
      if (product.variants?.sizes && product.variants.sizes.length > 0) {
        // Product has sizes - validate size selection
        if (!item.selectedSize || !item.selectedSize.name) {
          return abortAndError(res, `Size selection required for ${product.name}`, 400);
        }
        
        // Find the selected size
        const sizeVariant = product.variants.sizes.find(s => s.name === item.selectedSize.name);
        if (!sizeVariant) {
          return abortAndError(res, `Invalid size ${item.selectedSize.name} for ${product.name}`, 400);
        }
        
        // Check size-specific stock
        if (sizeVariant.stock < qty) {
          return abortAndError(res, `Insufficient stock for ${product.name} (Size: ${item.selectedSize.name}). Available: ${sizeVariant.stock}, Requested: ${qty}`, 400);
        }
        
        // Use price from frontend (already includes size adjustment and B2B discount)
        subtotal += itemPrice * qty;
        
        orderItems.push({ 
          product: product._id, 
          name: product.name, 
          sku: product.sku, 
          brand: product.brand, 
          price: itemPrice, 
          isB2BPrice: isItemB2BPrice,
          b2bSavings: itemB2BSavings,
          qty, 
          quantity: qty,
          variant: {
            size: item.selectedSize.name
          }
        });
      } else {
        // Product without sizes - use regular stock
        if (product.stock < qty) {
          return abortAndError(res, `Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${qty}`, 400);
        }
        subtotal += itemPrice * qty;
        orderItems.push({ 
          product: product._id, 
          name: product.name, 
          sku: product.sku, 
          brand: product.brand, 
          price: itemPrice, 
          isB2BPrice: isItemB2BPrice,
          b2bSavings: itemB2BSavings,
          qty, 
          quantity: qty 
        });
      }
    }

    // B2B discount � use the discount calculated on frontend (already includes per-item B2B pricing)
    // This section is kept for backwards compatibility with old orders that didn't calculate B2B on frontend
    const user = await withSession(User.findById(req.user.id));
    if (!user) {
      return abortAndError(res, 'User not found', 404);
    }
    
    // Use client-calculated B2B discount (more accurate as it's calculated with category discounts)
    const b2bDiscount = clientB2BDiscount || totalB2BSavings || 0;
    const b2bDiscountPct = subtotal > 0 ? Math.round((b2bDiscount / (subtotal + b2bDiscount)) * 10000) / 100 : 0;

    // Promo code discount (Coupon validation and application)
    let couponDiscount = 0;
    let appliedCoupon = null;
    if (promoCode) {
      const Coupon = require('../models/Coupon');
      const coupon = await withSession(Coupon.findOne({ code: promoCode.toUpperCase(), isActive: true }));
      
      if (coupon) {
        const now = new Date();
        const isValid = now >= coupon.startDate && now <= coupon.endDate;
        const hasUsageLeft = !coupon.usageLimit || coupon.usageCount < coupon.usageLimit;
        const notUsedByUser = !coupon.usedBy.includes(req.user.id);
        const meetsMinimum = subtotal >= coupon.minimumOrderAmount;
        const roleMatches = coupon.applicableUserRoles.length === 0 || coupon.applicableUserRoles.includes(user.role);
        
        let isFirstOrder = true;
        if (coupon.isFirstOrderOnly) {
          const orderCount = await withSession(Order.countDocuments({ user: req.user.id, status: { $ne: 'cancelled' } }));
          isFirstOrder = orderCount === 0;
        }
        
        if (isValid && hasUsageLeft && notUsedByUser && meetsMinimum && roleMatches && isFirstOrder) {
          // Calculate discount based on coupon type
          if (coupon.type === 'percentage') {
            // Validate percentage value
            if (coupon.value < 0 || coupon.value > 100) {
              return abortAndError(res, 'Invalid coupon configuration', 400);
            }
            couponDiscount = (subtotal * coupon.value) / 100;
            if (coupon.maximumDiscount && couponDiscount > coupon.maximumDiscount) {
              couponDiscount = coupon.maximumDiscount;
            }
          } else if (coupon.type === 'fixed') {
            couponDiscount = Math.min(coupon.value, subtotal);
          } else if (coupon.type === 'buy_x_get_y') {
            // Calculate buy X get Y discount
            for (const item of orderItems) {
              const setsQualified = Math.floor(item.qty / coupon.buyQuantity);
              const freeItems = setsQualified * coupon.getQuantity;
              const itemDiscount = freeItems * item.price;
              couponDiscount += itemDiscount;
            }
          }
          
          couponDiscount = Math.round(couponDiscount * 100) / 100;
          appliedCoupon = {
            code: coupon.code,
            type: coupon.type,
            discountAmount: couponDiscount
          };
          
          // Update coupon usage
          coupon.usageCount += 1;
          coupon.usedBy.push(req.user.id);
          await coupon.save(sessionOpt);
        } else {
          if (useTransaction && session) await session.abortTransaction();
          // Return specific error message
          let errorMessage = 'Invalid or expired coupon';
          if (!isValid) errorMessage = 'This coupon has expired or is not yet valid';
          else if (!hasUsageLeft) errorMessage = 'This coupon has reached its usage limit';
          else if (!notUsedByUser) errorMessage = 'You have already used this coupon';
          else if (!meetsMinimum) errorMessage = `Minimum order amount of ৳${coupon.minimumOrderAmount.toLocaleString()} required`;
          else if (!roleMatches) errorMessage = 'This coupon is not applicable to your account type';
          else if (!isFirstOrder) errorMessage = 'This coupon is only valid for first-time orders';
          
          return errorResponse(res, errorMessage, null, 400);
        }
      } else {
        if (useTransaction && session) await session.abortTransaction();
        return errorResponse(res, 'Invalid coupon code', null, 404);
      }
    }

    // Delivery fee � Steadfast Courier zone-based pricing from district
    const SUBURBAN_DISTRICTS = new Set([
      'narayanganj', 'gazipur', 'manikganj', 'munshiganj', 'narsingdi',
    ]);
    const rawDistrict = (deliveryAddress?.district || '').trim().toLowerCase();
    let zone = 'outside_dhaka';
    if (!rawDistrict || rawDistrict === 'dhaka') zone = 'inside_dhaka';
    else if (SUBURBAN_DISTRICTS.has(rawDistrict)) zone = 'dhaka_suburban';
    const deliveryFee = DELIVERY_FEES[zone] ?? DELIVERY_FEES.outside_dhaka;

    // Loyalty points redemption
    let loyaltyDiscount = 0;
    let pointsRedeemed = 0;
    if (loyaltyPointsToRedeem && loyaltyPointsToRedeem > 0) {
      const loyaltyService = require('../services/loyaltyService');
      const { MIN_REDEEM_POINTS, POINTS_TO_TAKA, MAX_REDEEM_PERCENT } = loyaltyService.config;
      const subtotalAfterDiscounts = subtotal - b2bDiscount - couponDiscount;

      if (loyaltyPointsToRedeem < MIN_REDEEM_POINTS) {
        return abortAndError(res, `Minimum ${MIN_REDEEM_POINTS} points required to redeem`, 400);
      }
      if ((user.loyaltyPoints || 0) < loyaltyPointsToRedeem) {
        return abortAndError(res, 'Insufficient loyalty points', 400);
      }
      const maxPoints = loyaltyService.maxRedeemablePoints(subtotalAfterDiscounts);
      if (loyaltyPointsToRedeem > maxPoints) {
        return abortAndError(res, `Cannot redeem more than ${maxPoints} points for this order`, 400);
      }

      loyaltyDiscount = loyaltyService.pointsToTaka(loyaltyPointsToRedeem);
      pointsRedeemed = loyaltyPointsToRedeem;

      // Deduct points from user within transaction
      await User.findByIdAndUpdate(
        req.user.id,
        { $inc: { loyaltyPoints: -pointsRedeemed } },
        sessionOpt
      );
    }

    // Total calculation without VAT
    const totalAmount = Math.round((subtotal - b2bDiscount - couponDiscount - loyaltyDiscount + deliveryFee) * 100) / 100;

    const orderNumber = await generateOrderNumber();

    const order = await Order.create([{
      orderNumber,
      orderId: orderNumber,
      user: req.user.id,
      items: orderItems,
      subtotal,
      b2bDiscount,
      b2bDiscountPct,
      isB2BOrder: isB2BOrder || false,
      discount: b2bDiscount,
      promoDiscount: couponDiscount,
      couponDiscount,
      appliedCoupon,
      deliveryFee,
      vatAmount: 0,
      totalAmount,
      total: totalAmount,
      deliveryAddress,
      deliveryType: zone,
      deliveryMethod: zone,
      paymentMethod,
      promoCode: appliedCoupon?.code || null,
      notes,
      poNumber,
      statusTimestamps: { placed: new Date() },
      // ? Security Fix #4: Add metadata with idempotency key
      metadata: {
        idempotencyKey,
        createdVia: 'web',
        userAgent: req.headers['user-agent'],
        ipAddress: req.ip,
        requestId: req.id
      }
    }], sessionOpt);

    // Decrement stock atomically within transaction
    for (const item of orderItems) {
      const product = await withSession(Product.findById(item.product));
      
      // Check if this is a size variant order
      if (item.variant?.size) {
        // Decrement size-specific stock
        const sizeIndex = product.variants.sizes.findIndex(s => s.name === item.variant.size);
        if (sizeIndex === -1) {
          if (useTransaction && session) await session.abortTransaction();
          return res.status(400).json({
            success: false,
            message: `Size variant not found during order processing. Please try again.`
          });
        }
        
        // Check if size has enough stock
        if (product.variants.sizes[sizeIndex].stock < item.qty) {
          if (useTransaction && session) await session.abortTransaction();
          return res.status(400).json({
            success: false,
            message: `Stock changed during order processing for size ${item.variant.size}. Please try again.`
          });
        }
        
        // Decrement size-specific stock
        product.variants.sizes[sizeIndex].stock -= item.qty;
        
        // Also decrement main product stock
        product.stock = Math.max(0, product.stock - item.qty);
        
        await product.save(sessionOpt);
      } else {
        // Regular product without sizes - use original logic
        const result = await Product.findOneAndUpdate(
          { _id: item.product, stock: { $gte: item.qty } },
          { $inc: { stock: -item.qty } },
          { ...sessionOpt, new: true }
        );
        
        if (!result) {
          if (useTransaction && session) await session.abortTransaction();
          return res.status(400).json({
            success: false,
            message: `Stock changed during order processing. Please try again.`
          });
        }
      }
    }

    if (useTransaction && session) await session.commitTransaction();

    // Award loyalty points asynchronously (non-blocking)
    try {
      const loyaltyService = require('../services/loyaltyService');
      const LoyaltyTransaction = require('../models/LoyaltyTransaction');
      const earnedPoints = loyaltyService.calculateEarnedPoints(totalAmount);

      // Check if first order
      const prevOrderCount = await Order.countDocuments({
        user: req.user.id,
        _id: { $ne: order[0]._id },
        status: { $ne: 'cancelled' }
      });
      const isFirstOrder = prevOrderCount === 0;
      const bonusPoints = isFirstOrder ? loyaltyService.config.BONUS_FIRST_ORDER : 0;
      const totalPointsToAward = earnedPoints + bonusPoints;

      if (totalPointsToAward > 0) {
        const updatedUser = await User.findByIdAndUpdate(
          req.user.id,
          { $inc: { loyaltyPoints: totalPointsToAward } },
          { new: true }
        );
        await LoyaltyTransaction.create({
          user: req.user.id,
          type: 'earn',
          points: totalPointsToAward,
          balance: updatedUser.loyaltyPoints,
          description: isFirstOrder
            ? `Earned ${earnedPoints} pts for order ${orderNumber} + ${bonusPoints} first order bonus`
            : `Earned ${earnedPoints} pts for order ${orderNumber}`,
          order: order[0]._id,
          expiresAt: new Date(Date.now() + loyaltyService.config.POINTS_EXPIRY_DAYS * 24 * 60 * 60 * 1000)
        });

        // Record redemption transaction if points were redeemed
        if (pointsRedeemed > 0) {
          const userAfterRedeem = await User.findById(req.user.id).select('loyaltyPoints');
          await LoyaltyTransaction.create({
            user: req.user.id,
            type: 'redeem',
            points: -pointsRedeemed,
            balance: (userAfterRedeem?.loyaltyPoints || 0),
            description: `Redeemed ${pointsRedeemed} pts for ?${loyaltyDiscount} discount on order ${orderNumber}`,
            order: order[0]._id
          });
        }
      }
    } catch (loyaltyErr) {
      logger.error(`[createOrder] loyalty points error (non-fatal): ${loyaltyErr.message}`);
    }

    // Invalidate analytics cache
    cacheService.invalidateAnalytics();

    // Send order confirmation email asynchronously
    emailService.sendNewOrderEmail(order[0], user).then(result => {
      if (result.success) {
        logger.info(`[createOrder] ? Order confirmation email sent to ${user.email}`);
      } else if (result.skipped) {
        logger.warn(`[createOrder] ?? Email skipped: ${result.reason}`);
      } else {
        logger.error(`[createOrder] ? Email failed: ${result.error}`);
      }
    }).catch(err => {
      logger.error(`[createOrder] ? Email exception: ${err.message}`);
      logger.error(`[createOrder] Email error stack: ${err.stack}`);
    });

    // Send order confirmation SMS asynchronously (non-blocking)
    if (user.phone) {
      const { sendOrderConfirmationSMS } = require('../services/smsService');
      sendOrderConfirmationSMS(user.phone, orderNumber, totalAmount).catch(err => 
        logger.error(`[createOrder] SMS failed: ${err.message}`)
      );
    }

    // Send WhatsApp order confirmation asynchronously (non-blocking)
    if (user.phone) {
      const whatsappBot = require('../services/whatsappBot');
      whatsappBot.sendOrderConfirmation(order[0], user).catch(err =>
        logger.error(`[createOrder] WhatsApp failed: ${err.message}`)
      );
    }

    // Send push notifications asynchronously (non-blocking)
    try {
      const userNotif = notifications.orderConfirmed(order[0]);
      if (userNotif) Promise.resolve(userNotif).catch(err =>
        logger.error(`[createOrder] Push notification failed: ${err.message}`)
      );
    } catch (notifErr) {
      logger.error(`[createOrder] Push notification error: ${notifErr.message}`);
    }
    try {
      const adminNotif = notifications.newOrderAdmin(order[0]);
      if (adminNotif) Promise.resolve(adminNotif).catch(err =>
        logger.error(`[createOrder] Admin push notification failed: ${err.message}`)
      );
    } catch (notifErr) {
      logger.error(`[createOrder] Admin push notification error: ${notifErr.message}`);
    }

    // Log order placement activity
    logActivityAsync({
      user: req.user,
      action: ACTIONS.ORDER.PLACED,
      targetModel: 'Order',
      targetId: order[0]._id,
      targetName: orderNumber,
      req,
      metadata: {
        totalAmount,
        itemCount: orderItems.length,
        paymentMethod
      }
    });

    return successResponse(res, { order: order[0] }, 'Order created successfully', 201);
  } catch (error) {
    if (useTransaction && session) {
      try { await session.abortTransaction(); } catch { /* ignore */ }
    }
    
    // ? Security Fix #4: Handle duplicate key error gracefully
    if (error.code === 11000 && error.keyPattern?.['metadata.idempotencyKey']) {
      const existingOrder = await Order.findOne({
        'metadata.idempotencyKey': req.body.idempotencyKey
      }).lean();
      return res.status(200).json({
        success: true,
        message: 'Order already created',
        order: existingOrder,
        isDuplicate: true
      });
    }
    
    logger.error(`[createOrder] ${error.message}`);
    return errorResponse(res, 'Server error', process.env.ERROR_DETAIL_ENABLED === 'true' ? [error.message] : null, 500);
  } finally {
    if (session) session.endSession();
  }
};

/**
 * Get all orders (admin gets all, user gets own).
 * 
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Promise<void>}
 * 
 * @route GET /api/orders
 * @access Private
 */
exports.getOrders = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 20);
    const skip = (page - 1) * limit;

    const query = req.user.role === 'admin' ? {} : { user: req.user.id };

    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate('user', 'name email company')
        .populate('items.product', 'name sku')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Order.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      count: orders.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      orders
    });
  } catch (error) {
    logger.error(`[getOrders] ${error.message}`);
    return errorResponse(res, 'Server error', process.env.ERROR_DETAIL_ENABLED === 'true' ? [error.message] : null, 500);
  }
};

/**
 * Get single order by ID.
 * 
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Promise<void>}
 * 
 * @route GET /api/orders/:id
 * @access Private
 */
exports.getOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email phone company')
      .populate('items.product', 'name sku brand')
      .populate('notesHistory.addedBy', 'name email')
      .lean();

    if (!order) {
      return errorResponse(res, 'Order not found', null, 404);
    }

    // When using .lean(), _id is already a string (no need for .toString())
    const orderUserId = typeof order.user._id === 'string' ? order.user._id : order.user._id.toString();
    if (orderUserId !== req.user.id && req.user.role !== 'admin') {
      return errorResponse(res, 'Not authorized to access this order', null, 403);
    }

    return successResponse(res, { order });
  } catch (error) {
    logger.error(`[getOrder] ${error.message}`);
    return errorResponse(res, 'Server error', process.env.ERROR_DETAIL_ENABLED === 'true' ? [error.message] : null, 500);
  }
};

/**
 * Update order status and send notifications (admin only).
 * 
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Promise<void>}
 * 
 * @route PUT /api/orders/:id/status
 * @access Private/Admin
 */
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status, trackingNumber, courier } = req.body;

    // Validate status
    const validStatuses = ['placed', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'pending'];
    if (!status) {
      return errorResponse(res, 'Status is required', null, 400);
    }
    if (!validStatuses.includes(status)) {
      return errorResponse(res, `Invalid status. Must be one of: ${validStatuses.join(', ')}`, null, 400);
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return errorResponse(res, 'Order not found', null, 404);
    }

    const oldStatus = order.status;

    // Validate status transitions
    const validTransitions = {
      placed:          ['confirmed', 'cancelled'],
      confirmed:       ['processing', 'cancelled'],
      processing:      ['shipped', 'cancelled'],
      shipped:         ['out_for_delivery', 'cancelled'],
      out_for_delivery: ['delivered'],
      delivered:       [],
      cancelled:       [],
      pending:         ['placed', 'cancelled'],
    };
    const allowed = validTransitions[oldStatus];
    if (!allowed || !allowed.includes(status)) {
      return errorResponse(res, `Cannot transition order from '${oldStatus}' to '${status}'`, null, 400);
    }

    order.status = status;
    // Update statusTimestamps using $set pattern
    if (!order.statusTimestamps) order.statusTimestamps = {};
    order.statusTimestamps = { ...order.statusTimestamps, [status]: new Date() };
    order.markModified('statusTimestamps');

    if (trackingNumber) {
      order.trackingNumber = trackingNumber;
      order.tracking = { ...order.tracking, trackingNumber, courier: courier || order.tracking?.courier };
    }
    if (status === 'delivered') {
      order.deliveredAt = new Date();
      
      // -- Update Product soldCount when order is delivered --------------------
      // Increment soldCount for all products in the order
      const Product = require('../models/Product');
      for (const item of order.items) {
        try {
          await Product.findByIdAndUpdate(
            item.product,
            { $inc: { soldCount: item.quantity || item.qty || 1 } },
            { new: false, runValidators: false }
          );
        } catch (err) {
          logger.error(`[updateOrderStatus] Failed to increment soldCount for product ${item.product}: ${err.message}`);
        }
      }
    }

    await order.save();

    // -- Restore product stock when order is cancelled --------------------------
    if (status === 'cancelled' && oldStatus !== 'cancelled') {
      const Product = require('../models/Product');
      const restorePromises = order.items.map(item => {
        if (item.variant?.size) {
          // Restore size-variant stock
          return Product.findById(item.product).then(product => {
            if (product && product.variants?.sizes) {
              const sizeIndex = product.variants.sizes.findIndex(s => s.name === item.variant.size);
              if (sizeIndex !== -1) {
                product.variants.sizes[sizeIndex].stock += (item.qty || item.quantity || 1);
                product.stock = (product.stock || 0) + (item.qty || item.quantity || 1);
                return product.save();
              }
            }
            // Fallback: restore main stock only
            return Product.findByIdAndUpdate(
              item.product,
              { $inc: { stock: item.qty || item.quantity || 1 } }
            );
          });
        }
        return Product.findByIdAndUpdate(
          item.product,
          { $inc: { stock: item.qty || item.quantity || 1 } }
        );
      });
      await Promise.all(restorePromises);
    }

    // Send SMS notification for important status changes (non-blocking)
    const smsStatuses = ['confirmed', 'shipped', 'delivered', 'cancelled'];
    if (smsStatuses.includes(status)) {
      // Populate user to get phone number
      await order.populate('user', 'phone');
      
      if (order.user && order.user.phone) {
        const { sendOrderStatusSMS } = require('../services/smsService');
        sendOrderStatusSMS(order.user.phone, order.orderNumber, status).catch(err =>
          logger.error(`[updateOrderStatus] SMS failed: ${err.message}`)
        );
      }
    }

    // Send WhatsApp notification for status changes (non-blocking)
    const whatsappStatuses = ['confirmed', 'shipped', 'delivered', 'cancelled'];
    if (whatsappStatuses.includes(status)) {
      // Ensure user is populated
      if (!order.user || !order.user.phone) {
        await order.populate('user', 'name email phone');
      }
      
      if (order.user && order.user.phone) {
        const whatsappBot = require('../services/whatsappBot');
        whatsappBot.sendOrderStatusUpdate(order, order.user, status).catch(err =>
          logger.error(`[updateOrderStatus] WhatsApp failed: ${err.message}`)
        );
      }
    }

    // Send push notifications for status changes (non-blocking)
    if (status === 'shipped') {
      sendToUser(order.user._id || order.user, notifications.orderShipped(order)).catch(err =>
        logger.error(`[updateOrderStatus] Push notification failed: ${err.message}`)
      );
    }
    if (status === 'delivered') {
      sendToUser(order.user._id || order.user, notifications.orderDelivered(order)).catch(err =>
        logger.error(`[updateOrderStatus] Push notification failed: ${err.message}`)
      );
    }

    // Log status change activity
    logActivityAsync({
      user: req.user,
      action: ACTIONS.ORDER.STATUS_CHANGED,
      targetModel: 'Order',
      targetId: order._id,
      targetName: order.orderNumber,
      req,
      changes: {
        before: { status: oldStatus },
        after: { status }
      },
      metadata: { trackingNumber, courier }
    });

    return successResponse(res, { order }, 'Order status updated successfully');
  } catch (error) {
    logger.error(`[updateOrderStatus] ${error.message}`, { stack: error.stack });
    
    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return errorResponse(res, messages.join(', '), null, 400);
    }
    
    // Handle cast errors (invalid ObjectId)
    if (error.name === 'CastError') {
      return errorResponse(res, 'Invalid order ID format', null, 400);
    }
    
    return errorResponse(res, 'Failed to update order status. Please try again.', process.env.ERROR_DETAIL_ENABLED === 'true' ? [error.message] : null, 500);
  }
};

/**
 * Cancel order and restore product stock.
 * 
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Promise<void>}
 * 
 * @route PUT /api/orders/:id/cancel
 * @access Private
 */
exports.cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('user');
    if (!order) {
      return errorResponse(res, 'Order not found', null, 404);
    }

    if (order.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return errorResponse(res, 'Not authorized to cancel this order', null, 403);
    }

    if (!['placed', 'pending', 'confirmed'].includes(order.status)) {
      return errorResponse(res, 'Cannot cancel order in current status', null, 400);
    }

    // Restore product stock (including size variants)
    await Promise.all(
      order.items.map(async (item) => {
        if (item.variant?.size) {
          const product = await Product.findById(item.product);
          if (product && product.variants?.sizes) {
            const sizeIndex = product.variants.sizes.findIndex(s => s.name === item.variant.size);
            if (sizeIndex !== -1) {
              product.variants.sizes[sizeIndex].stock += (item.qty || item.quantity || 1);
              product.stock = (product.stock || 0) + (item.qty || item.quantity || 1);
              return product.save();
            }
          }
        }
        return Product.findByIdAndUpdate(item.product, { $inc: { stock: item.qty || item.quantity || 1 } });
      })
    );

    // Roll back B2B credit if used
    if (order.paymentMethod === 'b2b_credit' && order.paymentStatus === 'paid') {
      await User.findByIdAndUpdate(order.user._id, {
        $inc: { creditUsed: -(order.totalAmount || order.total || 0) }
      });
    }

    // Roll back loyalty points
    try {
      const LoyaltyTransaction = require('../models/LoyaltyTransaction');
      let pointsAdjustment = 0;
      let adjustmentDescription = '';

      // Deduct points that were earned from this order
      if (order.loyaltyPointsEarned && order.loyaltyPointsEarned > 0) {
        pointsAdjustment -= order.loyaltyPointsEarned;
        adjustmentDescription += `Deducted ${order.loyaltyPointsEarned} pts earned from cancelled order`;
      }

      // Restore points that were redeemed for this order
      if (order.loyaltyPointsRedeemed && order.loyaltyPointsRedeemed > 0) {
        pointsAdjustment += order.loyaltyPointsRedeemed;
        if (adjustmentDescription) adjustmentDescription += ' | ';
        adjustmentDescription += `Restored ${order.loyaltyPointsRedeemed} pts redeemed on cancelled order`;
      }

      // Apply points adjustment if needed
      if (pointsAdjustment !== 0) {
        const updatedUser = await User.findByIdAndUpdate(
          order.user._id,
          { $inc: { loyaltyPoints: pointsAdjustment } },
          { new: true }
        );

        // Create adjustment transaction
        await LoyaltyTransaction.create({
          user: order.user._id,
          type: 'adjust',
          points: pointsAdjustment,
          balance: updatedUser.loyaltyPoints,
          description: adjustmentDescription,
          order: order._id,
          createdBy: req.user.id
        });

        logger.info(`[cancelOrder] Loyalty points adjusted by ${pointsAdjustment} for order ${order.orderNumber}`);
      }
    } catch (loyaltyErr) {
      logger.error(`[cancelOrder] loyalty points rollback error (non-fatal): ${loyaltyErr.message}`);
    }

    order.status = 'cancelled';
    if (!order.statusTimestamps) order.statusTimestamps = {};
    order.statusTimestamps = { ...order.statusTimestamps, cancelled: new Date() };
    order.markModified('statusTimestamps');
    await order.save();

    // Log order cancellation activity
    logActivityAsync({
      user: req.user,
      action: ACTIONS.ORDER.CANCELLED,
      targetModel: 'Order',
      targetId: order._id,
      targetName: order.orderNumber,
      req,
      metadata: {
        totalAmount: order.totalAmount || order.total,
        itemCount: order.items.length
      }
    });

    return successResponse(res, { order }, 'Order cancelled successfully');
  } catch (error) {
    logger.error(`[cancelOrder] ${error.message}`);
    return errorResponse(res, 'Server error', process.env.ERROR_DETAIL_ENABLED === 'true' ? [error.message] : null, 500);
  }
};

/**
 * Track order by order number (public).
 * 
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Promise<void>}
 * 
 * @route GET /api/orders/track/:orderNumber
 * @access Public
 */
exports.trackOrder = async (req, res) => {
  try {
    const order = await Order.findOne({ orderNumber: req.params.orderNumber })
      .select('orderNumber status statusTimestamps deliveryAddress deliveryType tracking estimatedDelivery deliveredAt items')
      .lean();

    if (!order) {
      return errorResponse(res, 'Order not found', null, 404);
    }

    return successResponse(res, { order });
  } catch (error) {
    logger.error(`[trackOrder] ${error.message}`);
    return errorResponse(res, 'Server error', process.env.ERROR_DETAIL_ENABLED === 'true' ? [error.message] : null, 500);
  }
};

/**
 * Add note to order (admin only).
 * 
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Promise<void>}
 * 
 * @route PATCH /api/orders/:id/notes
 * @access Private/Admin
 */
exports.addOrderNote = async (req, res) => {
  try {
    const { note } = req.body;

    if (!note || !note.trim()) {
      return errorResponse(res, 'Please provide a note', null, 400);
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return errorResponse(res, 'Order not found', null, 404);
    }

    // Add to notes history
    if (!order.notesHistory) {
      order.notesHistory = [];
    }
    order.notesHistory.push({
      note: note.trim(),
      addedBy: req.user.id,
      addedAt: new Date()
    });

    // Update main notes field with latest note
    order.notes = note.trim();
    order.markModified('notesHistory');
    await order.save();

    // Populate the addedBy field for response
    await order.populate('notesHistory.addedBy', 'name email');

    return successResponse(res, { notesHistory: order.notesHistory }, 'Note added successfully');
  } catch (error) {
    logger.error(`[addOrderNote] ${error.message}`);
    return errorResponse(res, 'Server error', process.env.ERROR_DETAIL_ENABLED === 'true' ? [error.message] : null, 500);
  }
};

// --- Admin Notification Handlers ---------------------------------------------
// These record the notification action on the order.
// Plug in your email/SMS service (e.g. Nodemailer, Twilio) inside each case.

const NOTIFICATION_LABELS = {
  confirmation: 'Order Confirmation',
  payment:      'Payment Receipt',
  shipping:     'Shipping Notification',
  delivery:     'Delivery Confirmation',
};

exports.sendNotification = async (req, res) => {
  try {
    const { id }   = req.params;
    const { type } = req.body;

    if (!NOTIFICATION_LABELS[type]) {
      return errorResponse(res, 'Invalid notification type', null, 400);
    }

    // Add database query timeout (5 seconds)
    const order = await Order.findById(id)
      .populate('user', 'name email phone')
      .maxTimeMS(5000)
      .lean();
    if (!order) return errorResponse(res, 'Order not found', null, 404);

    // Get mutable order for updating (without .lean())
    const mutableOrder = await Order.findById(id);
    
    // Record that the admin triggered this notification
    if (!mutableOrder.notifications) mutableOrder.notifications = {};
    mutableOrder.notifications[type] = new Date();
    mutableOrder.markModified('notifications');
    await mutableOrder.save();

    logger.info(`[Notification] Admin sent "${NOTIFICATION_LABELS[type]}" for order ${order.orderNumber} to ${order.user?.email || 'unknown'}`);

    // -- Send real email asynchronously (non-blocking) ------------------------
    // Don't wait for email to complete - respond immediately to prevent timeout
    if (order.user?.email) {
      const customer = { name: order.user.name, email: order.user.email };
      
      // Send email in background (don't await)
      setImmediate(async () => {
        try {
          switch (type) {
            case 'confirmation': await emailService.sendOrderConfirmation(order, customer); break;
            case 'payment':      await emailService.sendPaymentReceipt(order, customer);    break;
            case 'shipping':     await emailService.sendShippingNotification(order, customer); break;
            case 'delivery':     await emailService.sendDeliveryConfirmation(order, customer); break;
          }
          logger.info(`[sendNotification] Email sent successfully: ${type} for order ${order.orderNumber}`);
        } catch (emailErr) {
          logger.warn(`[sendNotification] Email failed (non-fatal): ${emailErr.message}`);
        }
      });
    }
    // -------------------------------------------------------------------------

    return successResponse(res, {
      type,
      label: NOTIFICATION_LABELS[type],
      orderNumber: order.orderNumber,
      sentAt: mutableOrder.notifications[type],
    }, `${NOTIFICATION_LABELS[type]} notification queued successfully`);
  } catch (error) {
    logger.error(`[sendNotification] ${error.message}`);
    return errorResponse(res, 'Failed to send notification', process.env.ERROR_DETAIL_ENABLED === 'true' ? [error.message] : null, 500);
  }
};
