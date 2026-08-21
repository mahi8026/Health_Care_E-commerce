/**
 * B2B Pricing Utilities
 * 
 * Calculates B2B prices based on:
 * 1. Manual product B2B price override (if enabled)
 * 2. Category-based discount percentage
 * 3. Falls back to regular price if user not eligible
 */

/**
 * Calculate B2B price for a product
 * @param {Object} product - Product object with price, b2bPrice, b2bPriceEnabled, category
 * @param {Object} user - User object with b2bApprovalStatus, b2bDiscountEnabled
 * @param {Object} category - Category object with b2bDiscountEnabled, b2bDiscountPct
 * @returns {Object} { price, isB2BPrice, savings, discountPct, originalPrice }
 */
export function calculateB2BPrice(product, user, category) {
  // Default result — regular price for non-B2B users
  const defaultResult = {
    price: product.price || 0,
    isB2BPrice: false,
    savings: 0,
    discountPct: 0,
    originalPrice: product.price || 0,
  };

  // Check if user is eligible for B2B pricing
  if (!isEligibleForB2BPricing(user)) {
    return defaultResult;
  }

  // Option 1: Manual B2B price override (highest priority)
  if (product.b2bPriceEnabled && product.b2bPrice > 0) {
    const savings = (product.price || 0) - product.b2bPrice;
    const discountPct = product.price > 0 ? Math.round((savings / product.price) * 100) : 0;
    
    return {
      price: product.b2bPrice,
      isB2BPrice: true,
      savings: savings > 0 ? savings : 0,
      discountPct: discountPct > 0 ? discountPct : 0,
      originalPrice: product.price || 0,
    };
  }

  // Option 2: Category-based discount percentage
  if (category?.b2bDiscountEnabled && category?.b2bDiscountPct > 0) {
    const originalPrice = product.price || 0;
    const discountAmount = originalPrice * (category.b2bDiscountPct / 100);
    const b2bPrice = originalPrice - discountAmount;
    
    return {
      price: Math.round(b2bPrice), // Round to nearest taka
      isB2BPrice: true,
      savings: Math.round(discountAmount),
      discountPct: category.b2bDiscountPct,
      originalPrice,
    };
  }

  // No B2B pricing available
  return defaultResult;
}

/**
 * Check if user is eligible for B2B pricing
 * @param {Object} user - User object
 * @returns {boolean}
 */
export function isEligibleForB2BPricing(user) {
  if (!user) return false;
  
  // Must be approved B2B user
  if (user.b2bApprovalStatus !== 'approved') return false;
  
  // Must have B2B discount enabled by admin
  if (!user.b2bDiscountEnabled) return false;
  
  return true;
}

/**
 * Format price with B2B badge if applicable
 * @param {number} price - Price to format
 * @param {boolean} isB2BPrice - Whether this is a B2B price
 * @returns {Object} { formatted, badge }
 */
export function formatPriceWithBadge(price, isB2BPrice) {
  return {
    formatted: price > 0 ? `৳${price.toLocaleString()}` : 'Contact for Price',
    badge: isB2BPrice ? 'B2B Price' : null,
  };
}

/**
 * Get price display for product (with B2B logic)
 * @param {Object} product - Product object
 * @param {Object} user - User object
 * @param {Object} category - Category object
 * @returns {Object} Complete price display data
 */
export function getProductPriceDisplay(product, user, category) {
  const b2bPricing = calculateB2BPrice(product, user, category);
  const priceDisplay = formatPriceWithBadge(b2bPricing.price, b2bPricing.isB2BPrice);
  
  return {
    ...b2bPricing,
    ...priceDisplay,
    // Show strikethrough regular price if B2B price is active
    showOriginalPrice: b2bPricing.isB2BPrice && b2bPricing.savings > 0,
    originalPriceFormatted: `৳${b2bPricing.originalPrice.toLocaleString()}`,
  };
}

/**
 * Resolve the active flash deal ("Deal of the Day") for a product.
 * Uses `activeFlashDeal` attached by GET /api/products/:slug.
 * Returns null when no live deal applies or it does not beat the
 * customer's current price (mirrors the server rule: pay min(deal, B2B)).
 *
 * @param {Object} product - product with optional activeFlashDeal
 * @param {Object|null} priceDisplay - result of getProductPriceDisplay()
 * @returns {Object|null} { finalPrice, endTime, discountPct }
 */
export function getFlashDealDisplay(product, priceDisplay) {
  const deal = product?.activeFlashDeal;
  const finalPrice = Number(deal?.finalPrice) || 0;
  if (finalPrice <= 0) return null;

  const currentPrice = Number(priceDisplay?.price ?? product?.price) || 0;
  if (currentPrice > 0 && finalPrice >= currentPrice) return null;

  return {
    finalPrice,
    endTime: deal.endTime,
    discountPct: Number(deal.discountPercentage) || 0,
  };
}

/**
 * Calculate cart item price with B2B discount
 * @param {Object} item - Cart item with product data
 * @param {Object} user - User object
 * @param {Object} category - Category object
 * @returns {Object} { unitPrice, totalPrice, savings }
 */
export function calculateCartItemPrice(item, user, category) {
  const quantity = item.quantity || 1;
  const b2bPricing = calculateB2BPrice(item.product || item, user, category);
  
  return {
    unitPrice: b2bPricing.price,
    totalPrice: b2bPricing.price * quantity,
    savings: b2bPricing.savings * quantity,
    isB2BPrice: b2bPricing.isB2BPrice,
  };
}
