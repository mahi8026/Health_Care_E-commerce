const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const CacheService = require('../services/cacheService');
const logger = require('../utils/logger');
const { logActivityAsync, ACTIONS } = require('../utils/activityLogger');
const mongoose = require('mongoose');
const { DELIVERY_FEES } = require('../config/constants');
const { successResponse, errorResponse } = require('../utils/responseHelper');
const emailService = require('../services/emailService');
const pricingService = require('../services/pricingService');
const flashDealPricing = require('../services/flashDealPricing');
const { sendToUser, notifications } = require('../utils/oneSignalService');
const { ORDER_STATUSES, ORDER_STATUS_TRANSITIONS } = require('../constants/orderStatus');
// P4-1 — single source of truth for order-number generation now lives in
// orderService; the local copy below was deleted to prevent format drift.
const { generateOrderNumber } = require('../services/orderService');

const cacheService = new CacheService();

// Auto-book a SteadFast shipment when an order transitions to 'shipped'.
// Never throws: booking failures are logged and must not block the status flow.
// Skips when a tracking number is already set (manual entry wins).
async function bookSteadfastShipment(order) {
  try {
    const steadfastService = require('../services/steadfastService');
    if (!steadfastService.isConfigured()) {
      logger.info(`[updateOrderStatus] SteadFast not configured, skipping booking for ${order.orderNumber}`);
      return;
    }
    const address = order.deliveryAddress || {};
    if (!address.name || !address.phone || !(address.street || address.thana || address.district)) {
      logger.warn(`[updateOrderStatus] Missing shipping address for SteadFast booking ${order.orderNumber}`);
      return;
    }
    const payload = steadfastService.buildShipmentPayload(order);
    const consignment = await steadfastService.createShipment(payload);
    order.trackingNumber = consignment.tracking_code || consignment.invoice || order.trackingNumber;
    order.tracking = {
      ...(order.tracking || {}),
      courier: 'SteadFast',
      trackingNumber: order.trackingNumber,
      consignmentId: consignment.consignment_id,
      steadfastStatus: consignment.status,
      dispatchedAt: new Date()
    };
    order.markModified('tracking');
    logger.info(`[updateOrderStatus] SteadFast shipment booked for ${order.orderNumber}: consignment=${consignment.consignment_id} tracking=${consignment.tracking_code}`);
  } catch (error) {
    logger.error(`[updateOrderStatus] SteadFast booking failed for ${order.orderNumber}: ${error.message}`);
  }
}

// B9 — roll back B2B credit and loyalty points when an order is cancelled.
// Shared by cancelOrder and admin updateOrderStatus('cancelled').
async function rollbackOrderFinances(order, performedByUserId) {
  const orderUser = order.user?._id || order.user;

  // Roll back B2B credit if used
  if (order.paymentMethod === 'b2b_credit' && order.paymentStatus === 'paid' && orderUser) {
    const refundAmount = order.totalAmount || order.total || 0;
    await User.findByIdAndUpdate(orderUser, {
      $inc: { creditUsed: -refundAmount },
      $push: {
        creditTransactions: {
          orderId: order._id,
          orderNumber: order.orderNumber,
          amount: refundAmount,
          type: 'refund',
          timestamp: new Date()
        }
      }
    });
    logger.info(`[cancelOrder] B2B credit restored for order ${order.orderNumber}`);
  }

  // Roll back loyalty points
  try {
    const LoyaltyTransaction = require('../models/LoyaltyTransaction');
    let pointsAdjustment = 0;
    let adjustmentDescription = '';

    if (order.loyaltyPointsEarned && order.loyaltyPointsEarned > 0) {
      pointsAdjustment -= order.loyaltyPointsEarned;
      adjustmentDescription += `Deducted ${order.loyaltyPointsEarned} pts earned from cancelled order`;
    }

    if (order.loyaltyPointsRedeemed && order.loyaltyPointsRedeemed > 0) {
      pointsAdjustment += order.loyaltyPointsRedeemed;
      if (adjustmentDescription) {
adjustmentDescription += ' | ';
}
      adjustmentDescription += `Restored ${order.loyaltyPointsRedeemed} pts redeemed on cancelled order`;
    }

    if (pointsAdjustment !== 0 && orderUser) {
      const updatedUser = await User.findByIdAndUpdate(
        orderUser,
        { $inc: { loyaltyPoints: pointsAdjustment } },
        { new: true }
      );

      await LoyaltyTransaction.create({
        user: orderUser,
        type: 'adjust',
        points: pointsAdjustment,
        balance: updatedUser.loyaltyPoints,
        description: adjustmentDescription,
        order: order._id,
        createdBy: performedByUserId
      });
    }
  } catch (loyaltyErr) {
    logger.error(`[cancelOrder] loyalty points rollback error (non-fatal): ${loyaltyErr.message}`);
  }
}

// Order-number generation is consolidated in orderService.generateOrderNumber
// (MC-YYMMDD-XXXXXX, S4-hardened charset). The Order.js pre('save') hook remains
// the safety net for direct model saves outside the controller.
// The injected repository check keeps the service free of model dependencies.

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
    if (useTransaction && session) {
await session.abortTransaction();
}
    return errorResponse(res, msg, null, code);
  };


  try {
    // eslint-disable-next-line no-unused-vars
    const { items, deliveryAddress, deliveryMethod, deliveryType, paymentMethod, promoCode, notes, poNumber, loyaltyPointsToRedeem, idempotencyKey } = req.body;

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

    // Load user early — needed for server-side B2B pricing
    const user = await withSession(User.findById(req.user.id));
    if (!user) {
      return abortAndError(res, 'User not found', 404);
    }

    // ── SECURITY FIX (C1): server-side pricing ──────────────────────────────
    // Client-supplied price / isB2BPrice / b2bSavings / b2bDiscount fields are
    // NEVER trusted. All unit prices, size adjustments and B2B discounts are
    // computed here from the database (see services/pricingService.js).
    let quotedItems;
    try {
      quotedItems = await pricingService.quoteItems(items, user, session || undefined);
    } catch (pricingErr) {
      return abortAndError(res, pricingErr.message, 400);
    }

    // Validate stock atomically and build server-priced order items
    for (const quoted of quotedItems) {
      const product = quoted.product;
      const qty = quoted.qty;
      const itemPrice = quoted.unitPrice;
      const isItemB2BPrice = quoted.isB2BPrice;
      const itemB2BSavings = quoted.savings;
      const sizeName = quoted.sizeName;
      const itemFlashDealId = quoted.flashDealId || null;
      totalB2BSavings += itemB2BSavings * qty;
      
      // Check if product has size variants
      if (sizeName) {
        // Size already validated by pricingService — re-check stock only
        const sizeVariant = product.variants.sizes.find(s => s.name === sizeName);
        if (!sizeVariant || sizeVariant.stock < qty) {
          return abortAndError(res, `Insufficient stock for ${product.name} (Size: ${sizeName}). Available: ${sizeVariant ? sizeVariant.stock : 0}, Requested: ${qty}`, 400);
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
          flashDealId: itemFlashDealId,
          qty, 
          quantity: qty,
          variant: {
            size: sizeName
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
          flashDealId: itemFlashDealId,
          qty, 
          quantity: qty 
        });
      }
    }

    // B2B discount — computed server-side only (client B2B fields are ignored)
    const b2bDiscount = totalB2BSavings;
    const isB2BOrderFlag = pricingService.isEligibleForB2BPricing(user);
    const b2bDiscountPct = subtotal > 0 ? Math.round((b2bDiscount / (subtotal + b2bDiscount)) * 10000) / 100 : 0;

    // Promo code discount (Coupon validation and application)
    let couponDiscount = 0;
    let appliedCoupon = null;
    let reservedCouponId = null;
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
          
          // D2 — atomically reserve coupon usage (prevents exceeding usageLimit
          // under concurrency); fails only if the limit is hit or user already used it
          const couponReserved = await withSession(Coupon.updateOne(
            {
              _id: coupon._id,
              ...(coupon.usageLimit ? { usageCount: { $lt: coupon.usageLimit } } : {}),
              usedBy: { $ne: req.user.id }
            },
            { $inc: { usageCount: 1 }, $push: { usedBy: req.user.id } }
          ));

          if (couponReserved.matchedCount === 0) {
            if (useTransaction && session) {
await session.abortTransaction();
}
            return errorResponse(res, 'This coupon has reached its usage limit or was already used', null, 400);
          }
          reservedCouponId = coupon._id;
        } else {
          if (useTransaction && session) {
await session.abortTransaction();
}
          // Return specific error message
          let errorMessage = 'Invalid or expired coupon';
          if (!isValid) {
errorMessage = 'This coupon has expired or is not yet valid';
} else if (!hasUsageLeft) {
errorMessage = 'This coupon has reached its usage limit';
} else if (!notUsedByUser) {
errorMessage = 'You have already used this coupon';
} else if (!meetsMinimum) {
errorMessage = `Minimum order amount of ৳${coupon.minimumOrderAmount.toLocaleString()} required`;
} else if (!roleMatches) {
errorMessage = 'This coupon is not applicable to your account type';
} else if (!isFirstOrder) {
errorMessage = 'This coupon is only valid for first-time orders';
}
          
          return errorResponse(res, errorMessage, null, 400);
        }
      } else {
        if (useTransaction && session) {
await session.abortTransaction();
}
        return errorResponse(res, 'Invalid coupon code', null, 404);
      }
    }

    // Delivery fee � Steadfast Courier zone-based pricing from district
    const SUBURBAN_DISTRICTS = new Set([
      'narayanganj', 'gazipur', 'manikganj', 'munshiganj', 'narsingdi',
    ]);
    const rawDistrict = (deliveryAddress?.district || '').trim().toLowerCase();
    let zone = 'outside_dhaka';
    if (!rawDistrict || rawDistrict === 'dhaka') {
zone = 'inside_dhaka';
} else if (SUBURBAN_DISTRICTS.has(rawDistrict)) {
zone = 'dhaka_suburban';
}
    const deliveryFee = DELIVERY_FEES[zone] ?? DELIVERY_FEES.outside_dhaka;

    // Loyalty points redemption
    let loyaltyDiscount = 0;
    let pointsRedeemed = 0;
    if (loyaltyPointsToRedeem && loyaltyPointsToRedeem > 0) {
      const loyaltyService = require('../services/loyaltyService');
      const { MIN_REDEEM_POINTS } = loyaltyService.config;
      const subtotalAfterDiscounts = subtotal - b2bDiscount - couponDiscount;

      if (loyaltyPointsToRedeem < MIN_REDEEM_POINTS) {
        return abortAndError(res, `Minimum ${MIN_REDEEM_POINTS} points required to redeem`, 400);
      }
      const maxPoints = loyaltyService.maxRedeemablePoints(subtotalAfterDiscounts);
      if (loyaltyPointsToRedeem > maxPoints) {
        return abortAndError(res, `Cannot redeem more than ${maxPoints} points for this order`, 400);
      }

      loyaltyDiscount = loyaltyService.pointsToTaka(loyaltyPointsToRedeem);
      pointsRedeemed = loyaltyPointsToRedeem;

      // D4 — atomic balance-guarded redemption: no check-then-spend race
      const redemption = await User.findOneAndUpdate(
        { _id: req.user.id, loyaltyPoints: { $gte: pointsRedeemed } },
        { $inc: { loyaltyPoints: -pointsRedeemed } },
        sessionOpt
      );
      if (!redemption) {
        return abortAndError(res, 'Insufficient loyalty points', 400);
      }
    }

    // Total calculation without VAT
    // D2 — floor at zero so stacked discounts (buy_x_get_y / coupon / loyalty /
    // B2B) can never produce a negative chargeable amount.
    const totalAmount = Math.max(
      0,
      Math.round((subtotal - b2bDiscount - couponDiscount - loyaltyDiscount + deliveryFee) * 100) / 100
    );

    // P4-1 — generateOrderNumber now comes from orderService; the injected
    // checker queries the Order collection for uniqueness.
    const orderNumber = await generateOrderNumber(async (candidate) => !!(await Order.findOne({ orderNumber: candidate }).lean()));

    // D1 — pre-compute loyalty earnings so they persist on the order itself
    // (cancelOrder later rolls back these exact values instead of guessing 0)
    const loyaltyServiceForEarn = require('../services/loyaltyService');
    const prevOrderCount = await withSession(Order.countDocuments({ user: req.user.id, status: { $ne: 'cancelled' } }));
    const earnedPoints = loyaltyServiceForEarn.calculateEarnedPoints(totalAmount);
    const firstOrderBonus = prevOrderCount === 0 ? loyaltyServiceForEarn.config.BONUS_FIRST_ORDER : 0;
    const loyaltyPointsEarned = Math.round(earnedPoints + firstOrderBonus);

    const order = await Order.create([{
      orderNumber,
      orderId: orderNumber,
      user: req.user.id,
      items: orderItems,
      subtotal,
      b2bDiscount,
      b2bDiscountPct,
      isB2BOrder: isB2BOrderFlag,
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
      loyaltyPointsEarned,
      loyaltyPointsRedeemed: pointsRedeemed,
      loyaltyDiscount,
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

    // B7 — without a transaction, undo any partial writes on failure
    const compensateFailedOrder = async () => {
      try {
        if (order?.[0]?._id) {
          await Order.deleteOne({ _id: order[0]._id });
        }
      } catch (e) {
        logger.error(`[createOrder] compensation: failed to delete order: ${e.message}`);
      }

      for (const done of decrementedItems) {
        try {
          if (done.isVariant) {
            await Product.updateOne(
              { _id: done.product, 'variants.sizes.name': done.size },
              { $inc: { 'variants.sizes.$.stock': done.qty, stock: done.qty } }
            );
          } else {
            await Product.updateOne({ _id: done.product }, { $inc: { stock: done.qty } });
          }
        } catch (e) {
          logger.error(`[createOrder] compensation: failed to restore stock for ${done.product}: ${e.message}`);
        }
      }

      if (reservedCouponId) {
        try {
          const CouponModel = require('../models/Coupon');
          await CouponModel.updateOne(
            { _id: reservedCouponId, usedBy: req.user.id },
            { $inc: { usageCount: -1 }, $pull: { usedBy: req.user.id } }
          );
        } catch (e) {
          logger.error(`[createOrder] compensation: failed to reverse coupon usage: ${e.message}`);
        }
      }

      if (pointsRedeemed > 0) {
        try {
          await User.updateOne({ _id: req.user.id }, { $inc: { loyaltyPoints: pointsRedeemed } });
        } catch (e) {
          logger.error(`[createOrder] compensation: failed to restore loyalty points: ${e.message}`);
        }
      }
    };

    // Decrement stock atomically within transaction
    const decrementedItems = [];
    for (const item of orderItems) {
      // Check if this is a size variant order
      if (item.variant?.size) {
        // D3 — atomic decrement: guard variant and main stock in a single
        // conditional update (no read-modify-write race in the fallback path)
        const result = await withSession(Product.findOneAndUpdate(
          {
            _id: item.product,
            'variants.sizes.name': item.variant.size,
            'variants.sizes.stock': { $gte: item.qty },
            stock: { $gte: item.qty }
          },
          { $inc: { 'variants.sizes.$.stock': -item.qty, stock: -item.qty } },
          { ...sessionOpt, new: true }
        ));

        if (!result) {
          if (useTransaction && session) {
            await session.abortTransaction();
          } else {
            await compensateFailedOrder();
          }
          return res.status(400).json({
            success: false,
            message: `Stock changed during order processing for size ${item.variant.size}. Please try again.`
          });
        }

        decrementedItems.push({ product: item.product, qty: item.qty, size: item.variant.size, isVariant: true });
      } else {
        // Regular product without sizes - use original logic
        const result = await Product.findOneAndUpdate(
          { _id: item.product, stock: { $gte: item.qty } },
          { $inc: { stock: -item.qty } },
          { ...sessionOpt, new: true }
        );
        
        if (!result) {
          if (useTransaction && session) {
            await session.abortTransaction();
          } else {
            await compensateFailedOrder();
          }
          return res.status(400).json({
            success: false,
            message: `Stock changed during order processing. Please try again.`
          });
        }

        decrementedItems.push({ product: item.product, qty: item.qty, size: null, isVariant: false });
      }
    }

    // Flash deals — count units against each deal's soldCount at placement
    // time so stock-limited deals cannot be oversold during fulfilment.
    // Best-effort: a counter failure must not fail a placed order.
    try {
      await flashDealPricing.changeDealSoldCounts(orderItems, 1, session || undefined);
    } catch (dealErr) {
      logger.error(`[createOrder] flash-deal soldCount increment failed (non-fatal): ${dealErr.message}`);
    }

    if (useTransaction && session) {
await session.commitTransaction();
}

    // Award loyalty points asynchronously (non-blocking)
    try {
      const loyaltyService = require('../services/loyaltyService');
      const LoyaltyTransaction = require('../models/LoyaltyTransaction');

      if (loyaltyPointsEarned > 0) {
        const updatedUser = await User.findByIdAndUpdate(
          req.user.id,
          { $inc: { loyaltyPoints: loyaltyPointsEarned } },
          { new: true }
        );
        await LoyaltyTransaction.create({
          user: req.user.id,
          type: 'earn',
          points: loyaltyPointsEarned,
          balance: updatedUser.loyaltyPoints,
          description: firstOrderBonus > 0
            ? `Earned ${earnedPoints} pts for order ${orderNumber} + ${firstOrderBonus} first order bonus`
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

    // Send new-order notification to admin email asynchronously
    emailService.sendNewOrderAdminEmail(order[0], user).then(result => {
      if (result.success) {
        logger.info(`[createOrder] ? Admin notification sent for order #${orderNumber}`);
      } else if (result.skipped) {
        logger.warn(`[createOrder] ?? Admin email skipped: ${result.reason}`);
      }
    }).catch(err => {
      logger.error(`[createOrder] ? Admin email exception: ${err.message}`);
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
      if (userNotif) {
Promise.resolve(userNotif).catch(err =>
        logger.error(`[createOrder] Push notification failed: ${err.message}`)
      );
}
    } catch (notifErr) {
      logger.error(`[createOrder] Push notification error: ${notifErr.message}`);
    }
    try {
      const adminNotif = notifications.newOrderAdmin(order[0]);
      if (adminNotif) {
Promise.resolve(adminNotif).catch(err =>
        logger.error(`[createOrder] Admin push notification failed: ${err.message}`)
      );
}
    } catch (notifErr) {
      logger.error(`[createOrder] Admin push notification error: ${notifErr.message}`);
    }

    // Emit n8n workflow event (fire-and-forget, never blocks the response)
    try {
      const n8n = require('../services/n8nWebhookService');
      n8n.emitEvent('order-placed', {
        orderId: order[0]._id,
        orderNumber,
        items: orderItems.map(i => ({ name: i.name, sku: i.sku, qty: i.qty, price: i.price })),
        itemCount: orderItems.length,
        subtotal,
        totalAmount,
        paymentMethod,
        deliveryType: deliveryType || deliveryMethod || null,
        isB2BOrder: !!user.b2bAccount,
        deliveryAddress: {
          name: deliveryAddress?.name,
          phone: deliveryAddress?.phone,
          district: deliveryAddress?.district || deliveryAddress?.city
        },
        customer: { id: user._id, name: user.name, email: user.email, phone: user.phone }
      });
    } catch (n8nErr) {
      logger.error(`[createOrder] n8n event error: ${n8nErr.message}`);
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
      try {
 await session.abortTransaction(); 
} catch { /* ignore */ }
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
    if (session) {
session.endSession();
}
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

    // Admin filters (status / paymentStatus / date range / search)
    if (req.user.role === 'admin') {
      const { status, paymentStatus, dateFrom, dateTo, search } = req.query;
      if (status) {
        query.status = status;
      }
      if (paymentStatus) {
        query.paymentStatus = paymentStatus;
      }
      if (dateFrom || dateTo) {
        query.createdAt = {};
        if (dateFrom) {
          query.createdAt.$gte = new Date(dateFrom);
        }
        if (dateTo) {
          const to = new Date(dateTo);
          to.setHours(23, 59, 59, 999);
          query.createdAt.$lte = to;
        }
      }
      if (search) {
        const rx = new RegExp(String(search).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
        query.$or = [{ orderNumber: rx }, { 'deliveryAddress.email': rx }, { 'deliveryAddress.phone': rx }];
      }
    }

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
 * Admin-only: manually book a SteadFast shipment for an order on demand,
 * regardless of its current status. Returns errors so the admin gets feedback.
 *
 * @route POST /api/orders/:id/steadfast/ship
 * @access Private/Admin
 */
exports.shipViaSteadfast = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return errorResponse(res, 'Order not found', null, 404);
    }

    const steadfastService = require('../services/steadfastService');
    if (!steadfastService.isConfigured()) {
      return errorResponse(res, 'SteadFast is not configured. Set STEADFAST_API_KEY and STEADFAST_SECRET_KEY first.', null, 503);
    }

    if (order.tracking?.consignmentId || order.tracking?.courier === 'SteadFast') {
      return errorResponse(res, `Shipment already booked for this order (consignment ${order.tracking.consignmentId || order.tracking.trackingNumber})`, null, 409);
    }

    const address = order.deliveryAddress || {};
    if (!address.name || !address.phone || !(address.street || address.thana || address.district)) {
      return errorResponse(res, 'Order is missing a complete shipping address (name, phone, street/area/district)', null, 400);
    }

    const payload = steadfastService.buildShipmentPayload(order);
    const consignment = await steadfastService.createShipment(payload);

    order.trackingNumber = consignment.tracking_code || consignment.invoice || order.trackingNumber;
    order.tracking = {
      ...(order.tracking || {}),
      courier: 'SteadFast',
      trackingNumber: order.trackingNumber,
      consignmentId: consignment.consignment_id,
      steadfastStatus: consignment.status,
      dispatchedAt: new Date()
    };
    order.markModified('tracking');
    await order.save();

    logActivityAsync({
      user: req.user,
      action: ACTIONS.ORDER.STATUS_CHANGED,
      targetModel: 'Order',
      targetId: order._id,
      targetName: order.orderNumber,
      req,
      changes: { before: {}, after: { steedfastBooked: true } },
      metadata: { consignmentId: consignment.consignment_id, trackingCode: consignment.tracking_code }
    });

    return successResponse(res, {
      order,
      shipment: { consignmentId: consignment.consignment_id, trackingCode: consignment.tracking_code, status: consignment.status }
    }, 'SteadFast shipment booked successfully');
  } catch (error) {
    logger.error(`[shipViaSteadfast] ${error.message}`, { stack: error.stack });
    if (error.name === 'SteadfastError') {
      return errorResponse(res, `SteadFast booking failed: ${error.message}`, error.status ? [error.message] : null, error.status === 0 ? 502 : error.status);
    }
    return errorResponse(res, error.message || 'Failed to book shipment', null, 500);
  }
};

/**
 * Admin-only: current SteadFast account balance.
 *
 * @route GET /api/orders/steadfast/balance
 * @access Private/Admin
 */
exports.getSteadfastBalance = async (_req, res) => {
  try {
    const steadfastService = require('../services/steadfastService');
    if (!steadfastService.isConfigured()) {
      return errorResponse(res, 'SteadFast is not configured', null, 503);
    }
    const balance = await steadfastService.getBalance();
    return successResponse(res, { balance });
  } catch (error) {
    logger.error(`[getSteadfastBalance] ${error.message}`);
    if (error.name === 'SteadfastError') {
      return errorResponse(res, `SteadFast balance check failed: ${error.message}`, null, 502);
    }
    return errorResponse(res, 'Failed to fetch SteadFast balance', null, 500);
  }
};

/**
 * Admin-only: check a phone number against SteadFast's fraud reports.
 * Used by the order detail modal before booking a single shipment.
 *
 * @route GET /api/orders/steadfast/fraud/:phone
 * @access Private/Admin
 */
exports.checkSteadfastFraud = async (req, res) => {
  try {
    const steadfastService = require('../services/steadfastService');
    if (!steadfastService.isConfigured()) {
      return errorResponse(res, 'SteadFast is not configured', null, 503);
    }
    const result = await steadfastService.checkFraud(req.params.phone);
    return successResponse(res, {
      phone: result.phone,
      flagged: Boolean(result.fraud),
      reason: result.fraud,
      status: result.status,
    });
  } catch (error) {
    logger.error(`[checkSteadfastFraud] ${error.message}`);
    if (error.name === 'SteadfastError') {
      return errorResponse(res, `SteadFast fraud check failed: ${error.message}`, null, 502);
    }
    return errorResponse(res, 'Failed to check fraud status', null, 500);
  }
};

/**
 * Run `fn` over `items` with at most `limit` promises in flight, preserving
 * input order of results.
 */
async function runWithConcurrency(items, limit, fn) {
  const results = new Array(items.length);
  let cursor = 0;
  async function worker() {
    while (cursor < items.length) {
      const idx = cursor;
      cursor += 1;
      results[idx] = await fn(items[idx], idx);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

/**
 * Admin-only: bulk-book SteadFast shipments for orders that are eligible
 * (match the optional status filter, have a complete delivery address, are
 * not cancelled/delivered/refunded, and have no existing SteadFast booking).
 * One failed order never aborts the batch — every order is reported
 * individually so the admin can retry just the failures.
 *
 * @route POST /api/orders/steadfast/bulk-ship
 * @access Private/Admin
 */
exports.bulkShipViaSteadfast = async (req, res) => {
  try {
    const { status, ids } = req.body || {};

    const query = {
      status: { $nin: ['cancelled', 'delivered', 'refunded'] },
      'tracking.courier': { $ne: 'SteadFast' }
    };
    if (Array.isArray(ids) && ids.length > 0) {
      query._id = { $in: ids.map(id => String(id)) };
    } else if (status && typeof status === 'string') {
      query.status = status;
    }

    const orders = await Order.find(query).limit(200);
    if (orders.length === 0) {
      return successResponse(res, { booked: 0, skipped: 0, failed: 0, results: [] }, 'No eligible orders found for bulk shipping');
    }

    const steadfastService = require('../services/steadfastService');
    if (!steadfastService.isConfigured()) {
      return errorResponse(res, 'SteadFast is not configured. Set STEADFAST_API_KEY and STEADFAST_SECRET_KEY first.', null, 503);
    }

    // S6 — fraud pre-check for at-risk (COD, unpaid) orders only. Best-effort:
    // a failed fraud lookup never blocks business, and prepaid orders skip the
    // check entirely. Disable with { checkFraud: false }.
    const fraudByOrder = new Map();
    const doFraudCheck = (req.body || {}).checkFraud !== false;
    if (doFraudCheck) {
      const atRisk = orders.filter(o => {
        const address = o.deliveryAddress || {};
        return o.paymentStatus !== 'paid'
          && !(o.tracking?.consignmentId || o.tracking?.courier === 'SteadFast')
          && address.name && address.phone && (address.street || address.thana || address.district);
      });
      const checked = await runWithConcurrency(atRisk, 5, async order => {
        const phone = steadfastService.normalizePhone(order.deliveryAddress.phone);
        if (!phone) {
          return { id: order._id, flagged: false };
        }
        try {
          const result = await steadfastService.checkFraud(phone);
          return { id: order._id, flagged: Boolean(result.fraud), reason: result.fraud };
        } catch (error) {
          logger.warn(`[bulkShipViaSteadfast] Fraud check failed for ${order.orderNumber}: ${error.message}`);
          return { id: order._id, flagged: false };
        }
      });
      for (const check of checked) {
        fraudByOrder.set(check.id.toString(), check);
      }
    }

    const results = [];
    let booked = 0;
    let skipped = 0;
    let failed = 0;
    let fraudFlagged = 0;

    for (const order of orders) {
      const result = { orderId: order._id, orderNumber: order.orderNumber, status: order.status };

      if (order.tracking?.consignmentId || order.tracking?.courier === 'SteadFast') {
        result.skipReason = 'already_booked';
        skipped += 1;
        results.push(result);
        continue;
      }

      const address = order.deliveryAddress || {};
      if (!address.name || !address.phone || !(address.street || address.thana || address.district)) {
        result.skipReason = 'incomplete_address';
        skipped += 1;
        results.push(result);
        continue;
      }

      const fraud = fraudByOrder.get(order._id.toString());
      if (doFraudCheck && fraud && fraud.flagged) {
        result.skipReason = 'fraud_flagged';
        result.fraudReason = fraud.reason;
        fraudFlagged += 1;
        skipped += 1;
        results.push(result);
        continue;
      }

      try {
        const payload = steadfastService.buildShipmentPayload(order);
        const consignment = await steadfastService.createShipment(payload);

        order.trackingNumber = consignment.tracking_code || consignment.invoice || order.trackingNumber;
        order.tracking = {
          ...(order.tracking || {}),
          courier: 'SteadFast',
          trackingNumber: order.trackingNumber,
          consignmentId: consignment.consignment_id,
          steadfastStatus: consignment.status,
          dispatchedAt: new Date()
        };
        order.markModified('tracking');
        await order.save();

        result.shipment = {
          consignmentId: consignment.consignment_id,
          trackingCode: consignment.tracking_code,
          status: consignment.status
        };
        booked += 1;
      } catch (error) {
        failed += 1;
        result.error = error.name === 'SteadfastError' ? error.message : 'Booking failed';
        logger.error(`[bulkShipViaSteadfast] ${order.orderNumber}: ${error.message}`);
      }
      results.push(result);
    }

    return successResponse(res, { booked, skipped, failed, fraudFlagged, results }, `Bulk shipping complete: ${booked} booked, ${skipped} skipped, ${failed} failed`);
  } catch (error) {
    logger.error(`[bulkShipViaSteadfast] ${error.message}`, { stack: error.stack });
    return errorResponse(res, error.message || 'Failed to run bulk shipping', null, 500);
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

    // Validate status (single source of truth: constants/orderStatus)
    if (!status) {
      return errorResponse(res, 'Status is required', null, 400);
    }
    if (!ORDER_STATUSES.includes(status)) {
      return errorResponse(res, `Invalid status. Must be one of: ${ORDER_STATUSES.join(', ')}`, null, 400);
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return errorResponse(res, 'Order not found', null, 404);
    }

    const oldStatus = order.status;

    // Validate status transitions (single source of truth: constants/orderStatus)
    const allowed = ORDER_STATUS_TRANSITIONS[oldStatus];
    if (!allowed || !allowed.includes(status)) {
      return errorResponse(res, `Cannot transition order from '${oldStatus}' to '${status}'`, null, 400);
    }

    // B8 — 'cancelled' and 'delivered' perform side effects (stock restore,
    // credit/loyalty rollback, soldCount) that must run exactly once, so their
    // transitions are claimed atomically: only one concurrent request wins.
    if (status === 'cancelled' || status === 'delivered') {
      const claimed = await Order.updateOne(
        { _id: order._id, status: oldStatus },
        {
          $set: {
            status,
            [`statusTimestamps.${status}`]: new Date(),
            ...(status === 'delivered' ? { deliveredAt: new Date() } : {})
          }
        }
      );

      if (claimed.matchedCount === 0) {
        return errorResponse(res, `Order status was already changed by another request`, null, 409);
      }

      order.status = status;
      if (!order.statusTimestamps) {
order.statusTimestamps = {};
}
      order.statusTimestamps[status] = new Date();
      if (status === 'delivered') {
        order.deliveredAt = new Date();
      }

      if (status === 'delivered') {
        // -- Update Product soldCount when order is delivered --------------------
        // Only the winning request increments soldCount
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
      } else {
        // -- Restore product stock when order is cancelled ----------------------
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

        // B9 — admin cancellation must roll back B2B credit and loyalty points
        await rollbackOrderFinances(order, req.user.id);

        // Flash deals — free deal quota only while the deal is still live,
        // so ended deals keep their historical soldCount accuracy
        try {
          await flashDealPricing.changeDealSoldCounts(
            order.items.map((i) => ({ product: i.product, flashDealId: i.flashDealId, qty: i.qty || i.quantity || 1 })),
            -1
          );
        } catch (dealErr) {
          logger.error(`[updateOrderStatus] flash-deal soldCount rollback failed for ${order.orderNumber}: ${dealErr.message}`);
        }
      }
    } else {
      order.status = status;
      // Update statusTimestamps using $set pattern
      if (!order.statusTimestamps) {
order.statusTimestamps = {};
}
      order.statusTimestamps = { ...order.statusTimestamps, [status]: new Date() };
      order.markModified('statusTimestamps');

      if (trackingNumber) {
        order.trackingNumber = trackingNumber;
        order.tracking = { ...order.tracking, trackingNumber, courier: courier || order.tracking?.courier };
      }

      // Auto-book SteadFast shipment (best effort, non-blocking)
      if (status === 'shipped' && !order.trackingNumber && !order.tracking?.consignmentId) {
        await bookSteadfastShipment(order);
      }

      await order.save();
    }

    // Send SMS notification for important status changes (non-blocking)
    const smsStatuses = ['confirmed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'];
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
    const whatsappStatuses = ['confirmed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'];
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

    // Emit n8n workflow event (fire-and-forget, never blocks the response)
    try {
      const n8n = require('../services/n8nWebhookService');
      Promise.resolve(order.populate('user', 'name email phone'))
        .then(() => {
          const payload = {
            orderId: order._id,
            orderNumber: order.orderNumber,
            oldStatus,
            newStatus: status,
            totalAmount: order.totalAmount,
            paymentMethod: order.paymentMethod,
            tracking: order.tracking || null,
            customer: {
              id: order.user ? order.user._id : null,
              name: (order.user && order.user.name) || (order.deliveryAddress && order.deliveryAddress.name) || 'Customer',
              email: order.user ? order.user.email : null,
              // Fall back to the checkout contact number when the profile has none
              phone: (order.user && order.user.phone) || (order.deliveryAddress && order.deliveryAddress.phone) || null
            }
          };
          n8n.emitEvent('order-status-changed', payload);
          // Distinct lifecycle event for post-purchase flows (review requests)
          if (status === 'delivered') {
            n8n.emitEvent('order-delivered', payload);
          }
        })
        .catch((err) => logger.error(`[updateOrderStatus] n8n event failed: ${err.message}`));
    } catch (n8nErr) {
      logger.error(`[updateOrderStatus] n8n event error: ${n8nErr.message}`);
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
 * Verify payment for an order (admin marks bank-transfer/bKash as paid).
 *
 * @route PATCH /api/orders/:id/verify-payment
 * @access Private/Admin
 */
exports.verifyOrderPayment = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('user', 'name email phone');
    if (!order) {
      return errorResponse(res, 'Order not found', null, 404);
    }
    if (order.paymentStatus === 'paid') {
      return errorResponse(res, 'Payment already verified', null, 400);
    }

    const previous = order.paymentStatus;
    order.paymentStatus = 'paid';
    await order.save();

    logger.info(`[verifyOrderPayment] ${order.orderNumber} paymentStatus ${previous} -> paid by ${req.user.email}`);

    logActivityAsync({
      user: req.user,
      action: ACTIONS.PAYMENT.VERIFIED,
      targetModel: 'Order',
      targetId: order._id,
      targetName: order.orderNumber,
      req,
      changes: { before: { paymentStatus: previous }, after: { paymentStatus: 'paid' } }
    });

    return successResponse(res, { order }, 'Payment verified successfully');
  } catch (error) {
    logger.error(`[verifyOrderPayment] ${error.message}`, { stack: error.stack });
    if (error.name === 'CastError') {
      return errorResponse(res, 'Invalid order ID format', null, 400);
    }
    return errorResponse(res, 'Failed to verify payment', process.env.ERROR_DETAIL_ENABLED === 'true' ? [error.message] : null, 500);
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

    // B8 — atomically claim the cancellation BEFORE any rollback, so a second
    // concurrent request sees the new status and cannot double-restore stock
    // or double-refund credit/loyalty
    const claimed = await Order.updateOne(
      { _id: order._id, status: { $in: ['placed', 'pending', 'confirmed'] } },
      { $set: { status: 'cancelled', ['statusTimestamps.cancelled']: new Date() } }
    );
    if (claimed.matchedCount === 0) {
      return errorResponse(res, 'Cannot cancel order in current status', null, 400);
    }
    order.status = 'cancelled';
    if (!order.statusTimestamps) {
order.statusTimestamps = {};
}
    order.statusTimestamps.cancelled = new Date();

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

    // Roll back B2B credit and loyalty points
    await rollbackOrderFinances(order, req.user.id);

    // Flash deals — free deal quota only while the deal is still live,
    // so ended deals keep their historical soldCount accuracy
    try {
      await flashDealPricing.changeDealSoldCounts(
        order.items.map((i) => ({ product: i.product, flashDealId: i.flashDealId, qty: i.qty || i.quantity || 1 })),
        -1
      );
    } catch (dealErr) {
      logger.error(`[cancelOrder] flash-deal soldCount rollback failed for ${order.orderNumber}: ${dealErr.message}`);
    }

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
    if (!order) {
return errorResponse(res, 'Order not found', null, 404);
}

    // Get mutable order for updating (without .lean())
    const mutableOrder = await Order.findById(id);
    
    // Record that the admin triggered this notification
    if (!mutableOrder.notifications) {
mutableOrder.notifications = {};
}
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
