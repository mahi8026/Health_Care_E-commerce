const NodeCache = require('node-cache');
const logger = require('../utils/logger');

/**
 * Cache Service for Analytics
 * Provides TTL-based caching with pattern-based invalidation
 */
class CacheService {
  constructor(ttl = 300) { // 5 minutes default (300 seconds)
    this.cache = new NodeCache({
      stdTTL: ttl,
      checkperiod: 60, // Check for expired keys every 60 seconds
      useClones: false // Better performance, but be careful with mutations
    });
  }
  
  /**
   * Get cached value by key
   * @param {string} key - Cache key
   * @returns {any|null} Cached value or null if not found
   */
  get(key) {
    try {
      const value = this.cache.get(key);
      if (value !== undefined) {
        logger.debug(`Cache HIT: ${key}`);
        return value;
      }
      logger.debug(`Cache MISS: ${key}`);
      return null;
    } catch (error) {
      logger.error('Cache Get Error:', error);
      return null;
    }
  }
  
  /**
   * Set cached value with optional TTL
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   * @param {number} ttl - Optional TTL in seconds
   */
  set(key, value, ttl) {
    try {
      this.cache.set(key, value, ttl || this.cache.options.stdTTL);
      logger.debug(`Cache SET: ${key}`);
    } catch (error) {
      logger.error('Cache Set Error:', error);
    }
  }
  
  /**
   * Delete cached value by key
   * @param {string} key - Cache key to delete
   */
  del(key) {
    try {
      this.cache.del(key);
      logger.debug(`Cache DEL: ${key}`);
    } catch (error) {
      logger.error('Cache Del Error:', error);
    }
  }
  
  /**
   * Delete all keys matching a pattern
   * @param {string} pattern - Pattern to match (supports * wildcard)
   */
  delPattern(pattern) {
    try {
      const keys = this.cache.keys();
      const regex = new RegExp(pattern.replace('*', '.*'));
      const matchingKeys = keys.filter(key => regex.test(key));
      
      if (matchingKeys.length > 0) {
        this.cache.del(matchingKeys);
        logger.debug(`Cache DEL Pattern: ${pattern} (${matchingKeys.length} keys)`);
      }
    } catch (error) {
      logger.error('Cache Del Pattern Error:', error);
    }
  }
  
  /**
   * Generate cache key from prefix and parameters
   * @param {string} prefix - Key prefix
   * @param {object} params - Query parameters
   * @returns {string} Generated cache key
   */
  generateKey(prefix, params) {
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}:${params[key]}`)
      .join(':');
    return `${prefix}:${sortedParams}`;
  }
  
  /**
   * Invalidate all analytics-related cache entries
   * Called when orders or related data changes
   */
  invalidateAnalytics() {
    this.delPattern('sales:*');
    this.delPattern('orders:*');
    this.delPattern('products:*');
    this.delPattern('customers:*');
    this.delPattern('payments:*');
    this.delPattern('realtime:*');
    logger.debug('Analytics cache invalidated');
  }
  
  /**
   * Get cache statistics
   * @returns {object} Cache statistics
   */
  getStats() {
    return this.cache.getStats();
  }
}

module.exports = CacheService;
