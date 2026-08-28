const crypto = require('crypto');
const Order = require('../models/Order');
const logger = require('../utils/logger');
const { successResponse, errorResponse } = require('../utils/responseHelper');

// SteadFast statuses we safely map onto Mediport order statuses. Everything
// else only updates tracking.steadfastStatus — nothing ever moves an order
// backwards or un-cancels it.
const STEADFAST_STATUS_MAP = {
  out_for_delivery: 'out_for_delivery',
  delivered: 'delivered',
};

const ORDER_STATUS_ORDER = ['placed', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered'];

function extractWebhookPayload(body) {
  const data = (body && (body.data || body)) || {};
  return {
    consignmentId: data.consignment_id || data.consignmentId || null,
    trackingCode: data.tracking_code || data.trackingCode || null,
    invoice: data.invoice || null,
    status: data.delivery_status || data.status || null,
  };
}

// POST /api/orders/webhooks/steadfast — public courier callback
// SteadFast calls this URL on consignment status changes. Verified by a
// shared secret when STEADFAST_WEBHOOK_SECRET is configured; otherwise the
// lookup by consignment id still prevents arbitrary order tampering.
exports.steadfastWebhook = async (req, res) => {
  try {
    // S9 — fail CLOSED: in production an unset secret disables the endpoint
    // entirely (previously an unconfigured secret silently allowed unsigned
    // callers to mutate order tracking). Dev keeps the permissive bypass.
    const secret = process.env.STEADFAST_WEBHOOK_SECRET;
    const provided = req.headers['x-steadfast-secret'] || (req.body && req.body.secret);
    const isProduction = process.env.NODE_ENV === 'production';

    if (!secret) {
      if (isProduction) {
        logger.error('[steadfastWebhook] STEADFAST_WEBHOOK_SECRET unset in production — rejecting webhook');
        return errorResponse(res, 'Webhook not configured', null, 503);
      }
      logger.warn('[steadfastWebhook] Secret unset — permissive mode allowed only outside production');
    } else {
      // timing-safe comparison (mirrors automationAuth)
      const a = Buffer.from(String(provided || ''));
      const b = Buffer.from(String(secret));
      const valid = a.length === b.length && crypto.timingSafeEqual(a, b);
      if (!valid) {
        logger.warn('[steadfastWebhook] Rejected webhook with missing/invalid secret');
        return errorResponse(res, 'Unauthorized', null, 401);
      }
    }

    const { consignmentId, trackingCode, invoice, status } = extractWebhookPayload(req.body);
    if (!status) {
      return errorResponse(res, 'Unrecognized webhook payload', null, 400);
    }

    const clauses = [];
    if (consignmentId) {
      clauses.push({ 'tracking.consignmentId': consignmentId });
    }
    if (trackingCode) {
      clauses.push({ 'tracking.trackingNumber': trackingCode }, { trackingNumber: trackingCode });
    }
    if (invoice) {
      clauses.push({ orderNumber: invoice });
    }
    if (clauses.length === 0) {
      return errorResponse(res, 'Unrecognized webhook payload', null, 400);
    }

    const order = await Order.findOne({ $or: clauses });

    if (!order) {
      logger.info(`[steadfastWebhook] No order matched consignment=${consignmentId} tracking=${trackingCode} invoice=${invoice}`);
      return errorResponse(res, 'Order not found for webhook payload', null, 404);
    }

    // Always record the raw courier status regardless of mapping
    order.tracking = {
      ...(order.tracking || {}),
      courier: order.tracking?.courier || 'SteadFast',
      steadfastStatus: status,
    };
    order.markModified('tracking');

    const mapped = STEADFAST_STATUS_MAP[status];
    const currentIdx = ORDER_STATUS_ORDER.indexOf(order.status);
    const mappedIdx = mapped ? ORDER_STATUS_ORDER.indexOf(mapped) : -1;

    // Only advance forward and only from non-terminal statuses
    if (mappedIdx > -1 && (currentIdx === -1 || mappedIdx > currentIdx)) {
      order.status = mapped;
      order.statusTimestamps = { ...(order.statusTimestamps || {}), [mapped]: new Date() };
      if (mapped === 'delivered') {
        order.deliveredAt = order.deliveredAt || new Date();
      }
      logger.info(`[steadfastWebhook] ${order.orderNumber} advanced to ${mapped} (courier: ${status})`);
    }

    await order.save();
    return successResponse(res, { received: true, orderNumber: order.orderNumber, orderStatus: order.status });
  } catch (error) {
    logger.error(`[steadfastWebhook] ${error.message}`, { stack: error.stack });
    return errorResponse(res, 'Failed to process SteadFast webhook', null, 500);
  }
};

// GET /api/orders/track/:orderNumber  — public endpoint
exports.trackOrder = async (req, res) => {
  try {
    const { orderNumber } = req.params;

    const order = await Order.findOne({
      $or: [
        { orderNumber },
        { orderId: orderNumber }
      ]
    })
      .populate('items.product', 'name sku brand images')
      .select('-paymentDetails -__v')
      .lean();

    if (!order) {
      return errorResponse(res, 'Order not found. Please check your order number.', null, 404);
    }

    // Build timeline
    const steps = [
      { key: 'placed', label: 'Order Placed', icon: '📋' },
      { key: 'confirmed', label: 'Confirmed', icon: '✅' },
      { key: 'processing', label: 'Processing', icon: '⚙️' },
      { key: 'shipped', label: 'Dispatched', icon: '📦' },
      { key: 'out_for_delivery', label: 'Out for Delivery', icon: '🚚' },
      { key: 'delivered', label: 'Delivered', icon: '🏠' }
    ];

    const statusOrder = ['placed', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered'];
    const currentIndex = statusOrder.indexOf(order.status);

    const timeline = steps.map((step, idx) => ({
      ...step,
      status: idx < currentIndex ? 'completed' : idx === currentIndex ? 'active' : 'pending',
      timestamp: order.statusTimestamps?.[step.key] || null
    }));

    // S4 — public endpoint: never expose customer PII or payment details
    let courierStatus = null;
    if (order.tracking && order.tracking.courier === 'SteadFast' && (order.tracking.consignmentId || order.trackingNumber)) {
      try {
        const steadfastService = require('../services/steadfastService');
        const statusCheck = order.tracking.consignmentId
          ? await steadfastService.getStatusByCid(order.tracking.consignmentId)
          : await steadfastService.getStatusByInvoice(order.trackingNumber);
        const payload = statusCheck && statusCheck.data ? statusCheck.data : statusCheck;
        if (payload && (payload.delivery_status || payload.status)) {
          courierStatus = {
            courier: 'SteadFast',
            status: payload.delivery_status || payload.status,
            timestamps: {
              createdAt: payload.created_at || payload.createdAt || null,
              updatedAt: payload.updated_at || payload.updatedAt || null
            }
          };
        }
      } catch (error) {
        courierStatus = null;
      }
    }

    return successResponse(res, {
      orderNumber: order.orderNumber || order.orderId,
      status: order.status,
      items: (order.items || []).map(item => ({
        product: item.product,
        qty: item.qty || item.quantity,
      })),
      totalAmount: order.totalAmount || order.total,
      deliveryType: order.deliveryType,
      tracking: order.tracking,
      trackingNumber: order.trackingNumber,
      courierStatus,
      estimatedDelivery: order.estimatedDelivery,
      deliveredAt: order.deliveredAt,
      coldChain: order.coldChain,
      createdAt: order.createdAt,
      timeline
    });
  } catch (error) {
    return errorResponse(res, 'Failed to track order', process.env.ERROR_DETAIL_ENABLED === 'true' ? [error.message] : null, 500);
  }
};
