const PushSubscription = require('../models/PushSubscription');
const { sendToUser, sendToAll, sendToAdmins, notifications } = require('../utils/pushService');
const logger = require('../utils/logger');

// POST /api/push/subscribe — save subscription
exports.subscribe = async (req, res) => {
  try {
    logger.info(`[Push] Subscribe request received from ${req.ip}`);
    const { subscription, preferences, browser, device, os } = req.body;
    
    // Validate subscription object
    if (!subscription) {
      logger.error('[Push] Missing subscription object in request body');
      return res.status(400).json({ success: false, message: 'Missing subscription object' });
    }
    
    if (!subscription.endpoint) {
      logger.error('[Push] Missing endpoint in subscription');
      return res.status(400).json({ success: false, message: 'Missing subscription endpoint' });
    }
    
    if (!subscription.keys?.p256dh || !subscription.keys?.auth) {
      logger.error('[Push] Missing keys in subscription');
      return res.status(400).json({ success: false, message: 'Missing subscription keys (p256dh or auth)' });
    }
    
    logger.info(`[Push] Valid subscription received: ${subscription.endpoint.substring(0, 50)}...`);
    
    // Upsert subscription (update if endpoint exists)
    const saved = await PushSubscription.findOneAndUpdate(
      { endpoint: subscription.endpoint },
      {
        user:        req.user?._id || null,
        endpoint:    subscription.endpoint,
        keys:        subscription.keys,
        preferences: preferences || {},
        browser:     browser || '',
        device:      device || '',
        os:          os || '',
        isActive:    true,
        lastUsed:    new Date(),
      },
      { upsert: true, new: true }
    );
    
    logger.info(`[Push] Subscription saved to database: ${saved._id}`);
    
    // Send welcome notification
    if (req.user?._id) {
      logger.info(`[Push] Sending welcome notification to user ${req.user._id}`);
      try {
        await sendToUser(req.user._id, {
          title: '🎉 Notifications Enabled — MediportBD',
          body:  'You\'ll receive updates on orders, deals, and stock alerts.',
          icon:  '/icons/icon-192x192.png',
          tag:   'welcome',
          url:   '/',
        });
        logger.info(`[Push] Welcome notification sent successfully`);
      } catch (notifErr) {
        logger.error(`[Push] Failed to send welcome notification: ${notifErr.message}`);
        // Don't fail the subscription if welcome notification fails
      }
    }
    
    res.json({ success: true, message: 'Subscribed successfully', data: { id: saved._id } });
  } catch (err) {
    logger.error(`[Push] subscribe error: ${err.message}`);
    logger.error(`[Push] subscribe stack: ${err.stack}`);
    res.status(500).json({ success: false, message: err.message, error: err.toString() });
  }
};

// DELETE /api/push/unsubscribe — remove subscription
exports.unsubscribe = async (req, res) => {
  try {
    const { endpoint } = req.body;
    await PushSubscription.findOneAndDelete({ endpoint });
    res.json({ success: true, message: 'Unsubscribed successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /api/push/preferences — update notification preferences
exports.updatePreferences = async (req, res) => {
  try {
    const { endpoint, preferences } = req.body;
    await PushSubscription.findOneAndUpdate(
      { endpoint },
      { preferences }
    );
    res.json({ success: true, message: 'Preferences updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/admin/push/broadcast — admin sends notification to all users
exports.broadcast = async (req, res) => {
  try {
    const { title, body, url, image } = req.body;
    if (!title || !body) {
      return res.status(400).json({ success: false, message: 'Title and body are required' });
    }
    
    const payload = {
      title,
      body,
      icon:  '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      image: image || null,
      url:   url || '/',
      tag:   `broadcast-${Date.now()}`,
      data:  { type: 'broadcast' },
    };
    
    const sent = await sendToAll(payload);
    res.json({ success: true, message: `Notification sent to ${sent} devices`, data: { sent } });
  } catch (err) {
    logger.error(`[Push] broadcast: ${err.message}`);
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/admin/push/stats — push notification stats
exports.getStats = async (req, res) => {
  try {
    const [total, active, withUser, mobile, desktop] = await Promise.all([
      PushSubscription.countDocuments(),
      PushSubscription.countDocuments({ isActive: true }),
      PushSubscription.countDocuments({ user: { $ne: null }, isActive: true }),
      PushSubscription.countDocuments({ device: 'mobile', isActive: true }),
      PushSubscription.countDocuments({ device: 'desktop', isActive: true }),
    ]);
    res.json({ success: true, data: { total, active, withUser, mobile, desktop } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
