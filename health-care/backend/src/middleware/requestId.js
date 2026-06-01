const { v4: uuidv4 } = require('uuid');

/**
 * Request ID middleware — generates a UUID v4 for each incoming request,
 * attaches it to `req.id`, and sets the `X-Request-ID` response header.
 * Register this as the first middleware in the Express app so that every
 * subsequent middleware and controller has access to `req.id` for tracing.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
function requestId(req, res, next) {
  req.id = uuidv4();
  res.setHeader('X-Request-ID', req.id);
  next();
}

module.exports = requestId;
