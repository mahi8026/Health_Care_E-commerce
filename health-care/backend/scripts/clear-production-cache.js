/**
 * Clear Production Cache
 * 
 * This script clears the production Redis cache for the Comfy Stim product
 * 
 * Usage: node scripts/clear-production-cache.js
 */

const Redis = require('ioredis');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.production') });

async function clearProductionCache() {
  let redis;
  
  try {
    console.log('🔌 Connecting to Production Redis...');
    console.log('   Host:', process.env.REDIS_HOST);
    console.log('   Port:', process.env.REDIS_PORT);
    
    redis = new Redis({
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT,
      password: process.env.REDIS_PASSWORD,
      db: process.env.REDIS_DB || 0,
      retryStrategy: (times) => {
        if (times > 3) {
          console.error('❌ Could not connect to Redis after 3 attempts');
          return null;
        }
        return Math.min(times * 100, 3000);
      }
    });

    await new Promise((resolve, reject) => {
      redis.on('ready', resolve);
      redis.on('error', reject);
      setTimeout(() => reject(new Error('Connection timeout')), 10000);
    });

    console.log('✅ Connected to Production Redis\n');

    // Get all keys
    console.log('🔍 Finding cache keys...');
    const allKeys = await redis.keys('*');
    console.log(`   Found ${allKeys.length} total keys\n`);

    if (allKeys.length === 0) {
      console.log('✅ No cache keys found');
      return;
    }

    // Show some keys
    console.log('📋 Sample keys:');
    allKeys.slice(0, 10).forEach(key => console.log(`   - ${key}`));
    if (allKeys.length > 10) {
      console.log(`   ... and ${allKeys.length - 10} more`);
    }

    // Clear all product cache
    console.log('\n🗑️  Clearing ALL product cache keys...');
    const productKeys = allKeys.filter(key => 
      key.includes('product') || 
      key.includes('comfy') ||
      key.includes('COMFY')
    );
    
    if (productKeys.length > 0) {
      console.log(`   Clearing ${productKeys.length} product keys...`);
      await redis.del(...productKeys);
      console.log('   ✅ Product cache cleared!');
    }

    // Clear the specific product
    console.log('\n🎯 Clearing Comfy Stim specific cache...');
    const comfyKeys = [
      'products:detail:/api/products/comfy-stim-806-plus-digital-tens-machine-electro-stimulator',
      'products:detail:comfy-stim-806-plus-digital-tens-machine-electro-stimulator',
      'products:list:/api/products?search=comfy',
      'products:list:/api/products?category=6aa4e9b014e906aa880966ee'
    ];
    
    for (const key of comfyKeys) {
      const deleted = await redis.del(key);
      if (deleted) {
        console.log(`   ✅ Cleared: ${key}`);
      }
    }

    // Optional: Clear ALL cache for safety
    console.log('\n🗑️  Clearing ALL cache keys for maximum freshness...');
    await redis.flushdb();
    console.log('   ✅ All cache cleared!\n');

    console.log('═'.repeat(70));
    console.log('✅ PRODUCTION CACHE CLEARED');
    console.log('═'.repeat(70));
    console.log('\n📋 Summary:');
    console.log('   Environment: PRODUCTION');
    console.log('   Redis Host:', process.env.REDIS_HOST);
    console.log('   Total keys cleared:', allKeys.length);
    
    console.log('\n✅ Next Steps:');
    console.log('   1. Wait 30 seconds for cache to propagate');
    console.log('   2. Visit: https://mediportbd.com/products/comfy-stim-806-plus-digital-tens-machine-electro-stimulator');
    console.log('   3. Hard refresh (Ctrl+F5 or Cmd+Shift+R)');
    console.log('   4. Images and brand should now show correctly');
    console.log('\n   If still not working:');
    console.log('   - Check Vercel deployment logs');
    console.log('   - Trigger a new deployment on Vercel');
    console.log('   - Clear Vercel edge cache');

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    
    if (error.message.includes('ENOTFOUND') || error.message.includes('ECONNREFUSED')) {
      console.log('\n⚠️  Could not connect to Redis.');
      console.log('   Check your .env.production file has correct Redis credentials.');
    }
  } finally {
    if (redis) {
      redis.disconnect();
      console.log('\n🔌 Redis connection closed\n');
    }
  }
}

clearProductionCache();
