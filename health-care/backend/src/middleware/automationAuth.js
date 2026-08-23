/**
 * Automation API Key Middleware
 * ─────────────────────────────
 * Protects /api/automation/* endpoints consumed by the self-hosted n8n instance.
 * Clients must send:  X-Automation-Key: <AUTOMATION_API_KEY>
 *
 * Constant-time comparison prevents timing attacks on the key.
 */

const crypto = require('crypto');
const logger = require('../utils/logger');

function automationAuth(req, res, next) {
  const expected = process.env.AUTOMATION_API_KEY;
  if (!expected) {
    logger.error('[automationAuth] AUTOMATION_API_KEY is not configured');
    return res.status(503).json({ success: false, message: 'Automation API not configured' });
  }

  const provided = req.get('X-Automation-Key') || '';
  const a = Buffer.from(String(provided));
  const b = Buffer.from(expected);
  const valid = a.length === b.length && crypto.timingSafeEqual(a, b);

  if (!valid) {
    logger.warn(`[automationAuth] Rejected automation request from ${req.ip}`);
    return res.status(401).json({ success: false, message: 'Invalid automation key' });
  }
  return next();
}

module.exports = { automationAuth };
