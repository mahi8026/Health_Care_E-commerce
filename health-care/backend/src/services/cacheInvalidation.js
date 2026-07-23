const CacheService = require('./cacheService');

// Shared cache service instance for product cache invalidation
const cacheService = new CacheService();

/**
 * Invalidates all cache entries related to a specific product.
 * Clears both the individual product cache and the product list cache,
 * since a product update affects both.
 *
 * @param {string} productId - The ID of the product to invalidate
 */
function invalidateProductCache(productId) {
  // Invalidate the specific product detail cache
  cacheService.delPattern(`products:${productId}*`);

  // Also invalidate the product list cache since it may contain this product
  invalidateProductListCache();
}

/**
 * Invalidates all product list cache entries.
 * Called when any product is created, updated, or deleted so that
 * stale list responses are not served from the in-memory cache.
 */
function invalidateProductListCache() {
  cacheService.delPattern('products:*');
}

module.exports = {
  invalidateProductCache,
  invalidateProductListCache,
};
