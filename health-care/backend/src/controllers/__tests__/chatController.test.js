/**
 * Chat Controller Tests
 * Covers: guest room creation (S5 identity derivation), message send
 * identity enforcement, membership matrix via the REAL canAccessConversation,
 * and the sanitizeForCustomer field-stripping regression (S3).
 */

jest.mock('../../models/Conversation');
jest.mock('../../models/Message');
jest.mock('../../models/ChatConfig');
jest.mock('../../services/chatRoutingService', () => ({
  assignConversation: jest.fn().mockResolvedValue(null),
}));
jest.mock('../../utils/logger', () => ({ error: jest.fn(), info: jest.fn(), warn: jest.fn(), debug: jest.fn() }));

const {
  createConversation,
  getConversation,
  getConversationMessages,
  sendPublicMessage,
} = require('../chatController');
const Conversation = require('../../models/Conversation');
const Message = require('../../models/Message');
const chatSocketService = require('../../services/chatSocketService');

// Genuine 24-hex ObjectIds so String() comparisons behave like production.
const OWNER_A = '507f1f77bcf86cd799439011';
const OWNER_B = '607f1f77bcf86cd799439022';
const AGENT_ID = '707f1f77bcf86cd799439033';

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const mockReq = (overrides = {}) => ({
  body: {},
  params: {},
  query: {},
  ip: '203.0.113.50',
  get: jest.fn().mockReturnValue('jest-agent'),
  ...overrides,
});

// Fixtures
const guestConv = () => ({
  _id: 'g1',
  conversationId: 'conv-guest-1',
  customer: { userId: null, name: 'Guest', email: null, isAuthenticated: false },
  assignedTo: null,
  messageCount: 0,
  metadata: { ipAddress: '203.0.113.9', userAgent: 'test-agent' },
  internalNotes: [],
  save: jest.fn().mockResolvedValue(true),
});

const ownedConv = (ownerId) => ({
  ...guestConv(),
  conversationId: 'conv-owned-1',
  customer: { userId: ownerId, name: 'Rafiq', email: 'rafiq@example.com', isAuthenticated: true },
});

const agentAssignedConv = (ownerId) => ({
  ...ownedConv(ownerId),
  assignedTo: { _id: AGENT_ID, name: 'Agent One' },
});

const messageChain = (msgs) => ({
  sort: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  lean: jest.fn().mockResolvedValue(msgs),
});

// -- createConversation --------------------------------------------------------
describe('createConversation (guest room creation)', () => {
  beforeEach(() => jest.clearAllMocks());

  it('creates a guest room with email omitted and no claimed identity (widget flow)', async () => {
    const created = guestConv();
    created.conversationId = 'conv-new-1';
    Conversation.create.mockResolvedValue(created);

    // Widget payload — body tries to claim a userId that must be ignored (S5).
    const req = mockReq({
      body: { customer: { name: 'Guest', userId: OWNER_B } },
    });
    const res = mockRes();
    await createConversation(req, res);

    const payload = Conversation.create.mock.calls[0][0];
    expect(payload.customer.userId).toBeNull();
    expect(payload.customer.email).toBeNull();
    expect(payload.customer.isAuthenticated).toBe(false);
    expect(payload.customer.name).toBe('Guest');
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('attaches the verified token identity for authenticated callers', async () => {
    const created = ownedConv(OWNER_A);
    Conversation.create.mockResolvedValue(created);

    const req = mockReq({
      body: { customer: { name: 'Rafiq', email: 'rafiq@example.com' } },
      user: { _id: OWNER_A, name: 'Rafiq', role: 'customer' },
    });
    const res = mockRes();
    await createConversation(req, res);

    const payload = Conversation.create.mock.calls[0][0];
    expect(payload.customer.userId).toBe(OWNER_A);
    expect(payload.customer.isAuthenticated).toBe(true);
  });

  it('rejects a conversation without a name with 400', async () => {
    const req = mockReq({ body: { customer: { email: 'x@example.com' } } });
    const res = mockRes();
    await createConversation(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(Conversation.create).not.toHaveBeenCalled();
  });
});

// -- sendPublicMessage ---------------------------------------------------------
describe('sendPublicMessage (identity + membership)', () => {
  beforeEach(() => jest.clearAllMocks());

  it('derives guest identity server-side and ignores the body sender claim (S5)', async () => {
    Conversation.findOne.mockResolvedValue(guestConv());
    Message.create.mockResolvedValue({ messageId: 'm9', toObject: () => ({ messageId: 'm9' }) });

    const req = mockReq({
      body: {
        conversationId: 'conv-guest-1',
        content: 'hello, need help with an order',
        // Spoofed claim — must be ignored completely.
        sender: { name: 'Admin', type: 'agent', userId: OWNER_B },
      },
    });
    const res = mockRes();
    await sendPublicMessage(req, res);

    const payload = Message.create.mock.calls[0][0];
    expect(payload.sender).toEqual({ userId: null, name: 'Guest', type: 'customer' });
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('blocks a guest from posting into a claimed room', async () => {
    Conversation.findOne.mockResolvedValue(ownedConv(OWNER_A));

    const req = mockReq({ body: { conversationId: 'conv-owned-1', content: 'injected' } });
    const res = mockRes();
    await sendPublicMessage(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(Message.create).not.toHaveBeenCalled();
  });

  it('stamps the authenticated owner id on their own message', async () => {
    Conversation.findOne.mockResolvedValue(ownedConv(OWNER_A));
    Message.create.mockResolvedValue({ messageId: 'm10', toObject: () => ({ messageId: 'm10' }) });

    const req = mockReq({
      body: { conversationId: 'conv-owned-1', content: 'thanks!' },
      user: { _id: OWNER_A, name: 'Rafiq', role: 'customer' },
    });
    const res = mockRes();
    await sendPublicMessage(req, res);

    const payload = Message.create.mock.calls[0][0];
    expect(payload.sender.userId).toBe(OWNER_A);
    expect(payload.sender.type).toBe('customer');
    expect(res.status).toHaveBeenCalledWith(201);
  });
});

// -- getConversation (payload sanitization) ------------------------------------
describe('getConversation (payload sanitization)', () => {
  beforeEach(() => jest.clearAllMocks());

  it('strips internal notes and IP metadata from customer payloads', async () => {
    const conv = {
      conversationId: 'conv-owned-1',
      customer: { userId: OWNER_A, name: 'Rafiq' },
      metadata: { ipAddress: '203.0.113.9', userAgent: 'test-agent' },
      internalNotes: [{ text: 'internal secret', addedBy: AGENT_ID }],
    };
    Conversation.findOne.mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue(conv),
    });

    const req = mockReq({
      params: { id: 'conv-owned-1' },
      user: { _id: OWNER_A, role: 'customer' },
    });
    const res = mockRes();
    await getConversation(req, res);

    const payload = res.json.mock.calls[0][0].data;
    expect(payload.internalNotes).toBeUndefined();
    expect(payload.metadata.ipAddress).toBeUndefined();
    expect(payload.metadata.userAgent).toBeUndefined();
  });

  it('keeps internal notes in staff payloads', async () => {
    const conv = {
      conversationId: 'conv-guest-1',
      customer: { userId: null, name: 'Guest' },
      metadata: {},
      internalNotes: [{ text: 'internal secret', addedBy: AGENT_ID }],
    };
    Conversation.findOne.mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue(conv),
    });

    const req = mockReq({
      params: { id: 'conv-guest-1' },
      user: { _id: 'admin-id', role: 'admin' },
    });
    const res = mockRes();
    await getConversation(req, res);

    const payload = res.json.mock.calls[0][0].data;
    expect(payload.internalNotes).toHaveLength(1);
  });
});

// -- sanitizeForCustomer (service regression) ----------------------------------
describe('sanitizeForCustomer (field-name regression)', () => {
  it('removes metadata.ipAddress — the actual schema field', () => {
    const sanitized = chatSocketService.sanitizeForCustomer(guestConv());
    expect(sanitized.metadata).not.toHaveProperty('ipAddress');
    expect(sanitized.metadata).not.toHaveProperty('userAgent');
    expect(sanitized.metadata).not.toHaveProperty('ip');
    expect(sanitized.customer.name).toBe('Guest');
  });
});


// -- getConversationMessages ---------------------------------------------------
describe('getConversationMessages (membership matrix)', () => {
  beforeEach(() => jest.clearAllMocks());

  it('lets a guest (no token) read their ownerless room', async () => {
    Conversation.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(guestConv()) });
    const msgs = [{ messageId: 'm1' }];
    Message.find.mockReturnValue(messageChain(msgs));

    const req = mockReq({ params: { conversationId: 'conv-guest-1' } });
    const res = mockRes();
    await getConversationMessages(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json.mock.calls[0][0].data).toEqual(msgs);
  });

  it('denies a guest access to a room owned by a registered customer', async () => {
    Conversation.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(ownedConv(OWNER_A)) });

    const req = mockReq({ params: { conversationId: 'conv-owned-1' } });
    const res = mockRes();
    await getConversationMessages(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(Message.find).not.toHaveBeenCalled();
  });

  it('denies customer A access to customer B room', async () => {
    Conversation.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(ownedConv(OWNER_B)) });

    const req = mockReq({
      params: { conversationId: 'conv-owned-1' },
      user: { _id: OWNER_A, role: 'customer' },
    });
    const res = mockRes();
    await getConversationMessages(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('allows the owner to read their own room', async () => {
    Conversation.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(ownedConv(OWNER_A)) });
    Message.find.mockReturnValue(messageChain([]));

    const req = mockReq({
      params: { conversationId: 'conv-owned-1' },
      user: { _id: OWNER_A, role: 'customer' },
    });
    const res = mockRes();
    await getConversationMessages(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('denies an unassigned agent but allows the assigned one', async () => {
    Conversation.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(ownedConv(OWNER_A)) });

    const denied = mockRes();
    await getConversationMessages(
      mockReq({ params: { conversationId: 'conv-owned-1' }, user: { _id: AGENT_ID, role: 'agent' } }),
      denied
    );
    expect(denied.status).toHaveBeenCalledWith(403);

    Conversation.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(agentAssignedConv(OWNER_A)) });
    Message.find.mockReturnValue(messageChain([]));

    const allowed = mockRes();
    await getConversationMessages(
      mockReq({ params: { conversationId: 'conv-owned-1' }, user: { _id: AGENT_ID, role: 'agent' } }),
      allowed
    );
    expect(allowed.status).toHaveBeenCalledWith(200);
  });

  it('lets an admin read any room', async () => {
    Conversation.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(ownedConv(OWNER_A)) });
    Message.find.mockReturnValue(messageChain([]));

    const req = mockReq({
      params: { conversationId: 'conv-owned-1' },
      user: { _id: 'admin-id', role: 'admin' },
    });
    const res = mockRes();
    await getConversationMessages(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
  });
});

