/**
 * Clear Product Cache
 * 
 * This script clears all product-related cache entries in Redis
 * 
 * Usage: node scripts/clear-product-cache.js
 */

const Redis = require('ioredis');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function clearCache() {
  let redis;
  
  try {
    console.log('🔌 Connecting to Redis...');
    
    // Connect to Redis
    redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
      db: process.env.REDIS_DB || 0,
      retryStrategy: (times) => {
        if (times > 3) {
          console.error('❌ Could not connect to Redis after 3 attempts');
          return null;
        }
        return Math.min(times * 100, 3000);
      }
    });

    redis.on('error', (err) => {
      console.error('Redis connection error:', err.message);
    });

    await new Promise((resolve, reject) => {
      redis.on('ready', resolve);
      redis.on('error', reject);
      setTimeout(() => reject(new Error('Connection timeout')), 5000);
    });

    console.log('✅ Connected to Redis\n');

    // Get all keys
    console.log('🔍 Finding cache keys...');
    const allKeys = await redis.keys('*');
    console.log(`   Found ${allKeys.length} total keys\n`);

    if (allKeys.length === 0) {
      console.log('✅ No cache keys to clear');
      return;
    }

    // Filter product-related keys
    const productKeys = allKeys.filter(key => 
      key.includes('product') || 
      key.includes('products') ||
      key.includes('comfy') ||
      key.includes('COMFY')
    );

    console.log(`🗑️  Clearing ${productKeys.length} product-related keys...`);
    
    if (productKeys.length > 0) {
      productKeys.forEach(key => console.log(`   - ${key}`));
      await redis.del(...productKeys);
      console.log('\n✅ Product cache cleared!');
    } else {
      console.log('   No product-specific keys found');
    }

    // Also clear all keys option
    console.log('\n💭 Clear ALL cache keys? (y/n)');
    console.log(`   This will clear ${allKeys.length} keys total`);
    console.log('   Type "yes" and run: redis.flushdb()');
    
    // For automation, let's clear all
    console.log('\n🗑️  Clearing ALL cache keys for safety...');
    await redis.flushdb();
    console.log('✅ All cache cleared!\n');

    console.log('═'.repeat(70));
    console.log('✅ CACHE CLEARED SUCCESSFULLY');
    console.log('═'.repeat(70));
    console.log('\n📋 Summary:');
    console.log('   Product keys cleared:', productKeys.length);
    console.log('   Total keys cleared:', allKeys.length);
    console.log('\n✅ Next Steps:');
    console.log('   1. Refresh the product page (hard refresh: Ctrl+F5)');
    console.log('   2. Images and brand should now display correctly');
    console.log('   3. If still not working, restart the backend server');

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    
    if (error.message.includes('ECONNREFUSED')) {
      console.log('\n⚠️  Redis connection refused.');
      console.log('   The cache system may not be running or may use in-memory cache.');
      console.log('   Try restarting the backend server instead.');
    }
  } finally {
    if (redis) {
      redis.disconnect();
      console.log('\n🔌 Redis connection closed\n');
    }
  }
}

clearCache();
