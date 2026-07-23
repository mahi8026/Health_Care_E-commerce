#!/usr/bin/env node
/**
 * Invalidate All Product Caches
 * Use after direct database updates to force cache refresh
 */

require('dotenv').config();
const redisCache = require('./src/services/redisCache');

async function invalidateAllCaches() {
  try {
    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║           Invalidate All Product Caches                     ║');
    console.log('╚══════════════════════════════════════════════════════════════╝\n');

    console.log('🗑️  Invalidating all product-related caches...\n');

    // Use the centralized Redis cache service
    await redisCache.invalidateProductList();
    console.log('✅ Product list cache invalidated');

    await redisCache.invalidateCategories();
    console.log('✅ Category caches invalidated');

    await redisCache.invalidateBrands();
    console.log('✅ Brand caches invalidated');

    // Invalidate all product detail caches (wildcard)
    await redisCache.delPattern('products:detail:*');
    console.log('✅ All product detail caches invalidated');

    await redisCache.delPattern('homepage:*');
    console.log('✅ Homepage caches invalidated');

    console.log('\n═══════════════════════════════════════════════════════════\n');
    console.log('✅ All caches invalidated successfully!\n');
    console.log('💡 Next steps:');
    console.log('   1. Hard refresh admin panel (Ctrl+Shift+R)');
    console.log('   2. Products should now show correct categories');
    console.log('   3. If issues persist, restart backend server\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    
    if (error.message.includes('Redis') || error.message.includes('connect')) {
      console.log('\n⚠️  Redis not available - using fallback.\n');
      console.log('💡 To clear cache, restart the backend server:');
      console.log('   1. Stop backend (if running)');
      console.log('   2. cd health-care/backend');
      console.log('   3. npm run dev\n');
    } else {
      console.error(error.stack);
    }
    
    process.exit(1);
  }
}

invalidateAllCaches();
