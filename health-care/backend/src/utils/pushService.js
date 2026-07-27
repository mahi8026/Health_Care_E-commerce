const webpush = require('web-push');
const PushSubscription = require('../models/PushSubscription');
const logger = require('./logger');

// Validate VAPID configuration on startup
if (!process.env.VAPID_EMAIL || !process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
  logger.error('[Push] Missing VAPID environment variables:');
  logger.error(`  VAPID_EMAIL: ${process.env.VAPID_EMAIL ? 'SET' : 'MISSING'}`);
  logger.error(`  VAPID_PUBLIC_KEY: ${process.env.VAPID_PUBLIC_KEY ? 'SET' : 'MISSING'}`);
  logger.error(`  VAPID_PRIVATE_KEY: ${process.env.VAPID_PRIVATE_KEY ? 'SET' : 'MISSING'}`);
  logger.error('[Push] Push notifications will NOT work without these keys!');
} else {
  logger.info('[Push] VAPID keys configured successfully');
  logger.info(`[Push] VAPID_EMAIL: ${process.env.VAPID_EMAIL}`);
  logger.info(`[Push] VAPID_PUBLIC_KEY: ${process.env.VAPID_PUBLIC_KEY.substring(0, 30)}...`);
}

// Configure VAPID
try {
  webpush.setVapidDetails(
    process.env.VAPID_EMAIL,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY,
  );
  logger.info('[Push] web-push configured with VAPID details');
} catch (err) {
  logger.error(`[Push] Failed to configure VAPID: ${err.message}`);
}

// ── Send to ONE subscription ──────────────────────────────────────────────────
const sendToSubscription = async (subscription, payload) => {
  try {
    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.keys.p256dh,
          auth:   subscription.keys.auth,
        },
      },
      JSON.stringify(payload),
      {
        TTL: 60 * 60 * 24, // 24 hours — deliver even if device offline
        urgency: payload.urgency || 'normal', // high | normal | low
      }
    );
    // Update last used
    await PushSubscription.findByIdAndUpdate(subscription._id, {
      lastUsed: new Date(),
    });
    return true;
  } catch (err) {
    if (err.statusCode === 404 || err.statusCode === 410) {
      // Subscription expired → remove from DB
      await PushSubscription.findByIdAndDelete(subscription._id);
      logger.info(`[Push] Removed expired subscription: ${subscription.endpoint.slice(-20)}`);
    } else {
      logger.error(`[Push] Send failed: ${err.message}`);
    }
    return false;
  }
};

// ── Send to ONE user (all their devices) ───────────────────────────────────
const sendToUser = async (userId, payload) => {
  const subscriptions = await PushSubscription.find({
    user: userId,
    isActive: true,
  });
  if (!subscriptions.length) return 0;
  
  let sent = 0;
  await Promise.all(
    subscriptions.map(async (sub) => {
      const success = await sendToSubscription(sub, payload);
      if (success) sent++;
    })
  );
  logger.info(`[Push] Sent to user ${userId}: ${sent}/${subscriptions.length} devices`);
  return sent;
};

// ── Send to ALL subscribers (broadcast) ────────────────────────────────────
const sendToAll = async (payload, filter = {}) => {
  const query = { isActive: true, ...filter };
  const subscriptions = await PushSubscription.find(query);
  if (!subscriptions.length) return 0;
  
  let sent = 0;
  // Send in batches of 50 to avoid rate limits
  const batchSize = 50;
  for (let i = 0; i < subscriptions.length; i += batchSize) {
    const batch = subscriptions.slice(i, i + batchSize);
    const results = await Promise.all(
      batch.map(sub => sendToSubscription(sub, payload))
    );
    sent += results.filter(Boolean).length;
    // Small delay between batches
    if (i + batchSize < subscriptions.length) {
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }
  logger.info(`[Push] Broadcast sent: ${sent}/${subscriptions.length}`);
  return sent;
};

// ── Send to admin users ─────────────────────────────────────────────────────
const sendToAdmins = async (payload) => {
  const User = require('../models/User');
  const admins = await User.find({ role: 'admin' }).select('_id');
  const adminIds = admins.map(a => a._id);
  
  const subscriptions = await PushSubscription.find({
    user: { $in: adminIds },
    isActive: true,
  });
  
  let sent = 0;
  await Promise.all(
    subscriptions.map(async (sub) => {
      const success = await sendToSubscription(sub, payload);
      if (success) sent++;
    })
  );
  return sent;
};

// ── Notification payload builders ─────────────────────────────────────────────

const notifications = {
  
  orderConfirmed: (order) => ({
    title:  '✅ Order Confirmed — MediportBD',
    body:   `Order ${order.orderNumber} confirmed. Total: ৳${order.totalAmount?.toLocaleString()}`,
    icon:   '/icons/icon-192x192.png',
    badge:  '/icons/badge-72x72.png',
    image:  '/images/notification-order.png',
    tag:    `order-${order._id}`,
    url:    `/track/${order.orderNumber}`,
    urgency: 'high',
    actions: [
      { action: 'track', title: '📍 Track Order' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
    data: { type: 'order_confirmed', orderId: order._id, orderNumber: order.orderNumber },
  }),
  
  orderShipped: (order) => ({
    title:  '📦 Your Order is on the Way!',
    body:   `Order ${order.orderNumber} has been shipped. Expected delivery: 1-3 days.`,
    icon:   '/icons/icon-192x192.png',
    badge:  '/icons/badge-72x72.png',
    tag:    `shipped-${order._id}`,
    url:    `/track/${order.orderNumber}`,
    urgency: 'high',
    actions: [
      { action: 'track', title: '🚚 Track Now' },
      { action: 'dismiss', title: 'OK' },
    ],
    data: { type: 'order_shipped', orderId: order._id },
  }),
  
  orderDelivered: (order) => ({
    title:  '🎉 Order Delivered!',
    body:   `Order ${order.orderNumber} has been delivered. How was your experience?`,
    icon:   '/icons/icon-192x192.png',
    badge:  '/icons/badge-72x72.png',
    tag:    `delivered-${order._id}`,
    url:    `/account/orders`,
    urgency: 'normal',
    actions: [
      { action: 'review', title: '⭐ Write Review' },
      { action: 'reorder', title: '🔄 Reorder' },
    ],
    data: { type: 'order_delivered', orderId: order._id },
  }),
  
  refundProcessed: (order, amount) => ({
    title:  '💚 Refund Processed — MediportBD',
    body:   `৳${amount?.toLocaleString()} has been refunded for order ${order.orderNumber}`,
    icon:   '/icons/icon-192x192.png',
    badge:  '/icons/badge-72x72.png',
    tag:    `refund-${order._id}`,
    url:    `/account/orders`,
    urgency: 'high',
    data: { type: 'refund_processed', orderId: order._id },
  }),
  
  flashDeal: (product, discount) => ({
    title:  `🔥 Flash Deal — ${discount}% OFF!`,
    body:   `${product.name} — Limited time offer. Only while stocks last!`,
    icon:   '/icons/icon-192x192.png',
    badge:  '/icons/badge-72x72.png',
    image:  product.images?.[0]?.url || null,
    tag:    `deal-${product._id}`,
    url:    `/products/${product.slug || product._id}`,
    urgency: 'high',
    actions: [
      { action: 'shop', title: '🛒 Shop Now' },
      { action: 'dismiss', title: 'Maybe Later' },
    ],
    data: { type: 'flash_deal', productId: product._id },
  }),
  
  backInStock: (product) => ({
    title:  '✅ Back in Stock!',
    body:   `${product.name} is back in stock. Order before it runs out!`,
    icon:   '/icons/icon-192x192.png',
    badge:  '/icons/badge-72x72.png',
    image:  product.images?.[0]?.url || null,
    tag:    `stock-${product._id}`,
    url:    `/products/${product.slug || product._id}`,
    urgency: 'normal',
    actions: [
      { action: 'buy', title: '🛒 Buy Now' },
    ],
    data: { type: 'back_in_stock', productId: product._id },
  }),
  
  quoteApproved: (quote) => ({
    title:  '✅ Quotation Approved — MediportBD',
    body:   `Your B2B quotation for ৳${quote.totalAmount?.toLocaleString()} has been approved!`,
    icon:   '/icons/icon-192x192.png',
    badge:  '/icons/badge-72x72.png',
    tag:    `quote-${quote._id}`,
    url:    `/b2b/dashboard`,
    urgency: 'high',
    actions: [
      { action: 'view', title: '📋 View Quote' },
    ],
    data: { type: 'quote_approved', quoteId: quote._id },
  }),
  
  newOrderAdmin: (order) => ({
    title:  '🛒 New Order — MediportBD Admin',
    body:   `Order ${order.orderNumber} placed. ৳${order.totalAmount?.toLocaleString()} — ${order.paymentMethod}`,
    icon:   '/icons/icon-192x192.png',
    badge:  '/icons/badge-72x72.png',
    tag:    `admin-order-${order._id}`,
    url:    `/admin`,
    urgency: 'high',
    data: { type: 'admin_new_order', orderId: order._id },
  }),
  
  newRefundAdmin: (order) => ({
    title:  '⚠️ Refund Request — Action Required',
    body:   `Customer requested refund for order ${order.orderNumber}. ৳${order.refund?.amount?.toLocaleString()}`,
    icon:   '/icons/icon-192x192.png',
    badge:  '/icons/badge-72x72.png',
    tag:    `admin-refund-${order._id}`,
    url:    `/admin`,
    urgency: 'high',
    data: { type: 'admin_refund_request', orderId: order._id },
  }),
  
  lowStockAdmin: (product) => ({
    title:  '📦 Low Stock Alert — MediportBD',
    body:   `${product.name} has only ${product.stock} units left. Restock needed!`,
    icon:   '/icons/icon-192x192.png',
    badge:  '/icons/badge-72x72.png',
    tag:    `stock-alert-${product._id}`,
    url:    `/admin`,
    urgency: 'normal',
    data: { type: 'admin_low_stock', productId: product._id },
  }),
};

module.exports = { sendToUser, sendToAll, sendToAdmins, notifications };
