const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../utils/logger');
const tokenBlacklist = require('../services/tokenBlacklist');

// Protect routes — verify JWT and attach req.user
// ✅ Security Fix #2: Check token blacklist and secret rotation
exports.protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'Not authorized to access this route' });
    }

    // ✅ Check if token is blacklisted (logout, password change)
    const isBlacklisted = await tokenBlacklist.isBlacklisted(token);
    if (isBlacklisted) {
      logger.warn('[protect] Attempted use of blacklisted token', {
        tokenPrefix: token.substring(0, 20) + '...'
      });
      return res.status(401).json({ success: false, message: 'Token has been revoked. Please log in again.' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }

    // ✅ Check if token was issued before JWT secret rotation
    if (decoded.iat) {
      const isFromBeforeRotation = await tokenBlacklist.isTokenFromBeforeRotation(decoded.iat);
      if (isFromBeforeRotation) {
        logger.warn('[protect] Token issued before secret rotation', {
          userId: decoded.id,
          issuedAt: new Date(decoded.iat * 1000)
        });
        return res.status(401).json({ success: false, message: 'Session expired. Please log in again.' });
      }
    }

    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    if (!user.isActive) {
      return res.status(401).json({ success: false, message: 'Account is deactivated' });
    }

    // ✅ Check if user's tokens were invalidated (password change, security event)
    if (decoded.iat) {
      const isUserTokenInvalidated = await tokenBlacklist.isUserTokenInvalidated(decoded.id, decoded.iat);
      if (isUserTokenInvalidated) {
        logger.warn('[protect] User tokens invalidated', {
          userId: decoded.id,
          issuedAt: new Date(decoded.iat * 1000)
        });
        return res.status(401).json({ success: false, message: 'Session expired. Please log in again.' });
      }
    }

    req.user = user;
    req.token = token; // Store token for potential blacklisting
    next();
  } catch (error) {
    logger.error(`[protect] ${error.message}`);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Grant access to specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role '${req.user?.role}' is not authorized to access this route`
      });
    }
    next();
  };
};

// Shorthand for admin-only routes
exports.adminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admin access required' });
  }
  next();
};

// Optional authentication - attach user if token exists, but don't fail if missing
exports.optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // If no token, just continue without user
    if (!token) {
      return next();
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      
      // Only attach user if found and active
      if (user && user.isActive) {
        req.user = user;
      }
    } catch (err) {
      // Token invalid or expired - just continue without user
      logger.debug(`[optionalAuth] Token verification failed: ${err.message}`);
    }

    next();
  } catch (error) {
    logger.error(`[optionalAuth] ${error.message}`);
    next(); // Continue even on error
  }
};
