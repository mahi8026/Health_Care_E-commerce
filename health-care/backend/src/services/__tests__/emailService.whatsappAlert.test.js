'use strict';

/**
 * Unit tests for the restored WhatsApp admin escalation alert.
 *
 * Regression guard: the Brevo migration dropped
 * sendWhatsAppConversationAlert from services/emailService.js while
 * whatsappBot.js kept calling it through the utils/emailService shim, so the
 * call threw a TypeError that was swallowed by the caller's try/catch and
 * admins were never notified.
 */

jest.mock('axios');

// Re-assigned inside beforeEach after jest.resetModules() so that the axios
// instance asserted here is the same one the freshly-required emailService uses.
let axios;

const BREVO_URL = 'https://api.brevo.com/v3/smtp/email';

const conversation = (over = {}) => ({
  conversationId: 'conv-1',
  phoneNumber: '+8801700000000',
  category: 'support',
  status: 'escalated',
  createdAt: new Date('2026-10-12T00:00:00Z'),
  messages: [
    { direction: 'inbound', text: 'I need help with my order', timestamp: new Date('2026-10-12T00:01:00Z') },
    { direction: 'outbound', text: 'Connecting you to an agent', timestamp: new Date('2026-10-12T00:02:00Z') },
  ],
  ...over,
});

describe('emailService.sendWhatsAppConversationAlert', () => {
  let emailService;

  beforeEach(() => {
    jest.resetModules();
    process.env.BREVO_API_KEY = 'test-brevo-key';
    process.env.BREVO_FROM_EMAIL = 'noreply@mediportbd.com';
    process.env.ADMIN_EMAIL = 'admin@mediportbd.com';
    process.env.FRONTEND_URL = 'https://www.mediportbd.com';
    axios = require('axios');
    axios.post = jest.fn().mockResolvedValue({ data: { messageId: 'brevo-123' } });
    emailService = require('../emailService');
  });

  afterEach(() => {
    delete process.env.BREVO_API_KEY;
    delete process.env.ADMIN_EMAIL;
    delete process.env.FRONTEND_URL;
  });

  it('sends the escalation email to the admin address through the Brevo API', async () => {
    const result = await emailService.sendWhatsAppConversationAlert(
      conversation(),
      { name: 'Rahim Uddin', email: 'rahim@example.com', phone: '+8801700000000' }
    );

    expect(axios.post).toHaveBeenCalledTimes(1);
    const [url, payload] = axios.post.mock.calls[0];

    expect(url).toBe(BREVO_URL);
    expect(payload.to[0].email).toBe('admin@mediportbd.com');
    expect(payload.subject).toContain('Rahim Uddin');
    expect(payload.htmlContent).toContain('conv-1');
    expect(payload.htmlContent).toContain('+8801700000000');
    expect(payload.htmlContent).toContain('I need help with my order');
    expect(payload.htmlContent).toContain('https://www.mediportbd.com/admin?tab=whatsapp&conversation=conv-1');
    expect(result).toMatchObject({ success: true, messageId: 'brevo-123' });
  });

  it('still builds a valid alert when messages and user are missing', async () => {
    await emailService.sendWhatsAppConversationAlert(
      conversation({ messages: undefined, phoneNumber: '+8801999999999' }),
      null
    );

    expect(axios.post).toHaveBeenCalledTimes(1);
    const [, payload] = axios.post.mock.calls[0];
    expect(payload.subject).toContain('+8801999999999');
    expect(payload.htmlContent).toContain('No messages yet');
  });

  it('does not throw when the email transport is not configured (skips)', async () => {
    delete process.env.BREVO_API_KEY;
    axios.post.mockClear();

    const result = await emailService.sendWhatsAppConversationAlert(conversation(), null);

    expect(result).toMatchObject({ skipped: true });
    expect(axios.post).not.toHaveBeenCalled();
  });

  it('is reachable through the utils/emailService shim that whatsappBot requires', () => {
    const shim = require('../../utils/emailService');
    expect(typeof shim.sendWhatsAppConversationAlert).toBe('function');
    expect(shim.sendWhatsAppConversationAlert).toBe(emailService.sendWhatsAppConversationAlert);
  });
});
