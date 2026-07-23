const whatsappBot = require('../whatsappBot');
const whatsappService = require('../whatsappService');
const WhatsAppConversation = require('../../models/WhatsAppConversation');
const User = require('../../models/User');
const emailService = require('../../utils/emailService');

// Mock dependencies
jest.mock('../whatsappService');
jest.mock('../../models/WhatsAppConversation');
jest.mock('../../models/User');
jest.mock('../../utils/emailService');
jest.mock('../../utils/logger');

describe('WhatsAppBot - Admin Notifications', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('handleHumanHandoff', () => {
    it('should send admin notification when conversation is escalated', async () => {
      // Mock data
      const mockConversation = {
        conversationId: 'conv-123',
        phoneNumber: '+8801712345678',
        isBot: true,
        botStage: 'menu',
        status: 'active',
        category: 'general',
        messages: [
          { direction: 'inbound', text: 'I need to talk to someone', timestamp: new Date() }
        ],
        createdAt: new Date(),
        save: jest.fn().mockResolvedValue(true)
      };

      const mockUser = {
        _id: 'user-123',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+8801712345678',
        role: 'customer'
      };

      // Mock implementations
      whatsappService.sendMessage.mockResolvedValue({ success: true });
      User.findOne.mockResolvedValue(mockUser);
      emailService.sendWhatsAppConversationAlert.mockResolvedValue({ messageId: 'email-123' });

      // Execute
      await whatsappBot.handleHumanHandoff(mockConversation, '+8801712345678');

      // Assertions
      expect(whatsappService.sendMessage).toHaveBeenCalledWith(
        '+8801712345678',
        expect.stringContaining('Connecting to Human Agent'),
        expect.objectContaining({
          isBot: true,
          botIntent: 'human_handoff'
        })
      );

      expect(mockConversation.isBot).toBe(false);
      expect(mockConversation.botStage).toBe('human_handoff');
      expect(mockConversation.status).toBe('escalated');
      expect(mockConversation.save).toHaveBeenCalled();

      // Verify admin notification was sent
      expect(User.findOne).toHaveBeenCalled();
      expect(emailService.sendWhatsAppConversationAlert).toHaveBeenCalledWith(
        mockConversation,
        mockUser
      );
    });

    it('should handle notification failure gracefully', async () => {
      const mockConversation = {
        conversationId: 'conv-456',
        phoneNumber: '+8801712345678',
        isBot: true,
        botStage: 'menu',
        status: 'active',
        category: 'general',
        messages: [],
        createdAt: new Date(),
        save: jest.fn().mockResolvedValue(true)
      };

      whatsappService.sendMessage.mockResolvedValue({ success: true });
      User.findOne.mockResolvedValue(null);
      emailService.sendWhatsAppConversationAlert.mockRejectedValue(new Error('Email service down'));

      // Should not throw error
      await expect(
        whatsappBot.handleHumanHandoff(mockConversation, '+8801712345678')
      ).resolves.toBeDefined();

      // Conversation should still be saved
      expect(mockConversation.save).toHaveBeenCalled();
    });
  });

  describe('handleSupport', () => {
    it('should send admin notification for support requests', async () => {
      const mockConversation = {
        conversationId: 'conv-789',
        phoneNumber: '+8801712345678',
        isBot: true,
        botStage: 'menu',
        status: 'active',
        category: 'general',
        messages: [
          { direction: 'inbound', text: 'I have a problem with my order', timestamp: new Date() }
        ],
        createdAt: new Date(),
        save: jest.fn().mockResolvedValue(true)
      };

      const mockUser = {
        _id: 'user-456',
        name: 'Jane Smith',
        email: 'jane@example.com',
        phone: '+8801712345678',
        role: 'b2b'
      };

      whatsappService.sendMessage.mockResolvedValue({ success: true });
      User.findOne.mockResolvedValue(mockUser);
      emailService.sendWhatsAppConversationAlert.mockResolvedValue({ messageId: 'email-456' });

      await whatsappBot.handleSupport(mockConversation, '+8801712345678', 'I need help');

      expect(whatsappService.sendMessage).toHaveBeenCalledWith(
        '+8801712345678',
        expect.stringContaining('Customer Support'),
        expect.objectContaining({
          isBot: true,
          botIntent: 'support_request'
        })
      );

      expect(mockConversation.category).toBe('support');
      expect(mockConversation.status).toBe('pending');
      expect(mockConversation.save).toHaveBeenCalled();

      // Verify admin notification was sent
      expect(emailService.sendWhatsAppConversationAlert).toHaveBeenCalledWith(
        mockConversation,
        mockUser
      );
    });

    it('should work even when user is not found', async () => {
      const mockConversation = {
        conversationId: 'conv-999',
        phoneNumber: '+8801799999999',
        isBot: true,
        botStage: 'menu',
        status: 'active',
        category: 'general',
        messages: [],
        createdAt: new Date(),
        save: jest.fn().mockResolvedValue(true)
      };

      whatsappService.sendMessage.mockResolvedValue({ success: true });
      User.findOne.mockResolvedValue(null); // User not found
      emailService.sendWhatsAppConversationAlert.mockResolvedValue({ messageId: 'email-789' });

      await whatsappBot.handleSupport(mockConversation, '+8801799999999', 'help');

      // Should still send notification with null user
      expect(emailService.sendWhatsAppConversationAlert).toHaveBeenCalledWith(
        mockConversation,
        null
      );
    });
  });

  describe('Intent Detection', () => {
    it('should detect human handoff intent', () => {
      expect(whatsappBot.detectIntent('I want to talk to a human')).toBe('human');
      expect(whatsappBot.detectIntent('Connect me to an agent')).toBe('human');
      expect(whatsappBot.detectIntent('I need a person')).toBe('human');
    });

    it('should detect support intent', () => {
      expect(whatsappBot.detectIntent('I need help')).toBe('support');
      expect(whatsappBot.detectIntent('I have a problem')).toBe('support');
      expect(whatsappBot.detectIntent('Support please')).toBe('support');
    });
  });
});
