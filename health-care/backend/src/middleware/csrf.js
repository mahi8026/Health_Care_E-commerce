const { doubleCsrf } = require('csrf-csrf');

// CSRF protection using double submit cookie pattern.
// csrf-csrf v4 requires getSessionIdentifier — a function that returns a
// unique, stable string per request to bind the CSRF token to the caller.
// We use the Authorization Bearer token hash (for authenticated requests) or
// the client IP as the identifier. This is safe: the identifier is only used
// as a HMAC input, it is never exposed to the client.
const { generateCsrfToken, doubleCsrfProtection } = doubleCsrf({
  getSecret: () => process.env.CSRF_SECRET,
  cookieName: '__Host-psifi.x-csrf-token',
  cookieOptions: {
    sameSite: 'strict',
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
  },
  size: 64,
  ignoredMethods: ['GET', 'HEAD', 'OPTIONS'],
  getTokenFromRequest: (req) => req.headers['x-csrf-token'],
  // v4 required: bind each token to a per-request session identifier
  getSessionIdentifier: (req) => {
    // Use the bearer token (hashed) when present, otherwise fall back to IP
    const auth = req.headers.authorization || '';
    const bearer = auth.startsWith('Bearer ') ? auth.slice(7) : '';
    if (bearer) {
      // Hash so the raw token is never used as a key
      const crypto = require('crypto');
      return crypto.createHash('sha256').update(bearer).digest('hex');
    }
    return req.ip || req.headers['x-forwarded-for'] || 'anonymous';
  },
});

// Middleware to generate and attach CSRF token
const csrfTokenMiddleware = (req, res, next) => {
  const token = generateCsrfToken(req, res);
  res.locals.csrfToken = token;
  next();
};

// Route to get CSRF token
const getCsrfToken = (req, res) => {
  res.json({ csrfToken: res.locals.csrfToken });
};

module.exports = {
  doubleCsrfProtection,
  csrfTokenMiddleware,
  getCsrfToken,
};
