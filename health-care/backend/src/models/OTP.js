const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const logger = require('../utils/logger');

const otpSchema = new mongoose.Schema({
  identifier: {
    type: String,
    required: true,
    index: true // Phone number or email
  },
  type: {
    type: String,
    required: true,
    enum: ['phone_verify', 'login', 'password_reset', 'order_confirm'],
    index: true
  },
  otp: {
    type: String,
    required: true // Hashed OTP
  },
  attempts: {
    type: Number,
    default: 0,
    max: 5
  },
  isUsed: {
    type: Boolean,
    default: false
  },
  expiresAt: {
    type: Date,
    required: true,
    index: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

// Compound index for efficient queries
otpSchema.index({ identifier: 1, type: 1, createdAt: -1 });

// TTL index - auto-delete after 10 minutes
otpSchema.index({ createdAt: 1 }, { expireAfterSeconds: 600 });

/**
 * Generate a random 6-digit OTP
 * @returns {String} 6-digit OTP
 */
function generateOTPCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Check rate limit for OTP requests
 * Max 3 OTP requests per identifier per hour
 * @param {String} identifier - Phone or email
 * @param {String} type - OTP type
 * @returns {Boolean} true if within limit, false if exceeded
 */
otpSchema.statics.checkRateLimit = async function(identifier, type) {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  
  const count = await this.countDocuments({
    identifier,
    type,
    createdAt: { $gte: oneHourAgo }
  });
  
  return count < 3;
};

/**
 * Generate and save new OTP
 * Invalidates all previous unused OTPs for this identifier and type
 * @param {String} identifier - Phone number or email
 * @param {String} type - OTP type
 * @returns {Object} { success: boolean, otp?: string, error?: string }
 */
otpSchema.statics.generate = async function(identifier, type) {
  try {
    // Check rate limit
    const withinLimit = await this.checkRateLimit(identifier, type);
    if (!withinLimit) {
      logger.warn(`[OTP] Rate limit exceeded for ${identifier}`);
      return {
        success: false,
        error: 'Too many OTP requests. Please try again after 1 hour.'
      };
    }

    // Invalidate all previous unused OTPs for this identifier and type
    await this.updateMany(
      {
        identifier,
        type,
        isUsed: false,
        expiresAt: { $gt: new Date() }
      },
      {
        $set: { isUsed: true }
      }
    );

    // Generate new OTP
    const plainOTP = generateOTPCode();
    
    // Hash OTP before storing
    const salt = await bcrypt.genSalt(10);
    const hashedOTP = await bcrypt.hash(plainOTP, salt);

    // Create OTP document
    const otpDoc = await this.create({
      identifier,
      type,
      otp: hashedOTP,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
      attempts: 0,
      isUsed: false
    });

    logger.info(`[OTP] Generated for ${identifier} (type: ${type})`);

    return {
      success: true,
      otp: plainOTP, // Return plain OTP to send via SMS/email
      otpId: otpDoc._id
    };
  } catch (error) {
    logger.error(`[OTP] Generation failed: ${error.message}`);
    return {
      success: false,
      error: 'Failed to generate OTP'
    };
  }
};

/**
 * Verify OTP
 * @param {String} plainOTP - Plain OTP entered by user
 * @returns {Object} { success: boolean, error?: string, attemptsRemaining?: number }
 */
otpSchema.methods.verify = async function(plainOTP) {
  try {
    // Check if already used
    if (this.isUsed) {
      return {
        success: false,
        error: 'OTP has already been used'
      };
    }

    // Check if expired
    if (new Date() > this.expiresAt) {
      return {
        success: false,
        error: 'OTP has expired'
      };
    }

    // Check if max attempts exceeded
    if (this.attempts >= 5) {
      // Invalidate OTP
      this.isUsed = true;
      await this.save();
      
      return {
        success: false,
        error: 'Maximum verification attempts exceeded'
      };
    }

    // Increment attempts
    this.attempts += 1;
    await this.save();

    // Verify OTP
    const isMatch = await bcrypt.compare(plainOTP, this.otp);

    if (isMatch) {
      // Mark as used
      this.isUsed = true;
      await this.save();
      
      logger.info(`[OTP] Verified successfully for ${this.identifier}`);
      
      return {
        success: true
      };
    } else {
      const attemptsRemaining = 5 - this.attempts;
      
      logger.warn(`[OTP] Invalid OTP for ${this.identifier}. ${attemptsRemaining} attempts remaining`);
      
      return {
        success: false,
        error: 'Invalid OTP',
        attemptsRemaining
      };
    }
  } catch (error) {
    logger.error(`[OTP] Verification error: ${error.message}`);
    return {
      success: false,
      error: 'OTP verification failed'
    };
  }
};

/**
 * Find latest valid OTP for identifier and type
 * @param {String} identifier - Phone or email
 * @param {String} type - OTP type
 * @returns {Object|null} OTP document or null
 */
otpSchema.statics.findLatestValid = async function(identifier, type) {
  return await this.findOne({
    identifier,
    type,
    isUsed: false,
    expiresAt: { $gt: new Date() }
  }).sort({ createdAt: -1 });
};

/**
 * Clean up expired OTPs (manual cleanup, TTL index handles automatic cleanup)
 */
otpSchema.statics.cleanupExpired = async function() {
  const result = await this.deleteMany({
    expiresAt: { $lt: new Date() }
  });
  
  logger.info(`[OTP] Cleaned up ${result.deletedCount} expired OTPs`);
  return result.deletedCount;
};

module.exports = mongoose.model('OTP', otpSchema);
