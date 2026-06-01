/**
 * Integration tests for pagination across all list endpoints
 */

const request = require('supertest');
const mongoose = require('mongoose');

// ── Mocks must be declared before requiring server ────────────────────────────
// Auth middleware — stub all three exports so no handler is undefined
jest.mock('../../middleware/auth', () => ({
  protect: (req, res, next) => {
    req.user = { id: 'test-user-id', role: 'admin', _id: 'test-user-id' };
    next();
  },
  authorize: (..._roles) => (req, res, next) => next(),
  optionalAuth: (req, res, next) => next(),
  adminOnly: (req, res, next) => next(),
}));

// Redis cache — stub so server loads without a real Redis connection
jest.mock('../../services/redisCache', () => ({
  initRedis: jest.fn().mockResolvedValue(null),
  isRedisConnected: jest.fn().mockReturnValue(false),
  getRedisClient: jest.fn().mockReturnValue(null),
  get: jest.fn().mockResolvedValue(null),
  set: jest.fn().mockResolvedValue(true),
  del: jest.fn().mockResolvedValue(true),
  cacheMiss: jest.fn(),
  generateProductListKey: jest.fn().mockReturnValue('products:list:test'),
  generateProductDetailKey: jest.fn().mockReturnValue('products:detail:test'),
  CACHE_KEYS: {
    PRODUCTS_LIST: 'products:list',
    PRODUCTS_DETAIL: 'products:detail',
    CATEGORIES_LIST: 'categories:list',
    HOMEPAGE_FEATURED: 'homepage:featured',
  },
  CACHE_TTL: {
    PRODUCTS_LIST: 3600,
    PRODUCTS_DETAIL: 1800,
    CATEGORIES_LIST: 86400,
    HOMEPAGE_FEATURED: 300,
  },
}));

// Logger — prevent file-system writes during tests
jest.mock('../../utils/logger', () => ({
  info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn(), cacheMiss: jest.fn(),
}));

// Cron / monitor — avoid unref'd timers
jest.mock('../../utils/stockAlertCron', () => ({ startCronJobs: jest.fn() }));
jest.mock('../../utils/databaseMonitor', () => ({ monitorConnections: jest.fn() }));

const app = require('../../server');

describe('Pagination Integration Tests', () => {
  beforeAll(async () => {
    // Connect to test database if not already connected
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/medcore-test');
    }
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('GET /api/products - Product List Pagination', () => {
    it('should return standardized pagination metadata', async () => {
      const response = await request(app)
        .get('/api/products')
        .query({ page: 1, limit: 20 });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('pagination');
      
      // Check pagination metadata structure
      const { pagination } = response.body;
      expect(pagination).toHaveProperty('page');
      expect(pagination).toHaveProperty('limit');
      expect(pagination).toHaveProperty('total');
      expect(pagination).toHaveProperty('totalPages');
      expect(pagination).toHaveProperty('hasNext');
      expect(pagination).toHaveProperty('hasPrev');
      
      // Verify types
      expect(typeof pagination.page).toBe('number');
      expect(typeof pagination.limit).toBe('number');
      expect(typeof pagination.total).toBe('number');
      expect(typeof pagination.totalPages).toBe('number');
      expect(typeof pagination.hasNext).toBe('boolean');
      expect(typeof pagination.hasPrev).toBe('boolean');
      
      // Verify backward compatibility
      expect(response.body).toHaveProperty('products');
      expect(response.body).toHaveProperty('count');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('page');
      expect(response.body).toHaveProperty('pages');
    });

    it('should respect default limit of 20', async () => {
      const response = await request(app)
        .get('/api/products');

      expect(response.status).toBe(200);
      expect(response.body.pagination.limit).toBe(20);
    });

    it('should enforce maximum limit of 100', async () => {
      const response = await request(app)
        .get('/api/products')
        .query({ limit: 500 });

      expect(response.status).toBe(200);
      expect(response.body.pagination.limit).toBe(100);
    });

    it('should handle page parameter correctly', async () => {
      const response = await request(app)
        .get('/api/products')
        .query({ page: 2, limit: 10 });

      expect(response.status).toBe(200);
      expect(response.body.pagination.page).toBe(2);
      
      if (response.body.pagination.total > 10) {
        expect(response.body.pagination.hasPrev).toBe(true);
      }
    });
  });

  describe('GET /api/orders - Order List Pagination', () => {
    it('should return standardized pagination metadata', async () => {
      const response = await request(app)
        .get('/api/orders')
        .query({ page: 1, limit: 20 });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('pagination');
      
      const { pagination } = response.body;
      expect(pagination).toHaveProperty('page');
      expect(pagination).toHaveProperty('limit');
      expect(pagination).toHaveProperty('total');
      expect(pagination).toHaveProperty('totalPages');
      expect(pagination).toHaveProperty('hasNext');
      expect(pagination).toHaveProperty('hasPrev');
      
      // Verify backward compatibility
      expect(response.body).toHaveProperty('orders');
    });
  });

  describe('GET /api/reviews/product/:productId - Review List Pagination', () => {
    it('should return standardized pagination metadata', async () => {
      // Use a dummy product ID for testing
      const productId = new mongoose.Types.ObjectId();
      
      const response = await request(app)
        .get(`/api/reviews/product/${productId}`)
        .query({ page: 1, limit: 10 });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('pagination');
      
      const { pagination } = response.body;
      expect(pagination).toHaveProperty('page');
      expect(pagination).toHaveProperty('limit');
      expect(pagination).toHaveProperty('total');
      expect(pagination).toHaveProperty('totalPages');
      expect(pagination).toHaveProperty('hasNext');
      expect(pagination).toHaveProperty('hasPrev');
    });
  });

  describe('GET /api/admin/customers - User List Pagination', () => {
    it('should return standardized pagination metadata', async () => {
      const response = await request(app)
        .get('/api/admin/customers')
        .query({ page: 1, limit: 20 });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('pagination');
      
      const { pagination } = response.body;
      expect(pagination).toHaveProperty('page');
      expect(pagination).toHaveProperty('limit');
      expect(pagination).toHaveProperty('total');
      expect(pagination).toHaveProperty('totalPages');
      expect(pagination).toHaveProperty('hasNext');
      expect(pagination).toHaveProperty('hasPrev');
      
      // Verify backward compatibility
      expect(response.body).toHaveProperty('customers');
    });
  });

  describe('Pagination Edge Cases', () => {
    it('should handle invalid page numbers gracefully', async () => {
      const response = await request(app)
        .get('/api/products')
        .query({ page: -1 });

      expect(response.status).toBe(200);
      expect(response.body.pagination.page).toBe(1);
    });

    it('should handle invalid limit values gracefully', async () => {
      const response = await request(app)
        .get('/api/products')
        .query({ limit: 'abc' });

      expect(response.status).toBe(200);
      expect(response.body.pagination.limit).toBe(20); // default
    });

    it('should handle zero limit gracefully', async () => {
      const response = await request(app)
        .get('/api/products')
        .query({ limit: 0 });

      expect(response.status).toBe(200);
      expect(response.body.pagination.limit).toBe(1); // minimum
    });
  });

  describe('Pagination Metadata Accuracy', () => {
    it('should calculate totalPages correctly', async () => {
      const response = await request(app)
        .get('/api/products')
        .query({ limit: 10 });

      expect(response.status).toBe(200);
      
      const { pagination } = response.body;
      const expectedPages = Math.ceil(pagination.total / pagination.limit);
      expect(pagination.totalPages).toBe(expectedPages);
    });

    it('should set hasNext correctly on first page', async () => {
      const response = await request(app)
        .get('/api/products')
        .query({ page: 1, limit: 5 });

      expect(response.status).toBe(200);
      
      const { pagination } = response.body;
      if (pagination.total > pagination.limit) {
        expect(pagination.hasNext).toBe(true);
      } else {
        expect(pagination.hasNext).toBe(false);
      }
      expect(pagination.hasPrev).toBe(false);
    });

    it('should set hasPrev correctly on second page', async () => {
      const response = await request(app)
        .get('/api/products')
        .query({ page: 2, limit: 10 });

      expect(response.status).toBe(200);
      
      const { pagination } = response.body;
      if (pagination.total > 10) {
        expect(pagination.hasPrev).toBe(true);
      }
    });
  });
});
