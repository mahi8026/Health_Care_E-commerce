/**
 * Auth Controller Tests
 * Covers: register, login, refreshToken, getMe, updateProfile,
 *         logout, forgotPassword, resetPassword, updateNotificationPreferences
 */

jest.mock('mongoose', () => {
  const actual = jest.requireActual('mongoose');
  return {
    ...actual,
    startSession: jest.fn(),
  };
});

jest.mock('../../models/User');
jest.mock('../../utils/logger', () => ({ error: jest.fn(), info: jest.fn(), warn: jest.fn() }));
jest.mock('../../utils/activityLogger', () => ({
  logActivityAsync: jest.fn(),
  ACTIONS: {
    AUTH: { REGISTER: 'auth.register', LOGIN: 'auth.login', LOGOUT: 'auth.logout', PASSWORD_RESET: 'auth.password_reset' },
    USER: { UPDATED: 'user.updated' },
  },
}));
jest.mock('../../utils/emailService', () => ({ sendPasswordResetEmail: jest.fn().mockResolvedValue(true) }));
jest.mock('../../services/twoFactorService', () => ({ isTwoFactorEnabled: jest.fn().mockResolvedValue(false) }));

const {
  register,
  login,
  refreshToken,
  getMe,
  updateProfile,
  logout,
  forgotPassword,
  resetPassword,
  updateNotificationPreferences,
} = require('../authController');
const User = require('../../models/User');
const jwt = require('jsonwebtoken');

// ── Helpers ──────────────────────────────────────────────────────────────────
const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.redirect = jest.fn().mockReturnValue(res);
  return res;
};

const mockReq = (overrides = {}) => ({
  body: {},
  params: {},
  query: {},
  user: { id: 'user123', email: 'test@example.com', role: 'customer' },
  ip: '127.0.0.1',
  headers: {},
  ...overrides,
});

// ── register ─────────────────────────────────────────────────────────────────
describe('register', () => {
  const validBody = {
    name: 'Test User',
    email: 'test@example.com',
    password: 'Password1!',
    phone: '01712345678',
    accountType: 'Retail',
  };

  beforeEach(() => jest.clearAllMocks());

  it('returns 400 when email already exists', async () => {
    User.findOne.mockReturnValue({ collation: jest.fn().mockResolvedValue({ _id: 'existing' }) });
    const req = mockReq({ body: validBody });
    const res = mockRes();
    await register(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
  });

  it('creates retail user and returns 201 with token', async () => {
    User.findOne.mockReturnValue({ collation: jest.fn().mockResolvedValue(null) });
    const fakeUser = {
      _id: 'newuser123',
      name: 'Test User',
      email: 'test@example.com',
      role: 'customer',
      accountType: 'Retail',
      companyName: undefined,
      company: undefined,
      b2bTier: undefined,
      b2bId: undefined,
      refreshToken: null,
      save: jest.fn().mockResolvedValue(true),
    };
    User.create.mockResolvedValue(fakeUser);
    const req = mockReq({ body: validBody });
    const res = mockRes();
    await register(req, res);
    expect(res.status).toHaveBeenCalledWith(201);
    const body = res.json.mock.calls[0][0];
    expect(body.success).toBe(true);
    expect(body.token).toBeDefined();
    expect(body.user.role).toBe('customer');
  });

  it('creates B2B user with b2b_customer role', async () => {
    User.findOne.mockReturnValue({ collation: jest.fn().mockResolvedValue(null) });
    const fakeUser = {
      _id: 'b2buser123',
      name: 'B2B Corp',
      email: 'b2b@corp.com',
      role: 'b2b_customer',
      accountType: 'B2B',
      companyName: 'Corp Ltd',
      company: 'Corp Ltd',
      b2bTier: 'Silver',
      b2bId: 'B2B-12345',
      refreshToken: null,
      save: jest.fn().mockResolvedValue(true),
    };
    User.create.mockResolvedValue(fakeUser);
    const req = mockReq({ body: { ...validBody, accountType: 'B2B', companyName: 'Corp Ltd' } });
    const res = mockRes();
    await register(req, res);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json.mock.calls[0][0].user.role).toBe('b2b_customer');
  });

  it('returns 500 on database error', async () => {
    User.findOne.mockReturnValue({ collation: jest.fn().mockRejectedValue(new Error('DB error')) });
    const req = mockReq({ body: validBody });
    const res = mockRes();
    await register(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ── login ─────────────────────────────────────────────────────────────────────
describe('login', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 400 when email or password missing', async () => {
    const req = mockReq({ body: { email: 'test@example.com' } });
    const res = mockRes();
    await login(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 401 when user not found', async () => {
    User.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(null) });
    const req = mockReq({ body: { email: 'no@one.com', password: 'pass' } });
    const res = mockRes();
    await login(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('returns 401 when account is deactivated', async () => {
    const fakeUser = { isActive: false, comparePassword: jest.fn() };
    User.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(fakeUser) });
    const req = mockReq({ body: { email: 'test@example.com', password: 'pass' } });
    const res = mockRes();
    await login(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json.mock.calls[0][0].message).toMatch(/deactivated/i);
  });

  it('returns 401 when password does not match', async () => {
    const fakeUser = { isActive: true, comparePassword: jest.fn().mockResolvedValue(false) };
    User.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(fakeUser) });
    const req = mockReq({ body: { email: 'test@example.com', password: 'wrong' } });
    const res = mockRes();
    await login(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('returns 200 with requires2FA when 2FA is enabled', async () => {
    const fakeUser = {
      _id: 'user123',
      isActive: true,
      comparePassword: jest.fn().mockResolvedValue(true),
    };
    User.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(fakeUser) });
    const { isTwoFactorEnabled } = require('../../services/twoFactorService');
    isTwoFactorEnabled.mockResolvedValue(true);
    const req = mockReq({ body: { email: 'test@example.com', password: 'Password1!' } });
    const res = mockRes();
    await login(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json.mock.calls[0][0].requires2FA).toBe(true);
    isTwoFactorEnabled.mockResolvedValue(false); // reset
  });

  it('returns 200 with token on successful login', async () => {
    const fakeUser = {
      _id: 'user123',
      name: 'Test',
      email: 'test@example.com',
      role: 'customer',
      accountType: 'Retail',
      isActive: true,
      comparePassword: jest.fn().mockResolvedValue(true),
      save: jest.fn().mockResolvedValue(true),
    };
    User.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(fakeUser) });
    const req = mockReq({ body: { email: 'test@example.com', password: 'Password1!' } });
    const res = mockRes();
    await login(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    const body = res.json.mock.calls[0][0];
    expect(body.success).toBe(true);
    expect(body.token).toBeDefined();
  });
});

// ── refreshToken ──────────────────────────────────────────────────────────────
describe('refreshToken', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 401 when no refresh token provided', async () => {
    const req = mockReq({ body: {} });
    const res = mockRes();
    await refreshToken(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('returns 401 when refresh token is invalid', async () => {
    const req = mockReq({ body: { refreshToken: 'invalid.token.here' } });
    const res = mockRes();
    await refreshToken(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('returns 401 when token does not match stored token', async () => {
    const token = jwt.sign({ id: 'user123' }, process.env.JWT_REFRESH_SECRET || 'test-jwt-refresh-secret', { expiresIn: '30d' });
    User.findById.mockReturnValue({ select: jest.fn().mockResolvedValue({ refreshToken: 'different-token', save: jest.fn() }) });
    const req = mockReq({ body: { refreshToken: token } });
    const res = mockRes();
    await refreshToken(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('returns 200 with new tokens on valid refresh', async () => {
    const token = jwt.sign({ id: 'user123' }, process.env.JWT_REFRESH_SECRET || 'test-jwt-refresh-secret', { expiresIn: '30d' });
    const fakeUser = { _id: 'user123', refreshToken: token, save: jest.fn().mockResolvedValue(true) };
    User.findById.mockReturnValue({ select: jest.fn().mockResolvedValue(fakeUser) });
    const req = mockReq({ body: { refreshToken: token } });
    const res = mockRes();
    await refreshToken(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json.mock.calls[0][0].token).toBeDefined();
  });
});

// ── getMe ─────────────────────────────────────────────────────────────────────
describe('getMe', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 404 when user not found', async () => {
    User.findById.mockResolvedValue(null);
    const req = mockReq();
    const res = mockRes();
    await getMe(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('returns 200 with user data', async () => {
    const fakeUser = {
      _id: 'user123',
      name: 'Test',
      email: 'test@example.com',
      role: 'customer',
      accountType: 'Retail',
      creditLimit: 0,
      creditUsed: 0,
      getAvailableCredit: jest.fn().mockReturnValue(0),
    };
    User.findById.mockResolvedValue(fakeUser);
    const req = mockReq();
    const res = mockRes();
    await getMe(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json.mock.calls[0][0].user.email).toBe('test@example.com');
  });
});

// ── updateProfile ─────────────────────────────────────────────────────────────
describe('updateProfile', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 404 when user not found', async () => {
    User.findByIdAndUpdate.mockResolvedValue(null);
    const req = mockReq({ body: { name: 'New Name' } });
    const res = mockRes();
    await updateProfile(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('updates name and returns 200', async () => {
    const fakeUser = { _id: 'user123', name: 'New Name' };
    User.findByIdAndUpdate.mockResolvedValue(fakeUser);
    const req = mockReq({ body: { name: 'New Name' } });
    const res = mockRes();
    await updateProfile(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json.mock.calls[0][0].success).toBe(true);
  });

  it('saves bkashPhone when provided', async () => {
    const fakeUser = { _id: 'user123', bkashPhone: '01712345678' };
    User.findByIdAndUpdate.mockResolvedValue(fakeUser);
    const req = mockReq({ body: { bkashPhone: '01712345678' } });
    const res = mockRes();
    await updateProfile(req, res);
    expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
      'user123',
      expect.objectContaining({ bkashPhone: '01712345678' }),
      expect.any(Object)
    );
  });
});

// ── logout ────────────────────────────────────────────────────────────────────
describe('logout', () => {
  beforeEach(() => jest.clearAllMocks());

  it('clears refresh token and returns 200', async () => {
    User.findByIdAndUpdate.mockResolvedValue(true);
    const req = mockReq();
    const res = mockRes();
    await logout(req, res);
    expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
      'user123',
      { refreshToken: null },
      expect.any(Object)
    );
    expect(res.status).toHaveBeenCalledWith(200);
  });
});

// ── forgotPassword ────────────────────────────────────────────────────────────
describe('forgotPassword', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 400 when email not provided', async () => {
    const req = mockReq({ body: {} });
    const res = mockRes();
    await forgotPassword(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 200 even when email does not exist (prevents enumeration)', async () => {
    User.findOne.mockResolvedValue(null);
    const req = mockReq({ body: { email: 'nobody@example.com' } });
    const res = mockRes();
    await forgotPassword(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json.mock.calls[0][0].success).toBe(true);
  });

  it('saves reset token and sends email when user exists', async () => {
    const fakeUser = {
      _id: 'user123',
      email: 'test@example.com',
      passwordResetToken: null,
      passwordResetExpires: null,
      save: jest.fn().mockResolvedValue(true),
    };
    User.findOne.mockResolvedValue(fakeUser);
    const req = mockReq({ body: { email: 'test@example.com' } });
    const res = mockRes();
    await forgotPassword(req, res);
    expect(fakeUser.save).toHaveBeenCalled();
    expect(fakeUser.passwordResetToken).toBeDefined();
    expect(res.status).toHaveBeenCalledWith(200);
  });
});

// ── resetPassword ─────────────────────────────────────────────────────────────
describe('resetPassword', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 400 when token or password missing', async () => {
    const req = mockReq({ body: { token: 'abc' } });
    const res = mockRes();
    await resetPassword(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 400 when token is invalid or expired', async () => {
    User.findOne.mockResolvedValue(null);
    const req = mockReq({ body: { token: 'badtoken', password: 'NewPass1!' } });
    const res = mockRes();
    await resetPassword(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('resets password and invalidates sessions on valid token', async () => {
    const fakeUser = {
      _id: 'user123',
      password: 'old',
      passwordResetToken: undefined,
      passwordResetExpires: undefined,
      refreshToken: 'old-refresh',
      save: jest.fn().mockResolvedValue(true),
    };
    User.findOne.mockResolvedValue(fakeUser);
    const req = mockReq({ body: { token: 'validtoken', password: 'NewPass1!' } });
    const res = mockRes();
    await resetPassword(req, res);
    expect(fakeUser.save).toHaveBeenCalled();
    expect(fakeUser.refreshToken).toBeNull();
    expect(res.status).toHaveBeenCalledWith(200);
  });
});

// ── updateNotificationPreferences ─────────────────────────────────────────────
describe('updateNotificationPreferences', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 400 when no valid preferences provided', async () => {
    const req = mockReq({ body: { invalidKey: true } });
    const res = mockRes();
    await updateNotificationPreferences(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 404 when user not found', async () => {
    User.findByIdAndUpdate.mockResolvedValue(null);
    const req = mockReq({ body: { orderUpdates: true } });
    const res = mockRes();
    await updateNotificationPreferences(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('updates preferences and returns 200', async () => {
    const fakeUser = {
      _id: 'user123',
      notificationPreferences: { orderUpdates: true, promotions: false },
    };
    User.findByIdAndUpdate.mockResolvedValue(fakeUser);
    const req = mockReq({ body: { orderUpdates: true, promotions: false } });
    const res = mockRes();
    await updateNotificationPreferences(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json.mock.calls[0][0].success).toBe(true);
  });

  it('ignores non-boolean values for preference keys', async () => {
    const fakeUser = { _id: 'user123', notificationPreferences: { orderUpdates: true } };
    User.findByIdAndUpdate.mockResolvedValue(fakeUser);
    // orderUpdates is a string, not boolean — should be ignored
    // newsletter is boolean — should be included
    const req = mockReq({ body: { orderUpdates: 'yes', newsletter: true } });
    const res = mockRes();
    await updateNotificationPreferences(req, res);
    expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
      'user123',
      { $set: { 'notificationPreferences.newsletter': true } },
      expect.any(Object)
    );
  });
});
