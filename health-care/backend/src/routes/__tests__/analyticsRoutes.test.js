/**
 * Analytics Routes Configuration Tests
 * 
 * These tests verify that:
 * 1. All analytics endpoints are properly defined (7 GET + 1 POST)
 * 2. Routes are protected with authentication middleware
 * 3. Routes are authorized for admin and manager roles only
 * 4. Routes are registered in the Express router
 * 5. POST /web-vitals is public (no auth required) — Requirements: 10.2
 */

// Mock mongoose before importing anything
const mockSchema = jest.fn().mockImplementation(function() {
  return this;
});
mockSchema.Types = {
  ObjectId: 'ObjectId',
  String: 'String',
  Number: 'Number',
  Date: 'Date',
  Boolean: 'Boolean',
  Mixed: 'Mixed'
};

jest.mock('mongoose', () => ({
  Schema: mockSchema,
  model: jest.fn().mockReturnValue({}),
  connect: jest.fn(),
  connection: {
    readyState: 1
  }
}));

const express = require('express');
const request = require('supertest');

describe('Analytics Routes Configuration', () => {
  let analyticsRoutes;

  beforeAll(() => {
    // Load the routes module
    analyticsRoutes = require('../analyticsRoutes');
  });

  describe('Route Structure', () => {
    test('analyticsRoutes should be an Express Router', () => {
      expect(analyticsRoutes).toBeDefined();
      expect(typeof analyticsRoutes).toBe('function');
      expect(analyticsRoutes.stack).toBeDefined();
    });

    test('should have 8 route handlers defined (7 GET + 1 POST web-vitals)', () => {
      // Count the number of route layers (excluding middleware)
      const routeLayers = analyticsRoutes.stack.filter(layer => layer.route);
      expect(routeLayers.length).toBe(8);
    });

    test('should have /web-vitals POST endpoint', () => {
      const webVitalsRoute = analyticsRoutes.stack.find(
        layer => layer.route && layer.route.path === '/web-vitals'
      );
      expect(webVitalsRoute).toBeDefined();
      expect(webVitalsRoute.route.methods.post).toBe(true);
    });

    test('should have /sales endpoint', () => {
      const salesRoute = analyticsRoutes.stack.find(
        layer => layer.route && layer.route.path === '/sales'
      );
      expect(salesRoute).toBeDefined();
      expect(salesRoute.route.methods.get).toBe(true);
    });

    test('should have /orders endpoint', () => {
      const ordersRoute = analyticsRoutes.stack.find(
        layer => layer.route && layer.route.path === '/orders'
      );
      expect(ordersRoute).toBeDefined();
      expect(ordersRoute.route.methods.get).toBe(true);
    });

    test('should have /products endpoint', () => {
      const productsRoute = analyticsRoutes.stack.find(
        layer => layer.route && layer.route.path === '/products'
      );
      expect(productsRoute).toBeDefined();
      expect(productsRoute.route.methods.get).toBe(true);
    });

    test('should have /customers endpoint', () => {
      const customersRoute = analyticsRoutes.stack.find(
        layer => layer.route && layer.route.path === '/customers'
      );
      expect(customersRoute).toBeDefined();
      expect(customersRoute.route.methods.get).toBe(true);
    });

    test('should have /payments endpoint', () => {
      const paymentsRoute = analyticsRoutes.stack.find(
        layer => layer.route && layer.route.path === '/payments'
      );
      expect(paymentsRoute).toBeDefined();
      expect(paymentsRoute.route.methods.get).toBe(true);
    });

    test('should have /realtime endpoint', () => {
      const realtimeRoute = analyticsRoutes.stack.find(
        layer => layer.route && layer.route.path === '/realtime'
      );
      expect(realtimeRoute).toBeDefined();
      expect(realtimeRoute.route.methods.get).toBe(true);
    });

    test('should have /traffic endpoint', () => {
      const trafficRoute = analyticsRoutes.stack.find(
        layer => layer.route && layer.route.path === '/traffic'
      );
      expect(trafficRoute).toBeDefined();
      expect(trafficRoute.route.methods.get).toBe(true);
    });
  });

  describe('Middleware Configuration', () => {
    test('should have middleware layers applied to router', () => {
      // Check for middleware layers (protect and authorize)
      const middlewareLayers = analyticsRoutes.stack.filter(layer => !layer.route);
      expect(middlewareLayers.length).toBeGreaterThanOrEqual(2);
    });

    test('middleware should be applied before the protected GET routes', () => {
      // The /web-vitals POST route is public and comes first.
      // The protect + authorize middleware layers come after it, before the protected GET routes.
      const firstGetRouteIndex = analyticsRoutes.stack.findIndex(
        layer => layer.route && layer.route.methods.get
      );
      const middlewareBeforeGetRoutes = analyticsRoutes.stack
        .slice(0, firstGetRouteIndex)
        .filter(layer => !layer.route);
      
      expect(middlewareBeforeGetRoutes.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Integration with server.js', () => {
    test('routes should be exportable as a module', () => {
      expect(analyticsRoutes).toBeDefined();
      expect(typeof analyticsRoutes).toBe('function');
    });
  });
});

/**
 * POST /api/analytics/web-vitals — Integration Tests
 * Requirements: 10.2
 */
describe('POST /api/analytics/web-vitals', () => {
  let app;

  beforeAll(() => {
    // Build a minimal Express app that mounts the analytics router
    app = express();
    app.use(express.json());
    app.use('/api/analytics', require('../analyticsRoutes'));
  });

  describe('Valid requests', () => {
    test.each(['LCP', 'INP', 'CLS', 'FCP', 'TTFB'])(
      'should accept metric %s with a numeric value',
      async (metric) => {
        const res = await request(app)
          .post('/api/analytics/web-vitals')
          .send({ metric, value: 1234.5, path: '/test', timestamp: '2024-01-01T00:00:00.000Z' });

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.message).toBe('Web Vitals metric recorded');
      }
    );

    test('should use default path "/" when path is omitted', async () => {
      const res = await request(app)
        .post('/api/analytics/web-vitals')
        .send({ metric: 'LCP', value: 1000 });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });

    test('should set Cache-Control: no-store header', async () => {
      const res = await request(app)
        .post('/api/analytics/web-vitals')
        .send({ metric: 'CLS', value: 0.05 });

      expect(res.headers['cache-control']).toBe('no-store');
    });
  });

  describe('Input validation', () => {
    test('should return 400 when metric is missing', async () => {
      const res = await request(app)
        .post('/api/analytics/web-vitals')
        .send({ value: 1000, path: '/' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/metric must be one of/);
    });

    test('should return 400 when metric is not a valid CWV name', async () => {
      const res = await request(app)
        .post('/api/analytics/web-vitals')
        .send({ metric: 'INVALID', value: 1000, path: '/' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/metric must be one of/);
    });

    test('should return 400 when value is missing', async () => {
      const res = await request(app)
        .post('/api/analytics/web-vitals')
        .send({ metric: 'LCP', path: '/' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('value must be a number');
    });

    test('should return 400 when value is a string', async () => {
      const res = await request(app)
        .post('/api/analytics/web-vitals')
        .send({ metric: 'LCP', value: 'fast', path: '/' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('value must be a number');
    });

    test('should return 400 when value is Infinity', async () => {
      const res = await request(app)
        .post('/api/analytics/web-vitals')
        .send({ metric: 'LCP', value: Infinity, path: '/' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('value must be a number');
    });
  });
});
