const cron = require('node-cron');
const Product = require('../models/Product');
const Cart = require('../models/Cart');
const Order = require('../models/Order');
const { sendLowStockAlert, sendAbandonedCartEmail } = require('./emailService');
const { updateFlashDealStatuses } = require('../controllers/flashDealController');
const logger = require('./logger');

/** Escape a user-supplied string before embedding it in a RegExp. */
function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * One abandoned-cart recovery pass.
 *
 * Exported (instead of inlined in the cron handler) so it can be unit-tested
 * and invoked manually. The per-cart claim is atomic: the cart is flagged
 * `recoveryEmailSent` *before* the email leaves, so two overlapping runs — or
 * a run that outlives the next 2-hour tick — can never email the same customer
 * twice. If the send fails the claim is released, so the cart is retried next
 * run instead of being silently lost.
 *
 * @param {{ now?: Date, limit?: number }} [options]
 * @returns {Promise<{candidates:number,sent:number,alreadyOrdered:number,claimedElsewhere:number,failed:number}>}
 */
async function runAbandonedCartRecovery({ now = new Date(), limit = 200 } = {}) {
  const summary = { candidates: 0, sent: 0, alreadyOrdered: 0, claimedElsewhere: 0, failed: 0 };
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

  // Carts that are not flagged abandoned yet, idle 1h+, never emailed, not
  // opted out, still hold items, and are reachable: the account owner OR the
  // email captured at guest checkout (WAVE-GUEST-RECOVERY — guests used to be
  // skipped entirely, so that whole segment was unrecoverable).
  const abandonedCarts = await Cart.find({
    isAbandoned: false,
    lastActivity: { $lt: oneHourAgo },
    recoveryEmailSent: false,
    recoveryOptOut: { $ne: true },
    'items.0': { $exists: true }, // Has at least one item
    $or: [
      { user: { $exists: true, $ne: null } },
      { contactEmail: { $exists: true, $nin: [null, ''] } }
    ]
  })
    .limit(limit) // P2 — bound batch size per run; stragglers are picked up next run
    .populate('user', 'name email')
    .populate('items.product', 'name images price slug');

  summary.candidates = abandonedCarts.length;
  logger.info(`[CRON] Found ${summary.candidates} abandoned cart(s)`);

  for (const cart of abandonedCarts) {
    // Recipient: the account owner, or the email captured at guest checkout.
    const recipient = cart.user && cart.user.email
      ? { name: cart.user.name, email: cart.user.email }
      : (cart.contactEmail ? { name: 'there', email: cart.contactEmail } : null);

    if (!recipient) {
      // Unreachable cart — record it as abandoned so it is not re-scanned.
      await Cart.updateOne(
        { _id: cart._id, isAbandoned: false },
        { $set: { isAbandoned: true, abandonedAt: now } }
      );
      continue;
    }

    // Atomic claim — exactly one runner owns this cart's send.
    const claimed = await Cart.findOneAndUpdate(
      { _id: cart._id, recoveryEmailSent: false, recoveryOptOut: { $ne: true } },
      {
        $set: {
          isAbandoned: true,
          abandonedAt: now,
          recoveryEmailSent: true,
          recoveryEmailSentAt: now
        }
      },
      { new: true }
    ).select('_id');

    if (!claimed) {
      summary.claimedElsewhere += 1;
      continue;
    }

    // Suppress recovery when this email already placed an order after the cart
    // was created — otherwise we chase a guest who did complete checkout
    // (guest orders store the address email, not a user ref).
    const alreadyOrdered = await Order.exists({
      'deliveryAddress.email': new RegExp(`^${escapeRegExp(recipient.email)}$`, 'i'),
      createdAt: { $gte: cart.createdAt || new Date(0) }
    });
    if (alreadyOrdered) {
      summary.alreadyOrdered += 1;
      logger.info(`[CRON] Recovery skipped for ${recipient.email} — order already placed`);
      continue;
    }

    try {
      // Send recovery email
      await sendAbandonedCartEmail(cart, recipient, cart.recoveryOptOutToken);
      summary.sent += 1;
      logger.info(`[CRON] Recovery email sent to ${recipient.email}`);
    } catch (emailErr) {
      summary.failed += 1;
      logger.error(`[CRON] Failed to send recovery email for cart ${cart._id}: ${emailErr.message}`);
      // Release the claim so the next run retries this cart.
      await Cart.updateOne(
        { _id: cart._id },
        { $set: { recoveryEmailSent: false, recoveryEmailSentAt: null } }
      );
    }
  }

  return summary;
}

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
      })
        // P2 — bound the scan: project only what the email needs and cap rows
        .select('name sku stock lowStockThreshold minStock category')
        .limit(500)
        .lean();

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
  // Skipped only when n8n is genuinely wired up: flag AND webhook base URL,
  // matching n8nWebhookService's ENABLED check. Keying off the flag alone let a
  // leftover N8N_EVENTS_ENABLED=true with no reachable n8n instance silence
  // recovery completely — backend cron off and WF-03 never firing.
  const n8nHandlesCarts =
    process.env.N8N_EVENTS_ENABLED === 'true' && Boolean(process.env.N8N_WEBHOOK_BASE_URL);

  if (n8nHandlesCarts) {
    logger.info('[CRON] Abandoned cart recovery handled by n8n WF-03 — backend cron disabled');
  } else {
    cron.schedule('0 */2 * * *', async () => {
      logger.info('[CRON] Running abandoned cart check...');
      try {
        const summary = await runAbandonedCartRecovery();
        logger.info(
          `[CRON] Abandoned cart run complete — candidates=${summary.candidates} sent=${summary.sent} ` +
            `alreadyOrdered=${summary.alreadyOrdered} claimedElsewhere=${summary.claimedElsewhere} ` +
            `failed=${summary.failed}`
        );
      } catch (err) {
        logger.error(`[CRON] Abandoned cart check error: ${err.message}`);
      }
    }, { timezone: 'Asia/Dhaka' });
  }

  // ── Flash Deal Status Update — every 5 minutes ────────────────────────────
  cron.schedule('*/5 * * * *', async () => {
    logger.info('[CRON] Updating flash deal statuses...');
    try {
      await updateFlashDealStatuses();
    } catch (err) {
      logger.error(`[CRON] Flash deal status update error: ${err.message}`);
    }
  }, { timezone: 'Asia/Dhaka' });

  logger.info('Cron jobs scheduled: stock alerts (8AM BDT) + quote expiry (midnight BDT) + abandoned carts (every 2h) + flash deals (every 5min)');
}

module.exports = { startCronJobs, runAbandonedCartRecovery };
