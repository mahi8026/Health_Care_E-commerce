/**
 * Phase 4.2 — CRM route security tests.
 *
 * Proves, through the REAL protect/authorize middleware chain (only the
 * database lookup and Redis blacklist are stubbed):
 *   8. Admin authorization required
 *   9. Public/unauthorized access blocked — no route is reachable unauthenticated
 *
 * No database is required.
 */

jest.mock('../../models/User', () => ({ findById: jest.fn() }));
jest.mock('../../services/tokenBlacklist', () => ({
  isBlacklisted: jest.fn().mockResolvedValue(false),
  isTokenFromBeforeRotation: jest.fn().mockResolvedValue(false),
  isUserTokenInvalidated: jest.fn().mockResolvedValue(false),
}));
jest.mock('../../middleware/enhancedRateLimiter', () => ({
  adminApiLimiter: (req, res, next) => next(),
}));
jest.mock('../../controllers/crmController', () => ({
  listLeads: jest.fn(),
  getLeadMetrics: jest.fn(),
  getLead: jest.fn(),
  createLead: jest.fn(),
  updateLead: jest.fn(),
  addNote: jest.fn(),
  assignLead: jest.fn(),
  linkQuote: jest.fn(),
}));

const express = require('express');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const User = require('../../models/User');
const crmController = require('../../controllers/crmController');
const crmRoutes = require('../crmRoutes');

const USER_ID = '507f1f77bcf86cd799439011';
const tokenFor = (role) => jwt.sign({ id: USER_ID, role }, process.env.JWT_SECRET, { expiresIn: '1h' });

const ok = (status) => (req, res) => res.status(status).json({ success: true, data: [] });

beforeEach(() => {
  jest.clearAllMocks();
  crmController.listLeads.mockImplementation(ok(200));
  crmController.getLeadMetrics.mockImplementation(ok(200));
  crmController.getLead.mockImplementation(ok(200));
  crmController.createLead.mockImplementation((req, res) => res.status(201).json({ success: true }));
  crmController.updateLead.mockImplementation(ok(200));
  crmController.addNote.mockImplementation(ok(201));
  crmController.assignLead.mockImplementation(ok(200));
  crmController.linkQuote.mockImplementation(ok(201));
});

const buildApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/crm', crmRoutes);
  return app;
};

describe('CRM route authorization (real protect/authorize)', () => {
  it('blocks every CRM route when no token is supplied', async () => {
    const app = buildApp();
    const cases = [
      ['get', '/api/crm'],
      ['get', '/api/crm/metrics'],
      ['post', '/api/crm'],
      ['get', '/api/crm/507f1f77bcf86cd799439011'],
      ['patch', '/api/crm/507f1f77bcf86cd799439011'],
      ['post', '/api/crm/507f1f77bcf86cd799439011/notes'],
      ['post', '/api/crm/507f1f77bcf86cd799439011/assign'],
      ['post', '/api/crm/507f1f77bcf86cd799439011/quote'],
    ];
    for (const [method, path] of cases) {
      const res = await request(app)[method](path).send({});
      expect({ path, status: res.status }).toEqual({ path, status: 401 });
    }
    // No controller was ever reached (no public write path to CRM data)
    Object.values(crmController).forEach((fn) => expect(fn).not.toHaveBeenCalled());
  });

  it('blocks an authenticated non-admin (403) and never reaches the controller', async () => {
    // O-6 harness fix: protect() chains .select('-password') onto the query,
    // so the mock must resolve through a query object, not a bare promise.
    User.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue({ _id: USER_ID, role: 'customer', isActive: true, name: 'Synthetic Customer' }),
    });
    const app = buildApp();
    const res = await request(app)
      .get('/api/crm')
      .set('Authorization', `Bearer ${tokenFor('customer')}`);
    expect(res.status).toBe(403);
    expect(crmController.listLeads).not.toHaveBeenCalled();
  });

  it('rejects an invalid token before any authorization check', async () => {
    const app = buildApp();
    const res = await request(app).get('/api/crm').set('Authorization', 'Bearer not.a.jwt');
    expect(res.status).toBe(401);
    expect(crmController.listLeads).not.toHaveBeenCalled();
  });

  it('allows an admin through to the controller', async () => {
    User.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue({ _id: USER_ID, role: 'admin', isActive: true, name: 'Synthetic Admin' }),
    });
    const app = buildApp();
    const res = await request(app)
      .get('/api/crm')
      .set('Authorization', `Bearer ${tokenFor('admin')}`);
    expect(res.status).toBe(200);
    expect(crmController.listLeads).toHaveBeenCalledTimes(1);
    expect(User.findById).toHaveBeenCalledWith(USER_ID);
  });

  it('does not expose CRM data through any public (unprotected) path', async () => {
    // With protect returning 401 for anonymous callers, a public path would
    // reach the controller instead. Assert none does.
    const app = buildApp();
    const paths = ['/api/crm', '/api/crm/metrics'];
    for (const path of paths) {
      await request(app).get(path);
      expect(crmController.listLeads).not.toHaveBeenCalled();
      expect(crmController.getLeadMetrics).not.toHaveBeenCalled();
    }
  });
});
