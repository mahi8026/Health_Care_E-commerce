const Order = require('../models/Order');
const { successResponse, errorResponse } = require('../utils/responseHelper');

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
