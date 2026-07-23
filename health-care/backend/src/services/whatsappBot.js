const whatsappService = require('./whatsappService');
const WhatsAppConversation = require('../models/WhatsAppConversation');
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const logger = require('../utils/logger');

/**
 * WhatsApp Bot Logic
 * Handles automated responses and conversation flows
 */

class WhatsAppBot {
  constructor() {
    this.intents = {
      greeting: ['hi', 'hello', 'hey', 'assalamu alaikum', 'salam', 'good morning', 'good afternoon', 'good evening'],
      order_status: ['order', 'track', 'tracking', 'status', 'where is my order', 'delivery'],
      product_inquiry: ['product', 'price', 'available', 'stock', 'buy', 'purchase', 'equipment', 'machine'],
      quote_request: ['quote', 'quotation', 'bulk', 'b2b', 'wholesale', 'discount'],
      support: ['help', 'support', 'problem', 'issue', 'complaint'],
      human: ['agent', 'human', 'person', 'talk to someone', 'representative']
    };
  }

  /**
   * Process incoming message
   */
  async processMessage(from, text, _messageId) {
    try {
      logger.info(`[WhatsAppBot] Processing message from ${from}: ${text}`);

      // Get or create conversation
      const conversationId = await whatsappService.getOrCreateConversation(from);
      const conversation = await WhatsAppConversation.findOne({ conversationId });

      if (!conversation) {
        throw new Error('Failed to get conversation');
      }

      // Check if conversation is handled by human
      if (!conversation.isBot) {
        logger.info(`[WhatsAppBot] Conversation ${conversationId} is handled by human agent`);
        return { handled: false, reason: 'human_agent' };
      }

      // Detect intent
      const intent = this.detectIntent(text);
      logger.info(`[WhatsAppBot] Detected intent: ${intent}`);

      // Route to appropriate handler
      let response;
      switch (intent) {
        case 'greeting':
          response = await this.handleGreeting(conversation, from);
          break;
        case 'order_status':
          response = await this.handleOrderStatus(conversation, from, text);
          break;
        case 'product_inquiry':
          response = await this.handleProductInquiry(conversation, from, text);
          break;
        case 'quote_request':
          response = await this.handleQuoteRequest(conversation, from, text);
          break;
        case 'support':
          response = await this.handleSupport(conversation, from, text);
          break;
        case 'human':
          response = await this.handleHumanHandoff(conversation, from);
          break;
        default:
          response = await this.handleDefault(conversation, from, text);
          break;
      }

      // Update conversation context
      conversation.context.set('lastIntent', intent);
      conversation.context.set('lastMessage', text);
      conversation.context.set('lastResponse', response);
      await conversation.save();

      return { handled: true, intent, response };
    } catch (error) {
      logger.error(`[WhatsAppBot] Process message error: ${error.message}`);
      return { handled: false, error: error.message };
    }
  }

  /**
   * Detect intent from message text
   */
  detectIntent(text) {
    const lowerText = text.toLowerCase().trim();

    // Check each intent
    for (const [intent, keywords] of Object.entries(this.intents)) {
      for (const keyword of keywords) {
        if (lowerText.includes(keyword)) {
          return intent;
        }
      }
    }

    return 'unknown';
  }

  /**
   * Handle greeting
   */
  async handleGreeting(conversation, from) {
    const message = `👋 Welcome to MediportBD!

I'm your virtual assistant. How can I help you today?

*Quick Options:*
1️⃣ Track my order
2️⃣ Browse products
3️⃣ Request a quote
4️⃣ Get support
5️⃣ Talk to a human agent

Just reply with a number or describe what you need!`;

    await whatsappService.sendMessage(from, message, {
      isBot: true,
      botIntent: 'greeting'
    });

    conversation.botStage = 'menu';
    await conversation.save();

    return message;
  }

  /**
   * Handle order status inquiry
   */
  async handleOrderStatus(conversation, from, text) {
    try {
      // Extract order number from text
      const orderNumberMatch = text.match(/\b(ORD-\d+)\b/i);
      
      if (!orderNumberMatch) {
        const message = `📦 *Order Tracking*

Please provide your order number (e.g., ORD-12345) to track your order.

You can find it in your order confirmation email or SMS.`;

        await whatsappService.sendMessage(from, message, {
          isBot: true,
          botIntent: 'order_status_request'
        });

        conversation.botStage = 'order_tracking';
        await conversation.save();

        return message;
      }

      // Find order
      const orderNumber = orderNumberMatch[1].toUpperCase();
      const order = await Order.findOne({ orderNumber }).populate('items.product', 'name');

      if (!order) {
        const message = `❌ Order ${orderNumber} not found.

Please check the order number and try again, or contact support at +8801646886795.`;

        await whatsappService.sendMessage(from, message, {
          isBot: true,
          botIntent: 'order_not_found'
        });

        return message;
      }

      // Format order status
      const statusEmoji = {
        pending: '⏳',
        confirmed: '✅',
        processing: '📦',
        shipped: '🚚',
        delivered: '✅',
        cancelled: '❌'
      };

      const message = `${statusEmoji[order.status] || '📦'} *Order Status: ${orderNumber}*

*Status:* ${order.status.toUpperCase()}
*Total:* ৳${order.totalAmount.toLocaleString('en-BD')}
*Items:* ${order.items.length} item(s)
*Ordered:* ${order.createdAt.toLocaleDateString('en-BD')}

${order.trackingNumber ? `*Tracking:* ${order.trackingNumber}` : ''}

${order.status === 'shipped' ? '🚚 Your order is on the way!' : ''}
${order.status === 'delivered' ? '✅ Your order has been delivered!' : ''}

Track online: https://MediportBD.com/track/${orderNumber}

Need help? Reply "support" or call +8801646886795`;

      await whatsappService.sendMessage(from, message, {
        isBot: true,
        botIntent: 'order_status_found'
      });

      conversation.relatedOrder = order._id;
      conversation.category = 'order_status';
      await conversation.save();

      return message;
    } catch (error) {
      logger.error(`[WhatsAppBot] Order status error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Handle product inquiry
   */
  async handleProductInquiry(conversation, from, text) {
    try {
      // Search for products
      const searchTerms = text.toLowerCase()
        .replace(/product|price|available|stock|buy|purchase/gi, '')
        .trim();

      if (searchTerms.length < 3) {
        const message = `🔍 *Product Search*

What product are you looking for?

Examples:
• ECG machine
• Blood pressure monitor
• HbA1c test kit
• Surgical gloves

Or browse categories:
https://MediportBD.com/products`;

        await whatsappService.sendMessage(from, message, {
          isBot: true,
          botIntent: 'product_search_request'
        });

        conversation.botStage = 'product_search';
        await conversation.save();

        return message;
      }

      // Search products
      const products = await Product.find({
        $or: [
          { name: { $regex: searchTerms, $options: 'i' } },
          { description: { $regex: searchTerms, $options: 'i' } },
          { brand: { $regex: searchTerms, $options: 'i' } }
        ],
        isActive: true
      }).limit(5);

      if (products.length === 0) {
        const message = `❌ No products found for "${searchTerms}"

Try different keywords or browse all products:
https://MediportBD.com/products

Need help? Reply "support" or call +8801646886795`;

        return message;
      }

      // Format product list
      let message = `🔍 *Found ${products.length} product(s) for "${searchTerms}":*\n\n`;

      products.forEach((product, idx) => {
        const price = product.price?.toLocaleString('en-BD') || 'Contact for price';
        const stock = product.stock > 0 ? '✅ In Stock' : '❌ Out of Stock';
        
        message += `${idx + 1}. *${product.name}*\n`;
        message += `   Brand: ${product.brand || 'N/A'}\n`;
        message += `   Price: ৳${price}\n`;
        message += `   ${stock}\n`;
        message += `   View: https://MediportBD.com/products/${product._id}\n\n`;
      });

      message += `\n💬 Reply with product number for details or "quote" to request a quotation.`;

      await whatsappService.sendMessage(from, message, {
        isBot: true,
        botIntent: 'product_search_results'
      });

      conversation.relatedProducts = products.map(p => p._id);
      conversation.category = 'product_inquiry';
      await conversation.save();

      return message;
    } catch (error) {
      logger.error(`[WhatsAppBot] Product inquiry error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Handle quote request
   */
  async handleQuoteRequest(conversation, from, _text) {
    const message = `📋 *Request a Quote*

To get a customized quote, please provide:

1. Product name(s) or category
2. Quantity needed
3. Your organization name
4. Delivery location

Or submit online:
https://MediportBD.com/b2b

Our team will respond within 24 hours!

📞 Urgent? Call: +8801646886795
📧 Email: mahimrahman07@gmail.com`;

    await whatsappService.sendMessage(from, message, {
      isBot: true,
      botIntent: 'quote_request'
    });

    conversation.botStage = 'quote_collection';
    conversation.category = 'quote_request';
    await conversation.save();

    return message;
  }

  /**
   * Handle support request
   */
  async handleSupport(conversation, from, _text) {
    const message = `🆘 *Customer Support*

How can we help you?

*Common Issues:*
• Payment problems
• Delivery delays
• Product defects
• Return/refund requests
• Technical support

Please describe your issue, and I'll connect you with our support team.

📞 Call: +8801646886795 (24/7)
📧 Email: mahimrahman07@gmail.com
⏰ Office Hours: 9 AM - 6 PM (Sat-Thu)`;

    await whatsappService.sendMessage(from, message, {
      isBot: true,
      botIntent: 'support_request'
    });

    conversation.category = 'support';
    conversation.status = 'pending';
    await conversation.save();

    // Notify admin about support request
    try {
      const { sendWhatsAppConversationAlert } = require('../utils/emailService');
      
      // Try to find user by phone number
      let user = null;
      const cleanPhone = from.replace(/\D/g, '');
      user = await User.findOne({
        $or: [
          { phone: from },
          { phone: cleanPhone },
          { phone: `+${cleanPhone}` },
          { phone: `+880${cleanPhone.slice(-10)}` }
        ]
      });

      await sendWhatsAppConversationAlert(conversation, user);
      logger.info(`[WhatsAppBot] Admin notification sent for support request ${conversation.conversationId}`);
    } catch (notifyError) {
      logger.error(`[WhatsAppBot] Failed to send admin notification: ${notifyError.message}`);
      // Don't fail the support request if notification fails
    }

    return message;
  }

  /**
   * Handle human handoff
   */
  async handleHumanHandoff(conversation, from) {
    const message = `👤 *Connecting to Human Agent*

I'm transferring you to one of our team members. They'll respond shortly.

⏰ Response time: 5-15 minutes during business hours
📞 Urgent? Call: +8801646886795

Please wait...`;

    await whatsappService.sendMessage(from, message, {
      isBot: true,
      botIntent: 'human_handoff'
    });

    conversation.isBot = false;
    conversation.botStage = 'human_handoff';
    conversation.status = 'escalated';
    await conversation.save();

    // Notify admin/agent about new conversation
    try {
      const { sendWhatsAppConversationAlert } = require('../utils/emailService');
      
      // Try to find user by phone number
      let user = null;
      const cleanPhone = from.replace(/\D/g, '');
      user = await User.findOne({
        $or: [
          { phone: from },
          { phone: cleanPhone },
          { phone: `+${cleanPhone}` },
          { phone: `+880${cleanPhone.slice(-10)}` }
        ]
      });

      await sendWhatsAppConversationAlert(conversation, user);
      logger.info(`[WhatsAppBot] Admin notification sent for conversation ${conversation.conversationId}`);
    } catch (notifyError) {
      logger.error(`[WhatsAppBot] Failed to send admin notification: ${notifyError.message}`);
      // Don't fail the handoff if notification fails
    }

    return message;
  }

  /**
   * Handle default/unknown intent
   */
  async handleDefault(_conversation, from, _text) {
    const message = `I'm not sure I understand. Let me help you with:

*Quick Options:*
1️⃣ Track my order
2️⃣ Browse products
3️⃣ Request a quote
4️⃣ Get support
5️⃣ Talk to a human agent

Reply with a number or describe what you need!`;

    await whatsappService.sendMessage(from, message, {
      isBot: true,
      botIntent: 'fallback'
    });

    return message;
  }

  /**
   * Send order confirmation via WhatsApp
   */
  async sendOrderConfirmation(order, user) {
    try {
      if (!user.phone) {
        logger.warn(`[WhatsAppBot] User ${user._id} has no phone number`);
        return { success: false, error: 'No phone number' };
      }

      const message = `✅ *Order Confirmed!*

Thank you for your order, ${user.name}!

*Order Number:* ${order.orderNumber}
*Total Amount:* ৳${order.totalAmount.toLocaleString('en-BD')}
*Items:* ${order.items.length} item(s)
*Payment:* ${order.paymentMethod}

We'll notify you when your order ships.

Track your order:
https://MediportBD.com/track/${order.orderNumber}

Questions? Reply to this message or call +8801646886795`;

      const result = await whatsappService.sendMessage(user.phone, message, {
        isBot: true,
        botIntent: 'order_confirmation'
      });

      logger.info(`[WhatsAppBot] Order confirmation sent to ${user.phone}`);
      return result;
    } catch (error) {
      logger.error(`[WhatsAppBot] Order confirmation error: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send order status update via WhatsApp
   */
  async sendOrderStatusUpdate(order, user, newStatus) {
    try {
      if (!user.phone) {
        return { success: false, error: 'No phone number' };
      }

      const statusMessages = {
        confirmed: '✅ Your order has been confirmed and is being prepared.',
        processing: '📦 Your order is being processed.',
        shipped: '🚚 Your order has been shipped!',
        delivered: '✅ Your order has been delivered!',
        cancelled: '❌ Your order has been cancelled.'
      };

      const message = `📦 *Order Update: ${order.orderNumber}*

${statusMessages[newStatus] || `Status updated to: ${newStatus}`}

${order.trackingNumber ? `*Tracking Number:* ${order.trackingNumber}` : ''}

Track your order:
https://MediportBD.com/track/${order.orderNumber}

Questions? Reply to this message!`;

      const result = await whatsappService.sendMessage(user.phone, message, {
        isBot: true,
        botIntent: 'order_status_update'
      });

      logger.info(`[WhatsAppBot] Status update sent to ${user.phone}`);
      return result;
    } catch (error) {
      logger.error(`[WhatsAppBot] Status update error: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send quote ready notification
   */
  async sendQuoteReady(quote, user) {
    try {
      if (!user.phone) {
        return { success: false, error: 'No phone number' };
      }

      const message = `📋 *Your Quote is Ready!*

Hello ${user.name},

Your quotation #${quote.quoteNumber} is ready for review.

*Total Amount:* ৳${quote.totalAmount.toLocaleString('en-BD')}
*Valid Until:* ${quote.validUntil ? new Date(quote.validUntil).toLocaleDateString('en-BD') : 'N/A'}

View your quote:
https://MediportBD.com/account/quotes/${quote._id}

Questions? Reply to this message or call +8801646886795`;

      const result = await whatsappService.sendMessage(user.phone, message, {
        isBot: true,
        botIntent: 'quote_ready'
      });

      logger.info(`[WhatsAppBot] Quote notification sent to ${user.phone}`);
      return result;
    } catch (error) {
      logger.error(`[WhatsAppBot] Quote notification error: ${error.message}`);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new WhatsAppBot();
