const Order = require('../models/Order');
const CacheService = require('../services/cacheService');
const logger = require('../utils/logger');

// Initialize cache service with 5 minute TTL
const cacheService = new CacheService(300);

/**
 * Get sales analytics with aggregation by time period
 * @route GET /api/analytics/sales
 * @access Private (Admin, Manager)
 */
exports.getSalesAnalytics = async (req, res) => {
  try {
    const { startDate, endDate, groupBy = 'day' } = req.query;

    // Validate required parameters
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      });
    }

    // Validate groupBy parameter
    if (!['day', 'week', 'month'].includes(groupBy)) {
      return res.status(400).json({
        success: false,
        message: 'groupBy must be one of: day, week, month'
      });
    }

    // Parse and validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format'
      });
    }

    if (start > end) {
      return res.status(400).json({
        success: false,
        message: 'Start date must be before end date'
      });
    }

    // Check cache first
    const cacheKey = cacheService.generateKey('sales', { startDate, endDate, groupBy });
    const cachedData = cacheService.get(cacheKey);

    if (cachedData) {
      return res.status(200).json({
        success: true,
        data: cachedData,
        cached: true
      });
    }

    // Determine date format based on groupBy parameter
    let dateFormat;
    switch (groupBy) {
      case 'day':
        dateFormat = '%Y-%m-%d';
        break;
      case 'week':
        dateFormat = '%Y-W%V'; // ISO week format
        break;
      case 'month':
        dateFormat = '%Y-%m';
        break;
      default:
        dateFormat = '%Y-%m-%d';
    }

    // Build aggregation pipeline for current period
    const pipeline = [
      {
        $match: {
          createdAt: {
            $gte: start,
            $lte: end
          },
          status: { $in: ['delivered', 'processing', 'shipped'] }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: dateFormat, date: '$createdAt' }
          },
          revenue: { $sum: '$total' },
          orderCount: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      },
      {
        $project: {
          _id: 0,
          date: '$_id',
          revenue: 1,
          orderCount: 1
        }
      }
    ];

    // Execute aggregation
    const salesData = await Order.aggregate(pipeline);

    // Calculate total revenue for current period
    const totalRevenue = salesData.reduce((sum, item) => sum + item.revenue, 0);

    // Calculate previous period dates for growth comparison
    const periodDuration = end.getTime() - start.getTime();
    const previousStart = new Date(start.getTime() - periodDuration);
    const previousEnd = new Date(start.getTime() - 1); // Day before current period starts

    // Build aggregation pipeline for previous period
    const previousPipeline = [
      {
        $match: {
          createdAt: {
            $gte: previousStart,
            $lte: previousEnd
          },
          status: { $in: ['delivered', 'processing', 'shipped'] }
        }
      },
      {
        $group: {
          _id: null,
          revenue: { $sum: '$total' }
        }
      }
    ];

    // Execute previous period aggregation
    const previousPeriodData = await Order.aggregate(previousPipeline);
    const previousRevenue = previousPeriodData.length > 0 ? previousPeriodData[0].revenue : 0;

    // Calculate revenue growth percentage
    let growth = 0;
    if (previousRevenue > 0) {
      growth = ((totalRevenue - previousRevenue) / previousRevenue) * 100;
    } else if (totalRevenue > 0) {
      growth = 100; // 100% growth if previous period had no revenue
    }

    // Round growth to 2 decimal places
    growth = Math.round(growth * 100) / 100;

    // Prepare response data
    const responseData = {
      total: totalRevenue,
      growth: growth,
      data: salesData,
      metadata: {
        startDate: startDate,
        endDate: endDate,
        groupBy: groupBy
      }
    };

    // Cache the result
    cacheService.set(cacheKey, responseData);

    res.status(200).json({
      success: true,
      data: responseData,
      cached: false
    });

  } catch (error) {
    logger.error('Sales Analytics Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sales analytics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get order analytics with aggregation
 * @route GET /api/analytics/orders
 * @access Private (Admin, Manager)
 */
exports.getOrderAnalytics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Validate required parameters
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      });
    }

    // Parse and validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format'
      });
    }

    if (start > end) {
      return res.status(400).json({
        success: false,
        message: 'Start date must be before end date'
      });
    }

    // Check cache first
    const cacheKey = cacheService.generateKey('orders', { startDate, endDate });
    const cachedData = cacheService.get(cacheKey);

    if (cachedData) {
      return res.status(200).json({
        success: true,
        data: cachedData,
        cached: true
      });
    }

    // Build aggregation pipeline for total orders and average order value
    const orderStatsPipeline = [
      {
        $match: {
          createdAt: {
            $gte: start,
            $lte: end
          }
        }
      },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: '$total' }
        }
      }
    ];

    // Build aggregation pipeline for order status breakdown
    const statusBreakdownPipeline = [
      {
        $match: {
          createdAt: {
            $gte: start,
            $lte: end
          }
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          status: '$_id',
          count: 1
        }
      }
    ];

    // Build aggregation pipeline for payment method breakdown
    const paymentMethodPipeline = [
      {
        $match: {
          createdAt: {
            $gte: start,
            $lte: end
          }
        }
      },
      {
        $group: {
          _id: '$paymentMethod',
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          method: '$_id',
          count: 1
        }
      }
    ];

    // Build aggregation pipeline for fulfillment rate (completed orders)
    const fulfillmentPipeline = [
      {
        $match: {
          createdAt: {
            $gte: start,
            $lte: end
          }
        }
      },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          completedOrders: {
            $sum: {
              $cond: [
                { $in: ['$status', ['delivered']] },
                1,
                0
              ]
            }
          }
        }
      }
    ];

    // Execute all aggregations in parallel
    const [orderStats, statusBreakdown, paymentMethodBreakdown, fulfillmentStats] = await Promise.all([
      Order.aggregate(orderStatsPipeline),
      Order.aggregate(statusBreakdownPipeline),
      Order.aggregate(paymentMethodPipeline),
      Order.aggregate(fulfillmentPipeline)
    ]);

    // Extract results
    const totalOrders = orderStats.length > 0 ? orderStats[0].totalOrders : 0;
    const totalRevenue = orderStats.length > 0 ? orderStats[0].totalRevenue : 0;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Calculate percentages for status breakdown
    const statusBreakdownWithPercentages = statusBreakdown.map(item => ({
      status: item.status,
      count: item.count,
      percentage: totalOrders > 0 ? Math.round((item.count / totalOrders) * 100 * 100) / 100 : 0
    }));

    // Calculate percentages for payment method breakdown
    const paymentMethodBreakdownWithPercentages = paymentMethodBreakdown.map(item => ({
      method: item.method,
      count: item.count,
      percentage: totalOrders > 0 ? Math.round((item.count / totalOrders) * 100 * 100) / 100 : 0
    }));

    // Calculate fulfillment rate
    const completedOrders = fulfillmentStats.length > 0 ? fulfillmentStats[0].completedOrders : 0;
    const fulfillmentRate = totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100 * 100) / 100 : 0;

    // Prepare response data
    const responseData = {
      totalOrders: totalOrders,
      avgOrderValue: Math.round(avgOrderValue * 100) / 100,
      fulfillmentRate: fulfillmentRate,
      statusBreakdown: statusBreakdownWithPercentages,
      paymentMethodBreakdown: paymentMethodBreakdownWithPercentages
    };

    // Cache the result
    cacheService.set(cacheKey, responseData);

    res.status(200).json({
      success: true,
      data: responseData,
      cached: false
    });

  } catch (error) {
    logger.error('Order Analytics Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order analytics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get customer analytics with new vs returning customers, lifetime value, and segmentation
 * @route GET /api/analytics/customers
 * @access Private (Admin, Manager)
 */
exports.getCustomerAnalytics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Validate required parameters
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      });
    }

    // Parse and validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format'
      });
    }

    if (start > end) {
      return res.status(400).json({
        success: false,
        message: 'Start date must be before end date'
      });
    }

    // Check cache first
    const cacheKey = cacheService.generateKey('customers', { startDate, endDate });
    const cachedData = cacheService.get(cacheKey);

    if (cachedData) {
      return res.status(200).json({
        success: true,
        data: cachedData,
        cached: true
      });
    }

    // Calculate previous period dates for retention rate
    const periodDuration = end.getTime() - start.getTime();
    const previousStart = new Date(start.getTime() - periodDuration);
    const previousEnd = new Date(start.getTime() - 1);

    // Build aggregation pipeline for customer first order dates
    const firstOrderPipeline = [
      {
        $match: {
          status: { $in: ['delivered', 'processing', 'shipped'] }
        }
      },
      {
        $group: {
          _id: '$user',
          firstOrderDate: { $min: '$createdAt' }
        }
      }
    ];

    // Build aggregation pipeline for customers in current period
    const currentPeriodCustomersPipeline = [
      {
        $match: {
          createdAt: {
            $gte: start,
            $lte: end
          },
          status: { $in: ['delivered', 'processing', 'shipped'] }
        }
      },
      {
        $group: {
          _id: '$user'
        }
      }
    ];

    // Build aggregation pipeline for customers in previous period
    const previousPeriodCustomersPipeline = [
      {
        $match: {
          createdAt: {
            $gte: previousStart,
            $lte: previousEnd
          },
          status: { $in: ['delivered', 'processing', 'shipped'] }
        }
      },
      {
        $group: {
          _id: '$user'
        }
      }
    ];

    // Build aggregation pipeline for customer lifetime value and order counts
    const lifetimeValuePipeline = [
      {
        $match: {
          status: { $in: ['delivered', 'processing', 'shipped'] }
        }
      },
      {
        $group: {
          _id: '$user',
          lifetimeValue: { $sum: '$total' },
          orderCount: { $sum: 1 },
          orderDates: { $push: '$createdAt' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userInfo'
        }
      },
      {
        $unwind: '$userInfo'
      },
      {
        $project: {
          _id: 0,
          userId: '$_id',
          name: '$userInfo.name',
          email: '$userInfo.email',
          accountType: '$userInfo.accountType',
          lifetimeValue: { $round: ['$lifetimeValue', 2] },
          orderCount: 1,
          orderDates: 1
        }
      }
    ];

    // Execute all aggregations in parallel
    const [firstOrders, currentPeriodCustomers, previousPeriodCustomers, customerData] = await Promise.all([
      Order.aggregate(firstOrderPipeline),
      Order.aggregate(currentPeriodCustomersPipeline),
      Order.aggregate(previousPeriodCustomersPipeline),
      Order.aggregate(lifetimeValuePipeline)
    ]);

    // Create a map of first order dates
    const firstOrderMap = new Map();
    firstOrders.forEach(item => {
      firstOrderMap.set(item._id.toString(), item.firstOrderDate);
    });

    // Count new vs returning customers in current period
    let newCustomers = 0;
    let returningCustomers = 0;

    currentPeriodCustomers.forEach(customer => {
      const customerId = customer._id.toString();
      const firstOrderDate = firstOrderMap.get(customerId);
      
      if (firstOrderDate && firstOrderDate >= start && firstOrderDate <= end) {
        newCustomers++;
      } else {
        returningCustomers++;
      }
    });

    // Calculate retention rate
    const previousPeriodCustomerIds = new Set(
      previousPeriodCustomers.map(c => c._id.toString())
    );
    const currentPeriodCustomerIds = new Set(
      currentPeriodCustomers.map(c => c._id.toString())
    );

    let returningFromPrevious = 0;
    currentPeriodCustomerIds.forEach(customerId => {
      if (previousPeriodCustomerIds.has(customerId)) {
        returningFromPrevious++;
      }
    });

    const retentionRate = previousPeriodCustomers.length > 0
      ? Math.round((returningFromPrevious / previousPeriodCustomers.length) * 100 * 100) / 100
      : 0;

    // Get top 10 customers by total spending
    const topCustomers = customerData
      .sort((a, b) => b.lifetimeValue - a.lifetimeValue)
      .slice(0, 10)
      .map(customer => ({
        userId: customer.userId,
        name: customer.name,
        email: customer.email,
        totalSpent: customer.lifetimeValue,
        orderCount: customer.orderCount
      }));

    // Calculate average lifetime value
    const totalLifetimeValue = customerData.reduce((sum, c) => sum + c.lifetimeValue, 0);
    const avgLifetimeValue = customerData.length > 0
      ? Math.round((totalLifetimeValue / customerData.length) * 100) / 100
      : 0;

    // Segment customers by type (B2B vs retail)
    const b2bCustomers = customerData.filter(c => c.accountType === 'B2B');
    const retailCustomers = customerData.filter(c => c.accountType === 'Retail');

    const b2bRevenue = b2bCustomers.reduce((sum, c) => sum + c.lifetimeValue, 0);
    const retailRevenue = retailCustomers.reduce((sum, c) => sum + c.lifetimeValue, 0);

    const customerSegmentation = {
      b2b: {
        count: b2bCustomers.length,
        revenue: Math.round(b2bRevenue * 100) / 100
      },
      retail: {
        count: retailCustomers.length,
        revenue: Math.round(retailRevenue * 100) / 100
      }
    };

    // Calculate average time between orders for returning customers
    let totalTimeBetweenOrders = 0;
    let intervalCount = 0;

    customerData.forEach(customer => {
      if (customer.orderCount > 1) {
        const sortedDates = customer.orderDates.sort((a, b) => a - b);
        for (let i = 1; i < sortedDates.length; i++) {
          const timeDiff = sortedDates[i] - sortedDates[i - 1];
          totalTimeBetweenOrders += timeDiff;
          intervalCount++;
        }
      }
    });

    const avgTimeBetweenOrders = intervalCount > 0
      ? Math.round((totalTimeBetweenOrders / intervalCount) / (1000 * 60 * 60 * 24) * 100) / 100 // Convert to days
      : 0;

    // Prepare response data
    const responseData = {
      newCustomers: newCustomers,
      returningCustomers: returningCustomers,
      retentionRate: retentionRate,
      avgLifetimeValue: avgLifetimeValue,
      topCustomers: topCustomers,
      customerSegmentation: customerSegmentation,
      avgTimeBetweenOrders: avgTimeBetweenOrders
    };

    // Cache the result
    cacheService.set(cacheKey, responseData);

    res.status(200).json({
      success: true,
      data: responseData,
      cached: false
    });

  } catch (error) {
    logger.error('Customer Analytics Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch customer analytics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get product analytics with top sellers, revenue, stock alerts, and category breakdown
 * @route GET /api/analytics/products
 * @access Private (Admin, Manager)
 */
exports.getProductAnalytics = async (req, res) => {
  try {
    const { startDate, endDate, limit = 10 } = req.query;

    // Validate required parameters
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      });
    }

    // Parse and validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format'
      });
    }

    if (start > end) {
      return res.status(400).json({
        success: false,
        message: 'Start date must be before end date'
      });
    }

    // Validate limit parameter
    const limitNum = parseInt(limit);
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      return res.status(400).json({
        success: false,
        message: 'Limit must be a number between 1 and 100'
      });
    }

    // Check cache first
    const cacheKey = cacheService.generateKey('products', { startDate, endDate, limit });
    const cachedData = cacheService.get(cacheKey);

    if (cachedData) {
      return res.status(200).json({
        success: true,
        data: cachedData,
        cached: true
      });
    }

    // Build aggregation pipeline for top selling products by quantity
    const topSellingPipeline = [
      {
        $match: {
          createdAt: {
            $gte: start,
            $lte: end
          },
          status: { $in: ['delivered', 'processing', 'shipped'] }
        }
      },
      {
        $unwind: '$items'
      },
      {
        $group: {
          _id: '$items.product',
          quantitySold: { $sum: '$items.quantity' },
          revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
        }
      },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'productInfo'
        }
      },
      {
        $unwind: '$productInfo'
      },
      {
        $project: {
          _id: 0,
          productId: '$_id',
          name: '$productInfo.name',
          quantitySold: 1,
          revenue: { $round: ['$revenue', 2] }
        }
      },
      {
        $sort: { quantitySold: -1 }
      },
      {
        $limit: limitNum
      }
    ];

    // Build aggregation pipeline for top revenue products
    const topRevenuePipeline = [
      {
        $match: {
          createdAt: {
            $gte: start,
            $lte: end
          },
          status: { $in: ['delivered', 'processing', 'shipped'] }
        }
      },
      {
        $unwind: '$items'
      },
      {
        $group: {
          _id: '$items.product',
          revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
          quantitySold: { $sum: '$items.quantity' }
        }
      },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'productInfo'
        }
      },
      {
        $unwind: '$productInfo'
      },
      {
        $project: {
          _id: 0,
          productId: '$_id',
          name: '$productInfo.name',
          revenue: { $round: ['$revenue', 2] },
          quantitySold: 1
        }
      },
      {
        $sort: { revenue: -1 }
      },
      {
        $limit: limitNum
      }
    ];

    // Build aggregation pipeline for category breakdown
    const categoryBreakdownPipeline = [
      {
        $match: {
          createdAt: {
            $gte: start,
            $lte: end
          },
          status: { $in: ['delivered', 'processing', 'shipped'] }
        }
      },
      {
        $unwind: '$items'
      },
      {
        $lookup: {
          from: 'products',
          localField: 'items.product',
          foreignField: '_id',
          as: 'productInfo'
        }
      },
      {
        $unwind: '$productInfo'
      },
      {
        $group: {
          _id: '$productInfo.category',
          revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
          orderCount: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          category: '$_id',
          revenue: { $round: ['$revenue', 2] },
          orderCount: 1
        }
      },
      {
        $sort: { revenue: -1 }
      }
    ];

    // Calculate date 30 days ago for slow-moving inventory
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Build aggregation pipeline for slow-moving inventory
    const slowMovingPipeline = [
      {
        $match: {
          createdAt: {
            $gte: thirtyDaysAgo
          },
          status: { $in: ['delivered', 'processing', 'shipped'] }
        }
      },
      {
        $unwind: '$items'
      },
      {
        $group: {
          _id: '$items.product',
          lastSaleDate: { $max: '$createdAt' }
        }
      }
    ];

    // Execute all aggregations in parallel
    const [topSellingProducts, topRevenueProducts, categoryBreakdown, recentSales] = await Promise.all([
      Order.aggregate(topSellingPipeline),
      Order.aggregate(topRevenuePipeline),
      Order.aggregate(categoryBreakdownPipeline),
      Order.aggregate(slowMovingPipeline)
    ]);

    // Get low stock alerts from Product model
    const Product = require('../models/Product');
    const lowStockAlerts = await Product.find({
      stock: { $lt: 10 },
      isActive: true
    })
    .select('_id name stock minStock')
    .limit(50)
    .lean();

    // Format low stock alerts
    const formattedLowStockAlerts = lowStockAlerts.map(product => ({
      productId: product._id,
      name: product.name,
      currentStock: product.stock,
      minStock: product.minStock || 10
    }));

    // Identify slow-moving inventory (products with no sales in last 30 days)
    const recentlySoldProductIds = new Set(recentSales.map(item => item._id.toString()));
    
    // Get all active products
    const allActiveProducts = await Product.find({ isActive: true })
      .select('_id name')
      .lean();

    // Filter products with no recent sales
    const slowMovingInventory = allActiveProducts
      .filter(product => !recentlySoldProductIds.has(product._id.toString()))
      .map(product => ({
        productId: product._id,
        name: product.name,
        daysSinceLastSale: 30 // At least 30 days
      }))
      .slice(0, 50); // Limit to 50 items

    // Prepare response data
    const responseData = {
      topSellingProducts: topSellingProducts,
      topRevenueProducts: topRevenueProducts,
      lowStockAlerts: formattedLowStockAlerts,
      categoryBreakdown: categoryBreakdown,
      slowMovingInventory: slowMovingInventory
    };

    // Cache the result
    cacheService.set(cacheKey, responseData);

    res.status(200).json({
      success: true,
      data: responseData,
      cached: false
    });

  } catch (error) {
    logger.error('Product Analytics Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch product analytics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get payment analytics with method distribution, success rate, and B2B credit utilization
 * @route GET /api/analytics/payments
 * @access Private (Admin, Manager)
 */
exports.getPaymentAnalytics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Validate required parameters
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      });
    }

    // Parse and validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format'
      });
    }

    if (start > end) {
      return res.status(400).json({
        success: false,
        message: 'Start date must be before end date'
      });
    }

    // Check cache first
    const cacheKey = cacheService.generateKey('payments', { startDate, endDate });
    const cachedData = cacheService.get(cacheKey);

    if (cachedData) {
      return res.status(200).json({
        success: true,
        data: cachedData,
        cached: true
      });
    }

    // Build aggregation pipeline for payment method distribution
    const methodDistributionPipeline = [
      {
        $match: {
          createdAt: {
            $gte: start,
            $lte: end
          }
        }
      },
      {
        $group: {
          _id: '$paymentMethod',
          count: { $sum: 1 },
          totalAmount: { $sum: '$total' },
          successfulPayments: {
            $sum: {
              $cond: [
                { $eq: ['$paymentStatus', 'paid'] },
                1,
                0
              ]
            }
          },
          failedPayments: {
            $sum: {
              $cond: [
                { $eq: ['$paymentStatus', 'failed'] },
                1,
                0
              ]
            }
          }
        }
      },
      {
        $project: {
          _id: 0,
          method: '$_id',
          count: 1,
          totalAmount: { $round: ['$totalAmount', 2] },
          successfulPayments: 1,
          failedPayments: 1
        }
      }
    ];

    // Build aggregation pipeline for overall payment stats
    const overallStatsPipeline = [
      {
        $match: {
          createdAt: {
            $gte: start,
            $lte: end
          }
        }
      },
      {
        $group: {
          _id: null,
          totalPayments: { $sum: 1 },
          successfulPayments: {
            $sum: {
              $cond: [
                { $eq: ['$paymentStatus', 'paid'] },
                1,
                0
              ]
            }
          }
        }
      }
    ];

    // Build aggregation pipeline for failed payments
    const failedPaymentsPipeline = [
      {
        $match: {
          createdAt: {
            $gte: start,
            $lte: end
          },
          paymentStatus: 'failed'
        }
      },
      {
        $project: {
          _id: 0,
          orderId: 1,
          amount: '$total',
          method: '$paymentMethod',
          reason: { $ifNull: ['$paymentFailureReason', 'Payment declined'] },
          timestamp: '$createdAt'
        }
      },
      {
        $sort: { timestamp: -1 }
      },
      {
        $limit: 50
      }
    ];

    // Execute aggregations in parallel
    const [methodDistribution, overallStats, failedPayments] = await Promise.all([
      Order.aggregate(methodDistributionPipeline),
      Order.aggregate(overallStatsPipeline),
      Order.aggregate(failedPaymentsPipeline)
    ]);

    // Calculate total payments and percentages
    const totalPayments = overallStats.length > 0 ? overallStats[0].totalPayments : 0;
    const totalSuccessfulPayments = overallStats.length > 0 ? overallStats[0].successfulPayments : 0;

    // Calculate payment success rate
    const successRate = totalPayments > 0
      ? Math.round((totalSuccessfulPayments / totalPayments) * 100 * 100) / 100
      : 0;

    // Add percentages to method distribution and calculate method-specific success rates
    const methodDistributionWithPercentages = methodDistribution.map(item => {
      const methodSuccessRate = item.count > 0
        ? Math.round((item.successfulPayments / item.count) * 100 * 100) / 100
        : 0;

      return {
        method: item.method,
        count: item.count,
        percentage: totalPayments > 0 ? Math.round((item.count / totalPayments) * 100 * 100) / 100 : 0,
        totalAmount: item.totalAmount,
        successRate: methodSuccessRate,
        needsReview: methodSuccessRate < 90
      };
    });

    // Calculate average processing time per payment method
    // Note: Since Order model doesn't have processing time fields, we'll use a placeholder
    // In a real implementation, you would track payment processing timestamps
    const avgProcessingTime = methodDistribution.map(item => ({
      method: item.method,
      avgTime: 0 // Placeholder - would calculate from payment timestamps
    }));

    // Get B2B credit utilization
    const User = require('../models/User');
    const b2bUsers = await User.find({
      accountType: 'B2B',
      creditLimit: { $gt: 0 }
    })
    .select('creditLimit creditUsed')
    .lean();

    // Calculate total B2B credit utilization
    const totalCreditLimit = b2bUsers.reduce((sum, user) => sum + user.creditLimit, 0);
    const totalCreditUsed = b2bUsers.reduce((sum, user) => sum + user.creditUsed, 0);
    const creditUtilizationRate = totalCreditLimit > 0
      ? Math.round((totalCreditUsed / totalCreditLimit) * 100 * 100) / 100
      : 0;

    // Prepare response data
    const responseData = {
      methodDistribution: methodDistributionWithPercentages,
      successRate: successRate,
      failedPayments: failedPayments,
      avgProcessingTime: avgProcessingTime,
      b2bCreditUtilization: {
        totalLimit: Math.round(totalCreditLimit * 100) / 100,
        totalUsed: Math.round(totalCreditUsed * 100) / 100,
        utilizationRate: creditUtilizationRate
      }
    };

    // Cache the result
    cacheService.set(cacheKey, responseData);

    res.status(200).json({
      success: true,
      data: responseData,
      cached: false
    });

  } catch (error) {
    logger.error('Payment Analytics Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment analytics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get traffic analytics with page views, top products, search queries, bounce rate, and session duration
 * @route GET /api/analytics/traffic
 * @access Private (Admin, Manager)
 */
exports.getTrafficAnalytics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Validate required parameters
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      });
    }

    // Parse and validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format'
      });
    }

    if (start > end) {
      return res.status(400).json({
        success: false,
        message: 'Start date must be before end date'
      });
    }

    // Check cache first
    const cacheKey = cacheService.generateKey('traffic', { startDate, endDate });
    const cachedData = cacheService.get(cacheKey);

    if (cachedData) {
      return res.status(200).json({
        success: true,
        data: cachedData,
        cached: true
      });
    }

    // Build aggregation pipeline for total page views (using orders as proxy for site visits)
    // In a real implementation, this would come from a page view tracking collection
    const pageViewsPipeline = [
      {
        $match: {
          createdAt: {
            $gte: start,
            $lte: end
          }
        }
      },
      {
        $group: {
          _id: null,
          totalPageViews: { $sum: 1 }
        }
      }
    ];

    // Build aggregation pipeline for top 10 most viewed products
    // Using order items as proxy for product views
    const topViewedProductsPipeline = [
      {
        $match: {
          createdAt: {
            $gte: start,
            $lte: end
          }
        }
      },
      {
        $unwind: '$items'
      },
      {
        $group: {
          _id: '$items.product',
          viewCount: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'productInfo'
        }
      },
      {
        $unwind: '$productInfo'
      },
      {
        $project: {
          _id: 0,
          productId: '$_id',
          name: '$productInfo.name',
          category: '$productInfo.category',
          viewCount: 1
        }
      },
      {
        $sort: { viewCount: -1 }
      },
      {
        $limit: 10
      }
    ];

    // Build aggregation pipeline for search queries
    // Note: Since we don't have a search tracking collection, we'll use product names from orders
    // In a real implementation, this would come from search event tracking
    const searchQueriesPipeline = [
      {
        $match: {
          createdAt: {
            $gte: start,
            $lte: end
          }
        }
      },
      {
        $unwind: '$items'
      },
      {
        $lookup: {
          from: 'products',
          localField: 'items.product',
          foreignField: '_id',
          as: 'productInfo'
        }
      },
      {
        $unwind: '$productInfo'
      },
      {
        $group: {
          _id: '$productInfo.category',
          searchCount: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          searchTerm: '$_id',
          searchCount: 1
        }
      },
      {
        $sort: { searchCount: -1 }
      },
      {
        $limit: 20
      }
    ];

    // Build aggregation pipeline for session metrics
    // Calculate bounce rate and average session duration using order data
    const sessionMetricsPipeline = [
      {
        $match: {
          createdAt: {
            $gte: start,
            $lte: end
          }
        }
      },
      {
        $group: {
          _id: '$user',
          orderCount: { $sum: 1 },
          firstOrder: { $min: '$createdAt' },
          lastOrder: { $max: '$createdAt' }
        }
      },
      {
        $project: {
          _id: 0,
          userId: '$_id',
          orderCount: 1,
          sessionDuration: {
            $subtract: ['$lastOrder', '$firstOrder']
          },
          isBounce: {
            $cond: [
              { $eq: ['$orderCount', 1] },
              1,
              0
            ]
          }
        }
      }
    ];

    // Build aggregation pipeline for traffic sources
    // Using payment methods as proxy for traffic sources
    const trafficSourcesPipeline = [
      {
        $match: {
          createdAt: {
            $gte: start,
            $lte: end
          }
        }
      },
      {
        $group: {
          _id: '$paymentMethod',
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          source: {
            $switch: {
              branches: [
                { case: { $eq: ['$_id', 'card'] }, then: 'direct' },
                { case: { $eq: ['$_id', 'bkash'] }, then: 'mobile' },
                { case: { $eq: ['$_id', 'nagad'] }, then: 'mobile' },
                { case: { $eq: ['$_id', 'bank_transfer'] }, then: 'referral' },
                { case: { $eq: ['$_id', 'b2b_credit'] }, then: 'direct' }
              ],
              default: 'other'
            }
          },
          count: 1
        }
      },
      {
        $group: {
          _id: '$source',
          count: { $sum: '$count' }
        }
      },
      {
        $project: {
          _id: 0,
          source: '$_id',
          count: 1
        }
      },
      {
        $sort: { count: -1 }
      }
    ];

    // Execute all aggregations in parallel
    const [pageViewsData, topViewedProducts, searchQueries, sessionMetrics, trafficSources] = await Promise.all([
      Order.aggregate(pageViewsPipeline),
      Order.aggregate(topViewedProductsPipeline),
      Order.aggregate(searchQueriesPipeline),
      Order.aggregate(sessionMetricsPipeline),
      Order.aggregate(trafficSourcesPipeline)
    ]);

    // Extract page views count
    const totalPageViews = pageViewsData.length > 0 ? pageViewsData[0].totalPageViews : 0;

    // Calculate bounce rate
    const totalSessions = sessionMetrics.length;
    const bouncedSessions = sessionMetrics.filter(s => s.isBounce === 1).length;
    const bounceRate = totalSessions > 0
      ? Math.round((bouncedSessions / totalSessions) * 100 * 100) / 100
      : 0;

    // Calculate average session duration in seconds
    const totalSessionDuration = sessionMetrics.reduce((sum, s) => sum + s.sessionDuration, 0);
    const avgSessionDuration = totalSessions > 0
      ? Math.round((totalSessionDuration / totalSessions) / 1000) // Convert to seconds
      : 0;

    // Calculate total traffic count for percentages
    const totalTraffic = trafficSources.reduce((sum, s) => sum + s.count, 0);

    // Add percentages to traffic sources
    const trafficSourcesWithPercentages = trafficSources.map(source => ({
      source: source.source,
      count: source.count,
      percentage: totalTraffic > 0 ? Math.round((source.count / totalTraffic) * 100 * 100) / 100 : 0
    }));

    // Prepare response data
    const responseData = {
      pageViews: totalPageViews,
      topViewedProducts: topViewedProducts,
      searchQueries: searchQueries,
      bounceRate: bounceRate,
      avgSessionDuration: avgSessionDuration,
      trafficSources: trafficSourcesWithPercentages,
      metadata: {
        startDate: startDate,
        endDate: endDate,
        totalSessions: totalSessions
      }
    };

    // Cache the result
    cacheService.set(cacheKey, responseData);

    res.status(200).json({
      success: true,
      data: responseData,
      cached: false
    });

  } catch (error) {
    logger.error('Traffic Analytics Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch traffic analytics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get real-time metrics for today
 * @route GET /api/analytics/realtime
 * @access Private (Admin, Manager)
 */
exports.getRealTimeMetrics = async (req, res) => {
  try {
    // Get today's date range (start and end of today)
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    // Get yesterday's date range for comparison
    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);
    const yesterdayEnd = new Date(todayEnd);
    yesterdayEnd.setDate(yesterdayEnd.getDate() - 1);

    // Check cache first (5 minute TTL for real-time metrics)
    const cacheKey = cacheService.generateKey('realtime', { 
      date: todayStart.toISOString().split('T')[0] 
    });
    const cachedData = cacheService.get(cacheKey);

    if (cachedData) {
      return res.status(200).json({
        success: true,
        data: cachedData,
        cached: true
      });
    }

    // Build aggregation pipeline for today's sales
    const todaySalesPipeline = [
      {
        $match: {
          createdAt: {
            $gte: todayStart,
            $lte: todayEnd
          },
          status: { $in: ['delivered', 'processing', 'shipped'] }
        }
      },
      {
        $group: {
          _id: null,
          totalSales: { $sum: '$total' },
          orderCount: { $sum: 1 }
        }
      }
    ];

    // Build aggregation pipeline for yesterday's order count
    const yesterdayOrdersPipeline = [
      {
        $match: {
          createdAt: {
            $gte: yesterdayStart,
            $lte: yesterdayEnd
          }
        }
      },
      {
        $group: {
          _id: null,
          orderCount: { $sum: 1 }
        }
      }
    ];

    // Build aggregation pipeline for pending orders
    const pendingOrdersPipeline = [
      {
        $match: {
          status: { $in: ['placed', 'confirmed'] }
        }
      },
      {
        $group: {
          _id: null,
          count: { $sum: 1 }
        }
      }
    ];

    // Build aggregation pipeline for today's total orders (for conversion rate)
    const todayOrdersPipeline = [
      {
        $match: {
          createdAt: {
            $gte: todayStart,
            $lte: todayEnd
          }
        }
      },
      {
        $group: {
          _id: null,
          orderCount: { $sum: 1 }
        }
      }
    ];

    // Execute all aggregations in parallel
    const [todaySalesData, yesterdayOrdersData, pendingOrdersData, todayOrdersData] = await Promise.all([
      Order.aggregate(todaySalesPipeline),
      Order.aggregate(yesterdayOrdersPipeline),
      Order.aggregate(pendingOrdersPipeline),
      Order.aggregate(todayOrdersPipeline)
    ]);

    // Extract results
    const todaySales = todaySalesData.length > 0 ? todaySalesData[0].totalSales : 0;
    const todayOrderCount = todayOrdersData.length > 0 ? todayOrdersData[0].orderCount : 0;
    const yesterdayOrderCount = yesterdayOrdersData.length > 0 ? yesterdayOrdersData[0].orderCount : 0;
    const pendingOrders = pendingOrdersData.length > 0 ? pendingOrdersData[0].count : 0;

    // Calculate active users (users with sessions in last 15 minutes)
    // Note: Since we don't have a session tracking system, we'll use users who created orders in the last 15 minutes as a proxy
    const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000);
    const activeUsersPipeline = [
      {
        $match: {
          createdAt: {
            $gte: fifteenMinutesAgo,
            $lte: now
          }
        }
      },
      {
        $group: {
          _id: '$user'
        }
      },
      {
        $group: {
          _id: null,
          count: { $sum: 1 }
        }
      }
    ];

    const activeUsersData = await Order.aggregate(activeUsersPipeline);
    const activeUsers = activeUsersData.length > 0 ? activeUsersData[0].count : 0;

    // Calculate conversion rate
    // For now, we'll use a simplified calculation: today's orders / today's unique visitors
    // Since we don't have visitor tracking, we'll use unique users who placed orders as a proxy
    const todayVisitorsPipeline = [
      {
        $match: {
          createdAt: {
            $gte: todayStart,
            $lte: todayEnd
          }
        }
      },
      {
        $group: {
          _id: '$user'
        }
      },
      {
        $group: {
          _id: null,
          count: { $sum: 1 }
        }
      }
    ];

    const todayVisitorsData = await Order.aggregate(todayVisitorsPipeline);
    const todayVisitors = todayVisitorsData.length > 0 ? todayVisitorsData[0].count : 0;

    // Calculate conversion rate (orders / visitors * 100)
    // If we have no visitors, assume 100% conversion if we have orders, 0% otherwise
    let conversionRate = 0;
    if (todayVisitors > 0) {
      conversionRate = Math.round((todayOrderCount / todayVisitors) * 100 * 100) / 100;
    } else if (todayOrderCount > 0) {
      conversionRate = 100;
    }

    // Calculate order count comparison
    let orderCountChange = 0;
    if (yesterdayOrderCount > 0) {
      orderCountChange = Math.round(((todayOrderCount - yesterdayOrderCount) / yesterdayOrderCount) * 100 * 100) / 100;
    } else if (todayOrderCount > 0) {
      orderCountChange = 100;
    }

    // Prepare response data
    const responseData = {
      todaySales: Math.round(todaySales * 100) / 100,
      activeUsers: activeUsers,
      pendingOrders: pendingOrders,
      todayOrderCount: todayOrderCount,
      yesterdayOrderCount: yesterdayOrderCount,
      orderCountChange: orderCountChange,
      conversionRate: conversionRate,
      lastUpdated: now.toISOString()
    };

    // Cache the result with 5 minute TTL
    cacheService.set(cacheKey, responseData);

    res.status(200).json({
      success: true,
      data: responseData,
      cached: false
    });

  } catch (error) {
    logger.error('Real-Time Metrics Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch real-time metrics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
