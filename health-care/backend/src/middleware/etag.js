/**
 * ETag middleware for HTTP conditional requests.
 * Injects an ETag header into JSON responses and short-circuits with
 * 304 Not Modified when the client already has the same version.
 *
 * Usage (on a specific route):
 *   router.get('/products', etagMiddleware, handler);
 *
 * Requirements: 6.3, 6.10
 */
const crypto = require('crypto');
const logger = require('../utils/logger');

/**
 * Wraps res.json to compute and inject an ETag before the response is sent.
 * Returns 304 Not Modified when the If-None-Match header matches the ETag.
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
function etagMiddleware(req, res, next) {
  // Only relevant for GET / HEAD requests
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return next();
  }

  const originalJson = res.json.bind(res);

  res.json = function (data) {
    try {
      const hash = crypto
        .createHash('md5')
        .update(JSON.stringify(data))
        .digest('hex');
      const etag = `"${hash}"`;

      res.setHeader('ETag', etag);

      // Check client cache
      const clientEtag = req.headers['if-none-match'];
      if (clientEtag && clientEtag === etag) {
        logger.debug(`[ETag] 304 Not Modified: ${req.path}`);
        return res.status(304).end();
      }
      // P6 — no implicit Cache-Control default here. Previously this silently
      // stamped `public, max-age=3600` on ANY wrapped GET, which would let
      // shared caches store authenticated responses if the middleware were
      // ever mounted near private routes. Routes that want public caching
      // must set their own Cache-Control (or use cacheMiddleware).
    } catch (err) {
      logger.debug(`[ETag] Could not generate ETag: ${err.message}`);
    }

    return originalJson(data);
  };

  next();
}

module.exports = { etagMiddleware };
