const axios = require('axios');
const logger = require('../utils/logger');

/**
 * Verify Google reCAPTCHA v3 token
 * @param {String} token - reCAPTCHA token from client
 * @param {String} action - Expected action name
 * @returns {Object} { success: boolean, score: number, error?: string }
 */
async function verifyRecaptcha(token, action) {
  try {
    if (!process.env.RECAPTCHA_SECRET_KEY) {
      logger.warn('[CAPTCHA] reCAPTCHA secret key not configured — skipping CAPTCHA check');
      // Skip CAPTCHA entirely when not configured (no secret key set)
      return { success: true, score: 1.0, bypass: true };
    }

    const response = await axios.post(
      'https://www.google.com/recaptcha/api/siteverify',
      null,
      {
        params: {
          secret: process.env.RECAPTCHA_SECRET_KEY,
          response: token
        },
        timeout: 5000
      }
    );

    const { success, score, action: responseAction, 'error-codes': errorCodes } = response.data;

    // Check if verification was successful
    if (!success) {
      logger.warn(`[CAPTCHA] Verification failed: ${errorCodes?.join(', ')}`);
      return { 
        success: false, 
        error: 'CAPTCHA verification failed',
        errorCodes 
      };
    }

    // Check if action matches
    if (action && responseAction !== action) {
      logger.warn(`[CAPTCHA] Action mismatch: expected ${action}, got ${responseAction}`);
      return { 
        success: false, 
        error: 'CAPTCHA action mismatch' 
      };
    }

    // Check score threshold (0.0 - 1.0, higher is better)
    const threshold = parseFloat(process.env.RECAPTCHA_THRESHOLD || '0.5');
    
    if (score < threshold) {
      logger.warn(`[CAPTCHA] Score too low: ${score} < ${threshold}`);
      return { 
        success: false, 
        score, 
        error: 'CAPTCHA score too low' 
      };
    }

    logger.info(`[CAPTCHA] Verification successful: score ${score}`);
    return { success: true, score };

  } catch (error) {
    logger.error(`[CAPTCHA] Verification error: ${error.message}`);
    
    // Only skip on error when SKIP_CAPTCHA_DEV is explicitly set
    if (process.env.SKIP_CAPTCHA_DEV === 'true') {
      return { success: true, score: 1.0, bypass: true };
    }
    return { 
      success: false, 
      error: 'CAPTCHA verification error' 
    };
  }
}

/**
 * Express middleware to verify reCAPTCHA
 * @param {String} action - Expected action name
 */
function captchaMiddleware(action) {
  return async (req, res, next) => {
    try {
      // Get token from header or body
      const token = req.headers['x-recaptcha-token'] || req.body.recaptchaToken;

      if (!token) {
        // Bypass when CAPTCHA is not configured or SKIP_CAPTCHA_DEV is set
        if (!process.env.RECAPTCHA_SECRET_KEY || process.env.SKIP_CAPTCHA_DEV === 'true') {
          logger.debug('[CAPTCHA] Bypassing — RECAPTCHA_SECRET_KEY not configured');
          return next();
        }

        return res.status(400).json({
          success: false,
          message: 'CAPTCHA token required'
        });
      }

      // Verify token
      const result = await verifyRecaptcha(token, action);

      if (!result.success) {
        return res.status(403).json({
          success: false,
          message: result.error || 'CAPTCHA verification failed',
          captchaFailed: true
        });
      }

      // Add score to request for logging
      req.captchaScore = result.score;
      req.captchaBypassed = result.bypass;

      next();
    } catch (error) {
      logger.error(`[CAPTCHA] Middleware error: ${error.message}`);

      res.status(500).json({
        success: false,
        message: 'CAPTCHA verification error'
      });
    }
  };
}

/**
 * CAPTCHA middleware for login
 */
const loginCaptcha = captchaMiddleware('login');

/**
 * CAPTCHA middleware for register
 */
const registerCaptcha = captchaMiddleware('register');

/**
 * CAPTCHA middleware for password reset
 */
const passwordResetCaptcha = captchaMiddleware('password_reset');

module.exports = {
  verifyRecaptcha,
  captchaMiddleware,
  loginCaptcha,
  registerCaptcha,
  passwordResetCaptcha
};
