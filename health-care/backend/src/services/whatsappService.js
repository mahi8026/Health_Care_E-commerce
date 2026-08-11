const axios = require('axios');
const logger = require('../utils/logger');
const WhatsAppMessage = require('../models/WhatsAppMessage');
const WhatsAppConversation = require('../models/WhatsAppConversation');

/**
 * WhatsApp Business API Service
 * Supports multiple providers:
 * - Meta WhatsApp Business API (Cloud API)
 * - Twilio WhatsApp API
 * - Mock mode for development
 */

class WhatsAppService {
  constructor() {
    this.provider = process.env.WHATSAPP_PROVIDER || 'mock';
    this.businessPhone = process.env.WHATSAPP_BUSINESS_PHONE;
    
    // Meta Cloud API
    this.metaAccessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    this.metaPhoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    this.metaApiVersion = process.env.WHATSAPP_API_VERSION || 'v18.0';
    
    // Twilio
    this.twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
    this.twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
    this.twilioWhatsAppNumber = process.env.TWILIO_WHATSAPP_NUMBER;
    
    logger.info(`[WhatsApp] Initialized with provider: ${this.provider}`);
  }

  /**
   * Format phone number to WhatsApp format
   * @param {String} phone - Phone number
   * @returns {String} Formatted phone number (e.g., 8801712345678)
   */
  formatPhoneNumber(phone) {
    if (!phone) {
return null;
}
    
    // Remove all non-digit characters
    const cleaned = phone.replace(/\D/g, '');
    
    // Handle different formats
    if (cleaned.startsWith('880')) {
      return cleaned;
    } else if (cleaned.startsWith('0')) {
      return '880' + cleaned.substring(1);
    } else if (cleaned.length === 10) {
      return '880' + cleaned;
    } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
      return '880' + cleaned;
    }
    
    return '880' + cleaned;
  }

  /**
   * Send text message via Meta Cloud API
   */
  async sendMetaTextMessage(to, text) {
    try {
      const url = `https://graph.facebook.com/${this.metaApiVersion}/${this.metaPhoneNumberId}/messages`;
      
      const response = await axios.post(
        url,
        {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: this.formatPhoneNumber(to),
          type: 'text',
          text: { body: text }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.metaAccessToken}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );

      if (response.data && response.data.messages && response.data.messages[0]) {
        return {
          success: true,
          messageId: response.data.messages[0].id,
          provider: 'meta'
        };
      }

      return { success: false, error: 'Invalid response from Meta API' };
    } catch (error) {
      logger.error(`[WhatsApp] Meta API error: ${error.message}`);
      return {
        success: false,
        error: error.response?.data?.error?.message || error.message
      };
    }
  }

  /**
   * Send template message via Meta Cloud API
   */
  async sendMetaTemplateMessage(to, templateName, languageCode, components = []) {
    try {
      const url = `https://graph.facebook.com/${this.metaApiVersion}/${this.metaPhoneNumberId}/messages`;
      
      const response = await axios.post(
        url,
        {
          messaging_product: 'whatsapp',
          to: this.formatPhoneNumber(to),
          type: 'template',
          template: {
            name: templateName,
            language: { code: languageCode },
            components: components
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.metaAccessToken}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );

      if (response.data && response.data.messages && response.data.messages[0]) {
        return {
          success: true,
          messageId: response.data.messages[0].id,
          provider: 'meta'
        };
      }

      return { success: false, error: 'Invalid response from Meta API' };
    } catch (error) {
      logger.error(`[WhatsApp] Meta template error: ${error.message}`);
      return {
        success: false,
        error: error.response?.data?.error?.message || error.message
      };
    }
  }

  /**
   * Send interactive button message via Meta Cloud API
   */
  async sendMetaButtonMessage(to, bodyText, buttons) {
    try {
      const url = `https://graph.facebook.com/${this.metaApiVersion}/${this.metaPhoneNumberId}/messages`;
      
      const buttonComponents = buttons.map((btn, idx) => ({
        type: 'reply',
        reply: {
          id: btn.id || `btn_${idx}`,
          title: btn.title.substring(0, 20) // Max 20 chars
        }
      }));

      const response = await axios.post(
        url,
        {
          messaging_product: 'whatsapp',
          to: this.formatPhoneNumber(to),
          type: 'interactive',
          interactive: {
            type: 'button',
            body: { text: bodyText },
            action: {
              buttons: buttonComponents
            }
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.metaAccessToken}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );

      if (response.data && response.data.messages && response.data.messages[0]) {
        return {
          success: true,
          messageId: response.data.messages[0].id,
          provider: 'meta'
        };
      }

      return { success: false, error: 'Invalid response from Meta API' };
    } catch (error) {
      logger.error(`[WhatsApp] Meta button error: ${error.message}`);
      return {
        success: false,
        error: error.response?.data?.error?.message || error.message
      };
    }
  }

  /**
   * Send list message via Meta Cloud API
   */
  async sendMetaListMessage(to, bodyText, buttonText, sections) {
    try {
      const url = `https://graph.facebook.com/${this.metaApiVersion}/${this.metaPhoneNumberId}/messages`;
      
      const response = await axios.post(
        url,
        {
          messaging_product: 'whatsapp',
          to: this.formatPhoneNumber(to),
          type: 'interactive',
          interactive: {
            type: 'list',
            body: { text: bodyText },
            action: {
              button: buttonText,
              sections: sections
            }
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.metaAccessToken}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );

      if (response.data && response.data.messages && response.data.messages[0]) {
        return {
          success: true,
          messageId: response.data.messages[0].id,
          provider: 'meta'
        };
      }

      return { success: false, error: 'Invalid response from Meta API' };
    } catch (error) {
      logger.error(`[WhatsApp] Meta list error: ${error.message}`);
      return {
        success: false,
        error: error.response?.data?.error?.message || error.message
      };
    }
  }

  /**
   * Send message via Twilio WhatsApp API
   */
  async sendTwilioMessage(to, text) {
    try {
      const url = `https://api.twilio.com/2010-04-01/Accounts/${this.twilioAccountSid}/Messages.json`;
      const auth = Buffer.from(`${this.twilioAccountSid}:${this.twilioAuthToken}`).toString('base64');
      
      const response = await axios.post(
        url,
        new URLSearchParams({
          To: `whatsapp:+${this.formatPhoneNumber(to)}`,
          From: this.twilioWhatsAppNumber,
          Body: text
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
        return {
          success: true,
          messageId: response.data.sid,
          provider: 'twilio'
        };
      }

      return { success: false, error: 'Invalid response from Twilio' };
    } catch (error) {
      logger.error(`[WhatsApp] Twilio error: ${error.message}`);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  /**
   * Send mock message (development)
   */
  async sendMockMessage(to, text, type = 'text') {
    logger.info(`
╔════════════════════════════════════════════════════════════════╗
║                📱 MOCK WHATSAPP (Not Sent)                     ║
╠════════════════════════════════════════════════════════════════╣
║ To:      ${to.padEnd(50)}║
║ Type:    ${type.padEnd(50)}║
║ Message: ${text.substring(0, 47).padEnd(50)}║
║ Time:    ${new Date().toLocaleString().padEnd(50)}║
╚════════════════════════════════════════════════════════════════╝
    `);
    
    return {
      success: true,
      messageId: 'mock-wa-' + Date.now(),
      mock: true,
      provider: 'mock'
    };
  }

  /**
   * Main send message function
   */
  async sendMessage(to, text, options = {}) {
    try {
      const { type = 'text', buttons, listSections, templateName, templateLanguage, templateComponents } = options;

      let result;

      switch (this.provider.toLowerCase()) {
        case 'meta':
        case 'cloud':
          if (!this.metaAccessToken || !this.metaPhoneNumberId) {
            logger.warn('[WhatsApp] Meta credentials not configured, using mock mode');
            return this.sendMockMessage(to, text, type);
          }

          if (type === 'button' && buttons) {
            result = await this.sendMetaButtonMessage(to, text, buttons);
          } else if (type === 'list' && listSections) {
            result = await this.sendMetaListMessage(to, text, options.buttonText || 'View Options', listSections);
          } else if (type === 'template' && templateName) {
            result = await this.sendMetaTemplateMessage(to, templateName, templateLanguage || 'en', templateComponents || []);
          } else {
            result = await this.sendMetaTextMessage(to, text);
          }
          break;

        case 'twilio':
          if (!this.twilioAccountSid || !this.twilioAuthToken) {
            logger.warn('[WhatsApp] Twilio credentials not configured, using mock mode');
            return this.sendMockMessage(to, text, type);
          }
          result = await this.sendTwilioMessage(to, text);
          break;

        case 'mock':
        case 'development':
        default:
          result = await this.sendMockMessage(to, text, type);
          break;
      }

      // Save message to database
      if (result.success) {
        await this.saveOutboundMessage(to, text, result.messageId, type, options);
      }

      return result;
    } catch (error) {
      logger.error(`[WhatsApp] Send error: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Save outbound message to database
   */
  async saveOutboundMessage(to, text, messageId, type, options = {}) {
    try {
      const conversationId = await this.getOrCreateConversation(to);
      
      const message = new WhatsAppMessage({
        messageId,
        conversationId,
        from: this.businessPhone,
        to: this.formatPhoneNumber(to),
        direction: 'outbound',
        type,
        content: {
          text,
          ...options.content
        },
        status: 'sent',
        isBot: options.isBot !== false,
        botIntent: options.botIntent,
        templateName: options.templateName,
        templateLanguage: options.templateLanguage,
        sentAt: new Date()
      });

      await message.save();
      
      // Update conversation
      await WhatsAppConversation.findOneAndUpdate(
        { conversationId },
        {
          $inc: { messageCount: 1 },
          lastMessageAt: new Date()
        }
      );

      return message;
    } catch (error) {
      logger.error(`[WhatsApp] Save message error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Save inbound message to database
   */
  async saveInboundMessage(from, text, messageId, type = 'text', content = {}) {
    try {
      const conversationId = await this.getOrCreateConversation(from);
      
      const message = new WhatsAppMessage({
        messageId,
        conversationId,
        from: this.formatPhoneNumber(from),
        to: this.businessPhone,
        direction: 'inbound',
        type,
        content: {
          text,
          ...content
        },
        status: 'delivered',
        isBot: false,
        sentAt: new Date()
      });

      await message.save();
      
      // Update conversation
      await WhatsAppConversation.findOneAndUpdate(
        { conversationId },
        {
          $inc: { messageCount: 1 },
          lastMessageAt: new Date()
        }
      );

      return message;
    } catch (error) {
      logger.error(`[WhatsApp] Save inbound message error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get or create conversation
   */
  async getOrCreateConversation(phoneNumber) {
    try {
      const formattedPhone = this.formatPhoneNumber(phoneNumber);
      
      let conversation = await WhatsAppConversation.findOne({
        phoneNumber: formattedPhone,
        status: { $in: ['active', 'pending'] }
      });

      if (!conversation) {
        conversation = new WhatsAppConversation({
          phoneNumber: formattedPhone,
          conversationId: `wa_${formattedPhone}_${Date.now()}`,
          status: 'active',
          isBot: true,
          botStage: 'greeting'
        });
        await conversation.save();
        logger.info(`[WhatsApp] New conversation created: ${conversation.conversationId}`);
      }

      return conversation.conversationId;
    } catch (error) {
      logger.error(`[WhatsApp] Get/create conversation error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Mark message as read
   */
  async markAsRead(messageId) {
    try {
      if (this.provider === 'meta' || this.provider === 'cloud') {
        const url = `https://graph.facebook.com/${this.metaApiVersion}/${this.metaPhoneNumberId}/messages`;
        
        await axios.post(
          url,
          {
            messaging_product: 'whatsapp',
            status: 'read',
            message_id: messageId
          },
          {
            headers: {
              'Authorization': `Bearer ${this.metaAccessToken}`,
              'Content-Type': 'application/json'
            }
          }
        );
      }

      // Update in database
      await WhatsAppMessage.findOneAndUpdate(
        { messageId },
        { status: 'read', readAt: new Date() }
      );

      return { success: true };
    } catch (error) {
      logger.error(`[WhatsApp] Mark as read error: ${error.message}`);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new WhatsAppService();
