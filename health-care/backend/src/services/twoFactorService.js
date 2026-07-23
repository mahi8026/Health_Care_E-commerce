const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const TwoFactorAuth = require('../models/TwoFactorAuth');
const logger = require('../utils/logger');

/**
 * Generate 2FA secret for user
 * @param {Object} user - User object
 * @returns {Object} { secret, qrCode, backupCodes }
 */
async function generateTwoFactorSecret(user) {
  try {
    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `MediportBD (${user.email})`,
      issuer: 'MediportBD',
      length: 32
    });

    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

    // Create or update 2FA record
    let twoFactor = await TwoFactorAuth.findOne({ user: user._id }).select('+secret');
    
    if (twoFactor) {
      twoFactor.secret = secret.base32;
      twoFactor.isEnabled = false; // Reset until verified
    } else {
      twoFactor = new TwoFactorAuth({
        user: user._id,
        secret: secret.base32,
        isEnabled: false
      });
    }

    // Generate backup codes
    const backupCodes = twoFactor.generateBackupCodes();
    
    await twoFactor.save();

    logger.info(`[2FA] Secret generated for user ${user.email}`);

    return {
      secret: secret.base32,
      qrCode: qrCodeUrl,
      backupCodes
    };
  } catch (error) {
    logger.error(`[2FA] Error generating secret: ${error.message}`);
    throw error;
  }
}

/**
 * Verify 2FA token
 * @param {String} userId - User ID
 * @param {String} token - 6-digit token from authenticator app
 * @returns {Boolean} true if valid
 */
async function verifyTwoFactorToken(userId, token) {
  try {
    const twoFactor = await TwoFactorAuth.findOne({ 
      user: userId, 
      isEnabled: true 
    }).select('+secret');

    if (!twoFactor) {
      return false;
    }

    // Verify token
    const verified = speakeasy.totp.verify({
      secret: twoFactor.secret,
      encoding: 'base32',
      token: token,
      window: 2 // Allow 2 time steps before/after (60 seconds tolerance)
    });

    if (verified) {
      twoFactor.lastUsed = new Date();
      await twoFactor.save();
      logger.info(`[2FA] Token verified for user ${userId}`);
    }

    return verified;
  } catch (error) {
    logger.error(`[2FA] Error verifying token: ${error.message}`);
    return false;
  }
}

/**
 * Enable 2FA for user (after verifying initial token)
 * @param {String} userId - User ID
 * @param {String} token - 6-digit token to verify
 * @returns {Boolean} true if enabled successfully
 */
async function enableTwoFactor(userId, token) {
  try {
    const twoFactor = await TwoFactorAuth.findOne({ user: userId }).select('+secret');

    if (!twoFactor) {
      throw new Error('2FA not set up for this user');
    }

    // Verify token before enabling
    const verified = speakeasy.totp.verify({
      secret: twoFactor.secret,
      encoding: 'base32',
      token: token,
      window: 2
    });

    if (!verified) {
      return false;
    }

    // Enable 2FA
    twoFactor.isEnabled = true;
    twoFactor.enabledAt = new Date();
    await twoFactor.save();

    logger.info(`[2FA] Enabled for user ${userId}`);
    return true;
  } catch (error) {
    logger.error(`[2FA] Error enabling 2FA: ${error.message}`);
    throw error;
  }
}

/**
 * Disable 2FA for user
 * @param {String} userId - User ID
 * @returns {Boolean} true if disabled successfully
 */
async function disableTwoFactor(userId) {
  try {
    const twoFactor = await TwoFactorAuth.findOne({ user: userId });

    if (!twoFactor) {
      return true; // Already disabled
    }

    twoFactor.isEnabled = false;
    await twoFactor.save();

    logger.info(`[2FA] Disabled for user ${userId}`);
    return true;
  } catch (error) {
    logger.error(`[2FA] Error disabling 2FA: ${error.message}`);
    throw error;
  }
}

/**
 * Verify backup code
 * @param {String} userId - User ID
 * @param {String} code - Backup code
 * @returns {Boolean} true if valid
 */
async function verifyBackupCode(userId, code) {
  try {
    const twoFactor = await TwoFactorAuth.findOne({ 
      user: userId, 
      isEnabled: true 
    });

    if (!twoFactor) {
      return false;
    }

    const verified = twoFactor.verifyBackupCode(code);
    
    if (verified) {
      await twoFactor.save();
      logger.info(`[2FA] Backup code used for user ${userId}`);
    }

    return verified;
  } catch (error) {
    logger.error(`[2FA] Error verifying backup code: ${error.message}`);
    return false;
  }
}

/**
 * Check if user has 2FA enabled
 * @param {String} userId - User ID
 * @returns {Boolean} true if enabled
 */
async function isTwoFactorEnabled(userId) {
  try {
    const twoFactor = await TwoFactorAuth.findOne({ 
      user: userId, 
      isEnabled: true 
    });
    return !!twoFactor;
  } catch (error) {
    logger.error(`[2FA] Error checking 2FA status: ${error.message}`);
    return false;
  }
}

/**
 * Get 2FA status for user
 * @param {String} userId - User ID
 * @returns {Object} 2FA status information
 */
async function getTwoFactorStatus(userId) {
  try {
    const twoFactor = await TwoFactorAuth.findOne({ user: userId });

    if (!twoFactor) {
      return {
        enabled: false,
        setupComplete: false
      };
    }

    return {
      enabled: twoFactor.isEnabled,
      setupComplete: true,
      enabledAt: twoFactor.enabledAt,
      lastUsed: twoFactor.lastUsed,
      unusedBackupCodes: twoFactor.getUnusedBackupCodesCount()
    };
  } catch (error) {
    logger.error(`[2FA] Error getting 2FA status: ${error.message}`);
    throw error;
  }
}

module.exports = {
  generateTwoFactorSecret,
  verifyTwoFactorToken,
  enableTwoFactor,
  disableTwoFactor,
  verifyBackupCode,
  isTwoFactorEnabled,
  getTwoFactorStatus
};
