const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Product');
const {
  sendOrderConfirmation,
  sendPaymentReceipt,
  sendShippingNotification,
  sendDeliveryConfirmation,
  sendLowStockAlert
} = require('../services/emailService');
const { generateInvoice } = require('../utils/invoiceGenerator');
const logger = require('../utils/logger');
const { successResponse, errorResponse } = require('../utils/responseHelper');

// POST /api/notifications/order-confirmation
exports.sendOrderConfirmation = async (req, res) => {
  try {
    const { orderId } = req.body;
    
    if (!orderId) {
      return errorResponse(res, 'Order ID is required', null, 400);
    }

    const order = await Order.findById(orderId).populate('items.product', 'name sku brand');
    if (!order) {
      return errorResponse(res, 'Order not found', null, 404);
    }

    const user = await User.findById(order.user);
    if (!user) {
      return errorResponse(res, 'User not found', null, 404);
    }

    await sendOrderConfirmation(order, user);
    return successResponse(res, null, 'Order confirmation email sent successfully');
  } catch (error) {
    logger.error(`[sendOrderConfirmation] ${error.message}`);
    return errorResponse(res, 'Failed to send order confirmation', process.env.NODE_ENV === 'development' ? [error.message] : null, 500);
  }
};

// POST /api/notifications/payment-receipt
exports.sendPaymentReceipt = async (req, res) => {
  try {
    const { orderId } = req.body;
    
    if (!orderId) {
      return errorResponse(res, 'Order ID is required', null, 400);
    }

    const order = await Order.findById(orderId).populate('items.product', 'name sku brand');
    if (!order) {
      return errorResponse(res, 'Order not found', null, 404);
    }

    const user = await User.findById(order.user);
    if (!user) {
      return errorResponse(res, 'User not found', null, 404);
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
    return successResponse(res, null, 'Payment receipt email sent successfully');
  } catch (error) {
    logger.error(`[sendPaymentReceipt] ${error.message}`);
    return errorResponse(res, 'Failed to send payment receipt', process.env.NODE_ENV === 'development' ? [error.message] : null, 500);
  }
};

// POST /api/notifications/shipping
exports.sendShipping = async (req, res) => {
  try {
    const { orderId } = req.body;
    
    if (!orderId) {
      return errorResponse(res, 'Order ID is required', null, 400);
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return errorResponse(res, 'Order not found', null, 404);
    }

    const user = await User.findById(order.user);
    if (!user) {
      return errorResponse(res, 'User not found', null, 404);
    }

    await sendShippingNotification(order, user);
    return successResponse(res, null, 'Shipping notification sent successfully');
  } catch (error) {
    logger.error(`[sendShipping] ${error.message}`);
    return errorResponse(res, 'Failed to send shipping notification', process.env.NODE_ENV === 'development' ? [error.message] : null, 500);
  }
};

// POST /api/notifications/delivered
exports.sendDelivered = async (req, res) => {
  try {
    const { orderId } = req.body;
    const order = await Order.findById(orderId);
    if (!order) return errorResponse(res, 'Order not found', null, 404);

    const user = await User.findById(order.user);
    if (!user) return errorResponse(res, 'User not found', null, 404);

    await sendDeliveryConfirmation(order, user);
    return successResponse(res, null, 'Delivery confirmation sent');
  } catch (error) {
    return errorResponse(res, 'Failed to send delivery confirmation', process.env.NODE_ENV === 'development' ? [error.message] : null, 500);
  }
};

// POST /api/notifications/quotation-ready
exports.sendQuotationReady = async (req, res) => {
  try {
    const { quoteId } = req.body;
    const Quote = require('../models/Quote');
    const quote = await Quote.findById(quoteId).populate('user', 'name email');
    if (!quote) return errorResponse(res, 'Quote not found', null, 404);

    const { sendQuotationReady: sendQuote } = require('../utils/emailService');
    await sendQuote(quote, quote.user);
    return successResponse(res, null, 'Quotation ready email sent');
  } catch (error) {
    return errorResponse(res, 'Failed to send quotation email', process.env.NODE_ENV === 'development' ? [error.message] : null, 500);
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
      return successResponse(res, null, 'No low stock products found');
    }

    await sendLowStockAlert(lowStockProducts);
    return successResponse(res, null, `Stock alert sent for ${lowStockProducts.length} product(s)`);
  } catch (error) {
    return errorResponse(res, 'Failed to send stock alert', process.env.NODE_ENV === 'development' ? [error.message] : null, 500);
  }
};
