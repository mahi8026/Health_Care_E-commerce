/**
 * Backfill sequential invoice numbers for orders created before invoice
 * numbering was introduced (orders with no `invoiceNumber`).
 *
 * Numbers are assigned per Bangladesh fiscal year (1 Jul – 30 Jun) in
 * `createdAt` order, using the same atomic Counter as order placement, so
 * backfilled numbers continue seamlessly from where new orders left off.
 *
 * Usage:
 *   node src/scripts/backfillInvoiceNumbers.js           # dry run (default)
 *   node src/scripts/backfillInvoiceNumbers.js --apply   # write to DB
 *
 * Exit codes: 0 success, 1 failure.
 */
require('dotenv').config();
const mongoose = require('mongoose');
const { connectDB } = require('../config/database');
const Order = require('../models/Order');
const Counter = require('../models/Counter');
const { computeFiscalYear } = require('../services/orderService');
const logger = require('../utils/logger');

async function main() {
  const apply = process.argv.includes('--apply');
  await connectDB();
  logger.info(`[backfillInvoiceNumbers] mode=${apply ? 'APPLY' : 'DRY RUN'}`);

  const orders = await Order.find({ $or: [{ invoiceNumber: null }, { invoiceNumber: { $exists: false } }] })
    .sort({ createdAt: 1 })
    .select('_id orderNumber createdAt invoiceNumber')
    .lean();

  logger.info(`[backfillInvoiceNumbers] ${orders.length} order(s) without invoice number`);
  if (orders.length === 0) {
    logger.info('[backfillInvoiceNumbers] nothing to do');
    await mongoose.connection.close();
    process.exit(0);
  }

  let updated = 0;
  for (const order of orders) {
    const fy = computeFiscalYear(order.createdAt);
    const counter = await Counter.findOneAndUpdate(
      { _id: `invoice-${fy}` },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    const invoiceNumber = `MPBD-INV-${fy}-${String(counter.seq).padStart(5, '0')}`;
    logger.info(`  ${order.orderNumber || order._id} (${order.createdAt.toISOString().slice(0, 10)}) -> ${invoiceNumber}`);

    if (apply) {
      // Guard against a race with a concurrently placed new order: the sparse
      // unique index makes a duplicate write fail loudly instead of silently.
      try {
        await Order.updateOne({ _id: order._id, invoiceNumber: null }, { $set: { invoiceNumber } });
        updated += 1;
      } catch (err) {
        logger.error(`  FAILED for ${order.orderNumber || order._id}: ${err.message}`);
      }
    }
  }

  logger.info(`[backfillInvoiceNumbers] ${apply ? `assigned ${updated}/${orders.length}` : `${orders.length} would be assigned (dry run — rerun with --apply)`}`);
  await mongoose.connection.close();
  process.exit(0);
}

main().catch(async (err) => {
  logger.error(`[backfillInvoiceNumbers] ${err.message}`, { stack: err.stack });
  try { await mongoose.connection.close(); } catch { /* ignore */ }
  process.exit(1);
});