#!/usr/bin/env node
/**
 * Clear All Redis Cache & Verify Database
 * Forces complete cache refresh for categories and products
 * 
 * Usage: node clear-all-cache.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const redisCache = require('./src/services/redisCache');
const Product = require('./src/models/Product');
const Category = require('./src/models/Category');

async function clearAllCache() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Wait for Redis to initialize
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('🔄 Checking Redis connection...');
    const isConnected = redisCache.isRedisConnected();
    
    if (isConnected) {
      console.log('✅ Redis is connected\n');
      
      console.log('🔄 Clearing all Redis cache...');
      await redisCache.invalidateAllCaches();
      console.log('✅ All Redis caches cleared\n');
      
      console.log('🔄 Warming up categories cache...');
      await redisCache.warmCategories();
      console.log('✅ Categories cache warmed\n');
    } else {
      console.log('⚠️  Redis not available - this is OK, app will work without cache\n');
    }

    // Verify database status
    console.log('📊 Database Status:\n');
    
    const totalProducts = await Product.countDocuments();
    const activeProducts = await Product.countDocuments({ isActive: true });
    const totalCategories = await Category.countDocuments();
    const activeCategories = await Category.countDocuments({ isActive: true });
    
    console.log(`  Products: ${activeProducts}/${totalProducts} active`);
    console.log(`  Categories: ${activeCategories}/${totalCategories} active\n`);
    
    // Show category distribution
    console.log('📦 Category Distribution:\n');
    const categoryStats = await Product.aggregate([
      { $match: { isActive: true } },
      {
        $lookup: {
          from: 'categories',
          localField: 'category',
          foreignField: '_id',
          as: 'categoryInfo'
        }
      },
      { $unwind: { path: '$categoryInfo', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: '$categoryInfo.name',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);
    
    categoryStats.forEach(stat => {
      console.log(`  ${stat._id || 'Unknown'}: ${stat.count} products`);
    });

    await redisCache.close();
    await mongoose.connection.close();

    console.log('\n✅ Cache clearing complete!');
    console.log('\n💡 Next Steps:');
    console.log('  1. Backend is already running on Railway - changes are live');
    console.log('  2. Hard refresh browser: Ctrl + Shift + R (or Cmd + Shift + R on Mac)');
    console.log('  3. If still showing old data, clear browser cache:');
    console.log('     - Chrome: Ctrl + Shift + Delete');
    console.log('     - Firefox: Ctrl + Shift + Delete');
    console.log('     - Edge: Ctrl + Shift + Delete');
    console.log('  4. Or open in Incognito/Private window to bypass all caching\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run
console.log('╔══════════════════════════════════════════════════════════════╗');
console.log('║          Clear All Cache & Verify Database                  ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

clearAllCache();
