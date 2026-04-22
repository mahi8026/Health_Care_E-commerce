/**
 * Cache middleware for Express backend
 * Sets appropriate Cache-Control headers based on options
 *
 * Requirements: 8.1, 8.2, 8.3, 8.4
 */

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

module.exports = { cacheMiddleware, noStore, staticAssets };
