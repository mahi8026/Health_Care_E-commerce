'use strict';

/**
 * Unit tests for database health check middleware
 * Requirements: 2.3, 3.1
 */

const mongoose = require('mongoose');
const { dbHealthCheck } = require('../dbHealthCheck');

// Helper to create mock Express req/res/next objects
function createMocks() {
  const req = { headers: {} };
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    setHeader: jest.fn(),
  };
  const next = jest.fn();
  return { req, res, next };
}

describe('dbHealthCheck middleware', () => {
  describe('when MongoDB is connected (Requirement 3.1)', () => {
    beforeEach(() => {
      // Mock readyState as connected (1)
      Object.defineProperty(mongoose.connection, 'readyState', {
        value: 1,
        writable: true,
        configurable: true,
      });
    });

    it('calls next() when database is connected', () => {
      const { req, res, next } = createMocks();

      dbHealthCheck(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe('when MongoDB is disconnected (Requirement 2.3)', () => {
    beforeEach(() => {
      // Mock readyState as disconnected (0)
      Object.defineProperty(mongoose.connection, 'readyState', {
        value: 0,
        writable: true,
        configurable: true,
      });
    });

    it('returns 503 status when database is disconnected', () => {
      const { req, res, next } = createMocks();

      dbHealthCheck(req, res, next);

      expect(res.status).toHaveBeenCalledWith(503);
      expect(next).not.toHaveBeenCalled();
    });

    it('returns proper error response with all required fields', () => {
      const { req, res, next } = createMocks();

      dbHealthCheck(req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Database temporarily unavailable. Please try again shortly.',
        code: 'DB_UNAVAILABLE',
        retryAfter: 5,
      });
    });

    it('includes success: false in response', () => {
      const { req, res, next } = createMocks();

      dbHealthCheck(req, res, next);

      const response = res.json.mock.calls[0][0];
      expect(response.success).toBe(false);
    });

    it('includes user-friendly error message', () => {
      const { req, res, next } = createMocks();

      dbHealthCheck(req, res, next);

      const response = res.json.mock.calls[0][0];
      expect(response.error).toBe(
        'Database temporarily unavailable. Please try again shortly.'
      );
    });

    it('includes DB_UNAVAILABLE error code', () => {
      const { req, res, next } = createMocks();

      dbHealthCheck(req, res, next);

      const response = res.json.mock.calls[0][0];
      expect(response.code).toBe('DB_UNAVAILABLE');
    });

    it('includes retryAfter value of 5 seconds', () => {
      const { req, res, next } = createMocks();

      dbHealthCheck(req, res, next);

      const response = res.json.mock.calls[0][0];
      expect(response.retryAfter).toBe(5);
    });
  });

  describe('when MongoDB is connecting (state 2)', () => {
    beforeEach(() => {
      // Mock readyState as connecting (2)
      Object.defineProperty(mongoose.connection, 'readyState', {
        value: 2,
        writable: true,
        configurable: true,
      });
    });

    it('returns 503 when database is in connecting state', () => {
      const { req, res, next } = createMocks();

      dbHealthCheck(req, res, next);

      expect(res.status).toHaveBeenCalledWith(503);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('when MongoDB is disconnecting (state 3)', () => {
    beforeEach(() => {
      // Mock readyState as disconnecting (3)
      Object.defineProperty(mongoose.connection, 'readyState', {
        value: 3,
        writable: true,
        configurable: true,
      });
    });

    it('returns 503 when database is in disconnecting state', () => {
      const { req, res, next } = createMocks();

      dbHealthCheck(req, res, next);

      expect(res.status).toHaveBeenCalledWith(503);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('response format validation', () => {
    beforeEach(() => {
      // Mock readyState as disconnected (0)
      Object.defineProperty(mongoose.connection, 'readyState', {
        value: 0,
        writable: true,
        configurable: true,
      });
    });

    it('matches API standards with success field', () => {
      const { req, res, next } = createMocks();

      dbHealthCheck(req, res, next);

      const response = res.json.mock.calls[0][0];
      expect(response).toHaveProperty('success');
      expect(typeof response.success).toBe('boolean');
    });

    it('includes all required fields in error response', () => {
      const { req, res, next } = createMocks();

      dbHealthCheck(req, res, next);

      const response = res.json.mock.calls[0][0];
      expect(response).toHaveProperty('success');
      expect(response).toHaveProperty('error');
      expect(response).toHaveProperty('code');
      expect(response).toHaveProperty('retryAfter');
    });
  });
});
