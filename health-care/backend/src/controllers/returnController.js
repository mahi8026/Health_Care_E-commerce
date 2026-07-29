const Return = require('../models/Return');
const Order = require('../models/Order');
const Product = require('../models/Product');
const { sendEmail } = require('../utils/emailService');
const logger = require('../utils/logger');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/responseHelper');
const { sendToUser, sendToAdmins, notifications } = require('../utils/oneSignalService');

// @desc    Create return request
// @route   POST /api/returns
// @access  Private
exports.createReturn = async (req, res) => {
  try {
    const { orderId, products, reason, description, images } = req.body;

    // Validate required fields
    if (!orderId || !products || !reason || !description) {
      return errorResponse(res, 'Please provide all required fields', null, 400);
    }

    // Validate description length
    if (description.length < 20) {
      return errorResponse(res, 'Description must be at least 20 characters', null, 400);
    }

    // Validate order exists and belongs to user
    const order = await Order.findById(orderId).populate('items.product').lean();
    if (!order) {
      return errorResponse(res, 'Order not found', null, 404);
    }

    // When using .lean(), need to handle ObjectId comparison properly
    const orderUserId = typeof order.user === 'string' ? order.user : order.user.toString();
    if (orderUserId !== req.user._id.toString()) {
      return errorResponse(res, 'Not authorized to request return for this order', null, 403);
    }

    // Check if order is eligible for return (within 7 days)
    const deliveryDate = new Date(order.deliveredAt || order.createdAt);
    const daysSinceDelivery = Math.floor((Date.now() - deliveryDate) / (1000 * 60 * 60 * 24));
    
    if (daysSinceDelivery > 7) {
      return errorResponse(res, 'Return window expired. Returns must be requested within 7 days of delivery.', null, 400);
    }

    // Check if return already exists for this order
    const existingReturn = await Return.findOne({
      order: orderId,
      status: { $nin: ['cancelled'] }
    });

    if (existingReturn) {
      return errorResponse(res, 'A return request already exists for this order', null, 400);
    }

    // Calculate refund amount and prepare products array
    let refundAmount = 0;
    const returnProducts = [];

    for (const item of products) {
      const orderItem = order.items.find(i => i.product._id.toString() === item.product);
      if (!orderItem) {
        return errorResponse(res, `Product ${item.product} not found in order`, null, 400);
      }

      if (item.quantity > orderItem.quantity) {
        return errorResponse(res, `Cannot return more than ordered quantity for product ${orderItem.product.name}`, null, 400);
      }

      refundAmount += orderItem.price * item.quantity;
      returnProducts.push({
        product: item.product,
        quantity: item.quantity,
        reason: item.reason || reason,
        price: orderItem.price
      });
    }

    // Create return request
    const returnRequest = await Return.create({
      order: orderId,
      user: req.user._id,
      products: returnProducts,
      reason,
      description,
      images: images || [],
      refundAmount,
      status: 'pending'
    });

    // Populate return request for response
    await returnRequest.populate([
      { path: 'order', select: 'orderNumber totalAmount' },
      { path: 'user', select: 'name email' },
      { path: 'products.product', select: 'name sku images' }
    ]);

    // Send email notification to admin
    try {
      await sendEmail({
        to: process.env.ADMIN_EMAIL || 'admin@MediportBD.com',
        subject: `New Return Request - Order #${order.orderNumber}`,
        text: `
New return request received:

Return ID: ${returnRequest._id}
Order: #${order.orderNumber}
Customer: ${req.user.name} (${req.user.email})
Reason: ${reason}
Amount: ?${refundAmount}

Please review this request in the admin panel.
        `.trim()
      });
    } catch (emailErr) {
      logger.error(`[createReturn] Failed to send admin email: ${emailErr.message}`);
    }

    // Send confirmation email to customer
    try {
      await sendEmail({
        to: req.user.email,
        subject: `Return Request Received - Order #${order.orderNumber}`,
        text: `
Dear ${req.user.name},

Your return request for order #${order.orderNumber} has been received.

Return Details:
- Return ID: ${returnRequest._id.toString().slice(-8).toUpperCase()}
- Reason: ${reason}
- Refund Amount: ?${refundAmount}

We will review your request within 24-48 hours and notify you of our decision.

Thank you for your patience.

Best regards,
MediportBD Team
        `.trim()
      });
    } catch (emailErr) {
      logger.error(`[createReturn] Failed to send customer email: ${emailErr.message}`);
    }

    // Send push notification to admins for new refund request
    const orderForNotification = await Order.findById(orderId).populate('user', 'name email').lean();
    if (orderForNotification) {
      orderForNotification.refund = { amount: refundAmount };
      sendToAdmins(notifications.newRefundAdmin(orderForNotification)).catch(err =>
        logger.error(`[createReturn] Admin push notification failed: ${err.message}`)
      );
    }

    logger.info(`[createReturn] Return request created: ${returnRequest._id} for order ${order.orderNumber}`);

    return successResponse(res, returnRequest, 'Return request submitted successfully', 201);
  } catch (err) {
    logger.error(`[createReturn] ${err.message}`);
    return errorResponse(res, 'Failed to create return request', process.env.NODE_ENV === 'development' ? [err.message] : null, 500);
  }
};

// @desc    Get user's return requests
// @route   GET /api/returns/my-returns
// @access  Private
exports.getMyReturns = async (req, res) => {
  try {
    const returns = await Return.find({ user: req.user._id })
      .populate('order', 'orderNumber totalAmount createdAt')
      .populate('products.product', 'name sku images')
      .populate('approvedBy', 'name')
      .sort('-createdAt');

    return successResponse(res, { returns, count: returns.length });
  } catch (err) {
    logger.error(`[getMyReturns] ${err.message}`);
    return errorResponse(res, 'Failed to fetch return requests', process.env.NODE_ENV === 'development' ? [err.message] : null, 500);
  }
};

// @desc    Get all return requests (Admin)
// @route   GET /api/returns
// @access  Private/Admin
exports.getAllReturns = async (req, res) => {
  try {
    const { status, page = 1, limit = 20, sort = '-createdAt' } = req.query;
    
    const query = status && status !== 'all' ? { status } : {};

    const returns = await Return.find(query)
      .populate('user', 'name email phone')
      .populate('order', 'orderNumber totalAmount createdAt')
      .populate('products.product', 'name sku images')
      .populate('approvedBy', 'name')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Return.countDocuments(query);

    return paginatedResponse(res, returns, {
      page: Number(page),
      limit: Number(limit),
      total: count,
      totalPages: Math.ceil(count / limit),
      hasNext: Number(page) < Math.ceil(count / limit),
      hasPrev: Number(page) > 1
    });
  } catch (err) {
    logger.error(`[getAllReturns] ${err.message}`);
    return errorResponse(res, 'Failed to fetch return requests', process.env.NODE_ENV === 'development' ? [err.message] : null, 500);
  }
};

// @desc    Get single return request
// @route   GET /api/returns/:id
// @access  Private
exports.getReturn = async (req, res) => {
  try {
    const returnRequest = await Return.findById(req.params.id)
      .populate('user', 'name email phone')
      .populate({
        path: 'order',
        populate: { path: 'items.product', select: 'name sku images' }
      })
      .populate('products.product', 'name sku images brand')
      .populate('approvedBy', 'name email');

    if (!returnRequest) {
      return errorResponse(res, 'Return request not found', null, 404);
    }

    // Check authorization (user can only view their own returns, admin can view all)
    if (
      req.user.role !== 'admin' &&
      returnRequest.user._id.toString() !== req.user._id.toString()
    ) {
      return errorResponse(res, 'Not authorized to view this return request', null, 403);
    }

    return successResponse(res, returnRequest);
  } catch (err) {
    logger.error(`[getReturn] ${err.message}`);
    return errorResponse(res, 'Failed to fetch return request', process.env.NODE_ENV === 'development' ? [err.message] : null, 500);
  }
};

// @desc    Update return status (Admin)
// @route   PATCH /api/returns/:id/status
// @access  Private/Admin
exports.updateReturnStatus = async (req, res) => {
  try {
    const { status, adminNotes, refundMethod, refundTransactionId } = req.body;

    if (!status) {
      return errorResponse(res, 'Status is required', null, 400);
    }

    const returnRequest = await Return.findById(req.params.id)
      .populate('user', 'email name')
      .populate('order', 'orderNumber');

    if (!returnRequest) {
      return errorResponse(res, 'Return request not found', null, 404);
    }

    // Update return request
    returnRequest.status = status;
    if (adminNotes) returnRequest.adminNotes = adminNotes;
    if (refundMethod) returnRequest.refundMethod = refundMethod;
    if (refundTransactionId) returnRequest.refundTransactionId = refundTransactionId;

    if (status === 'approved') {
      returnRequest.approvedBy = req.user._id;
      returnRequest.approvedAt = Date.now();
    }

    if (status === 'refunded') {
      returnRequest.refundedAt = Date.now();
      
      // Update order status
      const order = await Order.findById(returnRequest.order);
      if (order) {
        order.status = 'refunded';
        await order.save();
        
        // Send push notification for refund processed
        sendToUser(returnRequest.user._id, notifications.refundProcessed(order, returnRequest.refundAmount)).catch(err =>
          logger.error(`[updateReturnStatus] Push notification failed: ${err.message}`)
        );
      }
    }

    await returnRequest.save();

    // Send email notification to customer
    const statusMessages = {
      approved: `Your return request has been approved. Refund of ?${returnRequest.refundAmount} will be processed within 3-5 business days via ${refundMethod || 'original payment method'}.`,
      rejected: `Your return request has been rejected. ${adminNotes ? `Reason: ${adminNotes}` : 'Please contact support for more details.'}`,
      refunded: `Your refund of ?${returnRequest.refundAmount} has been processed successfully. ${refundTransactionId ? `Transaction ID: ${refundTransactionId}` : ''}`,
    };

    if (statusMessages[status]) {
      try {
        await sendEmail({
          to: returnRequest.user.email,
          subject: `Return Request ${status.charAt(0).toUpperCase() + status.slice(1)} - Order #${returnRequest.order.orderNumber}`,
          text: `
Dear ${returnRequest.user.name},

${statusMessages[status]}

Return ID: ${returnRequest._id.toString().slice(-8).toUpperCase()}
Order: #${returnRequest.order.orderNumber}

${status === 'rejected' ? 'If you have any questions, please contact our support team.' : 'Thank you for your patience.'}

Best regards,
MediportBD Team
          `.trim()
        });
      } catch (emailErr) {
        logger.error(`[updateReturnStatus] Failed to send email: ${emailErr.message}`);
      }
    }

    logger.info(`[updateReturnStatus] Return ${returnRequest._id} status updated to ${status} by ${req.user.name}`);

    return successResponse(res, returnRequest, `Return request ${status} successfully`);
  } catch (err) {
    logger.error(`[updateReturnStatus] ${err.message}`);
    return errorResponse(res, 'Failed to update return status', process.env.NODE_ENV === 'development' ? [err.message] : null, 500);
  }
};

// @desc    Cancel return request
// @route   DELETE /api/returns/:id
// @access  Private
exports.cancelReturn = async (req, res) => {
  try {
    const returnRequest = await Return.findById(req.params.id);

    if (!returnRequest) {
      return errorResponse(res, 'Return request not found', null, 404);
    }

    // Check authorization
    if (returnRequest.user.toString() !== req.user._id.toString()) {
      return errorResponse(res, 'Not authorized to cancel this return request', null, 403);
    }

    // Can only cancel pending requests
    if (returnRequest.status !== 'pending') {
      return errorResponse(res, 'Can only cancel pending return requests', null, 400);
    }

    returnRequest.status = 'cancelled';
    await returnRequest.save();

    logger.info(`[cancelReturn] Return ${returnRequest._id} cancelled by user ${req.user._id}`);

    return successResponse(res, null, 'Return request cancelled successfully');
  } catch (err) {
    logger.error(`[cancelReturn] ${err.message}`);
    return errorResponse(res, 'Failed to cancel return request', process.env.NODE_ENV === 'development' ? [err.message] : null, 500);
  }
};

// @desc    Get return statistics (Admin)
// @route   GET /api/returns/stats
// @access  Private/Admin
exports.getReturnStats = async (req, res) => {
  try {
    const stats = await Return.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$refundAmount' }
        }
      }
    ]);

    const totalReturns = await Return.countDocuments();
    const pendingReturns = await Return.countDocuments({ status: 'pending' });
    const approvedReturns = await Return.countDocuments({ status: 'approved' });
    const refundedReturns = await Return.countDocuments({ status: 'refunded' });
    const rejectedReturns = await Return.countDocuments({ status: 'rejected' });

    const totalRefundAmount = await Return.aggregate([
      { $match: { status: 'refunded' } },
      { $group: { _id: null, total: { $sum: '$refundAmount' } } }
    ]);

    return successResponse(res, {
      total: totalReturns,
      pending: pendingReturns,
      approved: approvedReturns,
      refunded: refundedReturns,
      rejected: rejectedReturns,
      totalRefundAmount: totalRefundAmount[0]?.total || 0,
      byStatus: stats
    });
  } catch (err) {
    logger.error(`[getReturnStats] ${err.message}`);
    return errorResponse(res, 'Failed to fetch return statistics', process.env.NODE_ENV === 'development' ? [err.message] : null, 500);
  }
};
