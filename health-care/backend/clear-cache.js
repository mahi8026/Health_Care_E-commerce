#!/usr/bin/env node
/**
 * Clear Redis Cache
 * Clear all product and category caches after database updates
 */

require('dotenv').config();
const Redis = require('ioredis');

async function clearCache() {
  try {
    console.log('🔄 Connecting to Redis...\n');
    
    const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
      retryStrategy: (times) => {
        if (times > 3) {
          console.log('❌ Could not connect to Redis. Cache not cleared.');
          console.log('   This is OK - cache will expire naturally.\n');
          return null;
        }
        return Math.min(times * 100, 3000);
      }
    });

    redis.on('error', (err) => {
      console.log('⚠️  Redis error:', err.message);
      console.log('   Cache will expire naturally within 5-60 minutes.\n');
      process.exit(0);
    });

    // Wait for connection
    await new Promise((resolve, reject) => {
      redis.once('ready', resolve);
      redis.once('error', reject);
      setTimeout(() => reject(new Error('Redis connection timeout')), 5000);
    });

    console.log('✅ Connected to Redis\n');
    console.log('🗑️  Clearing caches...\n');

    // Get all keys
    const keys = await redis.keys('*');
    console.log(`   Found ${keys.length} cache keys\n`);

    if (keys.length === 0) {
      console.log('✅ No cache keys to clear\n');
      redis.disconnect();
      process.exit(0);
    }

    // Clear product-related caches
    const productKeys = keys.filter(k => 
      k.includes('products') || 
      k.includes('category') || 
      k.includes('homepage') ||
      k.includes('featured')
    );

    if (productKeys.length > 0) {
      console.log(`   Clearing ${productKeys.length} product/category cache keys:`);
      for (const key of productKeys) {
        await redis.del(key);
        console.log(`   ✅ Deleted: ${key}`);
      }
    }

    // Clear all cache (nuclear option)
    console.log('\n   Flushing all Redis cache...\n');
    await redis.flushall();
    
    console.log('✅ All cache cleared successfully!\n');
    console.log('💡 Next steps:');
    console.log('   1. Refresh your admin panel (hard refresh: Ctrl+Shift+R)');
    console.log('   2. Clear browser cache if needed');
    console.log('   3. Products should now show correct categories\n');

    redis.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    
    if (error.message.includes('ECONNREFUSED') || error.message.includes('timeout')) {
      console.log('\n⚠️  Could not connect to Redis.');
      console.log('   This is OK if Redis is not running.');
      console.log('   The cache will expire naturally within 5-60 minutes.\n');
      console.log('💡 To see changes immediately:');
      console.log('   1. Hard refresh admin panel (Ctrl+Shift+R)');
      console.log('   2. Or restart the backend server\n');
    }
    
    process.exit(0);
  }
}

// Run
console.log('╔══════════════════════════════════════════════════════════════╗');
console.log('║                    Clear Redis Cache                        ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

clearCache();
