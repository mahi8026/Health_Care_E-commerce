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
    const expectedSecret = process.env.ADMIN_UTILITY_SECRET;
    
    if (!expectedSecret) {
      return res.status(500).json({
        success: false,
        message: 'ADMIN_UTILITY_SECRET environment variable is not configured on server'
      });
    }
    
    if (secretKey !== expectedSecret) {
      return res.status(403).json({
        success: false,
        message: 'Invalid or missing secret key. Send { "secret": "your-secret" } in request body.'
      });
    }
    
    logger.info('🔄 Starting category count fix...');

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

/**
 * @route   POST /api/utils/sync-missing-categories
 * @desc    Create the 6 missing categories in production
 * @access  Protected by secret key
 */
router.post('/sync-missing-categories', async (req, res) => {
  try {
    // Security check
    const secretKey = req.body.secret;
    const expectedSecret = process.env.ADMIN_UTILITY_SECRET;
    
    if (!expectedSecret) {
      return res.status(500).json({
        success: false,
        message: 'ADMIN_UTILITY_SECRET environment variable is not configured on server'
      });
    }
    
    if (secretKey !== expectedSecret) {
      return res.status(403).json({
        success: false,
        message: 'Invalid or missing secret key'
      });
    }

    console.log('🔄 Starting category sync...');

    // The 6 categories that are missing in production
    const MISSING_CATEGORIES = [
      {
        name: 'Blood Bank Supplies',
        slug: 'blood-bank-supplies',
        description: 'Blood bags, blood collection equipment, transfusion supplies',
        isActive: true,
        displayOrder: 0,
        productCount: 3
      },
      {
        name: 'IV & Infusion Therapy',
        slug: 'iv-and-infusion-therapy',
        description: 'IV cannulas, infusion sets, burette sets, extension lines',
        isActive: true,
        displayOrder: 0,
        productCount: 8
      },
      {
        name: 'Surgical & Wound Care',
        slug: 'surgical-and-wound-care',
        description: 'Surgical tapes, wound dressings, ostomy supplies, surgical consumables',
        isActive: true,
        displayOrder: 0,
        productCount: 28
      },
      {
        name: 'Diabetes Care',
        slug: 'diabetes-care',
        description: 'Blood glucose meters, test strips, CGM systems, diabetes management',
        isActive: true,
        displayOrder: 0,
        productCount: 13
      },
      {
        name: 'Physiotherapy & Rehabilitation',
        slug: 'physiotherapy-and-rehabilitation',
        description: 'TENS units, heating pads, infrared lamps, physical therapy equipment',
        isActive: true,
        displayOrder: 0,
        productCount: 4
      },
      {
        name: 'Ophthalmology & ENT Equipment',
        slug: 'ophthalmology-and-ent-equipment',
        description: 'Ophthalmoscopes, otoscopes, retinoscopes, ENT examination equipment',
        isActive: true,
        displayOrder: 0,
        productCount: 12
      }
    ];

    let created = 0;
    let skipped = 0;
    const createdCategories = [];
    const skippedCategories = [];

    for (const categoryData of MISSING_CATEGORIES) {
      // Check if category already exists
      const existing = await Category.findOne({ slug: categoryData.slug });
      
      if (existing) {
        console.log(`  ⏭️  Skipped: "${categoryData.name}" (already exists)`);
        skipped++;
        skippedCategories.push(categoryData.name);
        continue;
      }
      
      // Create new category
      const category = await Category.create(categoryData);
      console.log(`  ✅ Created: "${categoryData.name}"`);
      created++;
      createdCategories.push({
        name: category.name,
        slug: category.slug,
        id: category._id
      });
    }

    // Get final count
    const totalCategories = await Category.countDocuments();
    const activeCategories = await Category.countDocuments({ isActive: true });

    console.log('✅ Category sync complete!');

    res.json({
      success: true,
      message: 'Missing categories synced successfully',
      data: {
        summary: {
          created,
          skipped,
          totalCategories,
          activeCategories
        },
        createdCategories,
        skippedCategories
      }
    });
  } catch (error) {
    console.error('❌ Sync categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to sync categories',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/utils/test-categories
 * @desc    Test category query without any middleware
 * @access  Public (for debugging)
 */
router.get('/test-categories', async (req, res) => {
  try {
    const mongoose = require('mongoose');
    
    // Get raw count
    const totalCount = await Category.countDocuments();
    const activeCount = await Category.countDocuments({ isActive: true });
    
    // Get all categories (no limit, no filter)
    const allCategories = await Category.find({})
      .select('name slug isActive productCount createdAt')
      .sort({ name: 1 })
      .lean();
    
    // Get only active
    const activeCategories = await Category.find({ isActive: true })
      .select('name slug productCount createdAt')
      .sort({ name: 1 })
      .lean();
    
    res.json({
      success: true,
      data: {
        database: {
          connected: mongoose.connection.readyState === 1,
          dbName: mongoose.connection.name
        },
        counts: {
          total: totalCount,
          active: activeCount,
          inactive: totalCount - activeCount
        },
        allCategories,
        activeCategories,
        activeCategoryNames: activeCategories.map(c => c.name),
        timestamp: new Date().toISOString(),
        note: 'This endpoint bypasses all caching and middleware to show raw database data'
      }
    });
  } catch (error) {
    console.error('❌ Test categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to test categories',
      error: error.message,
      stack: error.stack
    });
  }
});

/**
 * @route   POST /api/utils/clear-cache
 * @desc    Clear all Redis cache (or specific keys)
 * @access  Protected by secret key
 */
router.post('/clear-cache', async (req, res) => {
  try {
    // Security check
    const secretKey = req.body.secret;
    const expectedSecret = process.env.ADMIN_UTILITY_SECRET;
    
    if (!expectedSecret) {
      return res.status(500).json({
        success: false,
        message: 'ADMIN_UTILITY_SECRET environment variable is not configured on server'
      });
    }
    
    if (secretKey !== expectedSecret) {
      return res.status(403).json({
        success: false,
        message: 'Invalid or missing secret key'
      });
    }

    const redisCache = require('../services/redisCache');
    
    if (!redisCache.isRedisConnected()) {
      return res.json({
        success: true,
        message: 'Redis not connected - no cache to clear',
        data: { cleared: 0 }
      });
    }

    // Clear all cache or specific pattern
    const pattern = req.body.pattern || '*';
    
    if (pattern === '*') {
      await redisCache.flushAll();
      console.log('✅ Cleared all Redis cache');
    } else {
      await redisCache.delPattern(pattern);
      console.log(`✅ Cleared Redis cache pattern: ${pattern}`);
    }

    // Warm up important caches
    await redisCache.warmCategories();
    await redisCache.warmFeaturedProducts();
    
    res.json({
      success: true,
      message: 'Cache cleared and warmed successfully',
      data: {
        pattern,
        warmedCaches: ['categories', 'featuredProducts']
      }
    });
  } catch (error) {
    console.error('❌ Clear cache error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear cache',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/utils/fix-all-categories
 * @desc    Comprehensive fix for all category issues
 * @access  Protected by secret key
 */
router.post('/fix-all-categories', async (req, res) => {
  try {
    // Security check
    const secretKey = req.body.secret;
    const expectedSecret = process.env.ADMIN_UTILITY_SECRET;
    
    if (!expectedSecret) {
      return res.status(500).json({
        success: false,
        message: 'ADMIN_UTILITY_SECRET environment variable is not configured on server'
      });
    }
    
    if (secretKey !== expectedSecret) {
      return res.status(403).json({
        success: false,
        message: 'Invalid or missing secret key'
      });
    }

    console.log('🔧 Starting comprehensive category fix...');

    // Step 1: Get all categories
    const allCategories = await Category.find({}).sort({ name: 1 });
    const activeCategories = allCategories.filter(c => c.isActive);
    
    console.log(`   Found: ${allCategories.length} total, ${activeCategories.length} active`);

    // Step 2: Get all products
    const allProducts = await Product.find({ isActive: true });
    console.log(`   Found: ${allProducts.length} active products`);

    // Step 3: Count products per category
    const categoryProductCounts = {};
    
    for (const product of allProducts) {
      if (product.category) {
        const categoryId = product.category.toString();
        categoryProductCounts[categoryId] = (categoryProductCounts[categoryId] || 0) + 1;
      }
    }

    // Step 4: Update all category product counts
    const updates = [];
    let fixed = 0;

    for (const category of allCategories) {
      const categoryId = category._id.toString();
      const actualCount = categoryProductCounts[categoryId] || 0;
      const savedCount = category.productCount || 0;

      if (savedCount !== actualCount) {
        await Category.updateOne(
          { _id: category._id },
          { $set: { productCount: actualCount } }
        );
        
        updates.push({
          name: category.name,
          oldCount: savedCount,
          newCount: actualCount
        });
        
        fixed++;
        console.log(`   ✅ ${category.name}: ${savedCount} → ${actualCount}`);
      }
    }

    // Step 5: Get updated categories
    const updatedCategories = await Category.find({ isActive: true })
      .sort({ name: 1 })
      .select('name slug productCount')
      .lean();

    // Step 6: Calculate statistics
    const totalProducts = updatedCategories.reduce((sum, cat) => sum + (cat.productCount || 0), 0);
    const categoriesWithProducts = updatedCategories.filter(c => c.productCount > 0).length;
    const emptyCategories = updatedCategories.filter(c => !c.productCount || c.productCount === 0).length;

    console.log('✅ Category fix complete!');

    res.json({
      success: true,
      message: 'All category issues fixed successfully',
      data: {
        summary: {
          totalCategories: updatedCategories.length,
          activeCategories: updatedCategories.length,
          categoriesWithProducts,
          emptyCategories,
          totalProducts,
          updatedCounts: fixed
        },
        updates,
        categories: updatedCategories.map(c => ({
          name: c.name,
          slug: c.slug,
          productCount: c.productCount || 0
        }))
      }
    });
  } catch (error) {
    console.error('❌ Fix all categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fix categories',
      error: error.message
    });
  }
});

module.exports = router;
