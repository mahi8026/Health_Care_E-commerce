const Newsletter = require('../models/Newsletter');
const { sendNewsletterWelcomeEmail, sendNewsletterBroadcast } = require('../utils/emailService');
const logger = require('../utils/logger');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/responseHelper');

// ─── Public: Subscribe ───────────────────────────────────────────────────────
exports.subscribe = async (req, res) => {
  try {
    const { email, name, source = 'footer' } = req.body;

    if (!email) {
      return errorResponse(res, 'Email is required', null, 400);
    }

    // Check if email already exists
    let subscriber = await Newsletter.findOne({ email: email.toLowerCase() });

    if (subscriber) {
      if (subscriber.isSubscribed) {
        return successResponse(res, { alreadySubscribed: true }, 'You are already subscribed to our newsletter');
      } else {
        // Resubscribe
        subscriber.isSubscribed = true;
        subscriber.subscribedAt = new Date();
        subscriber.unsubscribedAt = undefined;
        if (name) subscriber.name = name;
        if (source) subscriber.source = source;
        await subscriber.save();

        // Send welcome email
        try {
          await sendNewsletterWelcomeEmail(subscriber.email, subscriber.name, subscriber.unsubscribeToken);
        } catch (emailErr) {
          logger.error('Welcome email error:', emailErr);
        }

        return successResponse(res, null, 'Welcome back! You have been resubscribed to our newsletter');
      }
    }

    // Create new subscriber
    subscriber = await Newsletter.create({
      email: email.toLowerCase(),
      name,
      source,
      isSubscribed: true
    });

    // Send welcome email
    try {
      await sendNewsletterWelcomeEmail(subscriber.email, subscriber.name, subscriber.unsubscribeToken);
    } catch (emailErr) {
      logger.error('Welcome email error:', emailErr);
    }

    return successResponse(res, null, 'Thank you for subscribing! Check your email for confirmation.', 201);
  } catch (error) {
    logger.error('Subscribe error:', error);
    return errorResponse(res, 'Failed to subscribe', process.env.NODE_ENV === 'development' ? [error.message] : null, 500);
  }
};

// ─── Public: Unsubscribe ─────────────────────────────────────────────────────
exports.unsubscribe = async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Invalid Link - MediportBD</title>
          <style>
            body { margin:0; padding:40px 20px; font-family:'Plus Jakarta Sans',Arial,sans-serif; background:#F1F3F6; color:#1a1a2e; text-align:center; }
            .container { max-width:500px; margin:0 auto; background:#fff; padding:40px; border-radius:12px; box-shadow:0 2px 8px rgba(0,0,0,0.1); }
            h1 { color:#E24B4A; font-size:24px; margin-bottom:16px; }
            p { color:#666; font-size:14px; line-height:1.6; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>❌ Invalid Unsubscribe Link</h1>
            <p>The unsubscribe link is invalid or expired. Please contact support if you need assistance.</p>
          </div>
        </body>
        </html>
      `);
    }

    const subscriber = await Newsletter.findOne({ unsubscribeToken: token });

    if (!subscriber) {
      return res.status(404).send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Not Found - MediportBD</title>
          <style>
            body { margin:0; padding:40px 20px; font-family:'Plus Jakarta Sans',Arial,sans-serif; background:#F1F3F6; color:#1a1a2e; text-align:center; }
            .container { max-width:500px; margin:0 auto; background:#fff; padding:40px; border-radius:12px; box-shadow:0 2px 8px rgba(0,0,0,0.1); }
            h1 { color:#E24B4A; font-size:24px; margin-bottom:16px; }
            p { color:#666; font-size:14px; line-height:1.6; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>❌ Subscriber Not Found</h1>
            <p>We couldn't find your subscription. You may have already unsubscribed.</p>
          </div>
        </body>
        </html>
      `);
    }

    if (!subscriber.isSubscribed) {
      return res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Already Unsubscribed - MediportBD</title>
          <style>
            body { margin:0; padding:40px 20px; font-family:'Plus Jakarta Sans',Arial,sans-serif; background:#F1F3F6; color:#1a1a2e; text-align:center; }
            .container { max-width:500px; margin:0 auto; background:#fff; padding:40px; border-radius:12px; box-shadow:0 2px 8px rgba(0,0,0,0.1); }
            h1 { color:#0B2545; font-size:24px; margin-bottom:16px; }
            p { color:#666; font-size:14px; line-height:1.6; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>✓ Already Unsubscribed</h1>
            <p>You have already unsubscribed from our newsletter.</p>
          </div>
        </body>
        </html>
      `);
    }

    // Unsubscribe
    subscriber.isSubscribed = false;
    subscriber.unsubscribedAt = new Date();
    await subscriber.save();

    res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Unsubscribed - MediportBD</title>
        <style>
          body { margin:0; padding:40px 20px; font-family:'Plus Jakarta Sans',Arial,sans-serif; background:#F1F3F6; color:#1a1a2e; text-align:center; }
          .container { max-width:500px; margin:0 auto; background:#fff; padding:40px; border-radius:12px; box-shadow:0 2px 8px rgba(0,0,0,0.1); }
          .logo { font-size:28px; font-weight:700; color:#0B2545; margin-bottom:24px; }
          .logo sup { font-size:14px; color:#0E8A6E; }
          h1 { color:#0B2545; font-size:24px; margin-bottom:16px; }
          p { color:#666; font-size:14px; line-height:1.6; margin-bottom:12px; }
          .footer { margin-top:32px; padding-top:24px; border-top:1px solid #E5E7EB; font-size:12px; color:#999; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo">🏥 Mediport<sup>BD</sup></div>
          <h1>✓ You have been unsubscribed successfully</h1>
          <p>We're sorry to see you go! You will no longer receive newsletter emails from MediportBD.</p>
          <p>If you change your mind, you can always resubscribe from our website.</p>
          <div class="footer">
            <p>MediportBD | Medical Equipment & Supplies</p>
            <p>Dhaka, Bangladesh | mahimrahman07@gmail.com</p>
          </div>
        </div>
      </body>
      </html>
    `);
  } catch (error) {
    logger.error('Unsubscribe error:', error);
    res.status(500).send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Error - MediportBD</title>
        <style>
          body { margin:0; padding:40px 20px; font-family:'Plus Jakarta Sans',Arial,sans-serif; background:#F1F3F6; color:#1a1a2e; text-align:center; }
          .container { max-width:500px; margin:0 auto; background:#fff; padding:40px; border-radius:12px; box-shadow:0 2px 8px rgba(0,0,0,0.1); }
          h1 { color:#E24B4A; font-size:24px; margin-bottom:16px; }
          p { color:#666; font-size:14px; line-height:1.6; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>❌ Something went wrong</h1>
          <p>We encountered an error while processing your request. Please try again later or contact support.</p>
        </div>
      </body>
      </html>
    `);
  }
};

// ─── Admin: Get Subscribers ──────────────────────────────────────────────────
exports.getSubscribers = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      search = '', 
      isSubscribed, 
      source, 
      tags 
    } = req.query;

    const query = {};

    // Search by email or name
    if (search) {
      query.$or = [
        { email: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } }
      ];
    }

    // Filter by subscription status
    if (isSubscribed !== undefined) {
      query.isSubscribed = isSubscribed === 'true';
    }

    // Filter by source
    if (source) {
      query.source = source;
    }

    // Filter by tags
    if (tags) {
      query.tags = { $in: Array.isArray(tags) ? tags : [tags] };
    }

    const total = await Newsletter.countDocuments(query);
    const subscribers = await Newsletter.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .lean();

    // Get counts
    const totalSubscribers = await Newsletter.countDocuments();
    const activeSubscribers = await Newsletter.countDocuments({ isSubscribed: true });
    const unsubscribedCount = await Newsletter.countDocuments({ isSubscribed: false });

    return paginatedResponse(res, subscribers, {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
      hasNext: parseInt(page) < Math.ceil(total / parseInt(limit)),
      hasPrev: parseInt(page) > 1,
      stats: {
        total: totalSubscribers,
        active: activeSubscribers,
        unsubscribed: unsubscribedCount
      }
    });
  } catch (error) {
    logger.error('Get subscribers error:', error);
    return errorResponse(res, 'Failed to fetch subscribers', process.env.NODE_ENV === 'development' ? [error.message] : null, 500);
  }
};

// ─── Admin: Delete Subscriber ────────────────────────────────────────────────
exports.deleteSubscriber = async (req, res) => {
  try {
    const { id } = req.params;

    const subscriber = await Newsletter.findByIdAndDelete(id);

    if (!subscriber) {
      return errorResponse(res, 'Subscriber not found', null, 404);
    }

    return successResponse(res, null, 'Subscriber deleted successfully');
  } catch (error) {
    logger.error('Delete subscriber error:', error);
    return errorResponse(res, 'Failed to delete subscriber', process.env.NODE_ENV === 'development' ? [error.message] : null, 500);
  }
};

// ─── Admin: Broadcast Email ──────────────────────────────────────────────────
exports.broadcast = async (req, res) => {
  try {
    const { subject, htmlContent, targetTags = [] } = req.body;

    if (!subject || !htmlContent) {
      return errorResponse(res, 'Subject and content are required', null, 400);
    }

    // Build query for target subscribers
    const query = { isSubscribed: true };
    if (targetTags && targetTags.length > 0) {
      query.tags = { $in: targetTags };
    }

    const subscribers = await Newsletter.find(query).lean();

    if (subscribers.length === 0) {
      return errorResponse(res, 'No active subscribers found for the selected criteria', null, 400);
    }

    // Respond immediately — emails will be sent in the background
    successResponse(res, {
      total: subscribers.length,
      status: 'processing'
    }, `Broadcast started for ${subscribers.length} subscriber(s). Emails are being sent in the background.`);

    // Process email sending in the background (after response is sent)
    const BATCH_SIZE = 50;
    let sent = 0;
    let failed = 0;

    for (let i = 0; i < subscribers.length; i += BATCH_SIZE) {
      const batch = subscribers.slice(i, i + BATCH_SIZE);
      
      await Promise.allSettled(
        batch.map(async (subscriber) => {
          try {
            await sendNewsletterBroadcast(
              subscriber.email,
              subscriber.name,
              subject,
              htmlContent,
              subscriber.unsubscribeToken
            );
            sent++;
          } catch (err) {
            logger.error(`Failed to send to ${subscriber.email}:`, err);
            failed++;
          }
        })
      );

      // Small delay between batches to avoid rate limits
      if (i + BATCH_SIZE < subscribers.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    logger.info(`Broadcast completed: ${sent} sent, ${failed} failed out of ${subscribers.length} total`);
  } catch (error) {
    logger.error('Broadcast error:', error);
    // Only send error response if headers haven't been sent yet
    if (!res.headersSent) {
      return errorResponse(res, 'Failed to send broadcast', process.env.NODE_ENV === 'development' ? [error.message] : null, 500);
    }
  }
};

// ─── Admin: Get Stats ────────────────────────────────────────────────────────
exports.getStats = async (req, res) => {
  try {
    const total = await Newsletter.countDocuments();
    const active = await Newsletter.countDocuments({ isSubscribed: true });
    const unsubscribed = await Newsletter.countDocuments({ isSubscribed: false });

    // Subscriptions this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const thisMonth = await Newsletter.countDocuments({
      subscribedAt: { $gte: startOfMonth }
    });

    // Top sources
    const sourceStats = await Newsletter.aggregate([
      { $match: { isSubscribed: true } },
      { $group: { _id: '$source', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    return successResponse(res, {
      total,
      active,
      unsubscribed,
      thisMonth,
      sources: sourceStats.map(s => ({ source: s._id, count: s.count }))
    });
  } catch (error) {
    logger.error('Get stats error:', error);
    return errorResponse(res, 'Failed to fetch stats', process.env.NODE_ENV === 'development' ? [error.message] : null, 500);
  }
};
