const logger = require('../utils/logger');
const { sendTestSMS, maskPhoneNumber } = require('../services/smsService');

/**
 * @desc    Get SMS configuration
 * @route   GET /api/sms/config
 * @access  Private/Admin
 */
exports.getSMSConfig = async (req, res) => {
  try {
    const config = {
      provider: 'SSL Wireless',
      senderId: process.env.SMS_SENDER_ID || 'MedCoreBD',
      isConfigured: !!process.env.SMS_API_KEY,
      adminPhone: process.env.ADMIN_PHONE ? maskPhoneNumber(process.env.ADMIN_PHONE) : null
    };

    res.status(200).json({
      success: true,
      config
    });
  } catch (error) {
    logger.error(`[getSMSConfig] ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch SMS configuration',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
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
      return res.status(400).json({
        success: false,
        message: 'Please provide a phone number'
      });
    }

    // Validate phone number format (basic validation)
    const phoneRegex = /^(\+?880|0)?1[3-9]\d{8}$/;
    const cleanPhone = phone.replace(/\D/g, '');
    
    if (!phoneRegex.test(cleanPhone) && !phoneRegex.test(phone)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid Bangladesh phone number'
      });
    }

    // Send test SMS
    const result = await sendTestSMS(phone);

    if (result.success) {
      logger.info(`[sendTestSMS] Test SMS sent to ${maskPhoneNumber(phone)} by admin ${req.user.email}`);
      
      res.status(200).json({
        success: true,
        message: `Test SMS sent successfully to ${maskPhoneNumber(phone)}`,
        phone: maskPhoneNumber(phone)
      });
    } else {
      res.status(500).json({
        success: false,
        message: result.error || 'Failed to send test SMS'
      });
    }
  } catch (error) {
    logger.error(`[sendTestSMS] ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to send test SMS',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Get SMS logs (from Winston logs)
 * @route   GET /api/sms/logs
 * @access  Private/Admin
 */
exports.getSMSLogs = async (req, res) => {
  try {
    const { limit = 20 } = req.query;

    // In a production environment, you would read from Winston log files
    // For now, return a placeholder response
    // You can implement log file reading using fs module if needed

    res.status(200).json({
      success: true,
      message: 'SMS logs are available in Winston log files',
      logs: [],
      note: 'Check backend logs for detailed SMS activity'
    });
  } catch (error) {
    logger.error(`[getSMSLogs] ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch SMS logs',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
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
      senderId: process.env.SMS_SENDER_ID || 'MedCoreBD',
      // These would come from a tracking collection in production
      totalSent: 0,
      totalFailed: 0,
      lastSent: null
    };

    res.status(200).json({
      success: true,
      stats
    });
  } catch (error) {
    logger.error(`[getSMSStats] ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch SMS statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
