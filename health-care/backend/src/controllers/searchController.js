const logger = require('../utils/logger');
const { successResponse, errorResponse } = require('../utils/responseHelper');

/**
 * @desc    Get trending search terms
 * @route   GET /api/search/trending
 * @access  Public
 */
exports.getTrendingSearches = async (req, res) => {
  try {
    // Returns curated popular searches. Future: replace with SearchLog model aggregation.
    const trendingSearches = [
      'ECG Machine',
      'N95 Mask',
      'HbA1c Kit',
      'Pulse Oximeter',
      'Surgical Gloves',
      'Blood Pressure Monitor',
    ];
    
    return successResponse(res, {
      searches: trendingSearches.slice(0, 4),
    });
  } catch (error) {
    logger.error(`[getTrendingSearches] ${error.message}`);
    return errorResponse(res, 'Error fetching trending searches', process.env.NODE_ENV === 'development' ? [error.message] : null, 500);
  }
};

/**
 * @desc    Log a search query (for future trending analysis)
 * @route   POST /api/search/log
 * @access  Public
 */
exports.logSearch = async (req, res) => {
  try {
    const { query } = req.body;
    
    if (!query) {
      return errorResponse(res, 'Search query is required', null, 400);
    }
    
    // Search logging is a no-op until a SearchLog model is implemented.
    // When ready: await SearchLog.create({ query, timestamp: new Date() });
    
    return successResponse(res, null, 'Search logged successfully');
  } catch (error) {
    logger.error(`[logSearch] ${error.message}`);
    return errorResponse(res, 'Error logging search', process.env.NODE_ENV === 'development' ? [error.message] : null, 500);
  }
};
