const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const CacheService = require('../services/cacheService');
const logger = require('../utils/logger');
const { logActivityAsync, ACTIONS } = require('../utils/activityLogger');
const mongoose = require('mongoose');
const { DELIVERY_FEES } = require('../config/constants');

const cacheService = new CacheService();

// Generate a collision-resistant order number
async function generateOrderNumber() {
  const maxAttempts = 5;
  for (let i = 0; i < maxAttempts; i++) {
    const rand = Math.floor(Math.random() * 900) + 100; // 100–999
    const orderNumber = `ORD-${Date.now()}-${rand}`;
    const exists = await Order.findOne({ orderNumber }).lean();
    if (!exists) return orderNumber;
  }
  throw new Error('Failed to generate unique order number');
}

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
exports.createOrder = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { items, deliveryAddress, deliveryMethod, deliveryType, paymentMethod, promoCode, notes, poNumber } = req.body;

    if (!items || !items.length) {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: 'Order must contain at least one item' });
    }

    let subtotal = 0;
    const orderItems = [];

    // Validate all items and check stock atomically
    for (const item of items) {
      const product = await Product.findById(item.product).session(session);
      if (!product) {
        await session.abortTransaction();
        return res.status(404).json({ success: false, message: `Product not found: ${item.product}` });
      }
      const qty = item.qty || item.quantity || 1;
      if (product.stock < qty) {
        await session.abortTransaction();
        return res.status(400).json({ success: false, message: `Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${qty}` });
      }
      subtotal += product.price * qty;
      orderItems.push({ product: product._id, name: product.name, sku: product.sku, brand: product.brand, price: product.price, qty, quantity: qty });
    }

    // B2B discount — use user's b2bDiscountPct or default 8%
    const user = await User.findById(req.user.id).session(session);
    let b2bDiscountPct = 0;
    let b2bDiscount = 0;
    if (user.role === 'b2b_customer') {
      b2bDiscountPct = user.b2bDiscountPct || 8;
      b2bDiscount = subtotal * (b2bDiscountPct / 100);
    }

    // Promo code discount (Coupon validation and application)
    let couponDiscount = 0;
    let appliedCoupon = null;
    if (promoCode) {
      const Coupon = require('../models/Coupon');
      const coupon = await Coupon.findOne({ code: promoCode.toUpperCase(), isActive: true }).session(session);
      
      if (coupon) {
        const now = new Date();
        const isValid = now >= coupon.startDate && now <= coupon.endDate;
        const hasUsageLeft = !coupon.usageLimit || coupon.usageCount < coupon.usageLimit;
        const notUsedByUser = !coupon.usedBy.includes(req.user.id);
        const meetsMinimum = subtotal >= coupon.minimumOrderAmount;
        const roleMatches = coupon.applicableUserRoles.length === 0 || coupon.applicableUserRoles.includes(user.role);
        
        let isFirstOrder = true;
        if (coupon.isFirstOrderOnly) {
          const orderCount = await Order.countDocuments({ user: req.user.id, status: { $ne: 'cancelled' } }).session(session);
          isFirstOrder = orderCount === 0;
        }
        
        if (isValid && hasUsageLeft && notUsedByUser && meetsMinimum && roleMatches && isFirstOrder) {
          // Calculate discount based on coupon type
          if (coupon.type === 'percentage') {
            // Validate percentage value
            if (coupon.value < 0 || coupon.value > 100) {
              await session.abortTransaction();
              return res.status(400).json({ 
                success: false, 
                message: 'Invalid coupon configuration' 
              });
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
          await coupon.save({ session });
        } else {
          await session.abortTransaction();
          // Return specific error message
          let errorMessage = 'Invalid or expired coupon';
          if (!isValid) errorMessage = 'This coupon has expired or is not yet valid';
          else if (!hasUsageLeft) errorMessage = 'This coupon has reached its usage limit';
          else if (!notUsedByUser) errorMessage = 'You have already used this coupon';
          else if (!meetsMinimum) errorMessage = `Minimum order amount of ৳${coupon.minimumOrderAmount.toLocaleString()} required`;
          else if (!roleMatches) errorMessage = 'This coupon is not applicable to your account type';
          else if (!isFirstOrder) errorMessage = 'This coupon is only valid for first-time orders';
          
          return res.status(400).json({ success: false, message: errorMessage });
        }
      } else {
        await session.abortTransaction();
        return res.status(404).json({ success: false, message: 'Invalid coupon code' });
      }
    }

    // Delivery fee
    const method = deliveryType || deliveryMethod || 'standard';
    const deliveryFee = DELIVERY_FEES[method] || DELIVERY_FEES.standard;

    // Total calculation without VAT
    const totalAmount = Math.round((subtotal - b2bDiscount - couponDiscount + deliveryFee) * 100) / 100;

    const orderNumber = await generateOrderNumber();

    const order = await Order.create([{
      orderNumber,
      orderId: orderNumber,
      user: req.user.id,
      items: orderItems,
      subtotal,
      b2bDiscount,
      b2bDiscountPct,
      discount: b2bDiscount,
      promoDiscount: couponDiscount,
      couponDiscount,
      appliedCoupon,
      deliveryFee,
      vatAmount: 0,
      totalAmount,
      total: totalAmount,
      deliveryAddress,
      deliveryType: method,
      deliveryMethod: method,
      paymentMethod,
      promoCode: appliedCoupon?.code || null,
      notes,
      poNumber,
      statusTimestamps: { placed: new Date() }
    }], { session });

    // Decrement stock atomically within transaction
    for (const item of orderItems) {
      const result = await Product.findOneAndUpdate(
        { _id: item.product, stock: { $gte: item.qty } },
        { $inc: { stock: -item.qty } },
        { session, new: true }
      );
      
      if (!result) {
        await session.abortTransaction();
        return res.status(400).json({ 
          success: false, 
          message: `Stock changed during order processing. Please try again.` 
        });
      }
    }

    await session.commitTransaction();

    // Invalidate analytics cache
    cacheService.invalidateAnalytics();

    // Send order confirmation email asynchronously
    const { sendOrderConfirmation } = require('../utils/emailService');
    sendOrderConfirmation(order[0], user).catch(err => logger.error(`[createOrder] email failed: ${err.message}`));

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

    res.status(201).json({ success: true, message: 'Order created successfully', order: order[0] });
  } catch (error) {
    await session.abortTransaction();
    logger.error(`[createOrder] ${error.message}`);
    res.status(500).json({ success: false, message: 'Server error', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  } finally {
    session.endSession();
  }
};

// @desc    Get all orders (admin gets all, user gets own)
// @route   GET /api/orders
// @access  Private
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
    res.status(500).json({ success: false, message: 'Server error', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Private
exports.getOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email phone company')
      .populate('items.product', 'name sku brand')
      .populate('notesHistory.addedBy', 'name email');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to access this order' });
    }

    res.status(200).json({ success: true, order });
  } catch (error) {
    logger.error(`[getOrder] ${error.message}`);
    res.status(500).json({ success: false, message: 'Server error', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status, trackingNumber, courier } = req.body;

    // Validate status
    const validStatuses = ['placed', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'pending'];
    if (!status) {
      return res.status(400).json({ success: false, message: 'Status is required' });
    }
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const oldStatus = order.status;
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
    }

    await order.save();

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

    res.status(200).json({ success: true, message: 'Order status updated successfully', order });
  } catch (error) {
    logger.error(`[updateOrderStatus] ${error.message}`, { stack: error.stack });
    
    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    
    // Handle cast errors (invalid ObjectId)
    if (error.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid order ID format' });
    }
    
    res.status(500).json({ 
      success: false, 
      message: process.env.NODE_ENV === 'development' ? error.message : 'Failed to update order status. Please try again.' 
    });
  }
};

// @desc    Cancel order
// @route   PUT /api/orders/:id/cancel
// @access  Private
exports.cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('user');
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to cancel this order' });
    }

    if (!['placed', 'pending', 'confirmed'].includes(order.status)) {
      return res.status(400).json({ success: false, message: 'Cannot cancel order in current status' });
    }

    // Restore product stock
    await Promise.all(
      order.items.map(item =>
        Product.findByIdAndUpdate(item.product, { $inc: { stock: item.qty || item.quantity || 1 } })
      )
    );

    // Roll back B2B credit if used
    if (order.paymentMethod === 'b2b_credit' && order.paymentStatus === 'paid') {
      await User.findByIdAndUpdate(order.user._id, {
        $inc: { creditUsed: -(order.totalAmount || order.total || 0) }
      });
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

    res.status(200).json({ success: true, message: 'Order cancelled successfully', order });
  } catch (error) {
    logger.error(`[cancelOrder] ${error.message}`);
    res.status(500).json({ success: false, message: 'Server error', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

// @desc    Track order by order number (public)
// @route   GET /api/orders/track/:orderNumber
// @access  Public
exports.trackOrder = async (req, res) => {
  try {
    const order = await Order.findOne({ orderNumber: req.params.orderNumber })
      .select('orderNumber status statusTimestamps deliveryAddress deliveryType tracking estimatedDelivery deliveredAt items')
      .lean();

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    res.status(200).json({ success: true, order });
  } catch (error) {
    logger.error(`[trackOrder] ${error.message}`);
    res.status(500).json({ success: false, message: 'Server error', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

// @desc    Add note to order
// @route   PATCH /api/orders/:id/notes
// @access  Private/Admin
exports.addOrderNote = async (req, res) => {
  try {
    const { note } = req.body;

    if (!note || !note.trim()) {
      return res.status(400).json({ success: false, message: 'Please provide a note' });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
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

    res.status(200).json({
      success: true,
      message: 'Note added successfully',
      notesHistory: order.notesHistory
    });
  } catch (error) {
    logger.error(`[addOrderNote] ${error.message}`);
    res.status(500).json({ success: false, message: 'Server error', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};
