/**
 * Diagnostic Routes
 * Check system configuration and service status
 */

const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');

/**
 * @route   GET /api/diagnostic/cloudinary
 * @desc    Check Cloudinary configuration status
 * @access  Private/Admin
 */
router.get('/cloudinary', protect, authorize('admin'), (req, res) => {
  try {
    const hasCloudName = !!process.env.CLOUDINARY_CLOUD_NAME;
    const hasApiKey = !!process.env.CLOUDINARY_API_KEY;
    const hasApiSecret = !!process.env.CLOUDINARY_API_SECRET;
    
    const isConfigured = hasCloudName && hasApiKey && hasApiSecret;

    res.json({
      success: true,
      cloudinary: {
        configured: isConfigured,
        cloudName: hasCloudName ? process.env.CLOUDINARY_CLOUD_NAME : 'NOT SET',
        apiKey: hasApiKey ? `${process.env.CLOUDINARY_API_KEY.substring(0, 6)}...` : 'NOT SET',
        apiSecret: hasApiSecret ? '***SET***' : 'NOT SET',
        status: isConfigured ? 'ready' : 'missing credentials'
      },
      uploadService: {
        mode: isConfigured ? 'cloudinary' : 'local-disk',
        warning: !isConfigured ? 'Images will be stored locally (not suitable for production)' : null
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to check Cloudinary status',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/diagnostic/env
 * @desc    Check all environment variables (admin only)
 * @access  Private/Admin
 */
router.get('/env', protect, authorize('admin'), (req, res) => {
  try {
    const envVars = {
      NODE_ENV: process.env.NODE_ENV || 'NOT SET',
      PORT: process.env.PORT || 'NOT SET',
      FRONTEND_URL: process.env.FRONTEND_URL || 'NOT SET',
      BACKEND_URL: process.env.BACKEND_URL || 'NOT SET',
      MONGODB_URI: process.env.MONGODB_URI ? '***CONFIGURED***' : 'NOT SET',
      JWT_SECRET: process.env.JWT_SECRET ? '***CONFIGURED***' : 'NOT SET',
      
      // Cloudinary
      CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || 'NOT SET',
      CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY ? `${process.env.CLOUDINARY_API_KEY.substring(0, 6)}...` : 'NOT SET',
      CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET ? '***SET***' : 'NOT SET',
      
      // Redis
      REDIS_HOST: process.env.REDIS_HOST || 'NOT SET',
      REDIS_PORT: process.env.REDIS_PORT || 'NOT SET',
      REDIS_PASSWORD: process.env.REDIS_PASSWORD ? '***SET***' : 'NOT SET',
      
      // Email
      SMTP_HOST: process.env.SMTP_HOST || 'NOT SET',
      SMTP_USER: process.env.SMTP_USER || 'NOT SET',
      
      // Payment
      STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY ? '***SET***' : 'NOT SET',
      
      // OAuth
      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? '***SET***' : 'NOT SET'
    };

    res.json({
      success: true,
      environment: envVars,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to check environment',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/diagnostic/cloudinary/test
 * @desc    Test Cloudinary upload with a test image
 * @access  Private/Admin
 */
router.post('/cloudinary/test', protect, authorize('admin'), async (req, res) => {
  try {
    const hasCloudName = !!process.env.CLOUDINARY_CLOUD_NAME;
    const hasApiKey = !!process.env.CLOUDINARY_API_KEY;
    const hasApiSecret = !!process.env.CLOUDINARY_API_SECRET;
    
    if (!hasCloudName || !hasApiKey || !hasApiSecret) {
      return res.status(400).json({
        success: false,
        message: 'Cloudinary not configured. Missing environment variables.',
        missing: {
          CLOUDINARY_CLOUD_NAME: !hasCloudName,
          CLOUDINARY_API_KEY: !hasApiKey,
          CLOUDINARY_API_SECRET: !hasApiSecret
        }
      });
    }

    const cloudinary = require('cloudinary').v2;
    
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    // Test by getting account details
    const result = await cloudinary.api.ping();
    
    res.json({
      success: true,
      message: 'Cloudinary connection successful!',
      cloudinary: {
        status: result.status || 'ok',
        cloudName: process.env.CLOUDINARY_CLOUD_NAME,
        configured: true
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Cloudinary connection failed',
      error: error.message,
      details: error.http_code ? `HTTP ${error.http_code}` : 'Network error'
    });
  }
});

module.exports = router;
