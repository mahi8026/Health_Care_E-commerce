const Product = require('../models/Product');
const Order = require('../models/Order');
const logger = require('../utils/logger');
const redisCache = require('./redisCache');

/**
 * Recommendation Service
 * 
 * Provides intelligent product recommendations using:
 * - Content-based filtering (product similarity)
 * - Collaborative filtering (user behavior patterns)
 * - Hybrid approach combining multiple strategies
 */

// Cache keys
const CACHE_KEYS = {
  SIMILAR: (productId) => `recommendations:similar:${productId}`,
  ALSO_VIEWED: (productId) => `recommendations:also-viewed:${productId}`,
  BOUGHT_TOGETHER: (productId) => `recommendations:bought-together:${productId}`,
  PERSONALIZED: (userId) => `recommendations:personalized:${userId}`,
  TRENDING: 'recommendations:trending'
};

// Cache TTL (24 hours)
const CACHE_TTL = 86400;

/**
 * Calculate similarity score between two products (0-1)
 * Higher score = more similar
 */
function calculateSimilarity(product1, product2) {
  let score = 0;
  
  // Category match (30% weight)
  if (product1.category?.toString() === product2.category?.toString()) {
    score += 0.3;
  }
  
  // Brand match (15% weight)
  if (product1.brand && product2.brand) {
    const brand1 = typeof product1.brand === 'object' ? product1.brand.name : product1.brand;
    const brand2 = typeof product2.brand === 'object' ? product2.brand.name : product2.brand;
    if (brand1 === brand2) {
      score += 0.15;
    }
  }
  
  // Price range similarity (±30%) (10% weight)
  if (product1.price && product2.price) {
    const priceDiff = Math.abs(product1.price - product2.price);
    const avgPrice = (product1.price + product2.price) / 2;
    const priceRatio = priceDiff / avgPrice;
    
    if (priceRatio <= 0.3) {
      score += 0.1 * (1 - priceRatio / 0.3);
    }
  }
  
  // Tags overlap (15% weight)
  if (product1.tags && product2.tags && Array.isArray(product1.tags) && Array.isArray(product2.tags)) {
    const tags1 = new Set(product1.tags);
    const tags2 = new Set(product2.tags);
    const intersection = [...tags1].filter(t => tags2.has(t)).length;
    const union = new Set([...tags1, ...tags2]).size;
    
    if (union > 0) {
      const jaccardSimilarity = intersection / union;
      score += 0.15 * jaccardSimilarity;
    }
  }
  
  // Rating similarity (5% weight)
  const rating1 = product1.rating?.average || product1.rating || 0;
  const rating2 = product2.rating?.average || product2.rating || 0;
  
  if (rating1 > 0 && rating2 > 0) {
    const ratingDiff = Math.abs(rating1 - rating2);
    const ratingSimilarity = 1 - (ratingDiff / 5);
    score += 0.05 * ratingSimilarity;
  }
  
  return score;
}

/**
 * Get similar products based on content (category, brand, price, etc.)
 */
async function getSimilarProducts(productId, limit = 8) {
  try {
    // Check cache first
    const cached = await redisCache.get(CACHE_KEYS.SIMILAR(productId));
    if (cached) {
      logger.info(`[Recommendations] Similar products cache HIT for ${productId}`);
      return JSON.parse(cached);
    }
    
    // Find the current product
    const currentProduct = await Product.findById(productId)
      .populate('category', 'name slug')
      .populate('brand', 'name slug')
      .lean();
    
    if (!currentProduct) {
      throw new Error('Product not found');
    }
    
    // Find candidate products (same category, in stock)
    const candidates = await Product.find({
      _id: { $ne: productId },
      category: currentProduct.category?._id || currentProduct.category,
      isActive: true,
      stock: { $gt: 0 }
    })
      .populate('category', 'name slug')
      .populate('brand', 'name slug')
      .limit(50) // Get more candidates for better filtering
      .lean();
    
    // Calculate similarity scores
    const scored = candidates.map(product => ({
      product,
      score: calculateSimilarity(currentProduct, product)
    }));
    
    // Sort by score descending
    scored.sort((a, b) => b.score - a.score);
    
    // Diversify results (max 3 from same brand)
    const diversified = [];
    const brandCount = {};
    
    for (const item of scored) {
      const brandName = typeof item.product.brand === 'object' 
        ? item.product.brand.name 
        : item.product.brand;
      
      const count = brandCount[brandName] || 0;
      
      if (count < 3) {
        diversified.push(item.product);
        brandCount[brandName] = count + 1;
        
        if (diversified.length >= limit) {
break;
}
      }
    }
    
    // If still not enough, fill with highest scores
    if (diversified.length < limit) {
      const remaining = scored
        .map(item => item.product)
        .filter(p => !diversified.find(d => d._id.toString() === p._id.toString()))
        .slice(0, limit - diversified.length);
      
      diversified.push(...remaining);
    }
    
    const result = diversified.slice(0, limit);
    
    // Cache for 24 hours
    await redisCache.set(CACHE_KEYS.SIMILAR(productId), JSON.stringify(result), CACHE_TTL);
    
    logger.info(`[Recommendations] Generated ${result.length} similar products for ${productId}`);
    return result;
    
  } catch (error) {
    logger.error(`[Recommendations] Error getting similar products: ${error.message}`);
    throw error;
  }
}

/**
 * Get "Customers also viewed" recommendations
 * Uses collaborative filtering based on order history
 */
async function getAlsoViewed(productId, limit = 8) {
  try {
    // Check cache first
    const cached = await redisCache.get(CACHE_KEYS.ALSO_VIEWED(productId));
    if (cached) {
      logger.info(`[Recommendations] Also viewed cache HIT for ${productId}`);
      return JSON.parse(cached);
    }
    
    // Find orders containing this product (last 90 days for recency)
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setDate(threeMonthsAgo.getDate() - 90);
    
    const orders = await Order.find({
      'items.product': productId,
      createdAt: { $gte: threeMonthsAgo },
      status: { $in: ['delivered', 'shipped', 'processing'] } // Only valid orders
    })
      .select('items createdAt')
      .limit(200) // Limit for performance
      .lean();
    
    if (orders.length === 0) {
      // Fallback to similar products if no order history
      logger.info(`[Recommendations] No order history for ${productId}, using similar products`);
      return await getSimilarProducts(productId, limit);
    }
    
    // Count co-occurrences with recency weight
    const coOccurrences = {};
    const now = Date.now();
    
    orders.forEach(order => {
      // Calculate recency weight (newer orders count more)
      const orderAge = now - new Date(order.createdAt).getTime();
      const daysAgo = orderAge / (1000 * 60 * 60 * 24);
      const recencyWeight = Math.exp(-daysAgo / 30); // Exponential decay over 30 days
      
      order.items.forEach(item => {
        const itemId = item.product?.toString();
        
        if (itemId && itemId !== productId.toString()) {
          coOccurrences[itemId] = (coOccurrences[itemId] || 0) + recencyWeight;
        }
      });
    });
    
    // Sort by co-occurrence frequency
    const sortedIds = Object.entries(coOccurrences)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([id]) => id);
    
    if (sortedIds.length === 0) {
      // Fallback to similar products
      return await getSimilarProducts(productId, limit);
    }
    
    // Fetch actual products
    const products = await Product.find({
      _id: { $in: sortedIds },
      isActive: true,
      stock: { $gt: 0 }
    })
      .populate('category', 'name slug')
      .populate('brand', 'name slug')
      .lean();
    
    // Sort by original frequency order
    const sortedProducts = sortedIds
      .map(id => products.find(p => p._id.toString() === id))
      .filter(Boolean);
    
    const result = sortedProducts.slice(0, limit);
    
    // Cache for 24 hours
    await redisCache.set(CACHE_KEYS.ALSO_VIEWED(productId), JSON.stringify(result), CACHE_TTL);
    
    logger.info(`[Recommendations] Generated ${result.length} also-viewed products for ${productId}`);
    return result;
    
  } catch (error) {
    logger.error(`[Recommendations] Error getting also-viewed products: ${error.message}`);
    
    // Fallback to similar products on error
    try {
      return await getSimilarProducts(productId, limit);
    } catch (fallbackError) {
      logger.error(`[Recommendations] Fallback also failed: ${fallbackError.message}`);
      return [];
    }
  }
}

/**
 * Get "Frequently bought together" recommendations
 */
async function getFrequentlyBoughtTogether(productId, limit = 4) {
  try {
    // Check cache first
    const cached = await redisCache.get(CACHE_KEYS.BOUGHT_TOGETHER(productId));
    if (cached) {
      logger.info(`[Recommendations] Bought together cache HIT for ${productId}`);
      return JSON.parse(cached);
    }
    
    // Find orders containing this product (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const orders = await Order.find({
      'items.product': productId,
      createdAt: { $gte: sixMonthsAgo },
      status: { $in: ['delivered', 'shipped'] } // Only completed orders
    })
      .select('items')
      .limit(100)
      .lean();
    
    if (orders.length === 0) {
      return [];
    }
    
    // Count co-purchases (products bought in same order)
    const coPurchases = {};
    
    orders.forEach(order => {
      const productIds = order.items.map(item => item.product?.toString());
      
      productIds.forEach(id => {
        if (id && id !== productId.toString()) {
          coPurchases[id] = (coPurchases[id] || 0) + 1;
        }
      });
    });
    
    // Sort by frequency
    const sortedIds = Object.entries(coPurchases)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([id]) => id);
    
    if (sortedIds.length === 0) {
      return [];
    }
    
    // Fetch actual products
    const products = await Product.find({
      _id: { $in: sortedIds },
      isActive: true,
      stock: { $gt: 0 }
    })
      .populate('category', 'name slug')
      .populate('brand', 'name slug')
      .lean();
    
    const result = products.slice(0, limit);
    
    // Cache for 24 hours
    await redisCache.set(CACHE_KEYS.BOUGHT_TOGETHER(productId), JSON.stringify(result), CACHE_TTL);
    
    logger.info(`[Recommendations] Generated ${result.length} bought-together products for ${productId}`);
    return result;
    
  } catch (error) {
    logger.error(`[Recommendations] Error getting bought-together products: ${error.message}`);
    return [];
  }
}

/**
 * Get personalized recommendations for authenticated users
 */
async function getPersonalizedRecommendations(userId, limit = 12) {
  try {
    // Check cache first
    const cached = await redisCache.get(CACHE_KEYS.PERSONALIZED(userId));
    if (cached) {
      logger.info(`[Recommendations] Personalized cache HIT for user ${userId}`);
      return JSON.parse(cached);
    }
    
    // Get user's order history
    const userOrders = await Order.find({ user: userId })
      .select('items')
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();
    
    // Extract category and brand preferences
    const categoryPreferences = {};
    const brandPreferences = {};

    // P1 — one batched query for ALL product category/brand lookups
    // (previously a sequential Product.findById per item across 20 orders)
    const productIds = [];
    const productIdSet = new Set();
    for (const order of userOrders) {
      for (const item of order.items) {
        const id = String(item.product || '');
        if (id && !productIdSet.has(id)) {
          productIdSet.add(id);
          productIds.push(item.product);
        }
      }
    }

    const productInfos = productIds.length > 0
      ? await Product.find({ _id: { $in: productIds } })
          .select('category brand')
          .lean()
      : [];
    const productInfoById = new Map(productInfos.map(p => [String(p._id), p]));

    for (const order of userOrders) {
      for (const item of order.items) {
        const product = productInfoById.get(String(item.product));
        
        if (product) {
          if (product.category) {
            const catId = product.category.toString();
            categoryPreferences[catId] = (categoryPreferences[catId] || 0) + 1;
          }
          
          if (product.brand) {
            const brandName = typeof product.brand === 'object' ? product.brand.name : product.brand;
            brandPreferences[brandName] = (brandPreferences[brandName] || 0) + 1;
          }
        }
      }
    }
    
    // Get products matching preferences
    const preferredCategories = Object.keys(categoryPreferences);
    const preferredBrands = Object.keys(brandPreferences);
    
    const recommendations = await Product.find({
      $or: [
        { category: { $in: preferredCategories } },
        { brand: { $in: preferredBrands } }
      ],
      isActive: true,
      stock: { $gt: 0 }
    })
      .populate('category', 'name slug')
      .populate('brand', 'name slug')
      .limit(limit * 2) // Get more for filtering
      .lean();
    
    // Score and sort
    const scored = recommendations.map(product => {
      let score = 0;
      
      // Category preference (50%)
      const catId = product.category?._id?.toString() || product.category?.toString();
      if (catId && categoryPreferences[catId]) {
        score += 0.5 * categoryPreferences[catId];
      }
      
      // Brand preference (30%)
      const brandName = typeof product.brand === 'object' ? product.brand.name : product.brand;
      if (brandName && brandPreferences[brandName]) {
        score += 0.3 * brandPreferences[brandName];
      }
      
      // Rating (10%)
      const rating = product.rating?.average || product.rating || 0;
      score += 0.1 * rating;
      
      // Stock availability (10%)
      if (product.stock > 0) {
        score += 0.1;
      }
      
      return { product, score };
    });
    
    scored.sort((a, b) => b.score - a.score);
    
    const result = scored.slice(0, limit).map(item => item.product);
    
    // Cache for 24 hours
    await redisCache.set(CACHE_KEYS.PERSONALIZED(userId), JSON.stringify(result), CACHE_TTL);
    
    logger.info(`[Recommendations] Generated ${result.length} personalized products for user ${userId}`);
    return result;
    
  } catch (error) {
    logger.error(`[Recommendations] Error getting personalized recommendations: ${error.message}`);
    return [];
  }
}

/**
 * Get trending products
 */
async function getTrendingProducts(limit = 12) {
  try {
    // Check cache first
    const cached = await redisCache.get(CACHE_KEYS.TRENDING);
    if (cached) {
      logger.info('[Recommendations] Trending products cache HIT');
      return JSON.parse(cached);
    }
    
    // Get recently ordered products (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const trendingData = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: thirtyDaysAgo },
          status: { $in: ['delivered', 'shipped', 'processing'] }
        }
      },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          orderCount: { $sum: 1 },
          totalQuantity: { $sum: '$items.quantity' }
        }
      },
      { $sort: { orderCount: -1, totalQuantity: -1 } },
      { $limit: limit }
    ]);
    
    const productIds = trendingData.map(item => item._id);
    
    // Fetch actual products
    const products = await Product.find({
      _id: { $in: productIds },
      isActive: true,
      stock: { $gt: 0 }
    })
      .populate('category', 'name slug')
      .populate('brand', 'name slug')
      .lean();
    
    // Sort by original order
    const sortedProducts = productIds
      .map(id => products.find(p => p._id.toString() === id.toString()))
      .filter(Boolean);
    
    const result = sortedProducts.slice(0, limit);
    
    // Cache for 6 hours (trending changes frequently)
    await redisCache.set(CACHE_KEYS.TRENDING, JSON.stringify(result), 21600);
    
    logger.info(`[Recommendations] Generated ${result.length} trending products`);
    return result;
    
  } catch (error) {
    logger.error(`[Recommendations] Error getting trending products: ${error.message}`);
    return [];
  }
}

/**
 * Invalidate recommendation caches for a product
 */
async function invalidateProductCaches(productId) {
  try {
    await redisCache.del(CACHE_KEYS.SIMILAR(productId));
    await redisCache.del(CACHE_KEYS.ALSO_VIEWED(productId));
    await redisCache.del(CACHE_KEYS.BOUGHT_TOGETHER(productId));
    await redisCache.del(CACHE_KEYS.TRENDING);
    
    logger.info(`[Recommendations] Invalidated caches for product ${productId}`);
  } catch (error) {
    logger.error(`[Recommendations] Error invalidating caches: ${error.message}`);
  }
}

module.exports = {
  getSimilarProducts,
  getAlsoViewed,
  getFrequentlyBoughtTogether,
  getPersonalizedRecommendations,
  getTrendingProducts,
  invalidateProductCaches
};
