/**
 * Automation Controller
 * ─────────────────────
 * Data endpoints consumed exclusively by the self-hosted n8n instance.
 * Every route is protected by automationAuth (X-Automation-Key header).
 *
 * These endpoints keep ALL business logic / DB access inside the backend —
 * n8n only orchestrates messaging and scheduling. See automation/docs/N8N_AUTOMATION_PLAN.md
 */

const Order = require('../models/Order');
const Product = require('../models/Product');
const Cart = require('../models/Cart');
const User = require('../models/User');
const Quote = require('../models/Quote');
const { successResponse, errorResponse } = require('../utils/responseHelper');
const logger = require('../utils/logger');

// ── Helpers ──────────────────────────────────────────────────────────────────

const CUSTOMER_FIELDS = 'name email phone role marketingSegment loyaltyPoints createdAt';

function periodRange(period) {
  const now = new Date();
  const start = new Date(now);
  if (period === 'today') {
    start.setHours(0, 0, 0, 0);
  } else if (period === 'week') {
    start.setDate(start.getDate() - 7);
  } else if (period === 'month') {
    start.setMonth(start.getMonth() - 1);
  } else {
    start.setDate(start.getDate() - 1);
  }
  return { $gte: start, $lte: now };
}

/**
 * RFM-lite segmentation over aggregated order history.
 * Returns per-segment customer lists with contact info for campaigns.
 */
async function buildSegment(segment, limit) {
  const now = Date.now();
  const DAY = 24 * 60 * 60 * 1000;

  if (segment === 'new') {
    const cutoff = new Date(now - 30 * DAY);
    return User.find({
      role: { $in: ['customer', 'b2b_customer'] },
      isActive: true,
      createdAt: { $gte: cutoff }
    })
      .select(CUSTOMER_FIELDS)
      .limit(limit)
      .lean();
  }

  // Aggregate order stats per customer (newest order first for seed products)
  const pipeline = [
    { $match: { status: { $nin: ['cancelled', 'refunded', 'returned'] } } },
    { $sort: { 'statusTimestamps.placed': -1 } },
    {
      $group: {
        _id: '$user',
        orders: { $sum: 1 },
        totalSpent: { $sum: '$totalAmount' },
        lastOrderAt: { $max: '$statusTimestamps.placed' },
        lastProductIds: { $first: '$items.product' }
      }
    },
    { $sort: { totalSpent: -1 } }
  ];

  const stats = await Order.aggregate(pipeline);
  const userIds = stats.map((s) => s._id);
  const users = await User.find({
    _id: { $in: userIds },
    role: { $in: ['customer', 'b2b_customer'] },
    isActive: true
  })
    .select(CUSTOMER_FIELDS)
    .lean();

  const statMap = new Map(stats.map((s) => [String(s._id), s]));
  const out = [];
  for (const u of users) {
    const s = statMap.get(String(u._id));
    if (!s) {
      continue;
    }
    const daysSince = Math.floor((now - new Date(s.lastOrderAt || u.createdAt).getTime()) / DAY);

    let match = false;
    switch (segment) {
      case 'vip':
        match = (s.totalSpent >= 50000 || s.orders >= 10) && daysSince <= 60;
        break;
      case 'at_risk':
        match = s.orders >= 1 && daysSince > 45 && daysSince <= 90;
        break;
      case 'dormant':
        match = s.orders >= 1 && daysSince > 90;
        break;
      case 'active':
        match = s.orders >= 1 && daysSince <= 45;
        break;
      default:
        match = false;
    }
    if (match) {
      out.push({ ...u, orderStats: { orders: s.orders, totalSpent: s.totalSpent, daysSinceLastOrder: daysSince, lastProductIds: s.lastProductIds || [] } });
    }
    if (out.length >= limit) {
      break;
    }
  }
  return out;
}

// ── Endpoints ────────────────────────────────────────────────────────────────

/** POST /test — connectivity check from n8n. */
exports.testConnection = async (req, res) => {
  return successResponse(res, {
    pong: true,
    timestamp: new Date().toISOString(),
    n8n: require('../services/n8nWebhookService').getStatus()
  }, 'Automation API reachable');
};

/** GET /low-stock — products at/below their lowStockThreshold. */
exports.getLowStock = async (req, res) => {
  try {
    const products = await Product.find({
      isActive: true,
      $expr: { $lte: ['$stock', { $ifNull: ['$lowStockThreshold', '$minStock'] }] }
    })
      .select('name sku stock lowStockThreshold minStock price category brand soldCount updatedAt')
      .populate('category', 'name')
      .populate('brand', 'name')
      .sort({ stock: 1 })
      .lean();

    const outOfStock = products.filter((p) => p.stock <= 0);
    const lowStock = products.filter((p) => p.stock > 0);

    return successResponse(res, {
      count: products.length,
      outOfStock,
      lowStock,
      generatedAt: new Date().toISOString()
    });
  } catch (err) {
    logger.error(`[automation:getLowStock] ${err.message}`);
    return errorResponse(res, 'Failed to fetch low-stock products', null, 500);
  }
};

/** GET /abandoned-carts?minutes=120&limit=50 — carts idle ≥ N minutes with items. */
exports.getAbandonedCarts = async (req, res) => {
  try {
    const minutes = Math.max(15, parseInt(req.query.minutes, 10) || 120);
    const limit = Math.min(200, parseInt(req.query.limit, 10) || 50);
    const cutoff = new Date(Date.now() - minutes * 60 * 1000);

    const carts = await Cart.find({
      'items.0': { $exists: true },
      recoveryEmailSent: false,
      recoveredAt: { $exists: false },
      lastActivity: { $lte: cutoff },
      user: { $ne: null }
    })
      .populate('user', CUSTOMER_FIELDS)
      .populate('items.product', 'name slug price images')
      .sort({ subtotal: -1 })
      .limit(limit)
      .lean();

    return successResponse(res, {
      count: carts.length,
      carts: carts.map((c) => ({
        cartId: c._id,
        subtotal: c.subtotal,
        lastActivity: c.lastActivity,
        customer: c.user,
        items: (c.items || []).map((i) => ({
          name: i.product?.name,
          slug: i.product?.slug,
          qty: i.quantity,
          price: i.price
        }))
      }))
    });
  } catch (err) {
    logger.error(`[automation:getAbandonedCarts] ${err.message}`);
    return errorResponse(res, 'Failed to fetch abandoned carts', null, 500);
  }
};

/** POST /carts/mark-notified {cartIds:[]} — suppression flag after recovery message. */
exports.markCartsNotified = async (req, res) => {
  try {
    const { cartIds } = req.body || {};
    if (!Array.isArray(cartIds) || !cartIds.length) {
      return errorResponse(res, 'cartIds array is required', null, 400);
    }
    const result = await Cart.updateMany(
      { _id: { $in: cartIds } },
      { $set: { recoveryEmailSent: true, recoveryEmailSentAt: new Date(), isAbandoned: true, abandonedAt: new Date() } }
    );
    return successResponse(res, { updated: result.modifiedCount });
  } catch (err) {
    logger.error(`[automation:markCartsNotified] ${err.message}`);
    return errorResponse(res, 'Failed to mark carts notified', null, 500);
  }
};

/** GET /customers/segment/:segment?limit=100 — vip|at_risk|dormant|new|active */
exports.getCustomerSegment = async (req, res) => {
  try {
    const valid = ['vip', 'at_risk', 'dormant', 'new', 'active'];
    const segment = req.params.segment;
    if (!valid.includes(segment)) {
      return errorResponse(res, `Invalid segment. Use one of: ${valid.join(', ')}`, null, 400);
    }
    const limit = Math.min(500, parseInt(req.query.limit, 10) || 100);
    const customers = await buildSegment(segment, limit);
    return successResponse(res, { segment, count: customers.length, customers });
  } catch (err) {
    logger.error(`[automation:getCustomerSegment] ${err.message}`);
    return errorResponse(res, 'Failed to build segment', null, 500);
  }
};

/** POST /customers/apply-segments [{userId, segment}] — persist WF-08 results. */
exports.applySegments = async (req, res) => {
  try {
    const updates = Array.isArray(req.body) ? req.body : req.body.updates;
    if (!Array.isArray(updates)) {
      return errorResponse(res, 'Body must be an array of {userId, segment}', null, 400);
    }
    const valid = ['vip', 'at_risk', 'dormant', 'new', 'active'];
    let applied = 0;
    const ops = [];
    for (const u of updates.slice(0, 1000)) {
      if (!u.userId || !valid.includes(u.segment)) {
        continue;
      }
      ops.push({
        updateOne: {
          filter: { _id: u.userId },
          update: { $set: { marketingSegment: u.segment, segmentedAt: new Date() } }
        }
      });
    }
    if (ops.length) {
      const result = await User.bulkWrite(ops);
      applied = result.modifiedCount || 0;
    }
    return successResponse(res, { applied });
  } catch (err) {
    logger.error(`[automation:applySegments] ${err.message}`);
    return errorResponse(res, 'Failed to apply segments', null, 500);
  }
};

/** GET /products/:id/recommendations?limit=4 — reuses recommendationService. */
exports.getProductRecommendations = async (req, res) => {
  try {
    const limit = Math.min(12, parseInt(req.query.limit, 10) || 4);
    const recommendationService = require('../services/recommendationService');
    const products = await recommendationService.getSimilarProducts(req.params.id, limit);
    return successResponse(res, {
      count: products.length,
      products: products.map((p) => ({
        _id: p._id,
        name: p.name,
        slug: p.slug,
        price: p.price,
        image: p.images?.find((i) => i.isPrimary)?.url || p.images?.[0]?.url || null
      }))
    });
  } catch (err) {
    logger.error(`[automation:getProductRecommendations] ${err.message}`);
    return errorResponse(res, 'Failed to fetch recommendations', null, 500);
  }
};

/** GET /orders/stats?period=today|week|month — digest data for WF-07. */
exports.getOrderStats = async (req, res) => {
  try {
    const period = ['today', 'week', 'month'].includes(req.query.period) ? req.query.period : 'today';
    const dateRange = periodRange(period);

    const [summary] = await Order.aggregate([
      { $match: { createdAt: dateRange, status: { $nin: ['cancelled', 'refunded'] } } },
      {
        $group: {
          _id: null,
          orders: { $sum: 1 },
          revenue: { $sum: '$totalAmount' },
          b2bOrders: { $sum: { $cond: ['$isB2BOrder', 1, 0] } },
          codOrders: { $sum: { $cond: [{ $eq: ['$paymentMethod', 'cod'] }, 1, 0] } }
        }
      },
      {
        $project: {
          _id: 0,
          orders: 1,
          revenue: { $round: ['$revenue', 2] },
          aov: { $round: [{ $divide: ['$revenue', { $max: ['$orders', 1] }] }, 2] },
          b2bOrders: 1,
          codOrders: 1
        }
      }
    ]);

    const [cancelled] = await Order.aggregate([
      { $match: { createdAt: dateRange, status: 'cancelled' } },
      { $count: 'count' }
    ]);

    const topProducts = await Order.aggregate([
      { $match: { createdAt: dateRange, status: { $nin: ['cancelled', 'refunded'] } } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.name',
          sku: { $first: '$items.sku' },
          unitsSold: { $sum: '$items.qty' },
          revenue: { $sum: { $multiply: ['$items.price', '$items.qty'] } }
        }
      },
      { $sort: { revenue: -1 } },
      { $limit: 5 },
      { $project: { _id: 0, name: '$_id', sku: 1, unitsSold: 1, revenue: { $round: ['$revenue', 2] } } }
    ]);

    return successResponse(res, {
      period,
      summary: summary || { orders: 0, revenue: 0, aov: 0, b2bOrders: 0, codOrders: 0 },
      cancelled: cancelled?.count || 0,
      topProducts,
      generatedAt: new Date().toISOString()
    });
  } catch (err) {
    logger.error(`[automation:getOrderStats] ${err.message}`);
    return errorResponse(res, 'Failed to compute order stats', null, 500);
  }
};

/** GET /quotes/stale?hours=24 — quotes awaiting response beyond SLA (WF-04 sweep). */
exports.getStaleQuotes = async (req, res) => {
  try {
    const hours = Math.max(1, parseInt(req.query.hours, 10) || 24);
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);

    const quotes = await Quote.find({
      status: 'sent',
      createdAt: { $lte: cutoff }
    })
      .select('quoteNumber company companyName estimatedTotal status createdAt validUntil')
      .populate('user', CUSTOMER_FIELDS)
      .sort({ createdAt: 1 })
      .limit(100)
      .lean();

    return successResponse(res, { count: quotes.length, quotes });
  } catch (err) {
    logger.error(`[automation:getStaleQuotes] ${err.message}`);
    return errorResponse(res, 'Failed to fetch stale quotes', null, 500);
  }
};
