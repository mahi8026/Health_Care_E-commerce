const request = require('supertest');

// Mock mongoose connection with full Schema support
jest.mock('mongoose', () => {
  const actualMongoose = jest.requireActual('mongoose');
  return {
    ...actualMongoose,
    connection: {
      readyState: 1,
      host: 'localhost:27017'
    }
  };
});

// Mock redisCache
jest.mock('../services/redisCache', () => ({
  isRedisConnected: jest.fn(() => true),
  getRedisClient: jest.fn(),
  initRedis: jest.fn(),
  get: jest.fn().mockResolvedValue(null),
  set: jest.fn().mockResolvedValue(true),
  del: jest.fn().mockResolvedValue(true),
  cacheMiss: jest.fn(),
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

// Mock database connection
jest.mock('../config/database', () => jest.fn());

// Mock logger
jest.mock('../utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn()
}));

// Mock cron jobs
jest.mock('../utils/stockAlertCron', () => ({
  startCronJobs: jest.fn()
}));

// Mock database monitor
jest.mock('../utils/databaseMonitor', () => ({
  monitorConnections: jest.fn()
}));

describe('Health Check Endpoint', () => {
  let app;
  let mongoose;
  
  beforeEach(() => {
    jest.clearAllMocks();
    // Get mongoose reference
    mongoose = require('mongoose');
    // Import app after mocks are set up
    app = require('../server');
  });

  afterEach(() => {
    jest.resetModules();
  });

  describe('GET /api/health', () => {
    it('should return 200 and healthy status when database is connected', async () => {
      // Mock connected state
      mongoose.connection.readyState = 1;
      mongoose.connection.host = 'localhost:27017';

      const response = await request(app).get('/api/health');

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        success: true,
        status: 'healthy',
        message: 'MedCore BD API is running',
        version: '2.0.0',
        services: {
          api: 'operational',
          database: {
            status: 'connected',
            connected: true,
            host: 'localhost:27017'
          },
          redis: {
            status: 'connected',
            fallback: null
          }
        }
      });
      expect(response.body.timestamp).toBeDefined();
    });

    it('should return 503 and degraded status when database is disconnected', async () => {
      // Mock disconnected state
      mongoose.connection.readyState = 0;

      const response = await request(app).get('/api/health');

      expect(response.status).toBe(503);
      expect(response.body).toMatchObject({
        success: true,
        status: 'degraded',
        services: {
          api: 'operational',
          database: {
            status: 'disconnected',
            connected: false,
            host: null
          }
        }
      });
    });

    it('should return 503 and degraded status when database is connecting', async () => {
      // Mock connecting state
      mongoose.connection.readyState = 2;

      const response = await request(app).get('/api/health');

      expect(response.status).toBe(503);
      expect(response.body).toMatchObject({
        success: true,
        status: 'degraded',
        services: {
          database: {
            status: 'connecting',
            connected: false
          }
        }
      });
    });

    it('should return 503 and degraded status when database is disconnecting', async () => {
      // Mock disconnecting state
      mongoose.connection.readyState = 3;

      const response = await request(app).get('/api/health');

      expect(response.status).toBe(503);
      expect(response.body).toMatchObject({
        success: true,
        status: 'degraded',
        services: {
          database: {
            status: 'disconnecting',
            connected: false
          }
        }
      });
    });

    it('should show Redis as disconnected with memory-store fallback when Redis is unavailable', async () => {
      // Mock connected database but disconnected Redis
      mongoose.connection.readyState = 1;
      mongoose.connection.host = 'localhost:27017';
      
      const redisCache = require('../services/redisCache');
      redisCache.isRedisConnected.mockReturnValue(false);

      const response = await request(app).get('/api/health');

      expect(response.status).toBe(200);
      expect(response.body.services.redis).toMatchObject({
        status: 'disconnected',
        fallback: 'memory-store'
      });
    });

    it('should include timestamp in ISO format', async () => {
      mongoose.connection.readyState = 1;

      const response = await request(app).get('/api/health');

      expect(response.body.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    it('should include version number', async () => {
      mongoose.connection.readyState = 1;

      const response = await request(app).get('/api/health');

      expect(response.body.version).toBe('2.0.0');
    });
  });
});
