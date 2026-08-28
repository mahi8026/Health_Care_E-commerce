/**
 * Cache middleware for Express backend
 * Sets appropriate Cache-Control headers and implements Redis caching
 *
 * Requirements: 8.1, 8.2, 8.3, 8.4
 */

const { getRedisClient, isRedisConnected } = require('../services/redisCache');

// P4 — single canonical Redis client. This module previously created its OWN
// ioredis instance alongside services/redisCache.js (connection sprawl and
// divergent readiness between the two). Every helper below now goes through
// the shared client, which owns reconnection/retry policy centrally.
// NOTE: the previous `redisClient` export was removed — nothing imported it
// (verified by grep across controllers/routes/services).
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
    // Only cache GET requests, and only when the shared client is ready
    const client = isRedisConnected() ? getRedisClient() : null;
    if (req.method !== 'GET' || !client) {
      return next();
    }

    // P5 — cache-layer contract: the key is derived from the URL+query ONLY,
    // with no auth/role partition. This middleware may therefore ONLY be
    // mounted on fully anonymous catalog GETs (categoryRoutes,
    // manufacturerRoutes, productRoutes listings). Never attach it to
    // optionalAuth/user-scoped endpoints — one user's response would be
    // served to another. If that is ever needed, hash req.user._id into the
    // key first.
    const cacheKey = `${keyPrefix}${req.originalUrl || req.url}`;

    try {
      // Try to get cached response
      const cachedData = await client.get(cacheKey);
      
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
          client.setex(cacheKey, ttl, JSON.stringify(data)).catch(() => {
            // Cache write failure must never break the response path
          });
        }
        res.setHeader('X-Cache', 'MISS');
        return originalJson(data);
      };

      next();
    } catch (error) {
      next();
    }
  };
};

/**
 * Invalidate cache by pattern
 * @param {string} pattern - Redis key pattern (e.g., 'products:*')
 */
const invalidateCache = async (pattern) => {
  const client = isRedisConnected() ? getRedisClient() : null;
  if (!client) {
    return;
  }
  
  try {
    // P3 — SCAN (incremental, non-blocking) instead of KEYS, which stalls the
    // entire Redis event loop on production-sized keyspaces.
    const keys = [];
    let cursor = '0';
    do {
      const [next, batch] = await client.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
      cursor = next;
      if (batch && batch.length) {
        keys.push(...batch);
      }
    } while (cursor !== '0');

    // Delete in bounded batches to keep round-trip payloads small
    for (let i = 0; i < keys.length; i += 100) {
      await client.del(...keys.slice(i, i + 100));
    }
  } catch (error) {
    // Best-effort invalidation; stale entries expire via TTL anyway
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
  staticAssets
};

