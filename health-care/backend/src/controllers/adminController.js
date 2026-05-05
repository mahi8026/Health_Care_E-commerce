const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const Quote = require('../models/Quote');
const logger = require('../utils/logger');

// GET /api/admin/dashboard
exports.getDashboard = async (req, res) => {
  try {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Revenue this year
    const revenueAgg = await Order.aggregate([
      { $match: { createdAt: { $gte: startOfYear }, status: { $nin: ['cancelled'] } } },
      { $group: { _id: null, total: { $sum: { $ifNull: ['$totalAmount', '$total'] } } } }
    ]);
    const totalRevenue = revenueAgg[0]?.total || 0;

    // Revenue last month for growth calc
    const lastMonthAgg = await Order.aggregate([
      { $match: { createdAt: { $gte: lastMonth, $lte: endOfLastMonth }, status: { $nin: ['cancelled'] } } },
      { $group: { _id: null, total: { $sum: { $ifNull: ['$totalAmount', '$total'] } } } }
    ]);
    const thisMonthAgg = await Order.aggregate([
      { $match: { createdAt: { $gte: startOfMonth }, status: { $nin: ['cancelled'] } } },
      { $group: { _id: null, total: { $sum: { $ifNull: ['$totalAmount', '$total'] } } } }
    ]);
    const lastMonthRevenue = lastMonthAgg[0]?.total || 0;
    const thisMonthRevenue = thisMonthAgg[0]?.total || 0;
    const revenueGrowth = lastMonthRevenue > 0
      ? Math.round(((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100)
      : 0;

    // Order counts
    const totalOrders = await Order.countDocuments();
    const ordersThisMonth = await Order.countDocuments({ createdAt: { $gte: startOfMonth } });
    const ordersLastMonth = await Order.countDocuments({ createdAt: { $gte: lastMonth, $lte: endOfLastMonth } });
    const ordersGrowth = ordersLastMonth > 0
      ? Math.round(((ordersThisMonth - ordersLastMonth) / ordersLastMonth) * 100)
      : 0;

    // Active B2B clients
    const activeB2B = await User.countDocuments({ role: 'b2b_customer', isActive: true });

    // Pending quotes
    const pendingQuotes = await Quote.countDocuments({ status: 'pending' });

    // Monthly revenue breakdown (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);

    const monthlyRevenue = await Order.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo }, status: { $nin: ['cancelled'] } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            type: {
              $cond: [
                { $in: ['$paymentMethod', ['b2b_credit', 'beftn', 'cheque', 'npsb']] },
                'B2B', 'Retail'
              ]
            }
          },
          revenue: { $sum: { $ifNull: ['$totalAmount', '$total'] } }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Sales by category
    const salesByCategory = await Order.aggregate([
      { $match: { status: { $nin: ['cancelled'] } } },
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'products',
          localField: 'items.product',
          foreignField: '_id',
          as: 'productInfo'
        }
      },
      { $unwind: { path: '$productInfo', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: '$productInfo.category',
          revenue: { $sum: { $multiply: ['$items.price', { $ifNull: ['$items.qty', '$items.quantity', 1] }] } }
        }
      },
      { $sort: { revenue: -1 } }
    ]);

    // Low stock alerts
    const lowStock = await Product.find({
      isActive: true,
      stock: { $gt: 3, $lte: 10 }
    }).select('name sku stock lowStockThreshold minStock').limit(10).lean();

    const criticalStock = await Product.find({
      isActive: true,
      stock: { $lte: 3 }
    }).select('name sku stock lowStockThreshold minStock').limit(10).lean();

    // Recent orders for dashboard overview
    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('user', 'name email companyName')
      .lean();

    res.status(200).json({
      success: true,
      data: {
        kpis: {
          totalRevenue,
          revenueGrowth,
          totalOrders,
          ordersGrowth,
          activeB2B,
          pendingQuotes
        },
        monthlyRevenue,
        salesByCategory,
        stockAlerts: { lowStock, criticalStock },
        recentOrders
      }
    });
  } catch (error) {
    logger.error(`[adminController] ${error.message}`);
    res.status(500).json({ success: false, message: 'Server error', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

// GET /api/admin/analytics
exports.getAnalytics = async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    const now = new Date();
    let startDate;

    if (period === 'week') startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    else if (period === 'month') startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    else if (period === 'year') startDate = new Date(now.getFullYear(), 0, 1);
    else startDate = new Date(now.getFullYear(), now.getMonth(), 1);

    const [orderStats, topProducts, topCustomers] = await Promise.all([
      Order.aggregate([
        { $match: { createdAt: { $gte: startDate }, status: { $nin: ['cancelled'] } } },
        {
          $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            totalRevenue: { $sum: { $ifNull: ['$totalAmount', '$total'] } },
            b2bOrders: {
              $sum: { $cond: [{ $in: ['$paymentMethod', ['b2b_credit', 'beftn', 'cheque', 'npsb']] }, 1, 0] }
            }
          }
        }
      ]),
      Order.aggregate([
        { $match: { createdAt: { $gte: startDate }, status: { $nin: ['cancelled'] } } },
        { $unwind: '$items' },
        {
          $group: {
            _id: '$items.product',
            name: { $first: '$items.name' },
            revenue: { $sum: { $multiply: ['$items.price', { $ifNull: ['$items.qty', '$items.quantity', 1] }] } },
            qty: { $sum: { $ifNull: ['$items.qty', '$items.quantity', 1] } }
          }
        },
        { $sort: { revenue: -1 } },
        { $limit: 5 }
      ]),
      Order.aggregate([
        { $match: { createdAt: { $gte: startDate }, status: { $nin: ['cancelled'] } } },
        {
          $group: {
            _id: '$user',
            totalSpend: { $sum: { $ifNull: ['$totalAmount', '$total'] } },
            orderCount: { $sum: 1 }
          }
        },
        { $sort: { totalSpend: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'userInfo'
          }
        },
        { $unwind: '$userInfo' },
        {
          $project: {
            name: '$userInfo.name',
            company: { $ifNull: ['$userInfo.companyName', '$userInfo.company'] },
            totalSpend: 1,
            orderCount: 1
          }
        }
      ])
    ]);

    const stats = orderStats[0] || { totalOrders: 0, totalRevenue: 0, b2bOrders: 0 };
    const avgOrderValue = stats.totalOrders > 0 ? Math.round(stats.totalRevenue / stats.totalOrders) : 0;
    const b2bShare = stats.totalOrders > 0 ? Math.round((stats.b2bOrders / stats.totalOrders) * 100) : 0;

    const quoteConversion = await (async () => {
      const total = await Quote.countDocuments({ createdAt: { $gte: startDate } });
      const converted = await Quote.countDocuments({ createdAt: { $gte: startDate }, status: 'converted' });
      return total > 0 ? Math.round((converted / total) * 100) : 0;
    })();

    res.status(200).json({
      success: true,
      data: {
        metrics: {
          avgOrderValue,
          b2bShare,
          quoteConversion,
          retention: 91 // placeholder — real retention requires cohort analysis
        },
        topProducts,
        topCustomers
      }
    });
  } catch (error) {
    logger.error(`[adminController] ${error.message}`);
    res.status(500).json({ success: false, message: 'Server error', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

// GET /api/admin/customers
exports.getCustomers = async (req, res) => {
  try {
    const { role, tier, page = 1, limit = 20, search } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (tier) filter.b2bTier = tier;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { companyName: { $regex: search, $options: 'i' } }
      ];
    }

    const customers = await User.find(filter)
      .select('-password -refreshToken')
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();

    const total = await User.countDocuments(filter);

    // Enrich with order stats - preserve _id
    const enriched = await Promise.all(customers.map(async (customer) => {
      const orderAgg = await Order.aggregate([
        { $match: { user: customer._id, status: { $nin: ['cancelled'] } } },
        {
          $group: {
            _id: null,
            totalSpend: { $sum: { $ifNull: ['$totalAmount', '$total'] } },
            orderCount: { $sum: 1 },
            lastOrder: { $max: '$createdAt' }
          }
        }
      ]);
      const stats = orderAgg[0] || { totalSpend: 0, orderCount: 0, lastOrder: null };
      // Remove the _id: null from stats to avoid overwriting customer._id
      delete stats._id;
      return { ...customer, ...stats };
    }));

    res.status(200).json({ success: true, count: enriched.length, total, customers: enriched });
  } catch (error) {
    logger.error(`[adminController] getCustomers error: ${error.message}`, { stack: error.stack });
    res.status(500).json({ success: false, message: 'Server error', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

// PATCH /api/admin/customers/:id
exports.updateCustomer = async (req, res) => {
  try {
    const { b2bTier, creditLimit, accountManager, paymentTerms, isActive, role } = req.body;
    
    logger.info(`[adminController] Updating customer ${req.params.id} with:`, { b2bTier, creditLimit, accountManager, paymentTerms, isActive, role });
    
    // Validate customer ID
    if (!req.params.id || !req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      logger.warn(`[adminController] Invalid customer ID format: ${req.params.id}`);
      return res.status(400).json({ success: false, message: 'Invalid customer ID format' });
    }
    
    const updates = {};
    if (b2bTier) updates.b2bTier = b2bTier;
    if (creditLimit !== undefined) updates.creditLimit = creditLimit;
    if (accountManager) updates.accountManager = accountManager;
    if (paymentTerms) updates.paymentTerms = paymentTerms;
    if (isActive !== undefined) updates.isActive = isActive;
    if (role) updates.role = role;

    logger.info(`[adminController] Updates to apply:`, updates);

    const customer = await User.findByIdAndUpdate(
      req.params.id, 
      updates, 
      { new: true, runValidators: true }
    ).select('-password -refreshToken');

    if (!customer) {
      logger.warn(`[adminController] Customer not found: ${req.params.id}`);
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    logger.info(`[adminController] Customer updated successfully: ${customer._id}`);
    res.status(200).json({ success: true, message: 'Customer updated', customer });
  } catch (error) {
    logger.error(`[adminController] Update customer error: ${error.message}`, { 
      stack: error.stack,
      name: error.name,
      customerId: req.params.id,
      body: req.body
    });
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        success: false, 
        message: 'Validation error', 
        error: error.message 
      });
    }
    
    // Handle cast errors (invalid ObjectId)
    if (error.name === 'CastError') {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid customer ID', 
        error: error.message 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error' 
    });
  }
};

// POST /api/admin/stock-check
exports.manualStockCheck = async (req, res) => {
  try {
    const { sendLowStockAlert } = require('../utils/emailService');
    const lowStockProducts = await Product.find({
      isActive: true,
      $expr: { $lte: ['$stock', { $ifNull: ['$lowStockThreshold', '$minStock', 10] }] }
    }).lean();

    if (!lowStockProducts.length) {
      return res.status(200).json({ success: true, message: 'All products have sufficient stock', count: 0 });
    }

    await sendLowStockAlert(lowStockProducts);
    res.status(200).json({ success: true, message: `Stock alert sent for ${lowStockProducts.length} product(s)`, count: lowStockProducts.length, products: lowStockProducts });
  } catch (error) {
    logger.error(`[adminController] ${error.message}`);
    res.status(500).json({ success: false, message: 'Server error', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

// GET /api/admin/badges - Get badge counts for sidebar
exports.getBadges = async (req, res) => {
  try {
    // Count pending orders (placed, confirmed status)
    const pendingOrders = await Order.countDocuments({
      status: { $in: ['placed', 'confirmed'] }
    });

    // Count pending quotes
    const pendingQuotes = await Quote.countDocuments({
      status: 'pending'
    });

    // For now, set notifications to 0 (can be enhanced later with a notifications system)
    const unreadNotifications = 0;

    res.status(200).json({
      success: true,
      data: {
        pendingOrders,
        pendingQuotes,
        unreadNotifications
      }
    });
  } catch (error) {
    logger.error(`[adminController] getBadges error: ${error.message}`);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
};
