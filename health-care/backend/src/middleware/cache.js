/**
 * Cache middleware for Express backend
 * Sets appropriate Cache-Control headers and implements Redis caching
 *
 * Requirements: 8.1, 8.2, 8.3, 8.4
 */

const Redis = require('ioredis');

// Initialize Redis client
let redisClient = null;
try {
  redisClient = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    retryStrategy: (times) => {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
    maxRetriesPerRequest: 3,
  });

  redisClient.on('error', (err) => {
    console.error('Redis Client Error:', err);
  });

  redisClient.on('connect', () => {
    console.log('✅ Redis connected successfully');
  });
} catch (error) {
  console.warn('⚠️  Redis not available, caching disabled:', error.message);
}

/**
 * Creates an Express middleware that sets Cache-Control headers.
 *
 * @param {Object} options
 * @param {number}  [options.maxAge]   - max-age / s-maxage in seconds
 * @param {number}  [options.swr]      - stale-while-revalidate in seconds
 * @param {boolean} [options.private]  - when true, sets no-store (for authenticated endpoints)
 * @returns {Function} Express middleware
 */
const cacheMiddleware = (options = {}) => {
  const { maxAge, swr, private: isPrivate } = options;

  return (req, res, next) => {
    // Authenticated / private endpoints must never be cached
    if (isPrivate) {
      res.setHeader('Cache-Control', 'no-store');
      return next();
    }

    // Build a public CDN-friendly directive
    const directives = ['public'];

    if (typeof maxAge === 'number') {
      directives.push(`s-maxage=${maxAge}`);
    }

    if (typeof swr === 'number') {
      directives.push(`stale-while-revalidate=${swr}`);
    }

    res.setHeader('Cache-Control', directives.join(', '));
    next();
  };
};

/**
 * Redis cache middleware for GET requests
 * Caches response data in Redis with configurable TTL
 * 
 * @param {Object} options
 * @param {number} [options.ttl=300] - Time to live in seconds (default 5 minutes)
 * @param {string} [options.keyPrefix=''] - Prefix for cache keys
 * @returns {Function} Express middleware
 */
const redisCacheMiddleware = (options = {}) => {
  const { ttl = 300, keyPrefix = '' } = options;

  return async (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET' || !redisClient) {
      return next();
    }

    // Generate cache key from URL and query params
    const cacheKey = `${keyPrefix}${req.originalUrl || req.url}`;

    try {
      // Try to get cached response
      const cachedData = await redisClient.get(cacheKey);
      
      if (cachedData) {
        const parsed = JSON.parse(cachedData);
        res.setHeader('X-Cache', 'HIT');
        return res.status(200).json(parsed);
      }

      // Cache miss - store original json method
      const originalJson = res.json.bind(res);
      
      // Override json method to cache response
      res.json = function(data) {
        // Only cache successful responses
        if (res.statusCode === 200) {
          redisClient.setex(cacheKey, ttl, JSON.stringify(data)).catch(err => {
            console.error('Redis cache set error:', err);
          });
        }
        res.setHeader('X-Cache', 'MISS');
        return originalJson(data);
      };

      next();
    } catch (error) {
      console.error('Redis cache middleware error:', error);
      next();
    }
  };
};

/**
 * Invalidate cache by pattern
 * @param {string} pattern - Redis key pattern (e.g., 'products:*')
 */
const invalidateCache = async (pattern) => {
  if (!redisClient) return;
  
  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(...keys);
      console.log(`✅ Invalidated ${keys.length} cache keys matching: ${pattern}`);
    }
  } catch (error) {
    console.error('Cache invalidation error:', error);
  }
};

/**
 * Middleware that sets Cache-Control: no-store.
 * Use on all authenticated / private endpoints (orders, user profile, checkout).
 *
 * Requirement: 8.4
 */
const noStore = (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  next();
};

/**
 * Middleware for static assets served from /_next/static/.
 * Sets Cache-Control: public, max-age=31536000, immutable
 *
 * Requirement: 8.1
 */
const staticAssets = (req, res, next) => {
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  next();
};

module.exports = { 
  cacheMiddleware, 
  redisCacheMiddleware,
  invalidateCache,
  noStore, 
  staticAssets,
  redisClient 
};

