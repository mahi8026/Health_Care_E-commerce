const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Category = require('../models/Category');
const { protect, authorize } = require('../middleware/auth');

/**
 * @route   POST /api/utils/fix-category-counts
 * @desc    Recalculate and fix all category product counts
 * @access  Protected by secret key in request body
 */
router.post('/fix-category-counts', async (req, res) => {
  try {
    // Security: Require secret key in request body (avoid CORS issues with headers)
    const secretKey = req.body.secret;
    const expectedSecret = process.env.ADMIN_UTILITY_SECRET || 'medcore-fix-2024';
    
    if (secretKey !== expectedSecret) {
      return res.status(403).json({
        success: false,
        message: 'Invalid or missing secret key. Send { "secret": "your-secret" } in request body.'
      });
    }
    
    console.log('🔄 Starting category count fix...');

    // Get all categories
    const categories = await Category.find({});
    
    const results = {
      updated: [],
      unchanged: [],
      errors: []
    };

    for (const category of categories) {
      try {
        // Count products in this category
        const actualCount = await Product.countDocuments({
          category: category._id,
          isActive: true
        });
        
        const oldCount = category.productCount || 0;
        
        if (oldCount !== actualCount) {
          // Update category with correct count
          await Category.updateOne(
            { _id: category._id },
            { $set: { productCount: actualCount } }
          );
          
          results.updated.push({
            name: category.name,
            oldCount,
            newCount: actualCount
          });
          
          console.log(`  ✅ Updated: ${category.name} (${oldCount} → ${actualCount})`);
        } else {
          results.unchanged.push({
            name: category.name,
            count: actualCount
          });
          
          console.log(`  ✓ Correct: ${category.name} (${actualCount})`);
        }
      } catch (error) {
        results.errors.push({
          name: category.name,
          error: error.message
        });
        console.error(`  ❌ Error: ${category.name} - ${error.message}`);
      }
    }

    // Get final counts
    const finalCategories = await Category.find({ isActive: true })
      .select('name productCount')
      .sort({ productCount: -1 });
    
    const totalProducts = finalCategories.reduce((sum, cat) => sum + (cat.productCount || 0), 0);

    console.log('✅ Category count fix complete!');

    res.json({
      success: true,
      message: 'Category product counts fixed successfully',
      data: {
        summary: {
          total: categories.length,
          updated: results.updated.length,
          unchanged: results.unchanged.length,
          errors: results.errors.length,
          totalProducts
        },
        updated: results.updated,
        unchanged: results.unchanged,
        errors: results.errors,
        finalDistribution: finalCategories.map(cat => ({
          name: cat.name,
          productCount: cat.productCount || 0
        }))
      }
    });
  } catch (error) {
    console.error('❌ Fix category counts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fix category counts',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/utils/verify-category-counts
 * @desc    Verify category product counts without fixing
 * @access  Public (for debugging)
 */
router.get('/verify-category-counts', async (req, res) => {
  try {
    const categories = await Category.find({}).sort({ name: 1 });
    const activeCategories = categories.filter(c => c.isActive);
    
    const verification = [];
    let mismatches = 0;

    for (const category of categories) {
      const actualCount = await Product.countDocuments({
        category: category._id,
        isActive: true
      });
      
      const savedCount = category.productCount || 0;
      const isMatch = savedCount === actualCount;
      
      if (!isMatch) mismatches++;
      
      verification.push({
        id: category._id,
        name: category.name,
        slug: category.slug,
        isActive: category.isActive,
        savedCount,
        actualCount,
        status: isMatch ? 'OK' : 'MISMATCH'
      });
    }

    res.json({
      success: true,
      data: {
        totalCategories: categories.length,
        activeCategories: activeCategories.length,
        inactiveCategories: categories.length - activeCategories.length,
        mismatches,
        verification
      }
    });
  } catch (error) {
    console.error('❌ Verify category counts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify category counts',
      error: error.message
    });
  }
});

module.exports = router;
