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
      .select('-paymentDetails -__v');

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

    return successResponse(res, {
      orderNumber: order.orderNumber || order.orderId,
      status: order.status,
      paymentStatus: order.paymentStatus,
      paymentMethod: order.paymentMethod,
      items: order.items,
      subtotal: order.subtotal,
      deliveryFee: order.deliveryFee,
      vatAmount: order.vatAmount,
      totalAmount: order.totalAmount || order.total,
      deliveryAddress: order.deliveryAddress,
      deliveryType: order.deliveryType,
      tracking: order.tracking,
      trackingNumber: order.trackingNumber,
      estimatedDelivery: order.estimatedDelivery,
      deliveredAt: order.deliveredAt,
      receivedBy: order.receivedBy,
      coldChain: order.coldChain,
      createdAt: order.createdAt,
      timeline
    });
  } catch (error) {
    return errorResponse(res, 'Failed to track order', process.env.NODE_ENV === 'development' ? [error.message] : null, 500);
  }
};
