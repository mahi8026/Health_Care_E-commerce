const FlashDeal = require('../models/FlashDeal');

/**
 * Flash-deal aware pricing.
 *
 * Uses the SAME criteria as the public /flash-deals/active endpoint
 * (FlashDeal.getActiveDeals) so that what customers see advertised is
 * exactly what they are charged at cart/checkout time.
 */

/**
 * Build a map of productId -> active flash-deal entry.
 * If several active deals cover the same product, the lowest price wins
 * (customer always gets the best currently-advertised price).
 * Products whose deal stock is exhausted (soldCount >= stockLimit) are
 * skipped, mirroring the public endpoint's filtering.
 *
 * @param {Array<string|ObjectId>} productIds
 * @returns {Promise<Map<string, {dealId: string, finalPrice: number, discountPercentage: number, endTime: Date}>>}
 */
async function getActiveDealEntries(productIds) {
  const entries = new Map();
  // F5 — accept ids, ObjectIds, or populated docs defensively; drop junk values.
  const ids = [...new Set((productIds || [])
    .filter(Boolean)
    .map(v => (v && v._id) ? String(v._id) : String(v))
  )];
  if (ids.length === 0) {
return entries;
}

  const now = new Date();
  const deals = await FlashDeal.find({
    isActive: true,
    status: 'active',
    startTime: { $lte: now },
    endTime: { $gte: now },
    'products.product': { $in: ids },
  })
    .select('endTime products.product products.finalPrice products.discountPercentage products.stockLimit products.soldCount')
    .lean();

  for (const deal of deals) {
    for (const item of deal.products || []) {
      const pid = String(item.product);
      if (!ids.includes(pid)) {
continue;
}
      if (item.stockLimit && item.soldCount >= item.stockLimit) {
continue;
}

      const existing = entries.get(pid);
      if (!existing || Number(item.finalPrice) < existing.finalPrice) {
        entries.set(pid, {
          dealId: String(deal._id),
          finalPrice: Number(item.finalPrice),
          discountPercentage: Number(item.discountPercentage) || 0,
          endTime: deal.endTime,
        });
      }
    }
  }

  return entries;
}

/**
 * Back-compat helper: map of productId -> active flash-deal finalPrice.
 *
 * @param {Array<string|ObjectId>} productIds
 * @returns {Promise<Map<string, number>>}
 */
async function getActiveDealPriceMap(productIds) {
  const entries = await getActiveDealEntries(productIds);
  const map = new Map();
  for (const [pid, entry] of entries) {
    map.set(pid, entry.finalPrice);
  }
  return map;
}

/**
 * Resolve the effective base unit price for one product:
 * the active flash-deal price when available, otherwise the product price.
 *
 * @param {Object} product - Product doc (lean ok)
 * @param {Map<string, number>|null} dealPriceMap - from getActiveDealPriceMap()
 * @returns {number}
 */
function resolveBasePrice(product, dealPriceMap) {
  if (dealPriceMap && product?._id) {
    const dealPrice = dealPriceMap.get(String(product._id));
    if (Number.isFinite(dealPrice) && dealPrice > 0) {
return dealPrice;
}
  }
  return Number(product?.price) || 0;
}

/**
 * Adjust soldCount on flash deals for a list of order-like items.
 * Placement passes direction +1; cancellation passes -1.
 *
 * Rollbacks (-1) only apply while the deal is still live, so counters for
 * expired/ended deals keep their historical accuracy.
 *
 * @param {Array<{product: string|ObjectId, flashDealId?: string|ObjectId|null, qty?: number}>} items
 * @param {1|-1} direction
 * @param {import('mongoose').ClientSession=} session
 */
async function changeDealSoldCounts(items, direction, session) {
  // Group qty by dealId + product pair
  const byDeal = new Map();
  for (const item of items || []) {
    if (!item?.flashDealId || !item?.product) {
continue;
}
    const key = `${item.flashDealId}:${item.product}`;
    byDeal.set(key, {
      dealId: item.flashDealId,
      product: item.product,
      qty: Math.max(1, Number(item.qty) || 1),
    });
  }
  if (byDeal.size === 0) {
return;
}

  let adjustments = [...byDeal.values()];
  if (direction < 0) {
    const now = new Date();
    const liveIds = new Set(
      (
        await FlashDeal.find({
          _id: { $in: adjustments.map((a) => a.dealId) },
          isActive: true,
          status: 'active',
          startTime: { $lte: now },
          endTime: { $gte: now },
        })
          .select('_id')
          .lean()
      ).map((d) => String(d._id))
    );
    adjustments = adjustments.filter((a) => liveIds.has(String(a.dealId)));
    if (adjustments.length === 0) {
return;
}
  }

  const ops = adjustments.map(({ dealId, product, qty }) => ({
    updateOne: {
      filter: { _id: dealId, 'products.product': product },
      update: { $inc: { 'products.$.soldCount': direction * qty } },
    },
  }));

  await FlashDeal.bulkWrite(ops, session ? { session } : undefined);
}

module.exports = {
  getActiveDealEntries,
  getActiveDealPriceMap,
  resolveBasePrice,
  changeDealSoldCounts,
};
