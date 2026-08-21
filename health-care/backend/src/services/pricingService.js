const Category = require('../models/Category');
const Product = require('../models/Product');
const { getActiveDealEntries } = require('./flashDealPricing');

/**
 * Server-side pricing logic.
 * The frontend sends only product IDs + quantities (+ size selection).
 * All prices, B2B discounts and savings are computed here from the database —
 * client-supplied price fields are NEVER trusted.
 */

/**
 * Check if a user is eligible for B2B pricing.
 * Mirrors frontend logic (src/utils/pricing.js) — must be approved + admin-enabled.
 */
function isEligibleForB2BPricing(user) {
  return !!user && user.b2bApprovalStatus === 'approved' && !!user.b2bDiscountEnabled;
}

/**
 * Compute unit price for a product given user + category B2B rules.
 * Mirrors frontend calculateB2BPrice() so what users see == what they pay.
 * @returns {{price:number,isB2BPrice:boolean,savings:number,discountPct:number,originalPrice:number}}
 */
function getB2BPrice(product, user, category) {
  const originalPrice = Number(product.price) || 0;
  const defaultResult = {
    price: originalPrice,
    isB2BPrice: false,
    savings: 0,
    discountPct: 0,
    originalPrice
  };

  if (!isEligibleForB2BPricing(user)) {
return defaultResult;
}

  // Option 1: Manual B2B price override (highest priority)
  if (product.b2bPriceEnabled && Number(product.b2bPrice) > 0) {
    const savings = originalPrice - product.b2bPrice;
    const discountPct = originalPrice > 0 ? Math.round((savings / originalPrice) * 100) : 0;
    return {
      price: product.b2bPrice,
      isB2BPrice: true,
      savings: savings > 0 ? savings : 0,
      discountPct: discountPct > 0 ? discountPct : 0,
      originalPrice
    };
  }

  // Option 2: Category-based discount percentage
  if (category && category.b2bDiscountEnabled && Number(category.b2bDiscountPct) > 0) {
    const discountAmount = originalPrice * (category.b2bDiscountPct / 100);
    return {
      price: Math.round(originalPrice - discountAmount),
      isB2BPrice: true,
      savings: Math.round(discountAmount),
      discountPct: category.b2bDiscountPct,
      originalPrice
    };
  }

  return defaultResult;
}

/**
 * Quote a single line item strictly from server data.
 * Validates size selection for sized products and returns the server-side price.
 *
 * @param {Object} product - Mongoose Product document
 * @param {Object|null} user - requester (for B2B eligibility)
 * @param {Object|null} category - product's Category document (lean ok)
 * @param {Object} item - { product, qty|quantity, selectedSize }
 * @param {{dealId:string, finalPrice:number}|number|null} deal - active flash-deal entry, if any
 * @returns {{ unitPrice:number, isB2BPrice:boolean, savings:number, sizeName:string|null, flashDealId:string|null }}
 * @throws {Error} with a user-friendly message for invalid size/price config
 */
function quoteProduct(product, user, category, item, deal = null) {
  const dealPrice = typeof deal === 'object' && deal !== null ? Number(deal.finalPrice) : Number(deal);
  const b2b = getB2BPrice(product, user, category);

  let basePrice = b2b.price;
  let savings = b2b.savings;
  let isB2BPrice = b2b.isB2BPrice;
  let flashDealId = null;

  // Active flash-deal promo price. Applied when it beats the B2B/base price
  // so every customer always pays the best currently-advertised price.
  if (Number(dealPrice) > 0 && Number(dealPrice) < basePrice) {
    basePrice = Number(dealPrice);
    isB2BPrice = false;
    savings = Math.max(0, (Number(product.price) || 0) - basePrice);
    flashDealId = typeof deal === 'object' && deal !== null ? deal.dealId : null;
  }

  let sizeName = null;
  if (product.variants?.sizes?.length > 0) {
    if (!item.selectedSize || !item.selectedSize.name) {
      throw new Error(`Size selection required for ${product.name}`);
    }
    const sizeVariant = product.variants.sizes.find(s => s.name === item.selectedSize.name);
    if (!sizeVariant) {
      throw new Error(`Invalid size ${item.selectedSize.name} for ${product.name}`);
    }
    sizeName = sizeVariant.name;
  }

  const sizeAdjustment = sizeName
    ? Number(product.variants.sizes.find(s => s.name === sizeName).priceAdjustment) || 0
    : 0;

  const unitPrice = Math.max(0, Math.round((basePrice + sizeAdjustment) * 100) / 100);

  if (unitPrice <= 0) {
    throw new Error(`Product ${product.name} has no valid price configured`);
  }

  return {
    unitPrice,
    isB2BPrice,
    savings,
    sizeName,
    flashDealId
  };
}

/**
 * Quote an array of items, verifying products exist.
 * @param {Array} items - request line items
 * @param {Object|null} user - requester for B2B eligibility
 * @param {Object} [session] - mongoose session (for transactions)
 * @returns {Promise<Array<{product:Object, quote:Object, qty:number}>>}
 */
async function quoteItems(items, user, session = null) {
  const productIds = items.map(i => i.product);
  const productsQuery = Product.find({ _id: { $in: productIds } });
  if (session) {
    productsQuery.session(session);
  }
  const products = await productsQuery;

  const productMap = new Map(products.map(p => [String(p._id), p]));

  const categoryIds = [...new Set(products.filter(p => p.category).map(p => String(p.category)))];
  const categories = categoryIds.length
    ? await Category.find({ _id: { $in: categoryIds } })
    : [];
  const categoryMap = new Map(categories.map(c => [String(c._id), c]));

  const dealEntries = await getActiveDealEntries(productIds);

  const quoted = [];
  for (const item of items) {
    const product = productMap.get(String(item.product));
    if (!product) {
      throw new Error(`Product not found: ${item.product}`);
    }
    const category = product.category ? categoryMap.get(String(product.category)) : null;
    const dealEntry = dealEntries.get(String(product._id)) || null;
    const quote = quoteProduct(product, user, category, item, dealEntry);
    quoted.push({ product, category, qty: item.qty || item.quantity || 1, ...quote });
  }

  return quoted;
}

module.exports = {
  isEligibleForB2BPricing,
  getB2BPrice,
  quoteProduct,
  quoteItems
};