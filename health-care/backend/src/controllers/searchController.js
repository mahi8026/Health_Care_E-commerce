/**
 * @desc    Get trending search terms
 * @route   GET /api/search/trending
 * @access  Public
 */
exports.getTrendingSearches = async (req, res) => {
  try {
    // For now, return hardcoded popular searches
    // In the future, this could track actual search queries from a SearchLog model
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
        searches: trendingSearches.slice(0, 4), // Return top 4
      },
    });
  } catch (error) {
    console.error('Error fetching trending searches:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching trending searches',
      error: error.message,
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
    
    // TODO: Implement SearchLog model to track searches
    // For now, just return success
    
    res.json({
      success: true,
      message: 'Search logged successfully',
    });
  } catch (error) {
    console.error('Error logging search:', error);
    res.status(500).json({
      success: false,
      message: 'Error logging search',
      error: error.message,
    });
  }
};
