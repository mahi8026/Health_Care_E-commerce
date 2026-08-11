const logger = require('../utils/logger');
const { sendTestSMS, maskPhoneNumber } = require('../services/smsService');
const { successResponse, errorResponse } = require('../utils/responseHelper');

/**
 * @desc    Get SMS configuration
 * @route   GET /api/sms/config
 * @access  Private/Admin
 */
exports.getSMSConfig = async (req, res) => {
  try {
    const config = {
      provider: 'SSL Wireless',
      senderId: process.env.SMS_SENDER_ID || 'MediportBD',
      isConfigured: !!process.env.SMS_API_KEY,
      adminPhone: process.env.ADMIN_PHONE ? maskPhoneNumber(process.env.ADMIN_PHONE) : null
    };

    return successResponse(res, config);
  } catch (error) {
    logger.error(`[getSMSConfig] ${error.message}`);
    return errorResponse(res, 'Failed to fetch SMS configuration', process.env.ERROR_DETAIL_ENABLED === 'true' ? [error.message] : null, 500);
  }
};

/**
 * @desc    Send test SMS
 * @route   POST /api/sms/test
 * @access  Private/Admin
 */
exports.sendTestSMSHandler = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return errorResponse(res, 'Please provide a phone number', null, 400);
    }

    // Validate phone number format (basic validation)
    const phoneRegex = /^(\+?880|0)?1[3-9]\d{8}$/;
    const cleanPhone = phone.replace(/\D/g, '');
    
    if (!phoneRegex.test(cleanPhone) && !phoneRegex.test(phone)) {
      return errorResponse(res, 'Please provide a valid Bangladesh phone number', null, 400);
    }

    // Send test SMS
    const result = await sendTestSMS(phone);

    if (result.success) {
      logger.info(`[sendTestSMS] Test SMS sent to ${maskPhoneNumber(phone)} by admin ${req.user.email}`);
      
      return successResponse(res, {
        phone: maskPhoneNumber(phone)
      }, `Test SMS sent successfully to ${maskPhoneNumber(phone)}`);
    } else {
      return errorResponse(res, result.error || 'Failed to send test SMS', null, 500);
    }
  } catch (error) {
    logger.error(`[sendTestSMS] ${error.message}`);
    return errorResponse(res, 'Failed to send test SMS', process.env.ERROR_DETAIL_ENABLED === 'true' ? [error.message] : null, 500);
  }
};

/**
 * @desc    Get SMS logs (from Winston logs)
 * @route   GET /api/sms/logs
 * @access  Private/Admin
 */
exports.getSMSLogs = async (req, res) => {
  try {
    // In a production environment, you would read from Winston log files
    // For now, return a placeholder response
    // You can implement log file reading using fs module if needed

    return successResponse(res, {
      logs: [],
      note: 'Check backend logs for detailed SMS activity'
    }, 'SMS logs are available in Winston log files');
  } catch (error) {
    logger.error(`[getSMSLogs] ${error.message}`);
    return errorResponse(res, 'Failed to fetch SMS logs', process.env.ERROR_DETAIL_ENABLED === 'true' ? [error.message] : null, 500);
  }
};

/**
 * @desc    Get SMS statistics
 * @route   GET /api/sms/stats
 * @access  Private/Admin
 */
exports.getSMSStats = async (req, res) => {
  try {
    // In a production environment, you would track SMS sends in a separate collection
    // For now, return basic stats
    
    const stats = {
      isConfigured: !!process.env.SMS_API_KEY,
      provider: 'SSL Wireless',
      senderId: process.env.SMS_SENDER_ID || 'MediportBD',
      // These would come from a tracking collection in production
      totalSent: 0,
      totalFailed: 0,
      lastSent: null
    };

    return successResponse(res, stats);
  } catch (error) {
    logger.error(`[getSMSStats] ${error.message}`);
    return errorResponse(res, 'Failed to fetch SMS statistics', process.env.ERROR_DETAIL_ENABLED === 'true' ? [error.message] : null, 500);
  }
};
