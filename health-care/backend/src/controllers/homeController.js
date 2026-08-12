/**
 * Home Controller - Aggregated Homepage Data Endpoint
 * 
 * Reduces 15+ separate API calls to a single aggregated request.
 * Dramatically improves page load performance and reduces rate limiting issues.
 */

const Product = require('../models/Product');
const Category = require('../models/Category');
const Review = require('../models/Review');
const Coupon = require('../models/Coupon');
const Order = require('../models/Order');
const User = require('../models/User');
const Manufacturer = require('../models/Manufacturer');
const logger = require('../utils/logger');
const { get, set } = require('../services/redisCache');

/**
 * Get aggregated homepage data in a single request
 * 
 * Returns:
 * - Featured products (25 items)
 * - Categories with counts (all active)
 * - Deal products (discount > 0, 4 items)
 * - New arrivals (10 items)
 * - Top selling (4 items)
 * - Lab equipment products (4 items)
 * - Testimonials (3 approved reviews)
 * - Active promo (1 coupon)
 * - Site stats (products, brands, orders, clients)
 * 
 * @route GET /api/home/data
 * @access Public
 */
exports.getHomeData = async (req, res) => {
  const cacheKey = 'homepage:aggregated:v1';
  
  try {
    // Check MongoDB connection status first
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 1) {
      logger.warn('[homeController] MongoDB not connected yet, returning empty data');
      return res.json({
        success: true,
        data: {
          featuredProducts: [],
          categories: [],
          categoryCounts: {},
          dealProducts: [],
          newArrivals: [],
          topSellingProducts: [],
          labEquipmentProducts: [],
          testimonials: [],
          activePromo: null,
          stats: { totalProducts: 0, totalBrands: 0, totalOrders: 0, totalB2BClients: 0 }
        },
        cached: false,
        dbConnecting: true
      });
    }

    // Try cache first
    const cached = await get(cacheKey);
    if (cached) {
      return res.json({
        success: true,
        data: cached,
        cached: true
      });
    }

    // Run all queries in parallel for maximum performance
    const [
      featuredProducts,
      categories,
      categoryCounts,
      dealProducts,
      newArrivals,
      topSellingProducts,
      labEquipmentProducts,
      testimonials,
      activePromo,
      stats
    ] = await Promise.all([
      // 1. Featured products
      Product.find({ isFeatured: true, isActive: true })
        .populate('category', 'name slug')
        .populate('brand', 'name slug logo')
        .select('name price oldPrice images stock discount badge slug rating reviewCount')
        .sort({ createdAt: -1 })
        .limit(25)
        .lean(),

      // 2. Categories
      Category.find({ isActive: true })
        .select('name slug description image icon productCount parentCategory')
        .sort({ name: 1 })
        .lean(),

      // 3. Category counts
      Product.aggregate([
        { $match: { isActive: true } },
        {
          $lookup: {
            from: 'categories',
            localField: 'category',
            foreignField: '_id',
            as: 'categoryData'
          }
        },
        { $unwind: '$categoryData' },
        {
          $group: {
            _id: '$categoryData.name',
            count: { $sum: 1 }
          }
        }
      ]),

      // 4. Deal products (with discounts)
      Product.find({ isActive: true, discount: { $gt: 0 } })
        .populate('category', 'name slug')
        .populate('brand', 'name slug logo')
        .select('name price oldPrice images stock discount badge slug rating reviewCount')
        .sort({ discount: -1 })
        .limit(4)
        .lean(),

      // 5. New arrivals
      Product.find({ isActive: true })
        .populate('category', 'name slug')
        .populate('brand', 'name slug logo')
        .select('name price oldPrice images stock discount badge slug rating reviewCount')
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),

      // 6. Top selling products (by units sold in non-cancelled orders)
      // B1 — previously looked up a nonexistent 'orderitems' collection
      // (order items are embedded in 'orders'), so orderCount was always 0
      // and the section showed arbitrary products
      Product.aggregate([
        { $match: { isActive: true } },
        {
          $lookup: {
            from: 'orders',
            let: { pid: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $in: ['$$pid', '$items.product'] },
                      { $not: { $in: ['$status', ['cancelled', 'refunded', 'returned']] } }
                    ]
                  }
                }
              },
              {
                $project: {
                  unitsBought: {
                    $sum: {
                      $map: {
                        input: {
                          $filter: {
                            input: '$items',
                            as: 'it',
                            cond: { $eq: ['$$it.product', '$$pid'] }
                          }
                        },
                        as: 'f',
                        in: {
                          $add: [
                            { $ifNull: ['$$f.quantity', 0] },
                            { $ifNull: ['$$f.qty', 0] }
                          ]
                        }
                      }
                    }
                  }
                }
              }
            ],
            as: 'orderMatches'
          }
        },
        {
          $addFields: {
            orderCount: { $size: '$orderMatches' },
            unitsSold: { $sum: '$orderMatches.unitsBought' }
          }
        },
        { $sort: { unitsSold: -1, orderCount: -1 } },
        { $limit: 4 },
        {
          $lookup: {
            from: 'categories',
            localField: 'category',
            foreignField: '_id',
            as: 'category'
          }
        },
        { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: 'manufacturers',
            localField: 'brand',
            foreignField: '_id',
            as: 'brand'
          }
        },
        { $unwind: { path: '$brand', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            name: 1,
            price: 1,
            oldPrice: 1,
            images: 1,
            stock: 1,
            discount: 1,
            badge: 1,
            slug: 1,
            rating: 1,
            reviewCount: 1,
            'category._id': 1,
            'category.name': 1,
            'category.slug': 1,
            'brand._id': 1,
            'brand.name': 1,
            'brand.slug': 1,
            'brand.logo': 1
          }
        }
      ]),

      // 7. Lab Equipment products
      Category.findOne({ name: 'Lab Equipment' }).then(async (labCategory) => {
        if (!labCategory) {
return [];
}
        return Product.find({ category: labCategory._id, isActive: true })
          .populate('category', 'name slug')
          .populate('brand', 'name slug logo')
          .select('name price oldPrice images stock discount badge slug rating reviewCount')
          .limit(4)
          .lean();
      }),

      // 8. Testimonials (approved reviews)
      Review.find({ status: 'approved' })
        .populate('user', 'name email')
        .populate('product', 'name slug')
        .sort({ createdAt: -1 })
        .limit(3)
        .lean(),

      // 9. Active promo coupon
      Coupon.findOne({ 
        isActive: true,
        startDate: { $lte: new Date() },
        endDate: { $gte: new Date() }
      })
        .select('code value type minPurchase maximumDiscount description endDate')
        .lean(),

      // 10. Site stats
      Promise.all([
        Product.countDocuments({ isActive: true }),
        Manufacturer.countDocuments({ isActive: true }),
        Order.countDocuments({ status: 'delivered' }),
        User.countDocuments({ role: 'b2b_customer' })
      ]).then(([totalProducts, totalBrands, totalOrders, totalB2BClients]) => ({
        totalProducts,
        totalBrands,
        totalOrders,
        totalB2BClients
      }))
    ]);

    // Format category counts for easier frontend access
    const categoryCountsMap = {};
    categoryCounts.forEach(item => {
      categoryCountsMap[item._id] = item.count;
    });

    // Build response object
    const data = {
      featuredProducts,
      categories,
      categoryCounts: categoryCountsMap,
      dealProducts,
      newArrivals,
      topSellingProducts,
      labEquipmentProducts,
      testimonials,
      activePromo,
      stats
    };

    // Cache for 5 minutes (homepage changes frequently)
    await set(cacheKey, data, 300);

    res.json({
      success: true,
      data,
      cached: false
    });
  } catch (error) {
    logger.error('[HomeController] getHomeData error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load homepage data',
      error: process.env.ERROR_DETAIL_ENABLED === 'true' ? error.message : undefined
    });
  }
};

/**
 * Get category-specific products
 * 
 * Used for the category tabs on homepage
 * 
 * @route GET /api/home/category-products
 * @query category - Category names (comma-separated)
 * @query limit - Products per category (default: 10)
 * @access Public
 */
exports.getCategoryProducts = async (req, res) => {
  const { category, limit = 10 } = req.query;
  
  try {
    // P5 — clamp the limit BEFORE it enters the cache key: prevents
    // cache flooding via ?limit=999999999 and unbounded category dumps
    const rawLimit = parseInt(limit) || 10;
    const safeLimit = Math.min(Math.max(1, rawLimit), 30);
    // Check MongoDB connection status first
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 1) {
      logger.warn('[homeController] MongoDB not connected yet, returning empty category products');
      return res.json({
        success: true,
        data: {},
        cached: false,
        dbConnecting: true
      });
    }

    if (!category) {
      return res.status(400).json({
        success: false,
        message: 'Category parameter is required'
      });
    }

    const categories = category.split(',').map(c => c.trim());
    const cacheKey = `homepage:category-products:${categories.join('-')}:${safeLimit}`;

    // Try cache first
    const cached = await get(cacheKey);
    if (cached) {
      return res.json({
        success: true,
        data: cached,
        cached: true
      });
    }

    // Fetch categories
    const categoryDocs = await Category.find({ 
      name: { $in: categories },
      isActive: true 
    }).select('_id name').lean();

    if (categoryDocs.length === 0) {
      return res.json({
        success: true,
        data: {},
        cached: false
      });
    }

    // Fetch products for each category in parallel
    const productPromises = categoryDocs.map(cat =>
      Product.find({ category: cat._id, isActive: true })
        .populate('category', 'name slug')
        .populate('brand', 'name slug logo')
        .select('name price oldPrice images stock discount badge slug rating reviewCount')
        .limit(safeLimit)
        .lean()
        .then(products => ({ category: cat.name, products }))
    );

    const results = await Promise.all(productPromises);

    // Format as object with category names as keys
    const data = {};
    results.forEach(({ category, products }) => {
      data[category] = products;
    });

    // Cache for 10 minutes
    await set(cacheKey, data, 600);

    res.json({
      success: true,
      data,
      cached: false
    });
  } catch (error) {
    logger.error('[HomeController] getCategoryProducts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load category products',
      error: process.env.ERROR_DETAIL_ENABLED === 'true' ? error.message : undefined
    });
  }
};
