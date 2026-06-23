/**
 * Order Service
 * 
 * Business logic layer for order operations.
 * Handles order calculations, validations, and complex multi-model operations.
 */

const logger = require('../utils/logger');
const { DELIVERY_FEES } = require('../config/constants');

/**
 * Generate a collision-resistant order number
 * Format: MC-YYMMDD-XXXX (e.g., MC-260623-0042)
 * 
 * @param {Function} checkOrderNumberExists - Repository function to check if order number exists
 * @returns {Promise<string>} Unique order number
 * @throws {Error} If unable to generate unique order number after max attempts
 */
async function generateOrderNumber(checkOrderNumberExists) {
  const maxAttempts = 10;

  // Get today's date in YYMMDD format
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const datePart = `${yy}${mm}${dd}`;

  for (let i = 0; i < maxAttempts; i++) {
    // 4-digit random number (1000–9999)
    const rand = Math.floor(Math.random() * 9000) + 1000;
    const orderNumber = `MC-${datePart}-${rand}`;
    const exists = await checkOrderNumberExists(orderNumber);
    if (!exists) return orderNumber;
  }

  throw new Error('Failed to generate unique order number');
}

/**
 * Calculate order subtotal from items
 * 
 * @param {Array} items - Order items with product and quantity
 * @returns {number} Subtotal amount
 */
function calculateSubtotal(items) {
  return items.reduce((sum, item) => {
    const qty = item.qty || item.quantity || 1;
    return sum + (item.price * qty);
  }, 0);
}

/**
 * Calculate B2B discount for user
 * 
 * @param {Object} user - User document
 * @param {number} subtotal - Order subtotal
 * @returns {Object} { discountPct, discountAmount }
 */
function calculateB2BDiscount(user, subtotal) {
  if (user.role !== 'b2b_customer') {
    return { discountPct: 0, discountAmount: 0 };
  }

  const discountPct = user.b2bDiscountPct || 8;
  const discountAmount = subtotal * (discountPct / 100);

  return { discountPct, discountAmount };
}

/**
 * Validate and apply coupon to order
 * 
 * @param {string} promoCode - Coupon code
 * @param {Object} user - User document
 * @param {number} subtotal - Order subtotal
 * @param {Array} orderItems - Order items
 * @param {Function} findCoupon - Repository function to find coupon
 * @param {Function} countUserOrders - Repository function to count user orders
 * @param {Object} session - Mongoose session for transaction
 * @returns {Promise<Object>} { couponDiscount, appliedCoupon, couponDoc }
 * @throws {Error} If coupon is invalid or cannot be applied
 */
async function validateAndApplyCoupon(promoCode, user, subtotal, orderItems, findCoupon, countUserOrders, session) {
  if (!promoCode) {
    return { couponDiscount: 0, appliedCoupon: null, couponDoc: null };
  }

  const coupon = await findCoupon(promoCode.toUpperCase(), session);
  
  if (!coupon) {
    throw new Error('Invalid coupon code');
  }

  // Validate coupon conditions
  const now = new Date();
  const isValid = now >= coupon.startDate && now <= coupon.endDate;
  const hasUsageLeft = !coupon.usageLimit || coupon.usageCount < coupon.usageLimit;
  const notUsedByUser = !coupon.usedBy.includes(user._id);
  const meetsMinimum = subtotal >= coupon.minimumOrderAmount;
  const roleMatches = coupon.applicableUserRoles.length === 0 || coupon.applicableUserRoles.includes(user.role);
  
  let isFirstOrder = true;
  if (coupon.isFirstOrderOnly) {
    const orderCount = await countUserOrders(user._id, session);
    isFirstOrder = orderCount === 0;
  }

  // Check all conditions and throw specific error
  if (!isValid) {
    throw new Error('This coupon has expired or is not yet valid');
  }
  if (!hasUsageLeft) {
    throw new Error('This coupon has reached its usage limit');
  }
  if (!notUsedByUser) {
    throw new Error('You have already used this coupon');
  }
  if (!meetsMinimum) {
    throw new Error(`Minimum order amount of ৳${coupon.minimumOrderAmount.toLocaleString()} required`);
  }
  if (!roleMatches) {
    throw new Error('This coupon is not applicable to your account type');
  }
  if (!isFirstOrder) {
    throw new Error('This coupon is only valid for first-time orders');
  }

  // Calculate discount based on coupon type
  let couponDiscount = 0;

  if (coupon.type === 'percentage') {
    if (coupon.value < 0 || coupon.value > 100) {
      throw new Error('Invalid coupon configuration');
    }
    couponDiscount = (subtotal * coupon.value) / 100;
    if (coupon.maximumDiscount && couponDiscount > coupon.maximumDiscount) {
      couponDiscount = coupon.maximumDiscount;
    }
  } else if (coupon.type === 'fixed') {
    couponDiscount = Math.min(coupon.value, subtotal);
  } else if (coupon.type === 'buy_x_get_y') {
    for (const item of orderItems) {
      const setsQualified = Math.floor(item.qty / coupon.buyQuantity);
      const freeItems = setsQualified * coupon.getQuantity;
      const itemDiscount = freeItems * item.price;
      couponDiscount += itemDiscount;
    }
  }

  couponDiscount = Math.round(couponDiscount * 100) / 100;

  const appliedCoupon = {
    code: coupon.code,
    type: coupon.type,
    discountAmount: couponDiscount
  };

  return { couponDiscount, appliedCoupon, couponDoc: coupon };
}

/**
 * Calculate delivery fee based on delivery method
 * 
 * @param {string} district - Delivery district from deliveryAddress
 * @returns {number} Delivery fee amount
 */
function calculateDeliveryFee(district) {
  const SUBURBAN = new Set(['narayanganj', 'gazipur', 'manikganj', 'munshiganj', 'narsingdi']);
  const d = (district || '').trim().toLowerCase();
  let zone = 'outside_dhaka';
  if (!d || d === 'dhaka') zone = 'inside_dhaka';
  else if (SUBURBAN.has(d)) zone = 'dhaka_suburban';
  return DELIVERY_FEES[zone] ?? DELIVERY_FEES.outside_dhaka;
}

/**
 * Validate and calculate loyalty points redemption
 * 
 * @param {number} pointsToRedeem - Points user wants to redeem
 * @param {Object} user - User document
 * @param {number} subtotalAfterDiscounts - Subtotal after other discounts
 * @param {Object} loyaltyService - Loyalty service instance
 * @returns {Object} { loyaltyDiscount, pointsRedeemed }
 * @throws {Error} If redemption is invalid
 */
function validateLoyaltyRedemption(pointsToRedeem, user, subtotalAfterDiscounts, loyaltyService) {
  if (!pointsToRedeem || pointsToRedeem <= 0) {
    return { loyaltyDiscount: 0, pointsRedeemed: 0 };
  }

  const { MIN_REDEEM_POINTS } = loyaltyService.config;

  if (pointsToRedeem < MIN_REDEEM_POINTS) {
    throw new Error(`Minimum ${MIN_REDEEM_POINTS} points required to redeem`);
  }

  if ((user.loyaltyPoints || 0) < pointsToRedeem) {
    throw new Error('Insufficient loyalty points');
  }

  const maxPoints = loyaltyService.maxRedeemablePoints(subtotalAfterDiscounts);
  if (pointsToRedeem > maxPoints) {
    throw new Error(`Cannot redeem more than ${maxPoints} points for this order`);
  }

  const loyaltyDiscount = loyaltyService.pointsToTaka(pointsToRedeem);

  return { loyaltyDiscount, pointsRedeemed: pointsToRedeem };
}

/**
 * Calculate order total amount
 * 
 * @param {number} subtotal - Order subtotal
 * @param {number} b2bDiscount - B2B discount amount
 * @param {number} couponDiscount - Coupon discount amount
 * @param {number} loyaltyDiscount - Loyalty points discount amount
 * @param {number} deliveryFee - Delivery fee amount
 * @returns {number} Total amount (rounded to 2 decimals)
 */
function calculateOrderTotal(subtotal, b2bDiscount, couponDiscount, loyaltyDiscount, deliveryFee) {
  const total = subtotal - b2bDiscount - couponDiscount - loyaltyDiscount + deliveryFee;
  return Math.round(total * 100) / 100;
}

/**
 * Prepare order items from request items and products
 * 
 * @param {Array} requestItems - Items from request
 * @param {Array} products - Product documents
 * @returns {Array} Formatted order items
 */
function prepareOrderItems(requestItems, products) {
  return requestItems.map((item, index) => {
    const product = products[index];
    const qty = item.qty || item.quantity || 1;
    
    return {
      product: product._id,
      name: product.name,
      sku: product.sku,
      brand: product.brand,
      price: product.price,
      qty,
      quantity: qty
    };
  });
}

/**
 * Validate order items stock availability
 * 
 * @param {Array} items - Request items
 * @param {Array} products - Product documents
 * @throws {Error} If any product has insufficient stock
 */
function validateItemsStock(items, products) {
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const product = products[i];
    const qty = item.qty || item.quantity || 1;
    
    if (product.stock < qty) {
      throw new Error(
        `Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${qty}`
      );
    }
  }
}

/**
 * Award loyalty points for order (async, non-blocking)
 * 
 * @param {Object} order - Order document
 * @param {Object} user - User document
 * @param {number} totalAmount - Order total amount
 * @param {number} pointsRedeemed - Points redeemed in this order
 * @param {Function} updateUserPoints - Repository function to update user points
 * @param {Function} createLoyaltyTransaction - Repository function to create transaction
 * @param {Function} countUserOrders - Repository function to count user orders
 */
async function awardLoyaltyPoints(
  order,
  user,
  totalAmount,
  pointsRedeemed,
  updateUserPoints,
  createLoyaltyTransaction,
  countUserOrders
) {
  try {
    const loyaltyService = require('./loyaltyService');
    const earnedPoints = loyaltyService.calculateEarnedPoints(totalAmount);

    // Check if first order
    const prevOrderCount = await countUserOrders(user._id, { _id: { $ne: order._id }, status: { $ne: 'cancelled' } });
    const isFirstOrder = prevOrderCount === 0;
    const bonusPoints = isFirstOrder ? loyaltyService.config.BONUS_FIRST_ORDER : 0;
    const totalPointsToAward = earnedPoints + bonusPoints;

    if (totalPointsToAward > 0) {
      const updatedUser = await updateUserPoints(user._id, totalPointsToAward);
      
      await createLoyaltyTransaction({
        user: user._id,
        type: 'earn',
        points: totalPointsToAward,
        balance: updatedUser.loyaltyPoints,
        description: isFirstOrder
          ? `Earned ${earnedPoints} pts for order ${order.orderNumber} + ${bonusPoints} first order bonus`
          : `Earned ${earnedPoints} pts for order ${order.orderNumber}`,
        order: order._id,
        expiresAt: new Date(Date.now() + loyaltyService.config.POINTS_EXPIRY_DAYS * 24 * 60 * 60 * 1000)
      });

      // Record redemption transaction if points were redeemed
      if (pointsRedeemed > 0) {
        const userAfterRedeem = await updateUserPoints(user._id, 0); // Just fetch current points
        await createLoyaltyTransaction({
          user: user._id,
          type: 'redeem',
          points: -pointsRedeemed,
          balance: userAfterRedeem.loyaltyPoints,
          description: `Redeemed ${pointsRedeemed} pts for ৳${loyaltyService.pointsToTaka(pointsRedeemed)} discount on order ${order.orderNumber}`,
          order: order._id
        });
      }
    }
  } catch (error) {
    logger.error(`[awardLoyaltyPoints] Error (non-fatal): ${error.message}`);
  }
}

/**
 * Send order notifications (email, SMS, WhatsApp)
 * 
 * @param {Object} order - Order document
 * @param {Object} user - User document
 */
async function sendOrderNotifications(order, user) {
  // Send order confirmation email
  try {
    const { sendOrderConfirmation } = require('../utils/emailService');
    await sendOrderConfirmation(order, user);
  } catch (error) {
    logger.error(`[sendOrderNotifications] Email failed: ${error.message}`);
  }

  // Send SMS
  if (user.phone) {
    try {
      const { sendOrderConfirmationSMS } = require('./smsService');
      await sendOrderConfirmationSMS(user.phone, order.orderNumber, order.totalAmount || order.total);
    } catch (error) {
      logger.error(`[sendOrderNotifications] SMS failed: ${error.message}`);
    }
  }

  // Send WhatsApp
  if (user.phone) {
    try {
      const whatsappBot = require('./whatsappBot');
      await whatsappBot.sendOrderConfirmation(order, user);
    } catch (error) {
      logger.error(`[sendOrderNotifications] WhatsApp failed: ${error.message}`);
    }
  }
}

/**
 * Send order status update notifications
 * 
 * @param {Object} order - Order document
 * @param {Object} user - User document
 * @param {string} status - New order status
 */
async function sendStatusUpdateNotifications(order, user, status) {
  const smsStatuses = ['confirmed', 'shipped', 'delivered', 'cancelled'];
  const whatsappStatuses = ['confirmed', 'shipped', 'delivered', 'cancelled'];

  // Send SMS
  if (smsStatuses.includes(status) && user.phone) {
    try {
      const { sendOrderStatusSMS } = require('./smsService');
      await sendOrderStatusSMS(user.phone, order.orderNumber, status);
    } catch (error) {
      logger.error(`[sendStatusUpdateNotifications] SMS failed: ${error.message}`);
    }
  }

  // Send WhatsApp
  if (whatsappStatuses.includes(status) && user.phone) {
    try {
      const whatsappBot = require('./whatsappBot');
      await whatsappBot.sendOrderStatusUpdate(order, user, status);
    } catch (error) {
      logger.error(`[sendStatusUpdateNotifications] WhatsApp failed: ${error.message}`);
    }
  }
}

/**
 * Validate order status transition
 * 
 * @param {string} status - New status
 * @returns {boolean} True if valid
 * @throws {Error} If status is invalid
 */
function validateOrderStatus(status) {
  const validStatuses = [
    'placed', 'confirmed', 'processing', 'shipped', 
    'out_for_delivery', 'delivered', 'cancelled', 'pending'
  ];
  
  if (!status) {
    throw new Error('Status is required');
  }
  
  if (!validStatuses.includes(status)) {
    throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
  }
  
  return true;
}

/**
 * Check if order can be cancelled
 * 
 * @param {Object} order - Order document
 * @returns {boolean} True if can be cancelled
 * @throws {Error} If order cannot be cancelled
 */
function validateOrderCancellation(order) {
  if (!['placed', 'pending', 'confirmed'].includes(order.status)) {
    throw new Error('Cannot cancel order in current status');
  }
  return true;
}

module.exports = {
  generateOrderNumber,
  calculateSubtotal,
  calculateB2BDiscount,
  validateAndApplyCoupon,
  calculateDeliveryFee,
  validateLoyaltyRedemption,
  calculateOrderTotal,
  prepareOrderItems,
  validateItemsStock,
  awardLoyaltyPoints,
  sendOrderNotifications,
  sendStatusUpdateNotifications,
  validateOrderStatus,
  validateOrderCancellation
};
