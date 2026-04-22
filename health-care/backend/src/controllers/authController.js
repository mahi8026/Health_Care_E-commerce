const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../utils/logger');

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

    const token = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

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

    res.status(200).json({ success: true, message: 'Password reset successfully. Please log in.' });
  } catch (error) {
    logger.error(`[resetPassword] ${error.message}`);
    res.status(500).json({ success: false, message: 'Server error', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};
