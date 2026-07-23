const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getSimilarProducts,
  getAlsoViewed,
  getBoughtTogether,
  getPersonalized,
  getTrending,
  getHybridRecommendations
} = require('../controllers/recommendationController');

/**
 * @swagger
 * tags:
 *   name: Recommendations
 *   description: AI-powered product recommendation endpoints
 */

/**
 * @swagger
 * /recommendations/similar/{productId}:
 *   get:
 *     summary: Get similar products (content-based filtering)
 *     tags: [Recommendations]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 8
 *         description: Number of recommendations
 *     responses:
 *       200:
 *         description: Similar products
 *       400:
 *         description: Invalid product ID
 */
router.get('/similar/:productId', getSimilarProducts);

/**
 * @swagger
 * /recommendations/also-viewed/{productId}:
 *   get:
 *     summary: Get "Customers also viewed" recommendations
 *     tags: [Recommendations]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 8
 *         description: Number of recommendations
 *     responses:
 *       200:
 *         description: Also viewed products (collaborative filtering)
 */
router.get('/also-viewed/:productId', getAlsoViewed);

/**
 * @swagger
 * /recommendations/bought-together/{productId}:
 *   get:
 *     summary: Get "Frequently bought together" recommendations
 *     tags: [Recommendations]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 4
 *         description: Number of recommendations
 *     responses:
 *       200:
 *         description: Frequently bought together products
 */
router.get('/bought-together/:productId', getBoughtTogether);

/**
 * @swagger
 * /recommendations/hybrid/{productId}:
 *   get:
 *     summary: Get hybrid recommendations (combines multiple strategies)
 *     tags: [Recommendations]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 8
 *         description: Number of recommendations
 *     responses:
 *       200:
 *         description: Hybrid recommendations
 */
router.get('/hybrid/:productId', getHybridRecommendations);

/**
 * @swagger
 * /recommendations/trending:
 *   get:
 *     summary: Get trending products
 *     tags: [Recommendations]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 12
 *         description: Number of products
 *     responses:
 *       200:
 *         description: Trending products
 */
router.get('/trending', getTrending);

/**
 * @swagger
 * /recommendations/personalized:
 *   get:
 *     summary: Get personalized recommendations (requires authentication)
 *     tags: [Recommendations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 12
 *         description: Number of recommendations
 *     responses:
 *       200:
 *         description: Personalized recommendations
 *       401:
 *         description: Unauthorized
 */
router.get('/personalized', protect, getPersonalized);

module.exports = router;
