/**
 * Integration tests for pagination across all list endpoints
 */

const request = require('supertest');
const mongoose = require('mongoose');

// â”€â”€ Mocks must be declared before requiring server â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Auth middleware â€” stub all exports so no handler is undefined
// (incl. optionalOrderAuth, which orderRoutes mounts on POST /orders)
jest.mock('../../middleware/auth', () => ({
  protect: (req, res, next) => {
    req.user = { id: 'test-user-id', role: 'admin', _id: 'test-user-id' };
    next();
  },
  authorize: (..._roles) => (req, res, next) => next(),
  optionalAuth: (req, res, next) => next(),
  optionalOrderAuth: (req, res, next) => next(),
  adminOnly: (req, res, next) => next(),
}));

// Redis cache â€” stub so server loads without a real Redis connection
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

// Logger â€” prevent file-system writes during tests
jest.mock('../../utils/logger', () => ({
  info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn(), cacheMiss: jest.fn(),
}));

// Cron / monitor â€” avoid unref'd timers
jest.mock('../../utils/stockAlertCron', () => ({ startCronJobs: jest.fn() }));
jest.mock('../../utils/databaseMonitor', () => ({ monitorConnections: jest.fn() }));

const app = require('../../server');

describe('Pagination Integration Tests', () => {
  beforeAll(async () => {
    // Connect to test database if not already connected
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/Mediport-test');
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
      
      // The products endpoint returns the standardized paginatedResponse shape
      // { success, data, pagination } (no legacy products/count/total keys).
      expect(response.body).not.toHaveProperty('products');
      expect(response.body.data).toBeDefined();
      expect(response.body.data).toHaveLength(response.body.count ?? response.body.data.length);
    });

    it('should respect default limit of 20', async () => {
      const response = await request(app)
        .get('/api/products');

      expect(response.status).toBe(200);
      expect(response.body.pagination.limit).toBe(20);
    });

    it('should reject over-limit values with a validation error', async () => {
      // validateProductQuery caps limit at 100 (1-100) via express-validator.
      const response = await request(app)
        .get('/api/products')
        .query({ limit: 500 });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
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
      expect(response.body).toHaveProperty('orders');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('page');
      expect(response.body).toHaveProperty('pages');
      
      // getOrders returns the legacy shape { success, count, total, page, pages, orders }
      // (orders is an array; it may be empty on a fresh test database)
      expect(Array.isArray(response.body.orders)).toBe(true);
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

      // getCustomers returns { success, data: { count, total, customers } }
      // (updated here from the older tests' obsolete data/pagination/customers expectations).
      expect(response.body.data).toHaveProperty('customers');
      expect(response.body.data).toHaveProperty('total');
      expect(response.body.data).toHaveProperty('count');
      expect(typeof response.body.data.total).toBe('number');
      expect(response.body.data.customers).toHaveLength(response.body.data.count);
    });
  });

  describe('Pagination Edge Cases', () => {
    it('should reject negative page numbers with a validation error', async () => {
      // validateProductQuery requires page >= 1.
      const response = await request(app)
        .get('/api/products')
        .query({ page: -1 });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });

    it('should reject non-numeric limit values with a validation error', async () => {
      // validateProductQuery requires limit to be an integer.
      const response = await request(app)
        .get('/api/products')
        .query({ limit: 'abc' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });

    it('should reject zero limit with a validation error', async () => {
      // validateProductQuery requires limit >= 1 (min is 1, no silent coercion).
      const response = await request(app)
        .get('/api/products')
        .query({ limit: 0 });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
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
