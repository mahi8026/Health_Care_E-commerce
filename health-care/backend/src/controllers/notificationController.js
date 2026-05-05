const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Product');
const {
  sendOrderConfirmation,
  sendPaymentReceipt,
  sendShippingNotification,
  sendDeliveryConfirmation,
  sendLowStockAlert
} = require('../utils/emailService');
const { generateInvoice } = require('../utils/invoiceGenerator');
const logger = require('../utils/logger');

// POST /api/notifications/order-confirmation
exports.sendOrderConfirmation = async (req, res) => {
  try {
    const { orderId } = req.body;
    
    if (!orderId) {
      return res.status(400).json({ success: false, message: 'Order ID is required' });
    }

    const order = await Order.findById(orderId).populate('items.product', 'name sku brand');
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const user = await User.findById(order.user);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    await sendOrderConfirmation(order, user);
    res.status(200).json({ success: true, message: 'Order confirmation email sent successfully' });
  } catch (error) {
    logger.error(`[sendOrderConfirmation] ${error.message}`);
    res.status(500).json({ success: false, message: error.message || 'Failed to send order confirmation' });
  }
};

// POST /api/notifications/payment-receipt
exports.sendPaymentReceipt = async (req, res) => {
  try {
    const { orderId } = req.body;
    
    if (!orderId) {
      return res.status(400).json({ success: false, message: 'Order ID is required' });
    }

    const order = await Order.findById(orderId).populate('items.product', 'name sku brand');
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const user = await User.findById(order.user);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Generate PDF invoice
    let pdfBuffer;
    try {
      pdfBuffer = await generateInvoice(order, user);
    } catch (pdfErr) {
      logger.error('PDF generation failed:', pdfErr.message);
      // Continue without PDF attachment
    }

    await sendPaymentReceipt(order, user, pdfBuffer);
    res.status(200).json({ success: true, message: 'Payment receipt email sent successfully' });
  } catch (error) {
    logger.error(`[sendPaymentReceipt] ${error.message}`);
    res.status(500).json({ success: false, message: error.message || 'Failed to send payment receipt' });
  }
};

// POST /api/notifications/shipping
exports.sendShipping = async (req, res) => {
  try {
    const { orderId } = req.body;
    
    if (!orderId) {
      return res.status(400).json({ success: false, message: 'Order ID is required' });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const user = await User.findById(order.user);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    await sendShippingNotification(order, user);
    res.status(200).json({ success: true, message: 'Shipping notification sent successfully' });
  } catch (error) {
    logger.error(`[sendShipping] ${error.message}`);
    res.status(500).json({ success: false, message: error.message || 'Failed to send shipping notification' });
  }
};

// POST /api/notifications/delivered
exports.sendDelivered = async (req, res) => {
  try {
    const { orderId } = req.body;
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    const user = await User.findById(order.user);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    await sendDeliveryConfirmation(order, user);
    res.status(200).json({ success: true, message: 'Delivery confirmation sent' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/notifications/quotation-ready
exports.sendQuotationReady = async (req, res) => {
  try {
    const { quoteId } = req.body;
    const Quote = require('../models/Quote');
    const quote = await Quote.findById(quoteId).populate('user', 'name email');
    if (!quote) return res.status(404).json({ success: false, message: 'Quote not found' });

    const { sendQuotationReady: sendQuote } = require('../utils/emailService');
    await sendQuote(quote, quote.user);
    res.status(200).json({ success: true, message: 'Quotation ready email sent' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/notifications/stock-alert
exports.sendStockAlert = async (req, res) => {
  try {
    const lowStockProducts = await Product.find({
      isActive: true,
      $expr: { $lte: ['$stock', { $ifNull: ['$lowStockThreshold', 10] }] }
    }).lean();

    if (!lowStockProducts.length) {
      return res.status(200).json({ success: true, message: 'No low stock products found' });
    }

    await sendLowStockAlert(lowStockProducts);
    res.status(200).json({ success: true, message: `Stock alert sent for ${lowStockProducts.length} product(s)` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
