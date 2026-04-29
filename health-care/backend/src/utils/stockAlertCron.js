const cron = require('node-cron');
const Product = require('../models/Product');
const Cart = require('../models/Cart');
const User = require('../models/User');
const { sendLowStockAlert, sendAbandonedCartEmail } = require('./emailService');
const logger = require('./logger');

/**
 * Daily 8:00 AM BDT (UTC+6 = 02:00 UTC) — check low stock and email admin.
 * Also runs at midnight to expire stale quotes.
 * Every 2 hours — check for abandoned carts and send recovery emails.
 */
function startCronJobs() {
  // ── Low Stock Alert — daily 8:00 AM BDT (02:00 UTC) ─────────────────────
  cron.schedule('0 2 * * *', async () => {
    logger.info('[CRON] Running daily stock alert check...');
    try {
      const lowStockProducts = await Product.find({
        isActive: true,
        $expr: { $lte: ['$stock', { $ifNull: ['$lowStockThreshold', '$minStock', 10] }] }
      }).lean();

      if (lowStockProducts.length > 0) {
        await sendLowStockAlert(lowStockProducts);
        logger.info(`[CRON] Stock alert sent for ${lowStockProducts.length} product(s)`);
      } else {
        logger.info('[CRON] All products have sufficient stock');
      }
    } catch (err) {
      logger.error(`[CRON] Stock alert error: ${err.message}`);
    }
  }, { timezone: 'Asia/Dhaka' });

  // ── Expire Quotes — daily midnight BDT (18:00 UTC previous day) ──────────
  cron.schedule('0 18 * * *', async () => {
    logger.info('[CRON] Running quote expiry check...');
    try {
      const Quote = require('../models/Quote');
      const result = await Quote.updateMany(
        {
          status: { $in: ['pending', 'sent'] },
          validUntil: { $lt: new Date() }
        },
        { $set: { status: 'expired' } }
      );
      logger.info(`[CRON] Expired ${result.modifiedCount} quote(s)`);
    } catch (err) {
      logger.error(`[CRON] Quote expiry error: ${err.message}`);
    }
  }, { timezone: 'Asia/Dhaka' });

  // ── Abandoned Cart Recovery — every 2 hours ──────────────────────────────
  cron.schedule('0 */2 * * *', async () => {
    logger.info('[CRON] Running abandoned cart check...');
    try {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

      // Find carts that:
      // - Are not marked as abandoned yet
      // - Have not been active for 1+ hour
      // - Have not received recovery email
      // - Have a user (skip guest carts)
      // - Have items
      const abandonedCarts = await Cart.find({
        isAbandoned: false,
        lastActivity: { $lt: oneHourAgo },
        recoveryEmailSent: false,
        user: { $exists: true, $ne: null },
        'items.0': { $exists: true } // Has at least one item
      }).populate('user', 'name email')
        .populate('items.product', 'name images price');

      logger.info(`[CRON] Found ${abandonedCarts.length} abandoned cart(s)`);

      for (const cart of abandonedCarts) {
        try {
          // Mark as abandoned
          cart.isAbandoned = true;
          cart.abandonedAt = new Date();

          // Send recovery email
          if (cart.user && cart.user.email) {
            await sendAbandonedCartEmail(cart, cart.user);
            cart.recoveryEmailSent = true;
            cart.recoveryEmailSentAt = new Date();
            logger.info(`[CRON] Recovery email sent to ${cart.user.email}`);
          }

          await cart.save();
        } catch (emailErr) {
          logger.error(`[CRON] Failed to send recovery email for cart ${cart._id}: ${emailErr.message}`);
          // Still mark as abandoned even if email fails
          cart.isAbandoned = true;
          cart.abandonedAt = new Date();
          await cart.save();
        }
      }

      logger.info(`[CRON] Processed ${abandonedCarts.length} abandoned cart(s)`);
    } catch (err) {
      logger.error(`[CRON] Abandoned cart check error: ${err.message}`);
    }
  }, { timezone: 'Asia/Dhaka' });

  logger.info('Cron jobs scheduled: stock alerts (8AM BDT) + quote expiry (midnight BDT) + abandoned carts (every 2h)');
}

module.exports = { startCronJobs };
