const FlashDeal = require('../models/FlashDeal');

/**
 * Flash-deal aware pricing.
 *
 * Uses the SAME criteria as the public /flash-deals/active endpoint
 * (FlashDeal.getActiveDeals) so that what customers see advertised is
 * exactly what they are charged at cart/checkout time.
 */

/**
 * Build a map of productId -> active flash-deal finalPrice.
 * If several active deals cover the same product, the lowest price wins
 * (customer always gets the best currently-advertised price).
 * Products whose deal stock is exhausted (soldCount >= stockLimit) are
 * skipped, mirroring the public endpoint's filtering.
 *
 * @param {Array<string|ObjectId>} productIds
 * @returns {Promise<Map<string, number>>}
 */
async function getActiveDealPriceMap(productIds) {
  const map = new Map();
  const ids = [...new Set((productIds || []).filter(Boolean).map(String))];
  if (ids.length === 0) return map;

  const now = new Date();
  const deals = await FlashDeal.find({
    isActive: true,
    status: 'active',
    startTime: { $lte: now },
    endTime: { $gte: now },
    'products.product': { $in: ids },
  })
    .select('products.product products.finalPrice products.stockLimit products.soldCount')
    .lean();

  for (const deal of deals) {
    for (const item of deal.products || []) {
      const pid = String(item.product);
      if (!ids.includes(pid)) continue;
      if (item.stockLimit && item.soldCount >= item.stockLimit) continue;

      const existing = map.get(pid);
      if (existing === undefined || Number(item.finalPrice) < existing) {
        map.set(pid, Number(item.finalPrice));
      }
    }
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
    if (Number.isFinite(dealPrice) && dealPrice > 0) return dealPrice;
  }
  return Number(product?.price) || 0;
}

module.exports = {
  getActiveDealPriceMap,
  resolveBasePrice,
};
