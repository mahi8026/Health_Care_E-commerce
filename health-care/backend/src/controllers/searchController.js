const logger = require('../utils/logger');

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
    
    res.json({
      success: true,
      data: {
        searches: trendingSearches.slice(0, 4),
      },
    });
  } catch (error) {
    logger.error(`[getTrendingSearches] ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Error fetching trending searches',
    });
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
      return res.status(400).json({
        success: false,
        message: 'Search query is required',
      });
    }
    
    // Search logging is a no-op until a SearchLog model is implemented.
    // When ready: await SearchLog.create({ query, timestamp: new Date() });
    
    res.json({
      success: true,
      message: 'Search logged successfully',
    });
  } catch (error) {
    logger.error(`[logSearch] ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Error logging search',
    });
  }
};
