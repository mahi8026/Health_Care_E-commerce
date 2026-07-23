const { doubleCsrf } = require('csrf-csrf');

// CSRF protection using double submit cookie pattern
const {
  generateToken,
  doubleCsrfProtection,
} = doubleCsrf({
  getSecret: () => process.env.CSRF_SECRET || 'default-csrf-secret-change-in-production',
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
});

// Middleware to generate and attach CSRF token
const csrfTokenMiddleware = (req, res, next) => {
  const token = generateToken(req, res);
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
