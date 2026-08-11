/**
 * Tests for centralized error handler middleware.
 * Requirements: 11.1, 11.2, 11.3, 11.9, 11.10
 */

// Mock logger before requiring errorHandler
jest.mock('../../utils/logger', () => ({
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
}));

// Mock Sentry before requiring errorHandler
jest.mock('../../config/sentry', () => ({
  Sentry: {
    captureException: jest.fn(),
  },
}));

const errorHandler = require('../errorHandler');
const logger = require('../../utils/logger');
const { Sentry } = require('../../config/sentry');

/**
 * Helper to build a minimal mock req/res/next for Express error handler tests.
 */
function buildMocks(overrides = {}) {
  const req = {
    id: 'test-request-id-123',
    method: 'GET',
    path: '/api/test',
    ...overrides.req,
  };

  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    ...overrides.res,
  };

  const next = jest.fn();

  return { req, res, next };
}

describe('errorHandler middleware', () => {
  const originalEnv = process.env.NODE_ENV;
  const originalSentryDsn = process.env.SENTRY_DSN;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NODE_ENV = 'production'; // default to production for clean tests
    delete process.env.SENTRY_DSN;
  });

  afterAll(() => {
    process.env.NODE_ENV = originalEnv;
    if (originalSentryDsn) {
process.env.SENTRY_DSN = originalSentryDsn;
}
  });

  // ── Requirement 11.1: Return user-friendly JSON response ──────────────────

  describe('Req 11.1 — user-friendly JSON response', () => {
    it('returns success:false in the response body', () => {
      const { req, res, next } = buildMocks();
      const err = new Error('Something went wrong');
      err.status = 400;

      errorHandler(err, req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false })
      );
    });

    it('includes requestId in the response body', () => {
      const { req, res, next } = buildMocks();
      const err = new Error('Bad request');
      err.status = 400;

      errorHandler(err, req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ requestId: 'test-request-id-123' })
      );
    });

    it('returns "Internal server error" message for 5xx errors (never leaks internals)', () => {
      const { req, res, next } = buildMocks();
      const err = new Error('DB connection pool exhausted — internal detail');
      err.status = 500;

      errorHandler(err, req, res, next);

      const response = res.json.mock.calls[0][0];
      expect(response.message).toBe('Internal server error');
      expect(response.message).not.toContain('DB connection pool');
    });

    it('returns the actual error message for 4xx errors', () => {
      const { req, res, next } = buildMocks();
      const err = new Error('Email is required');
      err.status = 400;

      errorHandler(err, req, res, next);

      const response = res.json.mock.calls[0][0];
      expect(response.message).toBe('Email is required');
    });
  });

  // ── Requirement 11.2 / 11.3: Winston structured logging ──────────────────

  describe('Req 11.2/11.3 — structured Winston logging', () => {
    it('logs every error with logger.error', () => {
      const { req, res, next } = buildMocks();
      const err = new Error('Test error');
      err.status = 400;

      errorHandler(err, req, res, next);

      expect(logger.error).toHaveBeenCalledTimes(1);
    });

    it('includes requestId in the log payload', () => {
      const { req, res, next } = buildMocks();
      const err = new Error('Test error');
      err.status = 400;

      errorHandler(err, req, res, next);

      const logPayload = logger.error.mock.calls[0][1];
      expect(logPayload).toMatchObject({ requestId: 'test-request-id-123' });
    });

    it('includes error message in the log payload', () => {
      const { req, res, next } = buildMocks();
      const err = new Error('Specific error message');
      err.status = 400;

      errorHandler(err, req, res, next);

      const logPayload = logger.error.mock.calls[0][1];
      expect(logPayload).toMatchObject({ error: 'Specific error message' });
    });

    it('includes stack trace in the log payload', () => {
      const { req, res, next } = buildMocks();
      const err = new Error('Error with stack');
      err.status = 400;

      errorHandler(err, req, res, next);

      const logPayload = logger.error.mock.calls[0][1];
      expect(logPayload).toHaveProperty('stack');
      expect(typeof logPayload.stack).toBe('string');
    });

    it('includes HTTP method in the log payload', () => {
      const { req, res, next } = buildMocks({ req: { method: 'POST', path: '/api/auth/login', id: 'req-id' } });
      const err = new Error('Unauthorized');
      err.status = 401;

      errorHandler(err, req, res, next);

      const logPayload = logger.error.mock.calls[0][1];
      expect(logPayload).toMatchObject({ method: 'POST' });
    });

    it('includes request path in the log payload', () => {
      const { req, res, next } = buildMocks({ req: { method: 'GET', path: '/api/products', id: 'req-id' } });
      const err = new Error('Not found');
      err.status = 404;

      errorHandler(err, req, res, next);

      const logPayload = logger.error.mock.calls[0][1];
      expect(logPayload).toMatchObject({ path: '/api/products' });
    });
  });

  // ── Requirement 11.9: Forward 5xx to Sentry ───────────────────────────────

  describe('Req 11.9 — Sentry capture for 5xx errors', () => {
    beforeEach(() => {
      process.env.SENTRY_DSN = 'https://fake@sentry.io/123';
    });

    it('calls Sentry.captureException for 500 errors when SENTRY_DSN is set', () => {
      const { req, res, next } = buildMocks();
      const err = new Error('Internal error');
      err.status = 500;

      errorHandler(err, req, res, next);

      expect(Sentry.captureException).toHaveBeenCalledWith(err);
    });

    it('calls Sentry.captureException for 503 errors', () => {
      const { req, res, next } = buildMocks();
      const err = new Error('Service unavailable');
      err.status = 503;

      errorHandler(err, req, res, next);

      expect(Sentry.captureException).toHaveBeenCalledWith(err);
    });

    it('does NOT call Sentry.captureException for 4xx errors', () => {
      const { req, res, next } = buildMocks();
      const err = new Error('Bad request');
      err.status = 400;

      errorHandler(err, req, res, next);

      expect(Sentry.captureException).not.toHaveBeenCalled();
    });

    it('does NOT call Sentry.captureException when SENTRY_DSN is not set', () => {
      delete process.env.SENTRY_DSN;
      const { req, res, next } = buildMocks();
      const err = new Error('Internal error');
      err.status = 500;

      errorHandler(err, req, res, next);

      expect(Sentry.captureException).not.toHaveBeenCalled();
    });
  });

  // ── Requirement 11.10: Appropriate HTTP status codes ─────────────────────

  describe('Req 11.10 — appropriate HTTP status codes', () => {
    it('returns 400 for validation errors (err.status = 400)', () => {
      const { req, res, next } = buildMocks();
      const err = new Error('Validation failed');
      err.status = 400;

      errorHandler(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns 401 for authentication errors (err.status = 401)', () => {
      const { req, res, next } = buildMocks();
      const err = new Error('Unauthorized');
      err.status = 401;

      errorHandler(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('returns 404 for not-found errors (err.status = 404)', () => {
      const { req, res, next } = buildMocks();
      const err = new Error('Resource not found');
      err.status = 404;

      errorHandler(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('returns 500 when no status is set on the error', () => {
      const { req, res, next } = buildMocks();
      const err = new Error('Unexpected failure');

      errorHandler(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
    });

    it('accepts err.statusCode as an alternative to err.status', () => {
      const { req, res, next } = buildMocks();
      const err = new Error('Forbidden');
      err.statusCode = 403;

      errorHandler(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  // ── Error type normalisation ──────────────────────────────────────────────

  describe('error type normalisation', () => {
    it('maps Mongoose CastError to 400', () => {
      const { req, res, next } = buildMocks();
      const err = new Error('Cast to ObjectId failed');
      err.name = 'CastError';
      err.path = '_id';
      err.value = 'invalid-id';

      errorHandler(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('maps Mongoose duplicate key error (code 11000) to 400', () => {
      const { req, res, next } = buildMocks();
      const err = new Error('Duplicate key');
      err.code = 11000;
      err.keyValue = { email: 'test@example.com' };

      errorHandler(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('maps Mongoose ValidationError to 400', () => {
      const { req, res, next } = buildMocks();
      const err = new Error('Validation failed');
      err.name = 'ValidationError';
      err.errors = {
        email: { message: 'Email is required' },
        name: { message: 'Name is required' },
      };

      errorHandler(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      const response = res.json.mock.calls[0][0];
      expect(response.message).toContain('Email is required');
    });

    it('maps JsonWebTokenError to 401', () => {
      const { req, res, next } = buildMocks();
      const err = new Error('invalid signature');
      err.name = 'JsonWebTokenError';

      errorHandler(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      const response = res.json.mock.calls[0][0];
      expect(response.message).toBe('Invalid token');
    });

    it('maps TokenExpiredError to 401', () => {
      const { req, res, next } = buildMocks();
      const err = new Error('jwt expired');
      err.name = 'TokenExpiredError';

      errorHandler(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      const response = res.json.mock.calls[0][0];
      expect(response.message).toBe('Token expired');
    });

    it('maps MulterError LIMIT_FILE_SIZE to 400 with friendly message', () => {
      const { req, res, next } = buildMocks();
      const err = new Error('File too large');
      err.name = 'MulterError';
      err.code = 'LIMIT_FILE_SIZE';

      errorHandler(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      const response = res.json.mock.calls[0][0];
      expect(response.message).toContain('5MB');
    });
  });

  // ── Development mode stack trace ──────────────────────────────────────────

  describe('development mode behaviour', () => {
    it('includes stack trace in response body for 5xx in development', () => {
      process.env.NODE_ENV = 'development';
      process.env.ERROR_DETAIL_ENABLED = 'true';
      const { req, res, next } = buildMocks();
      const err = new Error('Dev error');
      err.status = 500;

      errorHandler(err, req, res, next);

      const response = res.json.mock.calls[0][0];
      expect(response).toHaveProperty('stack');
    });

    it('does NOT include stack trace in response body for 5xx in production', () => {
      process.env.NODE_ENV = 'production';
      const { req, res, next } = buildMocks();
      const err = new Error('Prod error');
      err.status = 500;

      errorHandler(err, req, res, next);

      const response = res.json.mock.calls[0][0];
      expect(response).not.toHaveProperty('stack');
    });
  });
});
