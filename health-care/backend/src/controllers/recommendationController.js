const recommendationService = require('../services/recommendationService');
const logger = require('../utils/logger');
const { successResponse, errorResponse } = require('../utils/responseHelper');

/**
 * @desc    Get similar products based on content filtering
 * @route   GET /api/recommendations/similar/:productId
 * @access  Public
 */
exports.getSimilarProducts = async (req, res) => {
  try {
    const { productId } = req.params;
    const limit = parseInt(req.query.limit) || 8;
    
    if (!productId || !productId.match(/^[0-9a-fA-F]{24}$/)) {
      return errorResponse(res, 'Invalid product ID', null, 400);
    }
    
    const recommendations = await recommendationService.getSimilarProducts(productId, limit);
    
    return successResponse(res, {
      count: recommendations.length,
      recommendations,
      algorithm: 'content-based-filtering'
    });
    
  } catch (error) {
    logger.error(`[getSimilarProducts] ${error.message}`);
    return errorResponse(res, 'Failed to get recommendations', process.env.NODE_ENV === 'development' ? [error.message] : null, 500);
  }
};

/**
 * @desc    Get "Customers also viewed" recommendations
 * @route   GET /api/recommendations/also-viewed/:productId
 * @access  Public
 */
exports.getAlsoViewed = async (req, res) => {
  try {
    const { productId } = req.params;
    const limit = parseInt(req.query.limit) || 8;
    
    if (!productId || !productId.match(/^[0-9a-fA-F]{24}$/)) {
      return errorResponse(res, 'Invalid product ID', null, 400);
    }
    
    const recommendations = await recommendationService.getAlsoViewed(productId, limit);
    
    return successResponse(res, {
      count: recommendations.length,
      recommendations,
      algorithm: 'collaborative-filtering'
    });
    
  } catch (error) {
    logger.error(`[getAlsoViewed] ${error.message}`);
    return errorResponse(res, 'Failed to get recommendations', process.env.NODE_ENV === 'development' ? [error.message] : null, 500);
  }
};

/**
 * @desc    Get "Frequently bought together" recommendations
 * @route   GET /api/recommendations/bought-together/:productId
 * @access  Public
 */
exports.getBoughtTogether = async (req, res) => {
  try {
    const { productId } = req.params;
    const limit = parseInt(req.query.limit) || 4;
    
    if (!productId || !productId.match(/^[0-9a-fA-F]{24}$/)) {
      return errorResponse(res, 'Invalid product ID', null, 400);
    }
    
    const recommendations = await recommendationService.getFrequentlyBoughtTogether(productId, limit);
    
    return successResponse(res, {
      count: recommendations.length,
      recommendations,
      algorithm: 'association-rules'
    });
    
  } catch (error) {
    logger.error(`[getBoughtTogether] ${error.message}`);
    return errorResponse(res, 'Failed to get recommendations', process.env.NODE_ENV === 'development' ? [error.message] : null, 500);
  }
};

/**
 * @desc    Get personalized recommendations for authenticated users
 * @route   GET /api/recommendations/personalized
 * @access  Private (requires authentication)
 */
exports.getPersonalized = async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 12;
    
    const recommendations = await recommendationService.getPersonalizedRecommendations(userId, limit);
    
    return successResponse(res, {
      count: recommendations.length,
      recommendations,
      algorithm: 'hybrid-personalized'
    });
    
  } catch (error) {
    logger.error(`[getPersonalized] ${error.message}`);
    return errorResponse(res, 'Failed to get recommendations', process.env.NODE_ENV === 'development' ? [error.message] : null, 500);
  }
};

/**
 * @desc    Get trending products
 * @route   GET /api/recommendations/trending
 * @access  Public
 */
exports.getTrending = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 12;
    
    const recommendations = await recommendationService.getTrendingProducts(limit);
    
    return successResponse(res, {
      count: recommendations.length,
      recommendations,
      algorithm: 'popularity-based'
    });
    
  } catch (error) {
    logger.error(`[getTrending] ${error.message}`);
    return errorResponse(res, 'Failed to get trending products', process.env.NODE_ENV === 'development' ? [error.message] : null, 500);
  }
};

/**
 * @desc    Get hybrid recommendations (combines multiple strategies)
 * @route   GET /api/recommendations/hybrid/:productId
 * @access  Public
 */
exports.getHybridRecommendations = async (req, res) => {
  try {
    const { productId } = req.params;
    const limit = parseInt(req.query.limit) || 8;
    
    if (!productId || !productId.match(/^[0-9a-fA-F]{24}$/)) {
      return errorResponse(res, 'Invalid product ID', null, 400);
    }
    
    // Get recommendations from both strategies
    const [similar, alsoViewed] = await Promise.all([
      recommendationService.getSimilarProducts(productId, limit),
      recommendationService.getAlsoViewed(productId, limit)
    ]);
    
    // Combine and deduplicate
    const combined = [...similar];
    const seenIds = new Set(similar.map(p => p._id.toString()));
    
    for (const product of alsoViewed) {
      const id = product._id.toString();
      if (!seenIds.has(id)) {
        combined.push(product);
        seenIds.add(id);
      }
    }
    
    // Take top N
    const recommendations = combined.slice(0, limit);
    
    return successResponse(res, {
      count: recommendations.length,
      recommendations,
      algorithm: 'hybrid',
      breakdown: {
        contentBased: similar.length,
        collaborative: alsoViewed.length,
        total: recommendations.length
      }
    });
    
  } catch (error) {
    logger.error(`[getHybridRecommendations] ${error.message}`);
    return errorResponse(res, 'Failed to get recommendations', process.env.NODE_ENV === 'development' ? [error.message] : null, 500);
  }
};
