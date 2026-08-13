const Return = require('../models/Return');
const Order = require('../models/Order');
const Product = require('../models/Product');
const { sendEmail } = require('../utils/emailService');
const logger = require('../utils/logger');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/responseHelper');
const { sendToUser, sendToAdmins, notifications } = require('../utils/oneSignalService');

const RETURN_REASON_LABELS = {
  damaged: 'Product damaged in transit',
  wrong_item: 'Wrong item delivered',
  defective: 'Product defective / not working',
  not_as_described: 'Product not as described',
  changed_mind: 'Changed mind',
  other: 'Other'
};

/**
 * Book a SteadFast return pickup for an approved return request, using the
 * original shipment consignment. Best-effort: resolves with a result object
 * instead of throwing (except for hard infra errors like "not configured").
 */
async function bookSteadfastReturn(returnRequest) {
  const steadfastService = require('../services/steadfastService');
  if (!steadfastService.isConfigured()) {
    return { success: false, skipped: 'not_configured', error: 'SteadFast is not configured' };
  }

  const order = await Order.findById(returnRequest.order)
    .select('orderNumber deliveryAddress paymentMethod paymentStatus totalAmount tracking')
    .lean();
  if (!order) {
    return { success: false, skipped: 'order_not_found', error: 'Original order not found' };
  }
  if (!order.tracking?.consignmentId || order.tracking?.courier !== 'SteadFast') {
    return { success: false, skipped: 'no_consignment', error: 'Original order has no SteadFast consignment' };
  }

  const address = order.deliveryAddress || {};
  const parts = [address.street, address.thana || address.area, address.district || address.city].filter(Boolean);
  const isCod = order.paymentMethod === 'cod' && order.paymentStatus !== 'paid';

  const data = await steadfastService.createReturn({
    consignmentId: order.tracking.consignmentId,
    recipientName: (address.name || '').trim(),
    recipientPhone: address.phone,
    recipientAddress: parts.join(', ') || 'Dhaka',
    codAmount: isCod ? (order.totalAmount || 0) : 0,
    reason: `${RETURN_REASON_LABELS[returnRequest.reason] || returnRequest.reason}. ${returnRequest.description || ''}`,
    reference: `${order.orderNumber || order._id}-R${String(returnRequest._id).slice(-6).toUpperCase()}`
  });

  const info = (data && (data.data || data.return_consignment || data.consignment)) || {};

  return {
    success: true,
    bookedAt: new Date(),
    consignmentId: info.consignment_id || info.id,
    trackingCode: info.tracking_code,
    status: info.status,
    raw: info
  };
}

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

    // B6 — only delivered orders are return-eligible
    // (previously `deliveredAt || createdAt` let never-delivered or cancelled orders qualify)
    if (!order.deliveredAt || order.status === 'cancelled') {
      return errorResponse(res, 'Returns are only available for delivered orders', null, 400);
    }

    // Check if order is eligible for return (within 7 days of actual delivery)
    const deliveryDate = new Date(order.deliveredAt);
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

    // Calculate refund amount (proportional to order-level discounts)
    let refundAmount = 0;
    const returnProducts = [];

    // Compute effective discount ratio from order-level discounts
    const orderSubtotal = order.items.reduce((sum, i) => sum + (i.price * i.quantity), 0);
    const orderPaidTotal = order.totalAmount || order.total || orderSubtotal;
    const discountRatio = orderSubtotal > 0 ? orderPaidTotal / orderSubtotal : 1;

    for (const item of products) {
      const orderItem = order.items.find(i => i.product._id.toString() === item.product);
      if (!orderItem) {
        return errorResponse(res, `Product ${item.product} not found in order`, null, 400);
      }

      if (item.quantity > orderItem.quantity) {
        return errorResponse(res, `Cannot return more than ordered quantity for product ${orderItem.product.name}`, null, 400);
      }

      const itemTotal = orderItem.price * item.quantity;
      refundAmount += Math.round(itemTotal * discountRatio);
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
        html: `
        <h2>New Return Request</h2>
        <p>
          Return ID: ${returnRequest._id}<br/>
          Order: #${order.orderNumber}<br/>
          Customer: ${req.user.name} (${req.user.email})<br/>
          Reason: ${reason}<br/>
          Amount: ৳${refundAmount}
        </p>
        <p style="color:#DC2626;font-weight:600;">Please review this request in the admin panel.</p>
      `
      });
    } catch (emailErr) {
      logger.error(`[createReturn] Failed to send admin email: ${emailErr.message}`);
    }

    // Send confirmation email to customer
    try {
      await sendEmail({
        to: req.user.email,
        subject: `Return Request Received - Order #${order.orderNumber}`,
        html: `
<h2>Return Request Received</h2>
<p>Dear ${req.user.name},</p>
<p>Your return request for order #${order.orderNumber} has been received.</p>
<p>
  <strong>Return ID:</strong> ${returnRequest._id.toString().slice(-8).toUpperCase()}<br/>
  <strong>Reason:</strong> ${reason}<br/>
  <strong>Refund Amount:</strong> ৳${refundAmount}
</p>
<p>We will review your request within 24-48 hours and notify you of our decision.</p>
<p>Thank you for your patience.<br/>Best regards,<br/>MediportBD Team</p>
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
    return errorResponse(res, 'Failed to create return request', process.env.ERROR_DETAIL_ENABLED === 'true' ? [err.message] : null, 500);
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
      .sort('-createdAt')
      .limit(20)
      .lean();

    return successResponse(res, { returns, count: returns.length });
  } catch (err) {
    logger.error(`[getMyReturns] ${err.message}`);
    return errorResponse(res, 'Failed to fetch return requests', process.env.ERROR_DETAIL_ENABLED === 'true' ? [err.message] : null, 500);
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
      .skip((page - 1) * limit)
      .lean();

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
    return errorResponse(res, 'Failed to fetch return requests', process.env.ERROR_DETAIL_ENABLED === 'true' ? [err.message] : null, 500);
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
    return errorResponse(res, 'Failed to fetch return request', process.env.ERROR_DETAIL_ENABLED === 'true' ? [err.message] : null, 500);
  }
};

// Valid return-status transitions (S3: prevents rejected → approved re-entry and double stock restore)
const RETURN_STATUS_TRANSITIONS = {
  pending: ['approved', 'rejected', 'cancelled'],
  approved: ['refunded', 'cancelled'],
  rejected: ['approved', 'cancelled'],
  refunded: [],
  cancelled: [],
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

    // S3 — enforce valid transitions before mutating anything
    const allowedNext = RETURN_STATUS_TRANSITIONS[returnRequest.status] || [];
    if (status === returnRequest.status) {
      return successResponse(res, returnRequest, `Return request is already ${status}`);
    }
    if (!allowedNext.includes(status)) {
      return errorResponse(res, `Cannot change return status from '${returnRequest.status}' to '${status}'`, null, 400);
    }

    // Update return request
    returnRequest.status = status;
    if (adminNotes) {
returnRequest.adminNotes = adminNotes;
}
    if (refundMethod) {
returnRequest.refundMethod = refundMethod;
}
    if (refundTransactionId) {
returnRequest.refundTransactionId = refundTransactionId;
}

    if (status === 'approved') {
      returnRequest.approvedBy = req.user._id;
      returnRequest.approvedAt = new Date();
    }

    if (status === 'refunded') {
      // B8-style atomic claim — 'approved' → 'refunded' restores stock exactly
      // once; a concurrent duplicate request (double-click, retry) loses with 409
      // and touches no inventory
      const claimed = await Return.updateOne(
        { _id: returnRequest._id, status: 'approved' },
        { $set: { status: 'refunded', refundedAt: new Date() } }
      );
      if (claimed.matchedCount === 0) {
        return errorResponse(res, 'Return request was already processed by another request', null, 409);
      }
      returnRequest.status = 'refunded';
      returnRequest.refundedAt = new Date();

      // S3 — restore stock exactly once per return, at refund time
      if (!returnRequest.stockRestored) {
        for (const product of returnRequest.products) {
          await Product.findByIdAndUpdate(
            product.product,
            { $inc: { stock: product.quantity } }
          );
        }
        returnRequest.stockRestored = true;
      }

      // Update order status
      const order = await Order.findById(returnRequest.order);
      if (order) {
        order.status = 'refunded';
        order.statusTimestamps = { ...(order.statusTimestamps || {}), refunded: new Date() };
        await order.save();
        
        // Send push notification for refund processed
        sendToUser(returnRequest.user._id, notifications.refundProcessed(order, returnRequest.refundAmount)).catch(err =>
          logger.error(`[updateReturnStatus] Push notification failed: ${err.message}`)
        );
      }
    }

    await returnRequest.save();

    // S7 — when a return is approved, best-effort book a SteadFast return pickup
    // against the original consignment. Never blocks the approval: failures are
    // recorded on the return doc and surfaced in the admin UI. The updateOne
    // guard makes a concurrent duplicate approval lose the write (atomic claim).
    if (status === 'approved') {
      bookSteadfastReturn(returnRequest)
        .then(result => Return.updateOne(
          { _id: returnRequest._id, steadfastReturn: null },
          { $set: { steadfastReturn: result } }
        ))
        .catch(err => logger.error(`[updateReturnStatus] SteadFast return booking failed: ${err.message}`));
    }

    // Send email notification to customer
    const statusMessages = {
      approved: `Your return request has been approved. Refund of ৳${returnRequest.refundAmount} will be processed within 3-5 business days via ${refundMethod || 'original payment method'}.`,
      rejected: `Your return request has been rejected. ${adminNotes ? `Reason: ${adminNotes}` : 'Please contact support for more details.'}`,
      refunded: `Your refund of ৳${returnRequest.refundAmount} has been processed successfully. ${refundTransactionId ? `Transaction ID: ${refundTransactionId}` : ''}`,
    };

    if (statusMessages[status]) {
      try {
        await sendEmail({
          to: returnRequest.user.email,
          subject: `Return Request ${status.charAt(0).toUpperCase() + status.slice(1)} - Order #${returnRequest.order.orderNumber}`,
          html: `
<h2>Return ${status.charAt(0).toUpperCase() + status.slice(1)}</h2>
<p>Dear ${returnRequest.user.name},</p>
<p>${statusMessages[status]}</p>
<p>
  <strong>Return ID:</strong> ${returnRequest._id.toString().slice(-8).toUpperCase()}<br/>
  <strong>Order:</strong> #${returnRequest.order.orderNumber}
</p>
<p>${status === 'rejected' ? 'If you have any questions, please contact our support team.' : 'Thank you for your patience.'}</p>
<p>Best regards,<br/>MediportBD Team</p>
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
    return errorResponse(res, 'Failed to update return status', process.env.ERROR_DETAIL_ENABLED === 'true' ? [err.message] : null, 500);
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
    return errorResponse(res, 'Failed to cancel return request', process.env.ERROR_DETAIL_ENABLED === 'true' ? [err.message] : null, 500);
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
    return errorResponse(res, 'Failed to fetch return statistics', process.env.ERROR_DETAIL_ENABLED === 'true' ? [err.message] : null, 500);
  }
};
