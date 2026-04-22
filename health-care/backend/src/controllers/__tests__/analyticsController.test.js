// Mock mongoose before importing models
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

const { getSalesAnalytics, getOrderAnalytics } = require('../analyticsController');
const Order = require('../../models/Order');
const Product = require('../../models/Product');
const CacheService = require('../../services/cacheService');

// Mock dependencies
jest.mock('../../models/Order');
jest.mock('../../models/Product');
jest.mock('../../services/cacheService');

describe('Analytics Controller - getSalesAnalytics', () => {
  let req, res;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Mock request and response objects
    req = {
      query: {}
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    // Mock cache service
    CacheService.mockImplementation(() => ({
      get: jest.fn().mockReturnValue(null),
      set: jest.fn(),
      generateKey: jest.fn((prefix, params) => `${prefix}:${JSON.stringify(params)}`)
    }));
  });

  describe('Input Validation', () => {
    it('should return 400 if startDate is missing', async () => {
      req.query = { endDate: '2024-01-31' };

      await getSalesAnalytics(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Start date and end date are required'
      });
    });

    it('should return 400 if endDate is missing', async () => {
      req.query = { startDate: '2024-01-01' };

      await getSalesAnalytics(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Start date and end date are required'
      });
    });

    it('should return 400 if groupBy is invalid', async () => {
      req.query = {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        groupBy: 'invalid'
      };

      await getSalesAnalytics(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'groupBy must be one of: day, week, month'
      });
    });

    it('should return 400 if date format is invalid', async () => {
      req.query = {
        startDate: 'invalid-date',
        endDate: '2024-01-31'
      };

      await getSalesAnalytics(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid date format'
      });
    });

    it('should return 400 if start date is after end date', async () => {
      req.query = {
        startDate: '2024-01-31',
        endDate: '2024-01-01'
      };

      await getSalesAnalytics(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Start date must be before end date'
      });
    });
  });

  describe('Sales Aggregation', () => {
    it('should return sales data grouped by day', async () => {
      req.query = {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        groupBy: 'day'
      };

      const mockSalesData = [
        { date: '2024-01-01', revenue: 10000, orderCount: 5 },
        { date: '2024-01-02', revenue: 15000, orderCount: 7 }
      ];

      const mockPreviousData = [{ revenue: 20000 }];

      Order.aggregate = jest.fn()
        .mockResolvedValueOnce(mockSalesData) // Current period
        .mockResolvedValueOnce(mockPreviousData); // Previous period

      await getSalesAnalytics(req, res);

      expect(Order.aggregate).toHaveBeenCalledTimes(2);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          total: 25000,
          growth: 25, // (25000 - 20000) / 20000 * 100 = 25%
          data: mockSalesData,
          metadata: {
            startDate: '2024-01-01',
            endDate: '2024-01-31',
            groupBy: 'day'
          }
        }),
        cached: false
      });
    });

    it('should filter orders by completed or paid status', async () => {
      req.query = {
        startDate: '2024-01-01',
        endDate: '2024-01-31'
      };

      Order.aggregate = jest.fn()
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      await getSalesAnalytics(req, res);

      const firstCall = Order.aggregate.mock.calls[0][0];
      expect(firstCall[0].$match.status).toEqual({ $in: ['completed', 'paid'] });
    });

    it('should calculate 100% growth when previous period has no revenue', async () => {
      req.query = {
        startDate: '2024-01-01',
        endDate: '2024-01-31'
      };

      const mockSalesData = [
        { date: '2024-01-01', revenue: 10000, orderCount: 5 }
      ];

      Order.aggregate = jest.fn()
        .mockResolvedValueOnce(mockSalesData)
        .mockResolvedValueOnce([]); // No previous period data

      await getSalesAnalytics(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          growth: 100
        }),
        cached: false
      });
    });

    it('should calculate 0% growth when both periods have no revenue', async () => {
      req.query = {
        startDate: '2024-01-01',
        endDate: '2024-01-31'
      };

      Order.aggregate = jest.fn()
        .mockResolvedValueOnce([]) // No current period data
        .mockResolvedValueOnce([]); // No previous period data

      await getSalesAnalytics(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          growth: 0
        }),
        cached: false
      });
    });
  });

  describe('Caching', () => {
    it('should return cached false when fetching from database', async () => {
      req.query = {
        startDate: '2024-01-01',
        endDate: '2024-01-31'
      };

      const mockSalesData = [
        { date: '2024-01-01', revenue: 10000, orderCount: 5 }
      ];

      Order.aggregate = jest.fn()
        .mockResolvedValueOnce(mockSalesData)
        .mockResolvedValueOnce([{ revenue: 8000 }]);

      await getSalesAnalytics(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          total: 10000,
          data: mockSalesData
        }),
        cached: false
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      req.query = {
        startDate: '2024-01-01',
        endDate: '2024-01-31'
      };

      Order.aggregate = jest.fn().mockRejectedValue(new Error('Database error'));

      await getSalesAnalytics(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to fetch sales analytics',
        error: undefined // Only shown in development
      });
    });
  });
});

describe('Analytics Controller - getOrderAnalytics', () => {
  let req, res;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Mock request and response objects
    req = {
      query: {}
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    // Mock cache service
    CacheService.mockImplementation(() => ({
      get: jest.fn().mockReturnValue(null),
      set: jest.fn(),
      generateKey: jest.fn((prefix, params) => `${prefix}:${JSON.stringify(params)}`)
    }));
  });

  describe('Input Validation', () => {
    it('should return 400 if startDate is missing', async () => {
      req.query = { endDate: '2024-01-31' };

      await getOrderAnalytics(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Start date and end date are required'
      });
    });

    it('should return 400 if endDate is missing', async () => {
      req.query = { startDate: '2024-01-01' };

      await getOrderAnalytics(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Start date and end date are required'
      });
    });

    it('should return 400 if date format is invalid', async () => {
      req.query = {
        startDate: 'invalid-date',
        endDate: '2024-01-31'
      };

      await getOrderAnalytics(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid date format'
      });
    });

    it('should return 400 if start date is after end date', async () => {
      req.query = {
        startDate: '2024-01-31',
        endDate: '2024-01-01'
      };

      await getOrderAnalytics(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Start date must be before end date'
      });
    });
  });

  describe('Order Analytics Aggregation', () => {
    it('should return order analytics with all metrics', async () => {
      req.query = {
        startDate: '2024-01-01',
        endDate: '2024-01-31'
      };

      const mockOrderStats = [{ totalOrders: 100, totalRevenue: 500000 }];
      const mockStatusBreakdown = [
        { status: 'pending', count: 20 },
        { status: 'delivered', count: 60 },
        { status: 'cancelled', count: 20 }
      ];
      const mockPaymentMethodBreakdown = [
        { method: 'bkash', count: 50 },
        { method: 'bank_transfer', count: 30 },
        { method: 'cash', count: 20 }
      ];
      const mockFulfillmentStats = [{ totalOrders: 100, completedOrders: 60 }];

      Order.aggregate = jest.fn()
        .mockResolvedValueOnce(mockOrderStats)
        .mockResolvedValueOnce(mockStatusBreakdown)
        .mockResolvedValueOnce(mockPaymentMethodBreakdown)
        .mockResolvedValueOnce(mockFulfillmentStats);

      await getOrderAnalytics(req, res);

      expect(Order.aggregate).toHaveBeenCalledTimes(4);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          totalOrders: 100,
          avgOrderValue: 5000,
          fulfillmentRate: 60,
          statusBreakdown: [
            { status: 'pending', count: 20, percentage: 20 },
            { status: 'delivered', count: 60, percentage: 60 },
            { status: 'cancelled', count: 20, percentage: 20 }
          ],
          paymentMethodBreakdown: [
            { method: 'bkash', count: 50, percentage: 50 },
            { method: 'bank_transfer', count: 30, percentage: 30 },
            { method: 'cash', count: 20, percentage: 20 }
          ]
        },
        cached: false
      });
    });

    it('should calculate average order value correctly', async () => {
      req.query = {
        startDate: '2024-01-01',
        endDate: '2024-01-31'
      };

      const mockOrderStats = [{ totalOrders: 10, totalRevenue: 75000 }];

      Order.aggregate = jest.fn()
        .mockResolvedValueOnce(mockOrderStats)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ totalOrders: 10, completedOrders: 5 }]);

      await getOrderAnalytics(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          avgOrderValue: 7500
        }),
        cached: false
      });
    });

    it('should calculate fulfillment rate correctly', async () => {
      req.query = {
        startDate: '2024-01-01',
        endDate: '2024-01-31'
      };

      const mockFulfillmentStats = [{ totalOrders: 50, completedOrders: 35 }];

      Order.aggregate = jest.fn()
        .mockResolvedValueOnce([{ totalOrders: 50, totalRevenue: 250000 }])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce(mockFulfillmentStats);

      await getOrderAnalytics(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          fulfillmentRate: 70
        }),
        cached: false
      });
    });

    it('should handle zero orders gracefully', async () => {
      req.query = {
        startDate: '2024-01-01',
        endDate: '2024-01-31'
      };

      Order.aggregate = jest.fn()
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      await getOrderAnalytics(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          totalOrders: 0,
          avgOrderValue: 0,
          fulfillmentRate: 0,
          statusBreakdown: [],
          paymentMethodBreakdown: []
        },
        cached: false
      });
    });

    it('should calculate percentages correctly for status breakdown', async () => {
      req.query = {
        startDate: '2024-01-01',
        endDate: '2024-01-31'
      };

      const mockStatusBreakdown = [
        { status: 'delivered', count: 75 },
        { status: 'pending', count: 25 }
      ];

      Order.aggregate = jest.fn()
        .mockResolvedValueOnce([{ totalOrders: 100, totalRevenue: 500000 }])
        .mockResolvedValueOnce(mockStatusBreakdown)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ totalOrders: 100, completedOrders: 75 }]);

      await getOrderAnalytics(req, res);

      const responseData = res.json.mock.calls[0][0].data;
      expect(responseData.statusBreakdown).toEqual([
        { status: 'delivered', count: 75, percentage: 75 },
        { status: 'pending', count: 25, percentage: 25 }
      ]);
    });

    it('should calculate percentages correctly for payment method breakdown', async () => {
      req.query = {
        startDate: '2024-01-01',
        endDate: '2024-01-31'
      };

      const mockPaymentMethodBreakdown = [
        { method: 'bkash', count: 60 },
        { method: 'cash', count: 40 }
      ];

      Order.aggregate = jest.fn()
        .mockResolvedValueOnce([{ totalOrders: 100, totalRevenue: 500000 }])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce(mockPaymentMethodBreakdown)
        .mockResolvedValueOnce([{ totalOrders: 100, completedOrders: 80 }]);

      await getOrderAnalytics(req, res);

      const responseData = res.json.mock.calls[0][0].data;
      expect(responseData.paymentMethodBreakdown).toEqual([
        { method: 'bkash', count: 60, percentage: 60 },
        { method: 'cash', count: 40, percentage: 40 }
      ]);
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      req.query = {
        startDate: '2024-01-01',
        endDate: '2024-01-31'
      };

      Order.aggregate = jest.fn().mockRejectedValue(new Error('Database error'));

      await getOrderAnalytics(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to fetch order analytics',
        error: undefined
      });
    });
  });
});

describe('Analytics Controller - getProductAnalytics', () => {
  let req, res;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Mock request and response objects
    req = {
      query: {}
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    // Mock cache service
    CacheService.mockImplementation(() => ({
      get: jest.fn().mockReturnValue(null),
      set: jest.fn(),
      generateKey: jest.fn((prefix, params) => `${prefix}:${JSON.stringify(params)}`)
    }));
  });

  describe('Input Validation', () => {
    it('should return 400 if startDate is missing', async () => {
      const { getProductAnalytics } = require('../analyticsController');
      req.query = { endDate: '2024-01-31' };

      await getProductAnalytics(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Start date and end date are required'
      });
    });

    it('should return 400 if endDate is missing', async () => {
      const { getProductAnalytics } = require('../analyticsController');
      req.query = { startDate: '2024-01-01' };

      await getProductAnalytics(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Start date and end date are required'
      });
    });

    it('should return 400 if date format is invalid', async () => {
      const { getProductAnalytics } = require('../analyticsController');
      req.query = {
        startDate: 'invalid-date',
        endDate: '2024-01-31'
      };

      await getProductAnalytics(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid date format'
      });
    });

    it('should return 400 if start date is after end date', async () => {
      const { getProductAnalytics } = require('../analyticsController');
      req.query = {
        startDate: '2024-01-31',
        endDate: '2024-01-01'
      };

      await getProductAnalytics(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Start date must be before end date'
      });
    });

    it('should return 400 if limit is invalid', async () => {
      const { getProductAnalytics } = require('../analyticsController');
      req.query = {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        limit: 'invalid'
      };

      await getProductAnalytics(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Limit must be a number between 1 and 100'
      });
    });

    it('should return 400 if limit is less than 1', async () => {
      const { getProductAnalytics } = require('../analyticsController');
      req.query = {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        limit: 0
      };

      await getProductAnalytics(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Limit must be a number between 1 and 100'
      });
    });

    it('should return 400 if limit is greater than 100', async () => {
      const { getProductAnalytics } = require('../analyticsController');
      req.query = {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        limit: 101
      };

      await getProductAnalytics(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Limit must be a number between 1 and 100'
      });
    });

    it('should use default limit of 10 if not provided', async () => {
      const { getProductAnalytics } = require('../analyticsController');
      const Product = require('../../models/Product');
      
      req.query = {
        startDate: '2024-01-01',
        endDate: '2024-01-31'
      };

      Order.aggregate = jest.fn()
        .mockResolvedValueOnce([]) // topSellingProducts
        .mockResolvedValueOnce([]) // topRevenueProducts
        .mockResolvedValueOnce([]) // categoryBreakdown
        .mockResolvedValueOnce([]); // recentSales

      const mockLeanFn = jest.fn().mockResolvedValue([]);
      const mockLimitFn = jest.fn().mockReturnValue({ lean: mockLeanFn });
      const mockSelectFn = jest.fn().mockReturnValue({ limit: mockLimitFn, lean: mockLeanFn });
      
      Product.find = jest.fn().mockReturnValue({ select: mockSelectFn });

      await getProductAnalytics(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('Product Analytics Aggregation', () => {
    it('should return product analytics with all metrics', async () => {
      const { getProductAnalytics } = require('../analyticsController');
      const Product = require('../../models/Product');
      
      req.query = {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        limit: 10
      };

      const mockTopSelling = [
        { productId: 'prod1', name: 'Product 1', quantitySold: 100, revenue: 50000 },
        { productId: 'prod2', name: 'Product 2', quantitySold: 80, revenue: 40000 }
      ];

      const mockTopRevenue = [
        { productId: 'prod3', name: 'Product 3', revenue: 60000, quantitySold: 50 },
        { productId: 'prod1', name: 'Product 1', revenue: 50000, quantitySold: 100 }
      ];

      const mockCategoryBreakdown = [
        { category: 'Diagnostic Equipment', revenue: 100000, orderCount: 50 },
        { category: 'Surgical Instruments', revenue: 80000, orderCount: 40 }
      ];

      const mockRecentSales = [
        { _id: 'prod1', lastSaleDate: new Date() },
        { _id: 'prod2', lastSaleDate: new Date() }
      ];

      const mockLowStockProducts = [
        { _id: 'prod4', name: 'Product 4', stock: 5, minStock: 10 },
        { _id: 'prod5', name: 'Product 5', stock: 3, minStock: 10 }
      ];

      const mockAllActiveProducts = [
        { _id: 'prod1', name: 'Product 1' },
        { _id: 'prod2', name: 'Product 2' },
        { _id: 'prod6', name: 'Product 6' } // This one has no recent sales
      ];

      Order.aggregate = jest.fn()
        .mockResolvedValueOnce(mockTopSelling)
        .mockResolvedValueOnce(mockTopRevenue)
        .mockResolvedValueOnce(mockCategoryBreakdown)
        .mockResolvedValueOnce(mockRecentSales);

      Product.find = jest.fn()
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              lean: jest.fn().mockResolvedValue(mockLowStockProducts)
            })
          })
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue(mockAllActiveProducts)
          })
        });

      await getProductAnalytics(req, res);

      expect(Order.aggregate).toHaveBeenCalledTimes(4);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          topSellingProducts: mockTopSelling,
          topRevenueProducts: mockTopRevenue,
          lowStockAlerts: [
            { productId: 'prod4', name: 'Product 4', currentStock: 5, minStock: 10 },
            { productId: 'prod5', name: 'Product 5', currentStock: 3, minStock: 10 }
          ],
          categoryBreakdown: mockCategoryBreakdown,
          slowMovingInventory: [
            { productId: 'prod6', name: 'Product 6', daysSinceLastSale: 30 }
          ]
        },
        cached: false
      });
    });

    it('should filter orders by completed, paid, or delivered status', async () => {
      const { getProductAnalytics } = require('../analyticsController');
      const Product = require('../../models/Product');
      
      req.query = {
        startDate: '2024-01-01',
        endDate: '2024-01-31'
      };

      Order.aggregate = jest.fn()
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      Product.find = jest.fn()
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              lean: jest.fn().mockResolvedValue([])
            })
          })
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue([])
          })
        });

      await getProductAnalytics(req, res);

      const firstCall = Order.aggregate.mock.calls[0][0];
      expect(firstCall[0].$match.status).toEqual({ $in: ['completed', 'paid', 'delivered'] });
    });

    it('should identify low stock products correctly', async () => {
      const { getProductAnalytics } = require('../analyticsController');
      const Product = require('../../models/Product');
      
      req.query = {
        startDate: '2024-01-01',
        endDate: '2024-01-31'
      };

      const mockLowStockProducts = [
        { _id: 'prod1', name: 'Product 1', stock: 5, minStock: 10 },
        { _id: 'prod2', name: 'Product 2', stock: 0, minStock: 10 }
      ];

      Order.aggregate = jest.fn()
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      Product.find = jest.fn()
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              lean: jest.fn().mockResolvedValue(mockLowStockProducts)
            })
          })
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue([])
          })
        });

      await getProductAnalytics(req, res);

      const lowStockCall = Product.find.mock.calls[0][0];
      expect(lowStockCall.stock).toEqual({ $lt: 10 });
      expect(lowStockCall.isActive).toBe(true);
    });

    it('should identify slow-moving inventory correctly', async () => {
      const { getProductAnalytics } = require('../analyticsController');
      const Product = require('../../models/Product');
      
      req.query = {
        startDate: '2024-01-01',
        endDate: '2024-01-31'
      };

      const mockRecentSales = [
        { _id: 'prod1', lastSaleDate: new Date() }
      ];

      const mockAllActiveProducts = [
        { _id: 'prod1', name: 'Product 1' },
        { _id: 'prod2', name: 'Product 2' }, // No recent sales
        { _id: 'prod3', name: 'Product 3' }  // No recent sales
      ];

      Order.aggregate = jest.fn()
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce(mockRecentSales);

      Product.find = jest.fn()
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              lean: jest.fn().mockResolvedValue([])
            })
          })
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue(mockAllActiveProducts)
          })
        });

      await getProductAnalytics(req, res);

      const responseData = res.json.mock.calls[0][0].data;
      expect(responseData.slowMovingInventory).toHaveLength(2);
      expect(responseData.slowMovingInventory).toEqual([
        { productId: 'prod2', name: 'Product 2', daysSinceLastSale: 30 },
        { productId: 'prod3', name: 'Product 3', daysSinceLastSale: 30 }
      ]);
    });

    it('should handle empty results gracefully', async () => {
      const { getProductAnalytics } = require('../analyticsController');
      const Product = require('../../models/Product');
      
      req.query = {
        startDate: '2024-01-01',
        endDate: '2024-01-31'
      };

      Order.aggregate = jest.fn()
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      Product.find = jest.fn()
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              lean: jest.fn().mockResolvedValue([])
            })
          })
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue([])
          })
        });

      await getProductAnalytics(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          topSellingProducts: [],
          topRevenueProducts: [],
          lowStockAlerts: [],
          categoryBreakdown: [],
          slowMovingInventory: []
        },
        cached: false
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      const { getProductAnalytics } = require('../analyticsController');
      req.query = {
        startDate: '2024-01-01',
        endDate: '2024-01-31'
      };

      Order.aggregate = jest.fn().mockRejectedValue(new Error('Database error'));

      await getProductAnalytics(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to fetch product analytics',
        error: undefined
      });
    });
  });
});


describe('Analytics Controller - getCustomerAnalytics', () => {
  let req, res;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Mock request and response objects
    req = {
      query: {}
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    // Mock cache service
    CacheService.mockImplementation(() => ({
      get: jest.fn().mockReturnValue(null),
      set: jest.fn(),
      generateKey: jest.fn((prefix, params) => `${prefix}:${JSON.stringify(params)}`)
    }));
  });

  describe('Input Validation', () => {
    it('should return 400 if startDate is missing', async () => {
      const { getCustomerAnalytics } = require('../analyticsController');
      req.query = { endDate: '2024-01-31' };

      await getCustomerAnalytics(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Start date and end date are required'
      });
    });

    it('should return 400 if endDate is missing', async () => {
      const { getCustomerAnalytics } = require('../analyticsController');
      req.query = { startDate: '2024-01-01' };

      await getCustomerAnalytics(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Start date and end date are required'
      });
    });

    it('should return 400 if date format is invalid', async () => {
      const { getCustomerAnalytics } = require('../analyticsController');
      req.query = {
        startDate: 'invalid-date',
        endDate: '2024-01-31'
      };

      await getCustomerAnalytics(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid date format'
      });
    });

    it('should return 400 if start date is after end date', async () => {
      const { getCustomerAnalytics } = require('../analyticsController');
      req.query = {
        startDate: '2024-01-31',
        endDate: '2024-01-01'
      };

      await getCustomerAnalytics(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Start date must be before end date'
      });
    });
  });

  describe('Customer Analytics Aggregation', () => {
    it('should return customer analytics with all metrics', async () => {
      const { getCustomerAnalytics } = require('../analyticsController');
      req.query = {
        startDate: '2024-01-01',
        endDate: '2024-01-31'
      };

      const mockFirstOrders = [
        { _id: 'user1', firstOrderDate: new Date('2024-01-15') },
        { _id: 'user2', firstOrderDate: new Date('2023-12-01') },
        { _id: 'user3', firstOrderDate: new Date('2024-01-20') }
      ];

      const mockCurrentPeriodCustomers = [
        { _id: 'user1' },
        { _id: 'user2' },
        { _id: 'user3' }
      ];

      const mockPreviousPeriodCustomers = [
        { _id: 'user2' }
      ];

      const mockCustomerData = [
        {
          userId: 'user1',
          name: 'Customer 1',
          email: 'customer1@test.com',
          accountType: 'Retail',
          lifetimeValue: 500,
          orderCount: 2,
          orderDates: [new Date('2024-01-15'), new Date('2024-01-25')]
        },
        {
          userId: 'user2',
          name: 'Customer 2',
          email: 'customer2@test.com',
          accountType: 'B2B',
          lifetimeValue: 1000,
          orderCount: 3,
          orderDates: [new Date('2023-12-01'), new Date('2024-01-10'), new Date('2024-01-20')]
        },
        {
          userId: 'user3',
          name: 'Customer 3',
          email: 'customer3@test.com',
          accountType: 'Retail',
          lifetimeValue: 300,
          orderCount: 1,
          orderDates: [new Date('2024-01-20')]
        }
      ];

      Order.aggregate = jest.fn()
        .mockResolvedValueOnce(mockFirstOrders)
        .mockResolvedValueOnce(mockCurrentPeriodCustomers)
        .mockResolvedValueOnce(mockPreviousPeriodCustomers)
        .mockResolvedValueOnce(mockCustomerData);

      await getCustomerAnalytics(req, res);

      expect(Order.aggregate).toHaveBeenCalledTimes(4);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          newCustomers: 2,
          returningCustomers: 1,
          retentionRate: 100,
          avgLifetimeValue: 600,
          topCustomers: expect.any(Array),
          customerSegmentation: {
            b2b: { count: 1, revenue: 1000 },
            retail: { count: 2, revenue: 800 }
          },
          avgTimeBetweenOrders: expect.any(Number)
        }),
        cached: false
      });
    });

    it('should correctly count new vs returning customers', async () => {
      const { getCustomerAnalytics } = require('../analyticsController');
      req.query = {
        startDate: '2024-01-01',
        endDate: '2024-01-31'
      };

      const mockFirstOrders = [
        { _id: 'user1', firstOrderDate: new Date('2024-01-15') },
        { _id: 'user2', firstOrderDate: new Date('2023-12-01') }
      ];

      const mockCurrentPeriodCustomers = [
        { _id: 'user1' },
        { _id: 'user2' }
      ];

      Order.aggregate = jest.fn()
        .mockResolvedValueOnce(mockFirstOrders)
        .mockResolvedValueOnce(mockCurrentPeriodCustomers)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      await getCustomerAnalytics(req, res);

      const responseData = res.json.mock.calls[0][0].data;
      expect(responseData.newCustomers).toBe(1);
      expect(responseData.returningCustomers).toBe(1);
    });

    it('should calculate retention rate correctly', async () => {
      const { getCustomerAnalytics } = require('../analyticsController');
      req.query = {
        startDate: '2024-01-01',
        endDate: '2024-01-31'
      };

      const mockPreviousPeriodCustomers = [
        { _id: 'user1' },
        { _id: 'user2' },
        { _id: 'user3' },
        { _id: 'user4' }
      ];

      const mockCurrentPeriodCustomers = [
        { _id: 'user1' },
        { _id: 'user3' },
        { _id: 'user5' }
      ];

      Order.aggregate = jest.fn()
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce(mockCurrentPeriodCustomers)
        .mockResolvedValueOnce(mockPreviousPeriodCustomers)
        .mockResolvedValueOnce([]);

      await getCustomerAnalytics(req, res);

      const responseData = res.json.mock.calls[0][0].data;
      expect(responseData.retentionRate).toBe(50);
    });

    it('should segment customers by type', async () => {
      const { getCustomerAnalytics } = require('../analyticsController');
      req.query = {
        startDate: '2024-01-01',
        endDate: '2024-01-31'
      };

      const mockCustomerData = [
        {
          userId: 'user1',
          name: 'Customer 1',
          email: 'customer1@test.com',
          accountType: 'B2B',
          lifetimeValue: 1000,
          orderCount: 2,
          orderDates: []
        },
        {
          userId: 'user2',
          name: 'Customer 2',
          email: 'customer2@test.com',
          accountType: 'B2B',
          lifetimeValue: 1500,
          orderCount: 3,
          orderDates: []
        },
        {
          userId: 'user3',
          name: 'Customer 3',
          email: 'customer3@test.com',
          accountType: 'Retail',
          lifetimeValue: 500,
          orderCount: 1,
          orderDates: []
        }
      ];

      Order.aggregate = jest.fn()
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce(mockCustomerData);

      await getCustomerAnalytics(req, res);

      const responseData = res.json.mock.calls[0][0].data;
      expect(responseData.customerSegmentation).toEqual({
        b2b: { count: 2, revenue: 2500 },
        retail: { count: 1, revenue: 500 }
      });
    });

    it('should return top 10 customers sorted by spending', async () => {
      const { getCustomerAnalytics } = require('../analyticsController');
      req.query = {
        startDate: '2024-01-01',
        endDate: '2024-01-31'
      };

      const mockCustomerData = Array.from({ length: 15 }, (_, i) => ({
        userId: `user${i}`,
        name: `Customer ${i}`,
        email: `customer${i}@test.com`,
        accountType: 'Retail',
        lifetimeValue: (15 - i) * 100,
        orderCount: 2,
        orderDates: []
      }));

      Order.aggregate = jest.fn()
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce(mockCustomerData);

      await getCustomerAnalytics(req, res);

      const responseData = res.json.mock.calls[0][0].data;
      expect(responseData.topCustomers).toHaveLength(10);
      
      for (let i = 1; i < responseData.topCustomers.length; i++) {
        expect(responseData.topCustomers[i - 1].totalSpent).toBeGreaterThanOrEqual(
          responseData.topCustomers[i].totalSpent
        );
      }
    });

    it('should handle empty customer data gracefully', async () => {
      const { getCustomerAnalytics } = require('../analyticsController');
      req.query = {
        startDate: '2024-01-01',
        endDate: '2024-01-31'
      };

      Order.aggregate = jest.fn()
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      await getCustomerAnalytics(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          newCustomers: 0,
          returningCustomers: 0,
          retentionRate: 0,
          avgLifetimeValue: 0,
          topCustomers: [],
          customerSegmentation: {
            b2b: { count: 0, revenue: 0 },
            retail: { count: 0, revenue: 0 }
          },
          avgTimeBetweenOrders: 0
        },
        cached: false
      });
    });

    it('should filter orders by completed, paid, or delivered status', async () => {
      const { getCustomerAnalytics } = require('../analyticsController');
      req.query = {
        startDate: '2024-01-01',
        endDate: '2024-01-31'
      };

      Order.aggregate = jest.fn()
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      await getCustomerAnalytics(req, res);

      const firstCall = Order.aggregate.mock.calls[0][0];
      expect(firstCall[0].$match.status).toEqual({ $in: ['completed', 'paid', 'delivered'] });

      const fourthCall = Order.aggregate.mock.calls[3][0];
      expect(fourthCall[0].$match.status).toEqual({ $in: ['completed', 'paid', 'delivered'] });
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      const { getCustomerAnalytics } = require('../analyticsController');
      req.query = {
        startDate: '2024-01-01',
        endDate: '2024-01-31'
      };

      Order.aggregate = jest.fn().mockRejectedValue(new Error('Database error'));

      await getCustomerAnalytics(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to fetch customer analytics',
        error: undefined
      });
    });
  });
});

describe('Analytics Controller - getPaymentAnalytics', () => {
  let req, res;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Mock request and response objects
    req = {
      query: {}
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    // Mock cache service
    CacheService.mockImplementation(() => ({
      get: jest.fn().mockReturnValue(null),
      set: jest.fn(),
      generateKey: jest.fn((prefix, params) => `${prefix}:${JSON.stringify(params)}`)
    }));
  });

  describe('Input Validation', () => {
    it('should return 400 if startDate is missing', async () => {
      const { getPaymentAnalytics } = require('../analyticsController');
      req.query = { endDate: '2024-01-31' };

      await getPaymentAnalytics(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Start date and end date are required'
      });
    });

    it('should return 400 if endDate is missing', async () => {
      const { getPaymentAnalytics } = require('../analyticsController');
      req.query = { startDate: '2024-01-01' };

      await getPaymentAnalytics(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Start date and end date are required'
      });
    });

    it('should return 400 if date format is invalid', async () => {
      const { getPaymentAnalytics } = require('../analyticsController');
      req.query = {
        startDate: 'invalid-date',
        endDate: '2024-01-31'
      };

      await getPaymentAnalytics(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid date format'
      });
    });

    it('should return 400 if start date is after end date', async () => {
      const { getPaymentAnalytics } = require('../analyticsController');
      req.query = {
        startDate: '2024-01-31',
        endDate: '2024-01-01'
      };

      await getPaymentAnalytics(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Start date must be before end date'
      });
    });
  });

  describe('Payment Analytics Aggregation', () => {
    it('should return payment analytics with all metrics', async () => {
      const { getPaymentAnalytics } = require('../analyticsController');
      const User = require('../../models/User');
      
      req.query = {
        startDate: '2024-01-01',
        endDate: '2024-01-31'
      };

      const mockMethodDistribution = [
        { method: 'bkash', count: 50, totalAmount: 250000, successfulPayments: 48, failedPayments: 2 },
        { method: 'bank_transfer', count: 30, totalAmount: 300000, successfulPayments: 29, failedPayments: 1 },
        { method: 'cash', count: 20, totalAmount: 100000, successfulPayments: 20, failedPayments: 0 }
      ];

      const mockOverallStats = [{ totalPayments: 100, successfulPayments: 97 }];

      const mockFailedPayments = [
        { orderId: 'ORD-001', amount: 5000, method: 'bkash', reason: 'Insufficient funds', timestamp: new Date() },
        { orderId: 'ORD-002', amount: 10000, method: 'bank_transfer', reason: 'Payment declined', timestamp: new Date() }
      ];

      const mockB2BUsers = [
        { creditLimit: 100000, creditUsed: 50000 },
        { creditLimit: 200000, creditUsed: 100000 }
      ];

      Order.aggregate = jest.fn()
        .mockResolvedValueOnce(mockMethodDistribution)
        .mockResolvedValueOnce(mockOverallStats)
        .mockResolvedValueOnce(mockFailedPayments);

      User.find = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(mockB2BUsers)
        })
      });

      await getPaymentAnalytics(req, res);

      expect(Order.aggregate).toHaveBeenCalledTimes(3);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          methodDistribution: [
            { method: 'bkash', count: 50, percentage: 50, totalAmount: 250000, successRate: 96, needsReview: false },
            { method: 'bank_transfer', count: 30, percentage: 30, totalAmount: 300000, successRate: 96.67, needsReview: false },
            { method: 'cash', count: 20, percentage: 20, totalAmount: 100000, successRate: 100, needsReview: false }
          ],
          successRate: 97,
          failedPayments: mockFailedPayments,
          avgProcessingTime: expect.any(Array),
          b2bCreditUtilization: {
            totalLimit: 300000,
            totalUsed: 150000,
            utilizationRate: 50
          }
        },
        cached: false
      });
    });

    it('should calculate payment success rate correctly', async () => {
      const { getPaymentAnalytics } = require('../analyticsController');
      const User = require('../../models/User');
      
      req.query = {
        startDate: '2024-01-01',
        endDate: '2024-01-31'
      };

      const mockOverallStats = [{ totalPayments: 100, successfulPayments: 85 }];

      Order.aggregate = jest.fn()
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce(mockOverallStats)
        .mockResolvedValueOnce([]);

      User.find = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue([])
        })
      });

      await getPaymentAnalytics(req, res);

      const responseData = res.json.mock.calls[0][0].data;
      expect(responseData.successRate).toBe(85);
    });

    it('should flag payment methods with success rate below 90%', async () => {
      const { getPaymentAnalytics } = require('../analyticsController');
      const User = require('../../models/User');
      
      req.query = {
        startDate: '2024-01-01',
        endDate: '2024-01-31'
      };

      const mockMethodDistribution = [
        { method: 'bkash', count: 100, totalAmount: 500000, successfulPayments: 85, failedPayments: 15 },
        { method: 'cash', count: 50, totalAmount: 250000, successfulPayments: 50, failedPayments: 0 }
      ];

      const mockOverallStats = [{ totalPayments: 150, successfulPayments: 135 }];

      Order.aggregate = jest.fn()
        .mockResolvedValueOnce(mockMethodDistribution)
        .mockResolvedValueOnce(mockOverallStats)
        .mockResolvedValueOnce([]);

      User.find = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue([])
        })
      });

      await getPaymentAnalytics(req, res);

      const responseData = res.json.mock.calls[0][0].data;
      expect(responseData.methodDistribution[0].needsReview).toBe(true);
      expect(responseData.methodDistribution[1].needsReview).toBe(false);
    });

    it('should calculate B2B credit utilization correctly', async () => {
      const { getPaymentAnalytics } = require('../analyticsController');
      const User = require('../../models/User');
      
      req.query = {
        startDate: '2024-01-01',
        endDate: '2024-01-31'
      };

      const mockB2BUsers = [
        { creditLimit: 100000, creditUsed: 75000 },
        { creditLimit: 200000, creditUsed: 50000 },
        { creditLimit: 150000, creditUsed: 100000 }
      ];

      Order.aggregate = jest.fn()
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ totalPayments: 100, successfulPayments: 95 }])
        .mockResolvedValueOnce([]);

      User.find = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(mockB2BUsers)
        })
      });

      await getPaymentAnalytics(req, res);

      const responseData = res.json.mock.calls[0][0].data;
      expect(responseData.b2bCreditUtilization.totalLimit).toBe(450000);
      expect(responseData.b2bCreditUtilization.totalUsed).toBe(225000);
      expect(responseData.b2bCreditUtilization.utilizationRate).toBe(50);
    });

    it('should handle zero B2B credit limit gracefully', async () => {
      const { getPaymentAnalytics } = require('../analyticsController');
      const User = require('../../models/User');
      
      req.query = {
        startDate: '2024-01-01',
        endDate: '2024-01-31'
      };

      Order.aggregate = jest.fn()
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ totalPayments: 100, successfulPayments: 95 }])
        .mockResolvedValueOnce([]);

      User.find = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue([])
        })
      });

      await getPaymentAnalytics(req, res);

      const responseData = res.json.mock.calls[0][0].data;
      expect(responseData.b2bCreditUtilization.utilizationRate).toBe(0);
    });

    it('should calculate percentages correctly for payment method distribution', async () => {
      const { getPaymentAnalytics } = require('../analyticsController');
      const User = require('../../models/User');
      
      req.query = {
        startDate: '2024-01-01',
        endDate: '2024-01-31'
      };

      const mockMethodDistribution = [
        { method: 'bkash', count: 60, totalAmount: 300000, successfulPayments: 58, failedPayments: 2 },
        { method: 'cash', count: 40, totalAmount: 200000, successfulPayments: 40, failedPayments: 0 }
      ];

      const mockOverallStats = [{ totalPayments: 100, successfulPayments: 98 }];

      Order.aggregate = jest.fn()
        .mockResolvedValueOnce(mockMethodDistribution)
        .mockResolvedValueOnce(mockOverallStats)
        .mockResolvedValueOnce([]);

      User.find = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue([])
        })
      });

      await getPaymentAnalytics(req, res);

      const responseData = res.json.mock.calls[0][0].data;
      expect(responseData.methodDistribution[0].percentage).toBe(60);
      expect(responseData.methodDistribution[1].percentage).toBe(40);
    });

    it('should limit failed payments to 50 results', async () => {
      const { getPaymentAnalytics } = require('../analyticsController');
      const User = require('../../models/User');
      
      req.query = {
        startDate: '2024-01-01',
        endDate: '2024-01-31'
      };

      Order.aggregate = jest.fn()
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ totalPayments: 100, successfulPayments: 95 }])
        .mockResolvedValueOnce([]);

      User.find = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue([])
        })
      });

      await getPaymentAnalytics(req, res);

      const failedPaymentsPipeline = Order.aggregate.mock.calls[2][0];
      const limitStage = failedPaymentsPipeline.find(stage => stage.$limit);
      expect(limitStage.$limit).toBe(50);
    });

    it('should handle empty payment data gracefully', async () => {
      const { getPaymentAnalytics } = require('../analyticsController');
      const User = require('../../models/User');
      
      req.query = {
        startDate: '2024-01-01',
        endDate: '2024-01-31'
      };

      Order.aggregate = jest.fn()
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      User.find = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue([])
        })
      });

      await getPaymentAnalytics(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          methodDistribution: [],
          successRate: 0,
          failedPayments: [],
          avgProcessingTime: [],
          b2bCreditUtilization: {
            totalLimit: 0,
            totalUsed: 0,
            utilizationRate: 0
          }
        },
        cached: false
      });
    });

    it('should query B2B users with credit limit greater than 0', async () => {
      const { getPaymentAnalytics } = require('../analyticsController');
      const User = require('../../models/User');
      
      req.query = {
        startDate: '2024-01-01',
        endDate: '2024-01-31'
      };

      Order.aggregate = jest.fn()
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ totalPayments: 100, successfulPayments: 95 }])
        .mockResolvedValueOnce([]);

      User.find = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue([])
        })
      });

      await getPaymentAnalytics(req, res);

      expect(User.find).toHaveBeenCalledWith({
        accountType: 'B2B',
        creditLimit: { $gt: 0 }
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      const { getPaymentAnalytics } = require('../analyticsController');
      req.query = {
        startDate: '2024-01-01',
        endDate: '2024-01-31'
      };

      Order.aggregate = jest.fn().mockRejectedValue(new Error('Database error'));

      await getPaymentAnalytics(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to fetch payment analytics',
        error: undefined
      });
    });
  });
});

describe('Analytics Controller - getRealTimeMetrics', () => {
  let req, res;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Mock request and response objects
    req = {};

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    // Mock cache service
    CacheService.mockImplementation(() => ({
      get: jest.fn().mockReturnValue(null),
      set: jest.fn(),
      generateKey: jest.fn((prefix, params) => `${prefix}:${JSON.stringify(params)}`)
    }));
  });

  describe('Real-Time Metrics Aggregation', () => {
    it('should return real-time metrics with all data', async () => {
      const { getRealTimeMetrics } = require('../analyticsController');

      const mockTodaySales = [{ totalSales: 50000, orderCount: 10 }];
      const mockYesterdayOrders = [{ orderCount: 8 }];
      const mockPendingOrders = [{ count: 5 }];
      const mockTodayOrders = [{ orderCount: 10 }];
      const mockActiveUsers = [{ count: 3 }];
      const mockTodayVisitors = [{ count: 10 }];

      Order.aggregate = jest.fn()
        .mockResolvedValueOnce(mockTodaySales)
        .mockResolvedValueOnce(mockYesterdayOrders)
        .mockResolvedValueOnce(mockPendingOrders)
        .mockResolvedValueOnce(mockTodayOrders)
        .mockResolvedValueOnce(mockActiveUsers)
        .mockResolvedValueOnce(mockTodayVisitors);

      await getRealTimeMetrics(req, res);

      expect(Order.aggregate).toHaveBeenCalledTimes(6);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          todaySales: 50000,
          activeUsers: 3,
          pendingOrders: 5,
          todayOrderCount: 10,
          yesterdayOrderCount: 8,
          orderCountChange: 25,
          conversionRate: 100,
          lastUpdated: expect.any(String)
        },
        cached: false
      });
    });

    it('should filter today sales by completed or paid status', async () => {
      const { getRealTimeMetrics } = require('../analyticsController');

      Order.aggregate = jest.fn()
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      await getRealTimeMetrics(req, res);

      const todaySalesPipeline = Order.aggregate.mock.calls[0][0];
      expect(todaySalesPipeline[0].$match.status).toEqual({ $in: ['completed', 'paid'] });
    });

    it('should calculate order count change correctly', async () => {
      const { getRealTimeMetrics } = require('../analyticsController');

      const mockTodaySales = [{ totalSales: 30000, orderCount: 15 }];
      const mockYesterdayOrders = [{ orderCount: 10 }];
      const mockTodayOrders = [{ orderCount: 15 }];

      Order.aggregate = jest.fn()
        .mockResolvedValueOnce(mockTodaySales)
        .mockResolvedValueOnce(mockYesterdayOrders)
        .mockResolvedValueOnce([{ count: 0 }])
        .mockResolvedValueOnce(mockTodayOrders)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ count: 15 }]);

      await getRealTimeMetrics(req, res);

      const responseData = res.json.mock.calls[0][0].data;
      expect(responseData.orderCountChange).toBe(50);
    });

    it('should calculate 100% order count change when yesterday had no orders', async () => {
      const { getRealTimeMetrics } = require('../analyticsController');

      const mockTodaySales = [{ totalSales: 20000, orderCount: 5 }];
      const mockTodayOrders = [{ orderCount: 5 }];

      Order.aggregate = jest.fn()
        .mockResolvedValueOnce(mockTodaySales)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ count: 0 }])
        .mockResolvedValueOnce(mockTodayOrders)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ count: 5 }]);

      await getRealTimeMetrics(req, res);

      const responseData = res.json.mock.calls[0][0].data;
      expect(responseData.orderCountChange).toBe(100);
    });

    it('should calculate 0% order count change when both days have no orders', async () => {
      const { getRealTimeMetrics } = require('../analyticsController');

      Order.aggregate = jest.fn()
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ count: 0 }])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      await getRealTimeMetrics(req, res);

      const responseData = res.json.mock.calls[0][0].data;
      expect(responseData.orderCountChange).toBe(0);
    });

    it('should calculate conversion rate correctly', async () => {
      const { getRealTimeMetrics } = require('../analyticsController');

      const mockTodaySales = [{ totalSales: 40000, orderCount: 8 }];
      const mockTodayOrders = [{ orderCount: 8 }];
      const mockTodayVisitors = [{ count: 20 }];

      Order.aggregate = jest.fn()
        .mockResolvedValueOnce(mockTodaySales)
        .mockResolvedValueOnce([{ orderCount: 5 }])
        .mockResolvedValueOnce([{ count: 2 }])
        .mockResolvedValueOnce(mockTodayOrders)
        .mockResolvedValueOnce([{ count: 1 }])
        .mockResolvedValueOnce(mockTodayVisitors);

      await getRealTimeMetrics(req, res);

      const responseData = res.json.mock.calls[0][0].data;
      expect(responseData.conversionRate).toBe(40);
    });

    it('should calculate 100% conversion rate when visitors equals orders', async () => {
      const { getRealTimeMetrics } = require('../analyticsController');

      const mockTodaySales = [{ totalSales: 25000, orderCount: 5 }];
      const mockTodayOrders = [{ orderCount: 5 }];
      const mockTodayVisitors = [{ count: 5 }];

      Order.aggregate = jest.fn()
        .mockResolvedValueOnce(mockTodaySales)
        .mockResolvedValueOnce([{ orderCount: 3 }])
        .mockResolvedValueOnce([{ count: 1 }])
        .mockResolvedValueOnce(mockTodayOrders)
        .mockResolvedValueOnce([{ count: 2 }])
        .mockResolvedValueOnce(mockTodayVisitors);

      await getRealTimeMetrics(req, res);

      const responseData = res.json.mock.calls[0][0].data;
      expect(responseData.conversionRate).toBe(100);
    });

    it('should calculate 0% conversion rate when no visitors or orders', async () => {
      const { getRealTimeMetrics } = require('../analyticsController');

      Order.aggregate = jest.fn()
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ count: 0 }])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      await getRealTimeMetrics(req, res);

      const responseData = res.json.mock.calls[0][0].data;
      expect(responseData.conversionRate).toBe(0);
    });

    it('should count active users from last 15 minutes', async () => {
      const { getRealTimeMetrics } = require('../analyticsController');

      const mockActiveUsers = [{ count: 7 }];

      Order.aggregate = jest.fn()
        .mockResolvedValueOnce([{ totalSales: 10000, orderCount: 2 }])
        .mockResolvedValueOnce([{ orderCount: 1 }])
        .mockResolvedValueOnce([{ count: 3 }])
        .mockResolvedValueOnce([{ orderCount: 2 }])
        .mockResolvedValueOnce(mockActiveUsers)
        .mockResolvedValueOnce([{ count: 2 }]);

      await getRealTimeMetrics(req, res);

      const responseData = res.json.mock.calls[0][0].data;
      expect(responseData.activeUsers).toBe(7);
    });

    it('should count pending orders requiring action', async () => {
      const { getRealTimeMetrics } = require('../analyticsController');

      const mockPendingOrders = [{ count: 12 }];

      Order.aggregate = jest.fn()
        .mockResolvedValueOnce([{ totalSales: 15000, orderCount: 3 }])
        .mockResolvedValueOnce([{ orderCount: 2 }])
        .mockResolvedValueOnce(mockPendingOrders)
        .mockResolvedValueOnce([{ orderCount: 3 }])
        .mockResolvedValueOnce([{ count: 1 }])
        .mockResolvedValueOnce([{ count: 3 }]);

      await getRealTimeMetrics(req, res);

      const responseData = res.json.mock.calls[0][0].data;
      expect(responseData.pendingOrders).toBe(12);

      const pendingOrdersPipeline = Order.aggregate.mock.calls[2][0];
      expect(pendingOrdersPipeline[0].$match.status).toEqual({ $in: ['pending', 'confirmed'] });
    });

    it('should handle empty data gracefully', async () => {
      const { getRealTimeMetrics } = require('../analyticsController');

      Order.aggregate = jest.fn()
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      await getRealTimeMetrics(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          todaySales: 0,
          activeUsers: 0,
          pendingOrders: 0,
          todayOrderCount: 0,
          yesterdayOrderCount: 0,
          orderCountChange: 0,
          conversionRate: 0,
          lastUpdated: expect.any(String)
        },
        cached: false
      });
    });

    it('should include lastUpdated timestamp in ISO format', async () => {
      const { getRealTimeMetrics } = require('../analyticsController');

      Order.aggregate = jest.fn()
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      await getRealTimeMetrics(req, res);

      const responseData = res.json.mock.calls[0][0].data;
      expect(responseData.lastUpdated).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    it('should round sales to 2 decimal places', async () => {
      const { getRealTimeMetrics } = require('../analyticsController');

      const mockTodaySales = [{ totalSales: 12345.6789, orderCount: 5 }];

      Order.aggregate = jest.fn()
        .mockResolvedValueOnce(mockTodaySales)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ orderCount: 5 }])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ count: 5 }]);

      await getRealTimeMetrics(req, res);

      const responseData = res.json.mock.calls[0][0].data;
      expect(responseData.todaySales).toBe(12345.68);
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      const { getRealTimeMetrics } = require('../analyticsController');

      Order.aggregate = jest.fn().mockRejectedValue(new Error('Database error'));

      await getRealTimeMetrics(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to fetch real-time metrics',
        error: undefined
      });
    });
  });
});

describe('Analytics Controller - getTrafficAnalytics', () => {
  let req, res;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Mock request and response objects
    req = {
      query: {}
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    // Mock cache service
    CacheService.mockImplementation(() => ({
      get: jest.fn().mockReturnValue(null),
      set: jest.fn(),
      generateKey: jest.fn((prefix, params) => `${prefix}:${JSON.stringify(params)}`)
    }));
  });

  describe('Input Validation', () => {
    it('should return 400 if startDate is missing', async () => {
      const { getTrafficAnalytics } = require('../analyticsController');
      req.query = { endDate: '2024-01-31' };

      await getTrafficAnalytics(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Start date and end date are required'
      });
    });

    it('should return 400 if endDate is missing', async () => {
      const { getTrafficAnalytics } = require('../analyticsController');
      req.query = { startDate: '2024-01-01' };

      await getTrafficAnalytics(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Start date and end date are required'
      });
    });

    it('should return 400 if date format is invalid', async () => {
      const { getTrafficAnalytics } = require('../analyticsController');
      req.query = {
        startDate: 'invalid-date',
        endDate: '2024-01-31'
      };

      await getTrafficAnalytics(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid date format'
      });
    });

    it('should return 400 if start date is after end date', async () => {
      const { getTrafficAnalytics } = require('../analyticsController');
      req.query = {
        startDate: '2024-01-31',
        endDate: '2024-01-01'
      };

      await getTrafficAnalytics(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Start date must be before end date'
      });
    });
  });

  describe('Traffic Analytics Aggregation', () => {
    it('should return traffic analytics with all metrics', async () => {
      const { getTrafficAnalytics } = require('../analyticsController');
      
      req.query = {
        startDate: '2024-01-01',
        endDate: '2024-01-31'
      };

      const mockPageViews = [{ totalPageViews: 1500 }];
      const mockTopProducts = [
        { productId: 'prod1', name: 'Product 1', category: 'Category A', viewCount: 250 },
        { productId: 'prod2', name: 'Product 2', category: 'Category B', viewCount: 200 }
      ];
      const mockSearchQueries = [
        { searchTerm: 'Category A', searchCount: 150 },
        { searchTerm: 'Category B', searchCount: 100 }
      ];
      const mockSessionMetrics = [
        { userId: 'user1', orderCount: 3, sessionDuration: 300000, isBounce: 0 },
        { userId: 'user2', orderCount: 1, sessionDuration: 0, isBounce: 1 },
        { userId: 'user3', orderCount: 2, sessionDuration: 180000, isBounce: 0 }
      ];
      const mockTrafficSources = [
        { source: 'direct', count: 100 },
        { source: 'mobile', count: 80 },
        { source: 'referral', count: 20 }
      ];

      Order.aggregate = jest.fn()
        .mockResolvedValueOnce(mockPageViews)
        .mockResolvedValueOnce(mockTopProducts)
        .mockResolvedValueOnce(mockSearchQueries)
        .mockResolvedValueOnce(mockSessionMetrics)
        .mockResolvedValueOnce(mockTrafficSources);

      await getTrafficAnalytics(req, res);

      expect(Order.aggregate).toHaveBeenCalledTimes(5);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          pageViews: 1500,
          topViewedProducts: mockTopProducts,
          searchQueries: mockSearchQueries,
          bounceRate: 33.33,
          avgSessionDuration: 160,
          trafficSources: [
            { source: 'direct', count: 100, percentage: 50 },
            { source: 'mobile', count: 80, percentage: 40 },
            { source: 'referral', count: 20, percentage: 10 }
          ],
          metadata: {
            startDate: '2024-01-01',
            endDate: '2024-01-31',
            totalSessions: 3
          }
        },
        cached: false
      });
    });

    it('should calculate bounce rate correctly', async () => {
      const { getTrafficAnalytics } = require('../analyticsController');
      
      req.query = {
        startDate: '2024-01-01',
        endDate: '2024-01-31'
      };

      const mockSessionMetrics = [
        { userId: 'user1', orderCount: 1, sessionDuration: 0, isBounce: 1 },
        { userId: 'user2', orderCount: 1, sessionDuration: 0, isBounce: 1 },
        { userId: 'user3', orderCount: 2, sessionDuration: 120000, isBounce: 0 },
        { userId: 'user4', orderCount: 3, sessionDuration: 240000, isBounce: 0 }
      ];

      Order.aggregate = jest.fn()
        .mockResolvedValueOnce([{ totalPageViews: 100 }])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce(mockSessionMetrics)
        .mockResolvedValueOnce([]);

      await getTrafficAnalytics(req, res);

      const responseData = res.json.mock.calls[0][0].data;
      expect(responseData.bounceRate).toBe(50);
    });

    it('should calculate average session duration in seconds', async () => {
      const { getTrafficAnalytics } = require('../analyticsController');
      
      req.query = {
        startDate: '2024-01-01',
        endDate: '2024-01-31'
      };

      const mockSessionMetrics = [
        { userId: 'user1', orderCount: 2, sessionDuration: 120000, isBounce: 0 },
        { userId: 'user2', orderCount: 3, sessionDuration: 180000, isBounce: 0 },
        { userId: 'user3', orderCount: 2, sessionDuration: 300000, isBounce: 0 }
      ];

      Order.aggregate = jest.fn()
        .mockResolvedValueOnce([{ totalPageViews: 100 }])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce(mockSessionMetrics)
        .mockResolvedValueOnce([]);

      await getTrafficAnalytics(req, res);

      const responseData = res.json.mock.calls[0][0].data;
      expect(responseData.avgSessionDuration).toBe(200);
    });

    it('should handle zero sessions gracefully', async () => {
      const { getTrafficAnalytics } = require('../analyticsController');
      
      req.query = {
        startDate: '2024-01-01',
        endDate: '2024-01-31'
      };

      Order.aggregate = jest.fn()
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      await getTrafficAnalytics(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          pageViews: 0,
          topViewedProducts: [],
          searchQueries: [],
          bounceRate: 0,
          avgSessionDuration: 0,
          trafficSources: [],
          metadata: {
            startDate: '2024-01-01',
            endDate: '2024-01-31',
            totalSessions: 0
          }
        },
        cached: false
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      const { getTrafficAnalytics } = require('../analyticsController');
      
      req.query = {
        startDate: '2024-01-01',
        endDate: '2024-01-31'
      };

      Order.aggregate = jest.fn().mockRejectedValue(new Error('Database error'));

      await getTrafficAnalytics(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to fetch traffic analytics',
        error: undefined
      });
    });
  });
});
