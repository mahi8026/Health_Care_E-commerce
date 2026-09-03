// health-care/backend/src/controllers/marketingController.js

/**
 * marketingController — Marketing channel analytics for the admin dashboard.
 *
 *  - POST /api/marketing/events        (public beacon — fire-and-forget)
 *  - GET  /api/marketing/overview      (admin) — channel KPIs in one call
 */

const mongoose = require('mongoose');
const MarketingEvent = require('../models/MarketingEvent');
const Newsletter = require('../models/Newsletter');
const Product = require('../models/Product');
const Cart = require('../models/Cart');
const Coupon = require('../models/Coupon');
const FlashDeal = require('../models/FlashDeal');
const Order = require('../models/Order');
const { successResponse, errorResponse } = require('../utils/responseHelper');
const logger = require('../utils/logger');

// Only these beacon types are accepted — keeps the public endpoint meaningless
// to spammers and the dashboard aggregates predictable.
const ALLOWED_EVENT_TYPES = new Set([
  'whatsapp_order_click',       // product page "Order on WhatsApp"
  'exit_intent_popup_shown',    // popup impression
  'exit_popup_lead',            // popup email captured
  'exit_popup_whatsapp_click',  // popup WhatsApp fallback clicked
]);

// ─── POST /api/marketing/events (public beacon) ──────────────────────────────
exports.trackEvent = async (req, res) => {
  try {
    const { type, productId, value, currency, path } = req.body || {};

    if (!type || !ALLOWED_EVENT_TYPES.has(type)) {
      return errorResponse(res, 'Unknown event type', null, 400);
    }

    const doc = {
      type,
      path: typeof path === 'string' ? path.slice(0, 300) : '',
    };

    if (productId && mongoose.Types.ObjectId.isValid(productId)) {
      doc.productId = productId;
    }
    if (typeof value === 'number' && Number.isFinite(value) && value >= 0) {
      doc.value = Math.min(value, 100000000); // sanity cap
    }
    if (typeof currency === 'string' && currency.length <= 8) {
      doc.currency = currency.toUpperCase();
    }

    await MarketingEvent.create(doc);
    return res.status(204).end();
  } catch (error) {
    // Beacon failures must never break the storefront UX.
    logger.error('Marketing event track error:', error.message);
    return res.status(204).end();
  }
};

// ─── GET /api/marketing/overview (admin) ─────────────────────────────────────
exports.getOverview = async (req, res) => {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      eventsByType,
      newsletterBySource,
      newsletterTotals,
      topProducts,
      abandonedCarts,
      activeCoupons,
      activeFlashDeals,
      orders30d,
    ] = await Promise.all([
      // Marketing events — last 30 days by type
      MarketingEvent.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo } } },
        { $group: { _id: '$type', count: { $sum: 1 }, value: { $sum: '$value' } } },
      ]),

      // Newsletter leads by signup source
      Newsletter.aggregate([
        { $group: { _id: '$source', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),

      Promise.all([
        Newsletter.countDocuments({}),
        Newsletter.countDocuments({ isSubscribed: true }),
        Newsletter.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
      ]),

      // Best sellers by units sold
      Product.find({ isActive: true })
        .sort({ soldCount: -1 })
        .limit(8)
        .select('name slug price soldCount images')
        .lean(),

      // Abandoned carts — recoverable vs already emailed
      Promise.all([
        Cart.countDocuments({ isAbandoned: true, recoveryEmailSent: false }),
        Cart.countDocuments({ isAbandoned: true, recoveryEmailSent: true }),
      ]),

      Coupon.countDocuments({
        isActive: true,
        startDate: { $lte: now },
        endDate: { $gte: now },
      }),

      FlashDeal.countDocuments({ isActive: true }),

      // Orders + revenue, last 30 days (exclude cancelled)
      Order.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo }, status: { $ne: 'cancelled' } } },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            revenue: { $sum: { $ifNull: ['$totalAmount', '$total'] } },
          },
        },
      ]),
    ]);

    const eventCount = (type) => eventsByType.find((e) => e._id === type)?.count || 0;
    const eventValue = (type) => eventsByType.find((e) => e._id === type)?.value || 0;

    return successResponse(res, {
      window: { days: 30, since: thirtyDaysAgo.toISOString() },

      whatsapp: {
        orderClicks30d: eventCount('whatsapp_order_click'),
        orderClickValue30d: eventValue('whatsapp_order_click'),
      },

      popup: {
        impressions30d: eventCount('exit_intent_popup_shown'),
        leads30d: eventCount('exit_popup_lead'),
        whatsappFallback30d: eventCount('exit_popup_whatsapp_click'),
      },

      newsletter: {
        total: newsletterTotals[0],
        active: newsletterTotals[1],
        newLast30d: newsletterTotals[2],
        bySource: newsletterBySource.map((s) => ({ source: s._id || 'unknown', count: s.count })),
      },

      abandonedCarts: {
        awaitingRecovery: abandonedCarts[0],
        recoveryEmailSent: abandonedCarts[1],
      },

      promotions: {
        activeCoupons,
        activeFlashDeals,
      },

      sales30d: {
        orders: orders30d[0]?.count || 0,
        revenue: orders30d[0]?.revenue || 0,
      },

      topProducts: topProducts.map((p) => ({
        _id: p._id,
        name: p.name,
        slug: p.slug,
        price: p.price,
        soldCount: p.soldCount || 0,
        image: p.images?.find((i) => i.isPrimary)?.url || p.images?.[0]?.url || null,
      })),
    });
  } catch (error) {
    logger.error('Marketing overview error:', error);
    return errorResponse(res, 'Failed to load marketing overview', null, 500);
  }
};