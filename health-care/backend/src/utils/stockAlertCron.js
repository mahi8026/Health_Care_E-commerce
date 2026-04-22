const cron = require('node-cron');
const Product = require('../models/Product');
const { sendLowStockAlert } = require('./emailService');
const logger = require('./logger');

/**
 * Daily 8:00 AM BDT (UTC+6 = 02:00 UTC) — check low stock and email admin.
 * Also runs at midnight to expire stale quotes.
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

  logger.info('Cron jobs scheduled: stock alerts (8AM BDT) + quote expiry (midnight BDT)');
}

module.exports = { startCronJobs };
