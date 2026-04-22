const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const CacheService = require('../services/cacheService');
const logger = require('../utils/logger');

const VAT_RATE = 0.05; // 5%
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
  try {
    const { items, deliveryAddress, deliveryMethod, deliveryType, paymentMethod, promoCode, notes, poNumber } = req.body;

    if (!items || !items.length) {
      return res.status(400).json({ success: false, message: 'Order must contain at least one item' });
    }

    let subtotal = 0;
    const orderItems = [];

    // Validate all items first, then decrement stock
    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(404).json({ success: false, message: `Product not found: ${item.product}` });
      }
      const qty = item.qty || item.quantity || 1;
      if (product.stock < qty) {
        return res.status(400).json({ success: false, message: `Insufficient stock for ${product.name}` });
      }
      subtotal += product.price * qty;
      orderItems.push({ product: product._id, name: product.name, sku: product.sku, brand: product.brand, price: product.price, qty, quantity: qty });
    }

    // B2B discount — use user's b2bDiscountPct or default 8%
    const user = await User.findById(req.user.id);
    let b2bDiscountPct = 0;
    let b2bDiscount = 0;
    if (user.role === 'b2b_customer') {
      b2bDiscountPct = user.b2bDiscountPct || 8;
      b2bDiscount = subtotal * (b2bDiscountPct / 100);
    }

    // Delivery fee
    const method = deliveryType || deliveryMethod || 'standard';
    let deliveryFee = 150;
    if (method === 'express') deliveryFee = 300;
    else if (method === 'nationwide') deliveryFee = 200;
    else if (method === 'cold_chain') deliveryFee = 500;

    // VAT applies to (subtotal - discount + deliveryFee)
    const taxableAmount = subtotal - b2bDiscount + deliveryFee;
    const vatAmount = Math.round(taxableAmount * VAT_RATE * 100) / 100;
    const totalAmount = Math.round((taxableAmount + vatAmount) * 100) / 100;

    const orderNumber = await generateOrderNumber();

    const order = await Order.create({
      orderNumber,
      orderId: orderNumber,
      user: req.user.id,
      items: orderItems,
      subtotal,
      b2bDiscount,
      b2bDiscountPct,
      discount: b2bDiscount,
      deliveryFee,
      vatAmount,
      totalAmount,
      total: totalAmount,
      deliveryAddress,
      deliveryType: method,
      deliveryMethod: method,
      paymentMethod,
      promoCode,
      notes,
      poNumber,
      statusTimestamps: { placed: new Date() }
    });

    // Decrement stock after order is created successfully
    for (const item of orderItems) {
      await Product.findByIdAndUpdate(item.product, { $inc: { stock: -item.qty } });
    }

    // Invalidate analytics cache
    cacheService.invalidateAnalytics();

    // Send order confirmation email asynchronously
    const { sendOrderConfirmation } = require('../utils/emailService');
    sendOrderConfirmation(order, user).catch(err => logger.error(`[createOrder] email failed: ${err.message}`));

    res.status(201).json({ success: true, message: 'Order created successfully', order });
  } catch (error) {
    logger.error(`[createOrder] ${error.message}`);
    res.status(500).json({ success: false, message: 'Server error', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
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
      .populate('items.product', 'name sku brand');

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

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
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
    }

    await order.save();

    res.status(200).json({ success: true, message: 'Order status updated successfully', order });
  } catch (error) {
    logger.error(`[updateOrderStatus] ${error.message}`);
    res.status(500).json({ success: false, message: 'Server error', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
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
