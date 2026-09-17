/**
 * Conversation model validation tests.
 * Regression: customer.email used to be required, which made the public
 * guest-widget room creation fail schema validation (guests have no email).
 */
const Conversation = require('../Conversation');

describe('Conversation schema validation', () => {
  it('accepts a guest conversation without an email', () => {
    const doc = new Conversation({
      conversationId: 'conv-test-guest',
      customer: { name: 'Guest', userId: null, email: null },
    });
    expect(doc.validateSync()).toBeUndefined();
  });

  it('still requires customer.name', () => {
    const doc = new Conversation({
      conversationId: 'conv-test-noname',
      customer: { email: 'x@example.com' },
    });
    const err = doc.validateSync();
    expect(err).toBeDefined();
    expect(err.errors['customer.name']).toBeDefined();
  });

  it('accepts an authenticated customer with email and userId', () => {
    const doc = new Conversation({
      conversationId: 'conv-test-authed',
      customer: { name: 'Rafiq', email: 'rafiq@example.com', userId: '507f1f77bcf86cd799439011', isAuthenticated: true },
    });
    expect(doc.validateSync()).toBeUndefined();
  });
});
