const { sendToUser, sendToAll, notifications } = require('../utils/oneSignalService');
const logger = require('../utils/logger');

/**
 * POST /api/push/register-user
 * Called after OneSignal subscription to link the OneSignal player ID
 * with the logged-in user's MongoDB ID (sets external_id on OneSignal).
 * This allows us to send targeted notifications by user ID.
 *
 * OneSignal external_id = MongoDB user _id (string)
 * This is set client-side via OneSignal.login(userId) — no backend call needed.
 * This endpoint is kept for compatibility / manual overrides.
 */
exports.registerUser = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.json({ success: true, message: 'Guest subscription — no user linking needed' });
    }
    // OneSignal login() on the client handles this automatically
    res.json({ success: true, message: 'User registered with OneSignal', userId });
  } catch (err) {
    logger.error(`[OneSignal] registerUser error: ${err.message}`);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * POST /api/push/subscribe  (kept for backwards compatibility)
 * With OneSignal we don't need to store subscriptions ourselves —
 * OneSignal manages all that. We just send a welcome notification.
 */
exports.subscribe = async (req, res) => {
  try {
    const userId = req.user?._id;
    logger.info(`[OneSignal] Subscribe called — userId: ${userId || 'guest'}`);

    // Send welcome notification if user is logged in
    if (userId) {
      try {
        await notifications.welcomeNotification(userId);
        logger.info(`[OneSignal] Welcome notification sent to user ${userId}`);
      } catch (notifErr) {
        logger.error(`[OneSignal] Welcome notification failed: ${notifErr.message}`);
      }
    }

    res.json({ success: true, message: 'Subscribed successfully via OneSignal' });
  } catch (err) {
    logger.error(`[OneSignal] subscribe error: ${err.message}`);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * DELETE /api/push/unsubscribe (kept for backwards compatibility)
 */
exports.unsubscribe = async (req, res) => {
  res.json({ success: true, message: 'Unsubscribed — managed by OneSignal client SDK' });
};

/**
 * PATCH /api/push/preferences
 */
exports.updatePreferences = async (req, res) => {
  res.json({ success: true, message: 'Preferences updated — managed by OneSignal tags' });
};

/**
 * POST /api/admin/push/broadcast
 * Admin sends a push notification to all subscribers
 */
/**
 * POST /api/admin/push/send-to-user
 * Admin sends a push notification to a specific user by their _id
 */
exports.sendToUser = async (req, res) => {
  try {
    const { userId, title, body, url } = req.body;
    if (!userId || !title || !body) {
      return res.status(400).json({ success: false, message: 'userId, title, and body are required' });
    }

    const result = await sendToUser(userId, { title, body, url: url || '/' });

    if (!result) {
      return res.status(500).json({ success: false, message: 'Failed to send via OneSignal' });
    }

    res.json({
      success: true,
      message: `Notification sent to user ${userId}`,
      data: { id: result.id },
    });
  } catch (err) {
    logger.error(`[OneSignal] sendToUser error: ${err.message}`);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.broadcast = async (req, res) => {
  try {
    const { title, body, url, image } = req.body;
    if (!title || !body) {
      return res.status(400).json({ success: false, message: 'Title and body are required' });
    }

    const result = await sendToAll({ title, body, url: url || '/', image });

    if (!result) {
      return res.status(500).json({ success: false, message: 'Failed to send via OneSignal' });
    }

    res.json({
      success: true,
      message: `Notification sent to ${result.recipients || 0} devices`,
      data: { sent: result.recipients, id: result.id },
    });
  } catch (err) {
    logger.error(`[OneSignal] broadcast error: ${err.message}`);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/admin/push/stats
 */
exports.getStats = async (req, res) => {
  try {
    const ONESIGNAL_APP_ID  = process.env.ONESIGNAL_APP_ID;
    const ONESIGNAL_API_KEY = process.env.ONESIGNAL_API_KEY;

    if (!ONESIGNAL_APP_ID || !ONESIGNAL_API_KEY) {
      return res.json({ success: true, data: { total: 0, message: 'OneSignal not configured' } });
    }

    const response = await fetch(
      `https://onesignal.com/api/v1/apps/${ONESIGNAL_APP_ID}`,
      { headers: { Authorization: `Basic ${ONESIGNAL_API_KEY}` } }
    );
    const data = await response.json();

    res.json({
      success: true,
      data: {
        total: data.players || 0,
        messagable: data.messagable_players || 0,
        appName: data.name,
      },
    });
  } catch (err) {
    logger.error(`[OneSignal] getStats error: ${err.message}`);
    res.status(500).json({ success: false, message: err.message });
  }
};
