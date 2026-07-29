/**
 * OneSignal Push Notification Service
 *
 * Sends push notifications via OneSignal REST API.
 * Replaces the old web-push / VAPID approach.
 *
 * Docs: https://documentation.onesignal.com/reference/create-notification
 */

const logger = require('./logger');

const ONESIGNAL_APP_ID  = process.env.ONESIGNAL_APP_ID;
const ONESIGNAL_API_KEY = process.env.ONESIGNAL_API_KEY; // REST API Key (not User Auth Key)

const BASE_URL = 'https://onesignal.com/api/v1/notifications';

/**
 * Core send function — posts to OneSignal REST API
 */
async function sendNotification(payload) {
  if (!ONESIGNAL_APP_ID || !ONESIGNAL_API_KEY) {
    logger.warn('[OneSignal] ONESIGNAL_APP_ID or ONESIGNAL_API_KEY not set — skipping notification');
    return null;
  }

  try {
    const body = {
      app_id: ONESIGNAL_APP_ID,
      ...payload,
    };

    const res = await fetch(BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${ONESIGNAL_API_KEY}`,
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (data.errors) {
      logger.error(`[OneSignal] API error: ${JSON.stringify(data.errors)}`);
      return null;
    }

    logger.info(`[OneSignal] Sent — recipients: ${data.recipients}, id: ${data.id}`);
    return data;
  } catch (err) {
    logger.error(`[OneSignal] sendNotification failed: ${err.message}`);
    return null;
  }
}

// ─── Public helpers ───────────────────────────────────────────────────────────

/**
 * Send to a specific user by their external_id (MongoDB user _id)
 */
async function sendToUser(userId, { title, body, url = '/', icon, data = {} }) {
  return sendNotification({
    include_aliases: { external_id: [String(userId)] },
    target_channel: 'push',
    headings:  { en: title },
    contents:  { en: body },
    url,
    chrome_web_icon: icon || `${process.env.FRONTEND_URL}/Mediport_Logo.png`,
    data,
  });
}

/**
 * Send to ALL subscribed users (broadcast)
 */
async function sendToAll({ title, body, url = '/', icon, image, data = {} }) {
  return sendNotification({
    included_segments: ['Total Subscriptions'],
    headings:  { en: title },
    contents:  { en: body },
    url,
    chrome_web_icon: icon || `${process.env.FRONTEND_URL}/Mediport_Logo.png`,
    big_picture: image || undefined,
    data,
  });
}

/**
 * Send to users with a specific tag (e.g. role: admin)
 */
async function sendToSegment(filters, { title, body, url = '/', icon, data = {} }) {
  return sendNotification({
    filters,
    headings:  { en: title },
    contents:  { en: body },
    url,
    chrome_web_icon: icon || `${process.env.FRONTEND_URL}/Mediport_Logo.png`,
    data,
  });
}

/**
 * Send to admin users (tagged via OneSignal tag: role=admin)
 */
async function sendToAdmins({ title, body, url = '/', data = {} }) {
  return sendToSegment(
    [{ field: 'tag', key: 'role', relation: '=', value: 'admin' }],
    { title, body, url, data }
  );
}

// ─── Pre-built notification templates ────────────────────────────────────────

const notifications = {
  orderPlaced: (userId, orderId, total) =>
    sendToUser(userId, {
      title: '✅ Order Confirmed — MediportBD',
      body:  `Your order #${orderId} for ৳${total?.toLocaleString()} has been placed.`,
      url:   `/orders/${orderId}`,
      data:  { type: 'order_placed', orderId },
    }),

  orderShipped: (userId, orderId, trackingNumber) =>
    sendToUser(userId, {
      title: '📦 Order Shipped — MediportBD',
      body:  `Order #${orderId} is on its way${trackingNumber ? `. Tracking: ${trackingNumber}` : ''}.`,
      url:   `/track?order=${orderId}`,
      data:  { type: 'order_shipped', orderId },
    }),

  orderDelivered: (userId, orderId) =>
    sendToUser(userId, {
      title: '🎉 Order Delivered — MediportBD',
      body:  `Order #${orderId} has been delivered. Please leave a review!`,
      url:   `/orders/${orderId}`,
      data:  { type: 'order_delivered', orderId },
    }),

  orderCancelled: (userId, orderId) =>
    sendToUser(userId, {
      title: '❌ Order Cancelled — MediportBD',
      body:  `Order #${orderId} has been cancelled. Contact us if you need help.`,
      url:   `/orders/${orderId}`,
      data:  { type: 'order_cancelled', orderId },
    }),

  refundProcessed: (userId, orderId, amount) =>
    sendToUser(userId, {
      title: '💰 Refund Processed — MediportBD',
      body:  `৳${amount?.toLocaleString()} has been refunded for order #${orderId}.`,
      url:   `/orders/${orderId}`,
      data:  { type: 'refund_processed', orderId },
    }),

  flashDeal: (productName, discount, productId) =>
    sendToAll({
      title: `🔥 Flash Deal — ${discount}% OFF`,
      body:  `${productName} is on flash sale. Limited time only!`,
      url:   `/products/${productId}`,
      data:  { type: 'flash_deal', productId },
    }),

  stockAlert: (userId, productName, productId) =>
    sendToUser(userId, {
      title: '📋 Back in Stock — MediportBD',
      body:  `${productName} is available again. Order before it runs out!`,
      url:   `/products/${productId}`,
      data:  { type: 'stock_alert', productId },
    }),

  welcomeNotification: (userId) =>
    sendToUser(userId, {
      title: '🎉 Notifications Enabled — MediportBD',
      body:  "You'll get instant alerts for orders, deals, and stock updates.",
      url:   '/',
      data:  { type: 'welcome' },
    }),

  orderConfirmed: (order) =>
    sendToUser(order.user, {
      title: '✅ Order Confirmed — MediportBD',
      body:  `Your order #${order.orderNumber} for ৳${(order.totalAmount || 0).toLocaleString()} has been confirmed.`,
      url:   `/orders/${order._id}`,
      data:  { type: 'order_placed', orderId: String(order._id) },
    }),

  newOrderAdmin: (order) =>
    sendToAdmins({
      title: '🆕 New Order — MediportBD',
      body:  `Order #${order.orderNumber} for ৳${(order.totalAmount || 0).toLocaleString()} has been placed by ${order.deliveryAddress?.name || 'a customer'}.`,
      url:   `/admin/orders/${order._id}`,
      data:  { type: 'new_order_admin', orderId: String(order._id) },
    }),
};

module.exports = { sendToUser, sendToAll, sendToAdmins, sendToSegment, notifications };
