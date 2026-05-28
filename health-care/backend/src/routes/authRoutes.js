const express = require('express');
const router = express.Router();
const passport = require('../config/passport');
const logger = require('../utils/logger');
const {
  register,
  login,
  refreshToken,
  getMe,
  updateProfile,
  changePassword,
  logout,
  forgotPassword,
  resetPassword,
  sendPhoneOTP,
  verifyPhoneOTP,
  setup2FA,
  enable2FA,
  disable2FA,
  verify2FA,
  get2FAStatus,
  googleAuthSuccess,
  googleAuthFailure,
  updateNotificationPreferences
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { noStore } = require('../middleware/cache');
const { loginCaptcha, registerCaptcha, passwordResetCaptcha } = require('../middleware/captcha');
const {
  loginLimiter,
  registerLimiter,
  passwordResetLimiter,
  otpLimiter,
  authLimiter
} = require('../middleware/enhancedRateLimiter');

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *               - phone
 *             properties:
 *               name:
 *                 type: string
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 example: SecurePass123!
 *               phone:
 *                 type: string
 *                 example: +8801712345678
 *               role:
 *                 type: string
 *                 enum: [customer, b2b_customer]
 *                 default: customer
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 token:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Validation error or user already exists
 */
// Public routes with CAPTCHA and rate limiting
router.post('/register', registerLimiter, registerCaptcha, register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login with email and password
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 example: SecurePass123!
 *               twoFactorCode:
 *                 type: string
 *                 example: "123456"
 *                 description: Required if 2FA is enabled
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 token:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', loginLimiter, login); // CAPTCHA temporarily disabled

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Refresh JWT token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *       401:
 *         description: Invalid refresh token
 */
router.post('/refresh', authLimiter, refreshToken);

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: Request password reset email
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 example: john@example.com
 *     responses:
 *       200:
 *         description: Password reset email sent
 *       404:
 *         description: User not found
 */
router.post('/forgot-password', passwordResetLimiter, passwordResetCaptcha, forgotPassword);

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     summary: Reset password with token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - password
 *             properties:
 *               token:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password reset successful
 *       400:
 *         description: Invalid or expired token
 */
router.post('/reset-password', passwordResetLimiter, resetPassword);

// Google OAuth routes
router.get('/google', 
  passport.authenticate('google', { 
    scope: ['profile', 'email'],
    session: false 
  })
);

router.get('/google/callback',
  (req, res, next) => {
    passport.authenticate('google', { 
      failureRedirect: '/api/auth/google/failure',
      session: false
    }, (err, user, info) => {
      if (err) {
        logger.error(`[Google OAuth Callback] Error: ${err.message}`);
        return res.redirect(`${process.env.FRONTEND_URL}/login?error=authentication_failed`);
      }
      
      if (!user) {
        logger.error('[Google OAuth Callback] No user returned');
        return res.redirect(`${process.env.FRONTEND_URL}/login?error=authentication_incomplete`);
      }
      
      // Manually attach user to request
      req.user = user;
      next();
    })(req, res, next);
  },
  googleAuthSuccess
);

router.get('/google/success', googleAuthSuccess);
router.get('/google/failure', googleAuthFailure);

// Protected routes
router.post('/logout', protect, noStore, logout);
router.get('/me', protect, noStore, getMe);
router.put('/profile', protect, noStore, updateProfile);
router.patch('/profile', protect, noStore, updateProfile);
router.patch('/change-password', protect, authLimiter, noStore, changePassword);
router.patch('/notification-preferences', protect, noStore, updateNotificationPreferences);

// Phone verification routes (with OTP rate limiting)
router.post('/send-phone-otp', protect, otpLimiter, noStore, sendPhoneOTP);
router.post('/verify-phone-otp', protect, otpLimiter, noStore, verifyPhoneOTP);

// 2FA routes (with auth rate limiting)
router.post('/2fa/setup', protect, authLimiter, noStore, setup2FA);
router.post('/2fa/enable', protect, authLimiter, noStore, enable2FA);
router.post('/2fa/disable', protect, authLimiter, noStore, disable2FA);
router.post('/2fa/verify', authLimiter, verify2FA); // No protect - verifying before login
router.get('/2fa/status', protect, noStore, get2FAStatus);

module.exports = router;
