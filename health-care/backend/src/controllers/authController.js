const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../utils/logger');
const { logActivityAsync, ACTIONS } = require('../utils/activityLogger');

// ── Token helpers ────────────────────────────────────────────────────────────
const generateAccessToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '7d' });

const generateRefreshToken = (id) =>
  jwt.sign({ id }, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET, { expiresIn: '30d' });

// ── Register ─────────────────────────────────────────────────────────────────
// POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const { name, email, password, phone, company, companyName, institutionType, accountType, b2bTier } = req.body;

    // Case-insensitive duplicate email check
    const userExists = await User.findOne({ email: email.toLowerCase().trim() }).collation({ locale: 'en', strength: 2 });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists with this email' });
    }

    const isB2B = accountType === 'B2B';
    const b2bId = isB2B ? `B2B-${Date.now().toString().slice(-5)}` : undefined;

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      phone: phone?.trim(),
      company: (companyName || company)?.trim(),
      companyName: (companyName || company)?.trim(),
      institutionType,
      accountType: accountType || 'Retail',
      role: isB2B ? 'b2b_customer' : 'customer',
      b2bAccount: isB2B,
      b2bTier: isB2B ? (b2bTier || 'Silver') : undefined,
      b2bId,
      paymentTerms: isB2B ? 30 : undefined
    });

    const token = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    // Log registration activity
    logActivityAsync({
      user,
      action: ACTIONS.AUTH.REGISTER,
      targetModel: 'User',
      targetId: user._id,
      targetName: user.email,
      req,
      metadata: { accountType: user.accountType, role: user.role }
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        accountType: user.accountType,
        company: user.companyName || user.company,
        b2bTier: user.b2bTier,
        b2bId: user.b2bId
      }
    });
  } catch (error) {
    logger.error(`[register] ${error.message}`);
    res.status(500).json({ success: false, message: 'Server error', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

// ── Login ─────────────────────────────────────────────────────────────────────
// POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (!user.isActive) {
      return res.status(401).json({ success: false, message: 'Account is deactivated. Please contact support.' });
    }

    const isPasswordMatch = await user.comparePassword(password);
    if (!isPasswordMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Check if 2FA is enabled
    const { isTwoFactorEnabled } = require('../services/twoFactorService');
    const has2FA = await isTwoFactorEnabled(user._id);

    if (has2FA) {
      // Don't generate tokens yet - require 2FA verification
      return res.status(200).json({
        success: true,
        requires2FA: true,
        userId: user._id,
        message: 'Please enter your 2FA code'
      });
    }

    const token = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    // Log login activity
    logActivityAsync({
      user,
      action: ACTIONS.AUTH.LOGIN,
      targetModel: 'User',
      targetId: user._id,
      targetName: user.email,
      req,
      metadata: { role: user.role, accountType: user.accountType }
    });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        accountType: user.accountType,
        company: user.companyName || user.company,
        phone: user.phone,
        b2bTier: user.b2bTier,
        b2bId: user.b2bId,
        creditLimit: user.creditLimit,
        creditUsed: user.creditUsed,
        loyaltyPoints: user.loyaltyPoints
      }
    });
  } catch (error) {
    logger.error(`[login] ${error.message}`);
    res.status(500).json({ success: false, message: 'Server error', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

// ── Refresh Token ─────────────────────────────────────────────────────────────
// POST /api/auth/refresh
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(401).json({ success: false, message: 'Refresh token required' });
    }

    const secret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, secret);
    } catch {
      return res.status(401).json({ success: false, message: 'Invalid or expired refresh token' });
    }

    const user = await User.findById(decoded.id).select('+refreshToken');
    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({ success: false, message: 'Refresh token mismatch' });
    }

    const newToken = generateAccessToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);
    user.refreshToken = newRefreshToken;
    await user.save({ validateBeforeSave: false });

    res.status(200).json({ success: true, token: newToken, refreshToken: newRefreshToken });
  } catch (error) {
    logger.error(`[refreshToken] ${error.message}`);
    res.status(500).json({ success: false, message: 'Server error', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

// ── Get Current User ──────────────────────────────────────────────────────────
// GET /api/auth/me
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        accountType: user.accountType,
        company: user.companyName || user.company,
        companyName: user.companyName,
        phone: user.phone,
        addresses: user.addresses,
        address: user.address,
        b2bTier: user.b2bTier,
        b2bId: user.b2bId,
        accountManager: user.accountManager,
        paymentTerms: user.paymentTerms,
        loyaltyPoints: user.loyaltyPoints,
        creditLimit: user.creditLimit,
        creditUsed: user.creditUsed,
        availableCredit: user.getAvailableCredit()
      }
    });
  } catch (error) {
    logger.error(`[getMe] ${error.message}`);
    res.status(500).json({ success: false, message: 'Server error', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

// ── Update Profile ────────────────────────────────────────────────────────────
// PATCH /api/auth/profile
exports.updateProfile = async (req, res) => {
  try {
    const { name, phone, address, addresses, companyName } = req.body;
    const updates = {};
    if (name) updates.name = name.trim();
    if (phone) updates.phone = phone.trim();
    if (address) updates.address = address;
    if (addresses) updates.addresses = addresses;
    if (companyName) { updates.companyName = companyName.trim(); updates.company = companyName.trim(); }

    const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true, runValidators: true });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({ success: true, message: 'Profile updated successfully', user });
  } catch (error) {
    logger.error(`[updateProfile] ${error.message}`);
    res.status(500).json({ success: false, message: 'Server error', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

// ── Logout ────────────────────────────────────────────────────────────────────
// POST /api/auth/logout
exports.logout = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user.id, { refreshToken: null }, { validateBeforeSave: false });
    
    // Log logout activity
    logActivityAsync({
      user: req.user,
      action: ACTIONS.AUTH.LOGOUT,
      targetModel: 'User',
      targetId: req.user.id,
      targetName: req.user.email,
      req
    });

    res.status(200).json({ success: true, message: 'Logout successful' });
  } catch (error) {
    logger.error(`[logout] ${error.message}`);
    res.status(500).json({ success: false, message: 'Server error', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

// ── Forgot Password ───────────────────────────────────────────────────────────
// POST /api/auth/forgot-password
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Please provide an email address' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    // Always return success to prevent email enumeration
    if (!user) {
      return res.status(200).json({ success: true, message: 'If that email exists, a reset link has been sent' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

    user.passwordResetToken = resetTokenHash;
    user.passwordResetExpires = Date.now() + 15 * 60 * 1000; // 15 minutes
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

    // Send email asynchronously — don't block the response
    const { sendPasswordResetEmail } = require('../utils/emailService');
    sendPasswordResetEmail(user, resetUrl).catch(err => logger.error(`[forgotPassword] email failed: ${err.message}`));

    res.status(200).json({ success: true, message: 'If that email exists, a reset link has been sent' });
  } catch (error) {
    logger.error(`[forgotPassword] ${error.message}`);
    res.status(500).json({ success: false, message: 'Server error', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

// ── Reset Password ────────────────────────────────────────────────────────────
// POST /api/auth/reset-password
exports.resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ success: false, message: 'Token and new password are required' });
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      passwordResetToken: tokenHash,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
    }

    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.refreshToken = null; // Invalidate all sessions
    await user.save();

    // Log password reset activity
    logActivityAsync({
      user,
      action: ACTIONS.AUTH.PASSWORD_RESET,
      targetModel: 'User',
      targetId: user._id,
      targetName: user.email,
      req
    });

    res.status(200).json({ success: true, message: 'Password reset successfully. Please log in.' });
  } catch (error) {
    logger.error(`[resetPassword] ${error.message}`);
    res.status(500).json({ success: false, message: 'Server error', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

// ── Send Phone OTP ────────────────────────────────────────────────────────────
// POST /api/auth/send-phone-otp
exports.sendPhoneOTP = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Check if user has phone number
    if (!user.phone) {
      return res.status(400).json({ success: false, message: 'Please add a phone number to your profile first' });
    }

    // Check if phone is already verified
    if (user.phoneVerified) {
      return res.status(400).json({ success: false, message: 'Phone number is already verified' });
    }

    const OTP = require('../models/OTP');
    const { sendOTP, maskPhoneNumber } = require('../services/smsService');

    // Generate OTP
    const result = await OTP.generate(user.phone, 'phone_verify');
    
    if (!result.success) {
      return res.status(429).json({ success: false, message: result.error });
    }

    // Send OTP via SMS (non-blocking)
    sendOTP(user.phone, result.otp).catch(err => {
      logger.error(`[sendPhoneOTP] SMS failed: ${err.message}`);
    });

    res.status(200).json({
      success: true,
      message: `OTP sent to ${maskPhoneNumber(user.phone)}`,
      phone: maskPhoneNumber(user.phone)
    });
  } catch (error) {
    logger.error(`[sendPhoneOTP] ${error.message}`);
    res.status(500).json({ success: false, message: 'Server error', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

// ── Verify Phone OTP ──────────────────────────────────────────────────────────
// POST /api/auth/verify-phone-otp
exports.verifyPhoneOTP = async (req, res) => {
  try {
    const { otp } = req.body;

    if (!otp || otp.length !== 6) {
      return res.status(400).json({ success: false, message: 'Please provide a valid 6-digit OTP' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (!user.phone) {
      return res.status(400).json({ success: false, message: 'No phone number found' });
    }

    if (user.phoneVerified) {
      return res.status(400).json({ success: false, message: 'Phone number is already verified' });
    }

    const OTP = require('../models/OTP');

    // Find latest valid OTP
    const otpDoc = await OTP.findLatestValid(user.phone, 'phone_verify');
    
    if (!otpDoc) {
      return res.status(400).json({ success: false, message: 'No valid OTP found. Please request a new one.' });
    }

    // Verify OTP
    const verifyResult = await otpDoc.verify(otp);

    if (!verifyResult.success) {
      return res.status(400).json({
        success: false,
        message: verifyResult.error,
        attemptsRemaining: verifyResult.attemptsRemaining
      });
    }

    // Mark phone as verified
    user.phoneVerified = true;
    user.phoneVerifiedAt = new Date();
    await user.save({ validateBeforeSave: false });

    // Log phone verification activity
    logActivityAsync({
      user,
      action: ACTIONS.USER.UPDATED,
      targetModel: 'User',
      targetId: user._id,
      targetName: user.email,
      req,
      metadata: { phoneVerified: true }
    });

    res.status(200).json({
      success: true,
      message: 'Phone number verified successfully',
      user: {
        id: user._id,
        phoneVerified: user.phoneVerified,
        phoneVerifiedAt: user.phoneVerifiedAt
      }
    });
  } catch (error) {
    logger.error(`[verifyPhoneOTP] ${error.message}`);
    res.status(500).json({ success: false, message: 'Server error', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

// ── 2FA Setup ─────────────────────────────────────────────────────────────────
// POST /api/auth/2fa/setup
exports.setup2FA = async (req, res) => {
  try {
    const { generateTwoFactorSecret } = require('../services/twoFactorService');
    
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Only allow admins to set up 2FA
    if (user.role !== 'admin') {
      return res.status(403).json({ success: false, message: '2FA is only available for admin accounts' });
    }

    const { secret, qrCode, backupCodes } = await generateTwoFactorSecret(user);

    res.status(200).json({
      success: true,
      message: '2FA setup initiated. Scan QR code with your authenticator app.',
      qrCode,
      secret, // Show secret for manual entry
      backupCodes,
      note: 'Save backup codes in a secure location. You will need them if you lose access to your authenticator app.'
    });
  } catch (error) {
    logger.error(`[setup2FA] ${error.message}`);
    res.status(500).json({ success: false, message: 'Server error', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

// ── 2FA Enable ────────────────────────────────────────────────────────────────
// POST /api/auth/2fa/enable
exports.enable2FA = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token || token.length !== 6) {
      return res.status(400).json({ success: false, message: 'Please provide a valid 6-digit token' });
    }

    const { enableTwoFactor } = require('../services/twoFactorService');
    
    const enabled = await enableTwoFactor(req.user.id, token);

    if (!enabled) {
      return res.status(400).json({ success: false, message: 'Invalid token. Please try again.' });
    }

    // Log 2FA enablement
    logActivityAsync({
      user: req.user,
      action: ACTIONS.USER.UPDATED,
      targetModel: 'User',
      targetId: req.user.id,
      targetName: req.user.email,
      req,
      metadata: { twoFactorEnabled: true }
    });

    res.status(200).json({
      success: true,
      message: '2FA enabled successfully. You will need to enter a code from your authenticator app on future logins.'
    });
  } catch (error) {
    logger.error(`[enable2FA] ${error.message}`);
    res.status(500).json({ success: false, message: 'Server error', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

// ── 2FA Disable ───────────────────────────────────────────────────────────────
// POST /api/auth/2fa/disable
exports.disable2FA = async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ success: false, message: 'Please provide your password to disable 2FA' });
    }

    // Verify password
    const user = await User.findById(req.user.id).select('+password');
    const isPasswordMatch = await user.comparePassword(password);

    if (!isPasswordMatch) {
      return res.status(401).json({ success: false, message: 'Invalid password' });
    }

    const { disableTwoFactor } = require('../services/twoFactorService');
    await disableTwoFactor(req.user.id);

    // Log 2FA disablement
    logActivityAsync({
      user: req.user,
      action: ACTIONS.USER.UPDATED,
      targetModel: 'User',
      targetId: req.user.id,
      targetName: req.user.email,
      req,
      metadata: { twoFactorEnabled: false }
    });

    res.status(200).json({
      success: true,
      message: '2FA disabled successfully'
    });
  } catch (error) {
    logger.error(`[disable2FA] ${error.message}`);
    res.status(500).json({ success: false, message: 'Server error', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

// ── 2FA Verify ────────────────────────────────────────────────────────────────
// POST /api/auth/2fa/verify
exports.verify2FA = async (req, res) => {
  try {
    const { token, backupCode, userId } = req.body;

    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID required' });
    }

    const { verifyTwoFactorToken, verifyBackupCode } = require('../services/twoFactorService');

    let verified = false;

    // Try token first
    if (token) {
      verified = await verifyTwoFactorToken(userId, token);
    }
    
    // Try backup code if token failed
    if (!verified && backupCode) {
      verified = await verifyBackupCode(userId, backupCode);
    }

    if (!verified) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid authentication code or backup code' 
      });
    }

    // Generate tokens
    const accessToken = generateAccessToken(userId);
    const refreshToken = generateRefreshToken(userId);

    // Update user's refresh token
    await User.findByIdAndUpdate(userId, { refreshToken }, { validateBeforeSave: false });

    // Get user data
    const user = await User.findById(userId);

    // Log 2FA verification
    logActivityAsync({
      user,
      action: ACTIONS.AUTH.LOGIN,
      targetModel: 'User',
      targetId: userId,
      targetName: user.email,
      req,
      metadata: { twoFactorUsed: true }
    });

    res.status(200).json({
      success: true,
      message: '2FA verification successful',
      token: accessToken,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        accountType: user.accountType
      }
    });
  } catch (error) {
    logger.error(`[verify2FA] ${error.message}`);
    res.status(500).json({ success: false, message: 'Server error', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

// ── 2FA Status ────────────────────────────────────────────────────────────────
// GET /api/auth/2fa/status
exports.get2FAStatus = async (req, res) => {
  try {
    const { getTwoFactorStatus } = require('../services/twoFactorService');
    
    const status = await getTwoFactorStatus(req.user.id);

    res.status(200).json({
      success: true,
      status
    });
  } catch (error) {
    logger.error(`[get2FAStatus] ${error.message}`);
    res.status(500).json({ success: false, message: 'Server error', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

// ── Google OAuth Success ──────────────────────────────────────────────────────
// GET /api/auth/google/success
exports.googleAuthSuccess = async (req, res) => {
  try {
    if (!req.user) {
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=authentication_failed`);
    }

    const token = generateAccessToken(req.user._id);
    const refreshToken = generateRefreshToken(req.user._id);

    // Update user's refresh token
    req.user.refreshToken = refreshToken;
    await req.user.save({ validateBeforeSave: false });

    // Log Google login activity
    logActivityAsync({
      user: req.user,
      action: ACTIONS.AUTH.LOGIN,
      targetModel: 'User',
      targetId: req.user._id,
      targetName: req.user.email,
      req,
      metadata: { authProvider: 'google', role: req.user.role }
    });

    // Redirect to frontend with tokens
    const redirectUrl = `${process.env.FRONTEND_URL}/auth/google/callback?token=${token}&refreshToken=${refreshToken}`;
    res.redirect(redirectUrl);
  } catch (error) {
    logger.error(`[googleAuthSuccess] ${error.message}`);
    res.redirect(`${process.env.FRONTEND_URL}/login?error=server_error`);
  }
};

// ── Google OAuth Failure ──────────────────────────────────────────────────────
// GET /api/auth/google/failure
exports.googleAuthFailure = (req, res) => {
  logger.error('[googleAuthFailure] Google authentication failed');
  res.redirect(`${process.env.FRONTEND_URL}/login?error=google_auth_failed`);
};
