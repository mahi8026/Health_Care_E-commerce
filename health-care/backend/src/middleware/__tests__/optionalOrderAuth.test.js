/**
 * optionalOrderAuth Middleware Tests — WAVE-GUEST guest checkout gate.
 *
 * Covers the middleware that allows unauthenticated visitors to reach
 * POST /api/orders (guest checkout) while still enforcing the FULL token
 * verification pipeline whenever a token IS supplied. The properties asserted
 * here are the ones that keep guest checkout safe:
 *   - guests get a synthetic, non-privileged, per-request identity
 *   - guests never trigger a database lookup
 *   - a supplied token is never downgraded to a guest order
 *
 * No database or replica set is required for any test in this file.
 */

jest.mock('../../models/User', () => ({ findById: jest.fn() }));
jest.mock('../../services/tokenBlacklist', () => ({
  isBlacklisted: jest.fn().mockResolvedValue(false),
  isTokenFromBeforeRotation: jest.fn().mockResolvedValue(false),
  isUserTokenInvalidated: jest.fn().mockResolvedValue(false),
}));
jest.mock('../../utils/logger', () => ({
  error: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
}));

const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const { optionalOrderAuth } = require('../auth');
const User = require('../../models/User');
const tokenBlacklist = require('../../services/tokenBlacklist');

const USER_ID = '507f1f77bcf86cd799439011';

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.locals = {};
  return res;
}

async function invoke(req) {
  const res = mockRes();
  const next = jest.fn();
  await optionalOrderAuth(req, res, next);
  return { req, res, next };
}

const activeUser = (overrides = {}) => ({
  _id: USER_ID,
  name: 'Real User',
  email: 'real@example.com',
  phone: '01712345678',
  role: 'customer',
  isActive: true,
  ...overrides,
});

const authHeader = (id = USER_ID) =>
  `Bearer ${jwt.sign({ id }, process.env.JWT_SECRET)}`;

beforeEach(() => {
  jest.clearAllMocks();
  tokenBlacklist.isBlacklisted.mockResolvedValue(false);
  tokenBlacklist.isTokenFromBeforeRotation.mockResolvedValue(false);
  tokenBlacklist.isUserTokenInvalidated.mockResolvedValue(false);
});

describe('optionalOrderAuth — guest path (no token supplied)', () => {
  it('attaches a synthetic guest user instead of rejecting the request', async () => {
    const { req, res, next } = await invoke({ headers: {} });

    expect(next).toHaveBeenCalledTimes(1);
    expect(next.mock.calls[0]).toHaveLength(0); // next() with no error
    expect(res.status).not.toHaveBeenCalled(); // no 401
    expect(req.guestOrder).toBe(true);
    expect(req.user.isGuest).toBe(true);
    expect(req.user.isActive).toBe(true);
  });

  it('issues a valid ObjectId for both id and _id aliases', async () => {
    const { req } = await invoke({ headers: {} });

    expect(mongoose.Types.ObjectId.isValid(req.user.id)).toBe(true);
    expect(mongoose.Types.ObjectId.isValid(req.user._id)).toBe(true);
  });

  it('keeps id and _id identical so controller views cannot disagree', async () => {
    // The controller stores order.user from req.user._id but reads req.user.id
    // elsewhere (coupon guards, compensation). Two different ObjectIds would
    // make those two views of the same guest diverge.
    const { req } = await invoke({ headers: {} });

    expect(String(req.user._id)).toBe(String(req.user.id));
  });

  it('never queries the database for a guest order', async () => {
    await invoke({ headers: {} });

    // A guest has no User document; any lookup here would be wasted I/O and
    // would wrongly imply a real account exists.
    expect(User.findById).not.toHaveBeenCalled();
  });

  it('grants no privileged role and no loyalty balance to guests', async () => {
    const { req } = await invoke({ headers: {} });

    expect(req.user.role).toBe('customer'); // never admin/agent
    expect(req.user.loyaltyPoints).toBe(0); // loyalty redemption stays disabled
    expect(req.user.email).toBeNull();
    expect(req.user.phone).toBeNull();
  });

  it('does not leak guest state onto the request as a real session', async () => {
    const { req } = await invoke({ headers: {} });

    expect(req.token).toBeUndefined();
  });

  it('gives every guest request a distinct id for idempotency dedupe', async () => {
    const first = await invoke({ headers: {} });
    const second = await invoke({ headers: {} });

    // Guest order dedupe keys on the idempotency key alone (never on user), so
    // shared ids would let one guest collide with another's order.
    expect(String(first.req.user._id)).not.toBe(String(second.req.user._id));
  });

  it('treats a malformed Authorization header as an anonymous guest', async () => {
    const { req } = await invoke({ headers: { authorization: 'Token abc' } });

    expect(req.user.isGuest).toBe(true);
    expect(req.guestOrder).toBe(true);
    expect(User.findById).not.toHaveBeenCalled();
  });
});
describe('optionalOrderAuth — signed-in path (token supplied)', () => {
  it('delegates to protect() and attaches the real user', async () => {
    const doc = activeUser();
    User.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue(doc),
    });

    const { req, next } = await invoke({
      headers: { authorization: authHeader() },
    });

    expect(next).toHaveBeenCalledTimes(1);
    expect(next.mock.calls[0]).toHaveLength(0);
    expect(req.user).toBe(doc);
    expect(req.user.isGuest).toBeUndefined(); // NOT a guest
    expect(req.guestOrder).toBeUndefined(); // never flagged as guest
    expect(req.token).toBeDefined(); // real session token retained
  });

  it('rejects an invalid token with 401 and never falls back to guest', async () => {
    const { req, res, next } = await invoke({
      headers: { authorization: 'Bearer not-a-real-token' },
    });

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
    // The critical property: a bad token must not silently become a guest
    // order, or an expired session would place unauthenticated orders.
    expect(req.guestOrder).toBeUndefined();
    expect(req.user).toBeUndefined();
  });

  it('rejects a revoked (blacklisted) token with 401', async () => {
    tokenBlacklist.isBlacklisted.mockResolvedValue(true);
    User.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue(activeUser()),
    });

    const { res, next } = await invoke({
      headers: { authorization: authHeader() },
    });

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects a token issued before a secret rotation with 401', async () => {
    tokenBlacklist.isTokenFromBeforeRotation.mockResolvedValue(true);
    User.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue(activeUser()),
    });

    const { res, next } = await invoke({
      headers: { authorization: authHeader() },
    });

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects a deactivated account with 401', async () => {
    User.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue(activeUser({ isActive: false })),
    });

    const { res, next } = await invoke({
      headers: { authorization: authHeader() },
    });

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });
});