const axios = require('axios');
const logger = require('../utils/logger');

/**
 * SMS Service supporting multiple providers:
 * - Twilio (for testing with free credit)
 * - SSL Wireless (for production in Bangladesh)
 * - Mock mode (for development)
 */

/**
 * Format phone number to ensure +880 prefix for Bangladesh
 * @param {String} phone - Phone number in any format
 * @returns {String} Formatted phone number with +880 prefix
 */
function formatPhoneNumber(phone) {
  if (!phone) return null;
  
  // Remove all non-digit characters
  let cleaned = phone.replace(/\D/g, '');
  
  // Handle different formats
  if (cleaned.startsWith('880')) {
    // Already has country code
    return '+' + cleaned;
  } else if (cleaned.startsWith('0')) {
    // Remove leading 0 and add country code
    return '+880' + cleaned.substring(1);
  } else if (cleaned.length === 10) {
    // 10 digits without leading 0
    return '+880' + cleaned;
  } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
    // 11 digits starting with 1
    return '+880' + cleaned;
  }
  
  // Default: assume it needs country code
  return '+880' + cleaned;
}

/**
 * Mask phone number for display
 * Example: +8801712345678 -> +880XXXXXX678
 * @param {String} phone - Phone number
 * @returns {String} Masked phone number
 */
function maskPhoneNumber(phone) {
  if (!phone) return 'N/A';
  
  const formatted = formatPhoneNumber(phone);
  if (formatted.length < 10) return formatted;
  
  // Show country code, mask middle digits, show last 3
  const countryCode = formatted.substring(0, 4); // +880
  const lastDigits = formatted.substring(formatted.length - 3);
  const maskedLength = formatted.length - 7;
  
  return `${countryCode}${'X'.repeat(maskedLength)}${lastDigits}`;
}

/**
 * Send SMS via Twilio API
 * @param {String} phone - Recipient phone number
 * @param {String} message - SMS message content
 * @returns {Object} { success: boolean, error?: string, messageId?: string }
 */
async function sendTwilioSMS(phone, message) {
  try {
    const formattedPhone = formatPhoneNumber(phone);
    
    // Twilio API endpoint — always uses the main Account SID in the URL
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const fromNumber = process.env.TWILIO_PHONE_NUMBER;
    
    // Support both auth methods:
    // 1. API Key (preferred, more secure): TWILIO_API_KEY_SID + TWILIO_API_KEY_SECRET
    // 2. Auth Token (legacy): TWILIO_AUTH_TOKEN
    let authUser, authPass;
    if (process.env.TWILIO_API_KEY_SID && process.env.TWILIO_API_KEY_SECRET) {
      authUser = process.env.TWILIO_API_KEY_SID;
      authPass = process.env.TWILIO_API_KEY_SECRET;
    } else {
      authUser = accountSid;
      authPass = process.env.TWILIO_AUTH_TOKEN;
    }

    const apiUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    
    // Create Basic Auth header
    const auth = Buffer.from(`${authUser}:${authPass}`).toString('base64');
    
    // Send SMS
    const response = await axios.post(
      apiUrl,
      new URLSearchParams({
        To: formattedPhone,
        From: fromNumber,
        Body: message
      }),
      {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        timeout: 10000
      }
    );

    if (response.data && response.data.sid) {
      logger.info(`[SMS] Twilio sent successfully to ${maskPhoneNumber(phone)}`);
      return {
        success: true,
        messageId: response.data.sid,
        provider: 'twilio'
      };
    } else {
      logger.error(`[SMS] Twilio failed: ${JSON.stringify(response.data)}`);
      return {
        success: false,
        error: 'Twilio SMS send failed'
      };
    }
  } catch (error) {
    logger.error(`[SMS] Twilio error: ${error.message}`);
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Twilio SMS error'
    };
  }
}

/**
 * Send SMS via SSL Wireless API
 * @param {String} phone - Recipient phone number
 * @param {String} message - SMS message content
 * @returns {Object} { success: boolean, error?: string, messageId?: string }
 */
async function sendSSLWirelessSMS(phone, message) {
  try {
    const formattedPhone = formatPhoneNumber(phone);
    
    // SSL Wireless API endpoint
    const apiUrl = process.env.SMS_API_URL || 'https://smsplus.sslwireless.com/api/v3/send-sms';
    
    // Prepare request payload
    const payload = {
      api_token: process.env.SMS_API_KEY,
      sid: process.env.SMS_SENDER_ID || 'MedCoreBD',
      msisdn: formattedPhone,
      sms: message,
      csms_id: Date.now().toString()
    };

    // Send SMS
    const response = await axios.post(apiUrl, payload, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      timeout: 10000
    });

    if (response.data && response.data.status === 'SUCCESS') {
      logger.info(`[SMS] SSL Wireless sent successfully to ${maskPhoneNumber(phone)}`);
      return {
        success: true,
        messageId: response.data.sms_id || payload.csms_id,
        provider: 'ssl_wireless'
      };
    } else {
      logger.error(`[SMS] SSL Wireless failed: ${JSON.stringify(response.data)}`);
      return {
        success: false,
        error: response.data?.message || 'SSL Wireless SMS send failed'
      };
    }
  } catch (error) {
    logger.error(`[SMS] SSL Wireless error: ${error.message}`);
    return {
      success: false,
      error: error.message || 'SSL Wireless SMS error'
    };
  }
}

/**
 * Send mock SMS (for development/testing)
 * @param {String} phone - Recipient phone number
 * @param {String} message - SMS message content
 * @returns {Object} { success: boolean, messageId: string, mock: boolean }
 */
async function sendMockSMS(phone, message) {
  logger.info(`
╔════════════════════════════════════════════════════════════════╗
║                    📱 MOCK SMS (Not Sent)                      ║
╠════════════════════════════════════════════════════════════════╣
║ To:      ${maskPhoneNumber(phone).padEnd(50)}║
║ Message: ${message.substring(0, 47).padEnd(50)}║
║ Time:    ${new Date().toLocaleString().padEnd(50)}║
╚════════════════════════════════════════════════════════════════╝
  `);
  
  return {
    success: true,
    messageId: 'mock-' + Date.now(),
    mock: true,
    provider: 'mock'
  };
}

/**
 * Main SMS sending function - routes to appropriate provider
 * @param {String} phone - Recipient phone number
 * @param {String} message - SMS message content
 * @returns {Object} { success: boolean, error?: string, messageId?: string }
 */
async function sendSMS(phone, message) {
  try {
    // Validate inputs
    if (!phone || !message) {
      logger.error('[SMS] Missing phone or message');
      return { success: false, error: 'Missing phone or message' };
    }

    // Determine provider
    const provider = process.env.SMS_PROVIDER || 'mock';
    
    logger.info(`[SMS] Using provider: ${provider}`);

    // Route to appropriate provider
    switch (provider.toLowerCase()) {
      case 'twilio':
        if (!process.env.TWILIO_ACCOUNT_SID || 
            (!process.env.TWILIO_AUTH_TOKEN && !process.env.TWILIO_API_KEY_SID)) {
          logger.warn('[SMS] Twilio credentials not configured, using mock mode');
          return sendMockSMS(phone, message);
        }
        return await sendTwilioSMS(phone, message);

      case 'ssl_wireless':
      case 'ssl':
        if (!process.env.SMS_API_KEY) {
          logger.warn('[SMS] SSL Wireless API key not configured, using mock mode');
          return sendMockSMS(phone, message);
        }
        return await sendSSLWirelessSMS(phone, message);

      case 'mock':
      case 'development':
      default:
        return sendMockSMS(phone, message);
    }
  } catch (error) {
    logger.error(`[SMS] Error in sendSMS: ${error.message}`);
    return {
      success: false,
      error: error.message || 'SMS service error'
    };
  }
}

/**
 * Send OTP via SMS
 * @param {String} phone - Recipient phone number
 * @param {String} otp - 6-digit OTP code
 * @returns {Object} { success: boolean, error?: string }
 */
async function sendOTP(phone, otp) {
  const message = `Your MedCore BD OTP is: ${otp}. Valid for 5 minutes. Do not share this code with anyone.`;
  
  logger.info(`[SMS] Sending OTP to ${maskPhoneNumber(phone)}`);
  return await sendSMS(phone, message);
}

/**
 * Send order confirmation SMS
 * @param {String} phone - Customer phone number
 * @param {String} orderNumber - Order number
 * @param {Number} total - Order total amount
 * @returns {Object} { success: boolean, error?: string }
 */
async function sendOrderConfirmationSMS(phone, orderNumber, total) {
  const formattedTotal = total.toLocaleString('en-BD');
  const message = `MedCore BD: Order #${orderNumber} confirmed. Total: ৳${formattedTotal}. Track at medcorebd.com/track`;
  
  logger.info(`[SMS] Sending order confirmation to ${maskPhoneNumber(phone)}`);
  return await sendSMS(phone, message);
}

/**
 * Send order status update SMS
 * @param {String} phone - Customer phone number
 * @param {String} orderNumber - Order number
 * @param {String} status - New order status
 * @returns {Object} { success: boolean, error?: string }
 */
async function sendOrderStatusSMS(phone, orderNumber, status) {
  // Format status for display
  const statusMap = {
    'confirmed': 'CONFIRMED',
    'processing': 'PROCESSING',
    'shipped': 'SHIPPED',
    'delivered': 'DELIVERED',
    'cancelled': 'CANCELLED'
  };
  
  const displayStatus = statusMap[status] || status.toUpperCase();
  const message = `MedCore BD: Order #${orderNumber} is now ${displayStatus}. Track at medcorebd.com/track`;
  
  logger.info(`[SMS] Sending status update to ${maskPhoneNumber(phone)}`);
  return await sendSMS(phone, message);
}

/**
 * Send low stock alert SMS to admin
 * @param {String} adminPhone - Admin phone number
 * @param {String} productName - Product name
 * @param {Number} stock - Current stock level
 * @returns {Object} { success: boolean, error?: string }
 */
async function sendLowStockAlertSMS(adminPhone, productName, stock) {
  const message = `MedCore BD ALERT: "${productName}" is low on stock (${stock} units remaining). Please restock soon.`;
  
  logger.info(`[SMS] Sending low stock alert to admin ${maskPhoneNumber(adminPhone)}`);
  return await sendSMS(adminPhone, message);
}

/**
 * Send test SMS (for admin testing)
 * @param {String} phone - Test recipient phone number
 * @returns {Object} { success: boolean, error?: string }
 */
async function sendTestSMS(phone) {
  const message = `MedCore BD: This is a test SMS. Your SMS service is working correctly. Sent at ${new Date().toLocaleString('en-BD')}`;
  
  logger.info(`[SMS] Sending test SMS to ${maskPhoneNumber(phone)}`);
  return await sendSMS(phone, message);
}

/**
 * Fire-and-forget SMS sending (non-blocking)
 * Use this for non-critical SMS that shouldn't block operations
 * @param {Function} smsFunction - SMS function to call
 * @param  {...any} args - Arguments to pass to the function
 */
function sendSMSAsync(smsFunction, ...args) {
  smsFunction(...args).catch(error => {
    logger.error(`[SMS] Async SMS failed: ${error.message}`);
  });
}

module.exports = {
  sendSMS,
  sendOTP,
  sendOrderConfirmationSMS,
  sendOrderStatusSMS,
  sendLowStockAlertSMS,
  sendTestSMS,
  sendSMSAsync,
  formatPhoneNumber,
  maskPhoneNumber
};
