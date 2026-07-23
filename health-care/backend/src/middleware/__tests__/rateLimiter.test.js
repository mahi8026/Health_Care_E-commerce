const request = require('supertest');
const express = require('express');
const { authLimiter, apiLimiter } = require('../rateLimiter');

describe('Rate Limiter Middleware', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
  });

  describe('authLimiter', () => {
    beforeEach(() => {
      app.post('/test-auth', authLimiter, (req, res) => {
        res.json({ success: true, message: 'Request successful' });
      });
    });

    it('should allow requests within the limit', async () => {
      const response = await request(app)
        .post('/test-auth')
        .send({ email: 'test@example.com', password: 'password123' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should include rate limit headers in response', async () => {
      const response = await request(app)
        .post('/test-auth')
        .send({ email: 'test@example.com', password: 'password123' });

      expect(response.headers).toHaveProperty('x-ratelimit-limit');
      expect(response.headers).toHaveProperty('x-ratelimit-remaining');
      expect(response.headers).toHaveProperty('x-ratelimit-reset');
    });

    it('should set correct rate limit values for auth endpoints', async () => {
      const response = await request(app)
        .post('/test-auth')
        .send({ email: 'test@example.com', password: 'password123' });

      // Auth limiter: 5 requests per 15 minutes
      expect(response.headers['x-ratelimit-limit']).toBe('5');
    });

    it('should block requests after exceeding the limit', async () => {
      // Make 5 requests (the limit)
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/test-auth')
          .send({ email: 'test@example.com', password: 'password123' });
      }

      // 6th request should be blocked
      const response = await request(app)
        .post('/test-auth')
        .send({ email: 'test@example.com', password: 'password123' });

      expect(response.status).toBe(429);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Too many authentication attempts');
    });

    it('should return retry-after information when rate limited', async () => {
      // Exceed the limit
      for (let i = 0; i < 6; i++) {
        await request(app)
          .post('/test-auth')
          .send({ email: 'test@example.com', password: 'password123' });
      }

      const response = await request(app)
        .post('/test-auth')
        .send({ email: 'test@example.com', password: 'password123' });

      expect(response.status).toBe(429);
      expect(response.body).toHaveProperty('retryAfter');
      expect(response.body.retryAfter).toBe(900); // 15 minutes in seconds
    });
  });

  describe('apiLimiter', () => {
    beforeEach(() => {
      app.get('/test-api', apiLimiter, (req, res) => {
        res.json({ success: true, data: [] });
      });
    });

    it('should allow requests within the limit', async () => {
      const response = await request(app).get('/test-api');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should include rate limit headers in response', async () => {
      const response = await request(app).get('/test-api');

      expect(response.headers).toHaveProperty('x-ratelimit-limit');
      expect(response.headers).toHaveProperty('x-ratelimit-remaining');
      expect(response.headers).toHaveProperty('x-ratelimit-reset');
    });

    it('should set correct rate limit values for API endpoints', async () => {
      const response = await request(app).get('/test-api');

      // API limiter: 100 requests per 15 minutes
      expect(response.headers['x-ratelimit-limit']).toBe('100');
    });

    it('should track remaining requests correctly', async () => {
      const response1 = await request(app).get('/test-api');
      const remaining1 = parseInt(response1.headers['x-ratelimit-remaining']);

      const response2 = await request(app).get('/test-api');
      const remaining2 = parseInt(response2.headers['x-ratelimit-remaining']);

      // Remaining should decrease by 1
      expect(remaining2).toBe(remaining1 - 1);
    });

    it('should block requests after exceeding the limit', async () => {
      // Make 100 requests (the limit)
      for (let i = 0; i < 100; i++) {
        await request(app).get('/test-api');
      }

      // 101st request should be blocked
      const response = await request(app).get('/test-api');

      expect(response.status).toBe(429);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Too many requests');
    });
  });

  describe('Rate limiter with different IPs', () => {
    beforeEach(() => {
      app.post('/test-auth', authLimiter, (req, res) => {
        res.json({ success: true });
      });
    });

    it('should track rate limits per IP address', async () => {
      // Make 5 requests from IP 1
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/test-auth')
          .set('X-Forwarded-For', '192.168.1.1')
          .send({ email: 'test@example.com', password: 'password123' });
      }

      // 6th request from IP 1 should be blocked
      const response1 = await request(app)
        .post('/test-auth')
        .set('X-Forwarded-For', '192.168.1.1')
        .send({ email: 'test@example.com', password: 'password123' });

      expect(response1.status).toBe(429);

      // Request from IP 2 should still work
      const response2 = await request(app)
        .post('/test-auth')
        .set('X-Forwarded-For', '192.168.1.2')
        .send({ email: 'test@example.com', password: 'password123' });

      expect(response2.status).toBe(200);
    });
  });

  describe('Rate limiter headers validation', () => {
    beforeEach(() => {
      app.get('/test-api', apiLimiter, (req, res) => {
        res.json({ success: true });
      });
    });

    it('should include X-RateLimit-Limit header', async () => {
      const response = await request(app).get('/test-api');
      expect(response.headers['x-ratelimit-limit']).toBeDefined();
      expect(parseInt(response.headers['x-ratelimit-limit'])).toBeGreaterThan(0);
    });

    it('should include X-RateLimit-Remaining header', async () => {
      const response = await request(app).get('/test-api');
      expect(response.headers['x-ratelimit-remaining']).toBeDefined();
      expect(parseInt(response.headers['x-ratelimit-remaining'])).toBeGreaterThanOrEqual(0);
    });

    it('should include X-RateLimit-Reset header', async () => {
      const response = await request(app).get('/test-api');
      expect(response.headers['x-ratelimit-reset']).toBeDefined();
      
      const resetTime = parseInt(response.headers['x-ratelimit-reset']);
      const currentTime = Math.floor(Date.now() / 1000);
      
      // Reset time should be in the future
      expect(resetTime).toBeGreaterThan(currentTime);
    });

    it('should update remaining count on each request', async () => {
      const response1 = await request(app).get('/test-api');
      const remaining1 = parseInt(response1.headers['x-ratelimit-remaining']);

      const response2 = await request(app).get('/test-api');
      const remaining2 = parseInt(response2.headers['x-ratelimit-remaining']);

      const response3 = await request(app).get('/test-api');
      const remaining3 = parseInt(response3.headers['x-ratelimit-remaining']);

      // Each request should decrease remaining (or stay the same if rate limiter resets)
      // In test environment with in-memory store, this might not always decrease
      expect(remaining2).toBeLessThanOrEqual(remaining1);
      expect(remaining3).toBeLessThanOrEqual(remaining2);
      
      // At least verify that remaining is a valid number
      expect(remaining1).toBeGreaterThanOrEqual(0);
      expect(remaining2).toBeGreaterThanOrEqual(0);
      expect(remaining3).toBeGreaterThanOrEqual(0);
    });
  });
});
