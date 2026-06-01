const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const Quote = require('../models/Quote');
const Cart = require('../models/Cart');
const logger = require('../utils/logger');
const { successResponse, errorResponse } = require('../utils/responseHelper');

function calcMonthGrowth(current, previous) {
  if (previous === 0 && current === 0) return { pct: 0, trend: 'neutral' };
  if (previous === 0) return { pct: null, trend: 'up' };
  const pct = Math.round(((current - previous) / previous) * 100);
  return { pct, trend: pct >= 0 ? 'up' : 'down' };
}

// Correct revenue field expression:
// Orders may store amount in totalAmount OR total (legacy alias).
// $ifNull with 2 args is the correct MongoDB syntax.
// We use $add with $ifNull to always get a number (never null).
const revenueExpr = {
  $add: [
    { $ifNull: ['$totalAmount', 0] },
    // If totalAmount is missing/zero but total exists, use total instead
    {
      $cond: [
        { $gt: [{ $ifNull: ['$totalAmount', 0] }, 0] },
        0,
        { $ifNull: ['$total', 0] }
      ]
    }
  ]
};

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
      { $group: { _id: null, total: { $sum: revenueExpr } } }
    ]);
    const totalRevenue = revenueAgg[0]?.total || 0;

    // Revenue last month for growth calc
    const lastMonthAgg = await Order.aggregate([
      { $match: { createdAt: { $gte: lastMonth, $lte: endOfLastMonth }, status: { $nin: ['cancelled'] } } },
      { $group: { _id: null, total: { $sum: revenueExpr } } }
    ]);
    const thisMonthAgg = await Order.aggregate([
      { $match: { createdAt: { $gte: startOfMonth }, status: { $nin: ['cancelled'] } } },
      { $group: { _id: null, total: { $sum: revenueExpr } } }
    ]);
    const lastMonthRevenue = lastMonthAgg[0]?.total || 0;
    const thisMonthRevenue = thisMonthAgg[0]?.total || 0;
    const revenueGrowthMeta = calcMonthGrowth(thisMonthRevenue, lastMonthRevenue);

    // Order counts (exclude cancelled from totals for overview)
    const orderMatch = { status: { $nin: ['cancelled'] } };
    const totalOrders = await Order.countDocuments(orderMatch);
    const ordersThisMonth = await Order.countDocuments({
      ...orderMatch,
      createdAt: { $gte: startOfMonth },
    });
    const ordersLastMonth = await Order.countDocuments({
      ...orderMatch,
      createdAt: { $gte: lastMonth, $lte: endOfLastMonth },
    });
    const ordersGrowthMeta = calcMonthGrowth(ordersThisMonth, ordersLastMonth);

    // Active B2B clients
    const activeB2B = await User.countDocuments({ role: 'b2b_customer', isActive: true });

    // Pending quotes
    const pendingQuotes = await Quote.countDocuments({ status: 'pending' });

    // Abandoned carts (real DB counts)
    const totalAbandoned = await Cart.countDocuments({ isAbandoned: true });
    const abandonedCarts = await Cart.find({ isAbandoned: true }).select('subtotal').lean();
    const abandonedCartValue = abandonedCarts.reduce((sum, c) => sum + (c.subtotal || 0), 0);
    const emailsSent = await Cart.countDocuments({ recoveryEmailSent: true });
    const totalRecovered = await Cart.countDocuments({ recoveredAt: { $exists: true, $ne: null } });
    const recoveryRate =
      totalAbandoned > 0 ? Math.round((totalRecovered / totalAbandoned) * 100) : 0;

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
          revenue: { $sum: revenueExpr }
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

    return successResponse(res, {
      kpis: {
        totalRevenue,
        thisMonthRevenue,
        revenueGrowth: revenueGrowthMeta.pct,
        revenueGrowthTrend: revenueGrowthMeta.trend,
        totalOrders,
        ordersThisMonth,
        ordersGrowth: ordersGrowthMeta.pct,
        ordersGrowthTrend: ordersGrowthMeta.trend,
        activeB2B,
        pendingQuotes,
        abandonedCarts: totalAbandoned,
        abandonedCartValue,
        cartRecoveryRate: recoveryRate,
        cartEmailsSent: emailsSent,
      },
      monthlyRevenue,
      salesByCategory,
      stockAlerts: { lowStock, criticalStock },
      recentOrders
    });
  } catch (error) {
    logger.error(`[adminController] ${error.message}`);
    return errorResponse(res, 'Server error', process.env.NODE_ENV === 'development' ? [error.message] : null, 500);
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
            totalRevenue: { $sum: revenueExpr },
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
            revenue: { $sum: { $multiply: ['$items.price', { $ifNull: ['$items.qty', 1] }] } },
            qty: { $sum: { $ifNull: ['$items.qty', 1] } }
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
            totalSpend: { $sum: revenueExpr },
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

    return successResponse(res, {
      metrics: {
        avgOrderValue,
        b2bShare,
        quoteConversion,
        retention: 91 // placeholder — real retention requires cohort analysis
      },
      topProducts,
      topCustomers
    });
  } catch (error) {
    logger.error(`[adminController] ${error.message}`);
    return errorResponse(res, 'Server error', process.env.NODE_ENV === 'development' ? [error.message] : null, 500);
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
            totalSpend: { $sum: revenueExpr },
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

    return successResponse(res, { count: enriched.length, total, customers: enriched });
  } catch (error) {
    logger.error(`[adminController] getCustomers error: ${error.message}`, { stack: error.stack });
    return errorResponse(res, 'Server error', process.env.NODE_ENV === 'development' ? [error.message] : null, 500);
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
      return errorResponse(res, 'Invalid customer ID format', null, 400);
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
      return errorResponse(res, 'Customer not found', null, 404);
    }

    logger.info(`[adminController] Customer updated successfully: ${customer._id}`);
    return successResponse(res, { customer }, 'Customer updated');
  } catch (error) {
    logger.error(`[adminController] Update customer error: ${error.message}`, { 
      stack: error.stack,
      name: error.name,
      customerId: req.params.id,
      body: req.body
    });
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      return errorResponse(res, 'Validation error', [error.message], 400);
    }
    
    // Handle cast errors (invalid ObjectId)
    if (error.name === 'CastError') {
      return errorResponse(res, 'Invalid customer ID', [error.message], 400);
    }
    
    return errorResponse(res, 'Server error', process.env.NODE_ENV === 'development' ? [error.message] : null, 500);
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
      return successResponse(res, { count: 0 }, 'All products have sufficient stock');
    }

    await sendLowStockAlert(lowStockProducts);
    return successResponse(res, { count: lowStockProducts.length, products: lowStockProducts }, `Stock alert sent for ${lowStockProducts.length} product(s)`);
  } catch (error) {
    logger.error(`[adminController] ${error.message}`);
    return errorResponse(res, 'Server error', process.env.NODE_ENV === 'development' ? [error.message] : null, 500);
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

    return successResponse(res, {
      pendingOrders,
      pendingQuotes,
      unreadNotifications
    });
  } catch (error) {
    logger.error(`[adminController] getBadges error: ${error.message}`);
    return errorResponse(res, 'Server error', process.env.NODE_ENV === 'development' ? [error.message] : null, 500);
  }
};

// GET /api/admin/users - Get admin users for assignment
exports.getAdminUsers = async (req, res) => {
  try {
    // Get all users with admin role who are active
    const adminUsers = await User.find({
      role: 'admin',
      isActive: true
    })
      .select('_id name email')
      .sort('name')
      .lean();

    return successResponse(res, {
      count: adminUsers.length,
      users: adminUsers
    });
  } catch (error) {
    logger.error(`[adminController] getAdminUsers error: ${error.message}`);
    return errorResponse(res, 'Server error', process.env.NODE_ENV === 'development' ? [error.message] : null, 500);
  }
};
