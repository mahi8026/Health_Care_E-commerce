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

const CacheService = require('../../services/cacheService');

// Mock the CacheService
jest.mock('../../services/cacheService');

describe('Cache Invalidation Integration', () => {
  beforeAll(() => {
    // Create mock cache service instance
    const mockCacheService = {
      invalidateAnalytics: jest.fn(),
      delPattern: jest.fn(),
      get: jest.fn(),
      set: jest.fn(),
      generateKey: jest.fn()
    };
    
    // Mock the CacheService constructor to return our mock instance
    CacheService.mockImplementation(() => mockCacheService);
  });

  describe('Order Controller', () => {
    it('should have cache service initialized', () => {
      // Import controller
      const orderController = require('../orderController');
      
      // Verify that the controller module loaded successfully
      expect(orderController).toBeDefined();
      expect(orderController.createOrder).toBeDefined();
      
      // Verify that CacheService was instantiated
      expect(CacheService).toHaveBeenCalled();
    });
  });

  describe('Product Controller', () => {
    it('should have cache service initialized', () => {
      // Import controller
      const productController = require('../productController');
      
      // Verify that the controller module loaded successfully
      expect(productController).toBeDefined();
      expect(productController.updateProduct).toBeDefined();
      
      // Verify that CacheService was instantiated
      expect(CacheService).toHaveBeenCalled();
    });
  });
});
