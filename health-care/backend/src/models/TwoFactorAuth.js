const mongoose = require('mongoose');

const twoFactorAuthSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  secret: {
    type: String,
    required: true,
    select: false // Don't return by default
  },
  backupCodes: [{
    code: {
      type: String,
      required: true
    },
    used: {
      type: Boolean,
      default: false
    },
    usedAt: Date
  }],
  isEnabled: {
    type: Boolean,
    default: false
  },
  enabledAt: Date,
  lastUsed: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient queries
twoFactorAuthSchema.index({ user: 1, isEnabled: 1 });

/**
 * Generate backup codes
 * @returns {Array} Array of backup codes
 */
twoFactorAuthSchema.methods.generateBackupCodes = function() {
  const codes = [];
  for (let i = 0; i < 10; i++) {
    // Generate 8-character alphanumeric code
    const code = Math.random().toString(36).substring(2, 10).toUpperCase();
    codes.push({
      code,
      used: false
    });
  }
  this.backupCodes = codes;
  return codes.map(c => c.code);
};

/**
 * Verify backup code
 * @param {String} code - Backup code to verify
 * @returns {Boolean} true if valid and unused
 */
twoFactorAuthSchema.methods.verifyBackupCode = function(code) {
  const backupCode = this.backupCodes.find(
    bc => bc.code === code.toUpperCase() && !bc.used
  );
  
  if (backupCode) {
    backupCode.used = true;
    backupCode.usedAt = new Date();
    return true;
  }
  
  return false;
};

/**
 * Check if user has unused backup codes
 * @returns {Number} Count of unused backup codes
 */
twoFactorAuthSchema.methods.getUnusedBackupCodesCount = function() {
  return this.backupCodes.filter(bc => !bc.used).length;
};

module.exports = mongoose.model('TwoFactorAuth', twoFactorAuthSchema);
