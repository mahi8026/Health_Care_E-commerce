#!/usr/bin/env node

/**
 * Clear Manufacturer Cache Script
 * 
 * Clears Redis cache for manufacturers endpoint
 * Run this after adding new brands to make them visible immediately
 * 
 * Usage:
 *   node src/scripts/clearManufacturerCache.js
 */

require('dotenv').config();
const redis = require('ioredis');

async function clearManufacturerCache() {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  Clear Manufacturer Cache');
  console.log('═══════════════════════════════════════════════════════════\n');

  // Try to connect to Redis
  const redisConfig = process.env.REDIS_URL ? 
    process.env.REDIS_URL : 
    {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD || undefined,
      db: parseInt(process.env.REDIS_DB || '0'),
      retryStrategy: (times) => {
        if (times > 3) {
          console.log('❌ Could not connect to Redis after 3 attempts');
          return null; // Stop retrying
        }
        return Math.min(times * 100, 2000); // Retry with exponential backoff
      }
    };

  const client = new redis(redisConfig);

  try {
    // Test connection
    await client.ping();
    console.log('✓ Connected to Redis\n');

    // Find all manufacturer cache keys
    console.log('→ Searching for manufacturer cache keys...');
    const keys = await client.keys('manufacturers:*');
    
    if (keys.length > 0) {
      console.log(`✓ Found ${keys.length} cache key(s):\n`);
      keys.forEach(key => console.log(`   - ${key}`));
      
      // Delete all keys
      console.log('\n→ Deleting cache keys...');
      await client.del(...keys);
      console.log(`✓ Cleared ${keys.length} manufacturer cache key(s)\n`);
      
      console.log('✅ Cache cleared successfully!');
      console.log('   New brands should now be visible in the frontend.\n');
    } else {
      console.log('✓ No manufacturer cache keys found');
      console.log('   Cache may have already expired or Redis is not being used.\n');
    }

    await client.quit();
    console.log('═══════════════════════════════════════════════════════════\n');
    
  } catch (error) {
    if (error.message.includes('ECONNREFUSED') || error.message.includes('connect')) {
      console.log('⚠️  Redis is not available');
      console.log('   The application is using in-memory cache fallback.\n');
      console.log('💡 Solutions:');
      console.log('   1. Wait 10 minutes for cache to expire automatically');
      console.log('   2. Restart the backend server to clear in-memory cache');
      console.log('   3. Hard refresh the browser (Ctrl+Shift+R)\n');
    } else {
      console.error('❌ Error:', error.message);
    }
    
    try {
      await client.quit();
    } catch (e) {
      // Ignore quit errors
    }
    
    console.log('═══════════════════════════════════════════════════════════\n');
  }
}

// Run script
if (require.main === module) {
  clearManufacturerCache().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}

module.exports = { clearManufacturerCache };
