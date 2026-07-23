const express = require('express');
const router = express.Router();
const { getTrendingSearches, logSearch } = require('../controllers/searchController');

// Public routes
router.get('/trending', getTrendingSearches);
router.post('/log', logSearch);

module.exports = router;
