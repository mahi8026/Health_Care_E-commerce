/**
 * Security Middleware Integration Tests
 * Tests helmet, express-mongo-sanitize, xss-clean, and hpp middleware
 * Validates: Requirements 10.5, 10.6, 10.7, 10.8
 */

const request = require('supertest');
const express = require('express');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xssClean = require('xss-clean');
const hpp = require('hpp');

describe('Security Middleware Tests', () => {
  let app;

  beforeEach(() => {
    // Create a fresh Express app for each test
    app = express();
    
    // Apply security middleware in the same order as server.js
    app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
          fontSrc: ["'self'", "https://fonts.gstatic.com"],
          imgSrc: ["'self'", "data:", "https:", "blob:"],
          scriptSrc: ["'self'", "'unsafe-inline'", "https://www.google.com", "https://www.gstatic.com"],
          frameSrc: ["'self'", "https://www.google.com"],
          connectSrc: ["'self'", "https://*.cloudinary.com"],
          upgradeInsecureRequests: [],
        }
      },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
      },
      frameguard: { action: 'deny' },
      noSniff: true,
      xssFilter: true,
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    }));
    
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    
    app.use(mongoSanitize());
    app.use(xssClean());
    app.use(hpp());
    
    // Test routes
    app.post('/api/test', (req, res) => {
      res.json({ success: true, data: req.body });
    });
    
    app.get('/api/test', (req, res) => {
      res.json({ success: true, query: req.query });
    });
  });

  describe('Helmet Security Headers', () => {
    test('should set Content-Security-Policy header', async () => {
      const response = await request(app).get('/api/test');
      
      expect(response.headers['content-security-policy']).toBeDefined();
      expect(response.headers['content-security-policy']).toContain("default-src 'self'");
    });

    test('should set Strict-Transport-Security (HSTS) header', async () => {
      const response = await request(app).get('/api/test');
      
      expect(response.headers['strict-transport-security']).toBeDefined();
      expect(response.headers['strict-transport-security']).toContain('max-age=31536000');
      expect(response.headers['strict-transport-security']).toContain('includeSubDomains');
      expect(response.headers['strict-transport-security']).toContain('preload');
    });

    test('should set X-Frame-Options header to DENY', async () => {
      const response = await request(app).get('/api/test');
      
      expect(response.headers['x-frame-options']).toBe('DENY');
    });

    test('should set X-Content-Type-Options header to nosniff', async () => {
      const response = await request(app).get('/api/test');
      
      expect(response.headers['x-content-type-options']).toBe('nosniff');
    });

    test('should set X-XSS-Protection header', async () => {
      const response = await request(app).get('/api/test');
      
      // Helmet 7+ may not set this header by default as it's deprecated in modern browsers
      // But if xssFilter: true is set, it should be present
      expect(response.headers['x-xss-protection']).toBeDefined();
    });

    test('should set Referrer-Policy header', async () => {
      const response = await request(app).get('/api/test');

      expect(response.headers['referrer-policy']).toBeDefined();
      expect(response.headers['referrer-policy']).toContain('strict-origin-when-cross-origin');
    });
  });

  describe('MongoDB Injection Prevention (express-mongo-sanitize)', () => {
    test('should sanitize MongoDB operators in request body', async () => {
      const maliciousPayload = {
        email: { $gt: '' },
        password: 'test123'
      };

      const response = await request(app)
        .post('/api/test')
        .send(maliciousPayload);

      expect(response.status).toBe(200);
      expect(response.body.data.email).not.toHaveProperty('$gt');
      // The $ should be removed or replaced
      expect(JSON.stringify(response.body.data.email)).not.toContain('$gt');
    });

    test('should sanitize MongoDB operators in nested objects', async () => {
      const maliciousPayload = {
        user: {
          email: { $ne: null },
          role: { $in: ['admin'] }
        }
      };

      const response = await request(app)
        .post('/api/test')
        .send(maliciousPayload);

      expect(response.status).toBe(200);
      // MongoDB operators should be sanitized
      const userData = response.body.data.user;
      expect(JSON.stringify(userData)).not.toContain('$ne');
      expect(JSON.stringify(userData)).not.toContain('$in');
    });

    test('should sanitize MongoDB operators in query parameters', async () => {
      const response = await request(app)
        .get('/api/test')
        .query({ email: { $gt: '' } });

      expect(response.status).toBe(200);
      // Query should be sanitized
      expect(JSON.stringify(response.body.query)).not.toContain('$gt');
    });

    test('should allow legitimate data without MongoDB operators', async () => {
      const legitimatePayload = {
        email: 'user@example.com',
        name: 'John Doe',
        price: 100
      };

      const response = await request(app)
        .post('/api/test')
        .send(legitimatePayload);

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual(legitimatePayload);
    });
  });

  describe('XSS Prevention (xss-clean)', () => {
    test('should sanitize XSS script tags in request body', async () => {
      const maliciousPayload = {
        name: '<script>alert("XSS")</script>',
        description: 'Normal text'
      };

      const response = await request(app)
        .post('/api/test')
        .send(maliciousPayload);

      expect(response.status).toBe(200);
      // xss-clean HTML-encodes dangerous tags so they cannot execute in a browser.
      // The raw '<script>' opening tag must not appear — it is encoded to '&lt;script>'.
      expect(response.body.data.name).not.toContain('<script>');
      expect(response.body.data.name).not.toContain('</script>');
    });

    test('should sanitize XSS event handlers in request body', async () => {
      const maliciousPayload = {
        name: '<img src=x onerror="alert(1)">',
        bio: '<div onload="malicious()">Content</div>'
      };

      const response = await request(app)
        .post('/api/test')
        .send(maliciousPayload);

      expect(response.status).toBe(200);
      // xss-clean HTML-encodes the opening '<' so the tag cannot be parsed as HTML.
      // The literal '<img' and '<div' strings must not appear in the output.
      expect(response.body.data.name).not.toContain('<img');
      expect(response.body.data.bio).not.toContain('<div');
    });

    test('should sanitize XSS in nested objects', async () => {
      const maliciousPayload = {
        user: {
          name: '<script>document.cookie</script>',
          address: {
            street: '<img src=x onerror=alert(1)>'
          }
        }
      };

      const response = await request(app)
        .post('/api/test')
        .send(maliciousPayload);

      expect(response.status).toBe(200);
      // Raw executable HTML tags must not appear anywhere in the serialised response.
      const serialised = JSON.stringify(response.body.data);
      expect(serialised).not.toContain('<script>');
      expect(serialised).not.toContain('<img');
    });

    test('should allow legitimate HTML entities', async () => {
      const legitimatePayload = {
        name: 'John & Jane',
        description: 'Price: $100 < $200'
      };

      const response = await request(app)
        .post('/api/test')
        .send(legitimatePayload);

      expect(response.status).toBe(200);
      // Legitimate content should pass through (may be encoded)
      expect(response.body.data.name).toBeTruthy();
      expect(response.body.data.description).toBeTruthy();
    });
  });

  describe('HTTP Parameter Pollution Prevention (hpp)', () => {
    test('should prevent parameter pollution with duplicate query params', async () => {
      // HPP should take the last value when duplicate params are provided
      const response = await request(app)
        .get('/api/test?sort=price&sort=name&sort=date');

      expect(response.status).toBe(200);
      // HPP should resolve to a single value (typically the last one)
      expect(typeof response.body.query.sort).toBe('string');
      expect(response.body.query.sort).toBe('date');
    });

    test('should handle array parameters correctly', async () => {
      const response = await request(app)
        .get('/api/test?category=medical&category=surgical');

      expect(response.status).toBe(200);
      // HPP should handle this appropriately
      expect(response.body.query.category).toBeDefined();
    });

    test('should allow single parameter values', async () => {
      const response = await request(app)
        .get('/api/test?page=1&limit=20&sort=price');

      expect(response.status).toBe(200);
      expect(response.body.query.page).toBe('1');
      expect(response.body.query.limit).toBe('20');
      expect(response.body.query.sort).toBe('price');
    });
  });

  describe('Combined Security Tests', () => {
    test('should handle multiple attack vectors simultaneously', async () => {
      const maliciousPayload = {
        email: { $gt: '' },
        name: '<script>alert("XSS")</script>',
        role: { $in: ['admin'] }
      };

      const response = await request(app)
        .post('/api/test')
        .send(maliciousPayload);

      expect(response.status).toBe(200);
      // All attacks should be mitigated
      expect(JSON.stringify(response.body.data)).not.toContain('$gt');
      expect(JSON.stringify(response.body.data)).not.toContain('$in');
      expect(JSON.stringify(response.body.data)).not.toContain('<script>');
    });

    test('should set all critical security headers', async () => {
      const response = await request(app).get('/api/test');

      // Verify all critical headers are present
      expect(response.headers['content-security-policy']).toBeDefined();
      expect(response.headers['strict-transport-security']).toBeDefined();
      expect(response.headers['x-frame-options']).toBeDefined();
      expect(response.headers['x-content-type-options']).toBeDefined();
      expect(response.headers['referrer-policy']).toBeDefined();
    });
  });
});
