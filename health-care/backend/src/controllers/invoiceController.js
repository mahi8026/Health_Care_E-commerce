const Order = require('../models/Order');
const User = require('../models/User');
const { generateInvoice } = require('../utils/invoiceGenerator');
const logger = require('../utils/logger');
const { errorResponse } = require('../utils/responseHelper');

/**
 * Generate PDF invoice for an order
 * @route POST /api/orders/invoice/pdf
 */
exports.generateInvoicePDF = async (req, res) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return errorResponse(res, 'Order ID is required', 400);
    }

    // Fetch order with user details
    const order = await Order.findById(orderId)
      .populate('user', 'name email phone companyName company b2bAccount accountType paymentTerms')
      .lean();

    if (!order) {
      return errorResponse(res, 'Order not found', 404);
    }

    // Check authorization - user can only access their own orders unless admin
    if (
      req.user.role !== 'admin' &&
      order.user._id.toString() !== req.user._id.toString()
    ) {
      return errorResponse(res, 'Unauthorized to access this invoice', 403);
    }

    // Generate PDF buffer
    const pdfBuffer = await generateInvoice(order, order.user);

    // Set response headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="Invoice-${order.orderNumber || order._id}.pdf"`
    );
    res.setHeader('Content-Length', pdfBuffer.length);

    // Send PDF buffer
    res.send(pdfBuffer);

    logger.info(`Invoice PDF generated for order ${order.orderNumber}`);
  } catch (error) {
    logger.error('Error generating invoice PDF:', error);
    return errorResponse(res, 'Failed to generate invoice PDF', 500);
  }
};

/**
 * Get invoice data for an order (JSON format)
 * @route GET /api/orders/:orderId/invoice
 */
exports.getInvoiceData = async (req, res) => {
  try {
    const { orderId } = req.params;

    // Fetch order with populated references
    const order = await Order.findById(orderId)
      .populate('user', 'name email phone companyName company b2bAccount accountType paymentTerms addresses')
      .populate({
        path: 'items.product',
        select: 'name sku brand',
        populate: {
          path: 'brand',
          select: 'name',
        },
      })
      .lean();

    if (!order) {
      return errorResponse(res, 'Order not found', 404);
    }

    // Check authorization
    if (
      req.user.role !== 'admin' &&
      order.user._id.toString() !== req.user._id.toString()
    ) {
      return errorResponse(res, 'Unauthorized to access this invoice', 403);
    }

    // Return order data for frontend rendering
    res.json({
      success: true,
      order,
    });

    logger.info(`Invoice data retrieved for order ${order.orderNumber}`);
  } catch (error) {
    logger.error('Error fetching invoice data:', error);
    return errorResponse(res, 'Failed to fetch invoice data', 500);
  }
};
