#!/usr/bin/env node
/**
 * Clear Rate Limit Cache
 * Run this script to reset rate limiting counters
 * Usage: node clearRateLimit.js
 */

require('dotenv').config();
const { getRedisClient, isRedisConnected } = require('./src/services/redisCache');

async function clearRateLimits() {
  try {
    console.log('🔄 Attempting to clear rate limit cache...');
    
    if (!isRedisConnected()) {
      console.log('⚠️  Redis is not connected. Rate limits are stored in memory.');
      console.log('💡 Simply restart the backend server to clear memory-based rate limits.');
      process.exit(0);
    }

    const redis = getRedisClient();
    
    // Find all rate limit keys (they start with 'rl:')
    const keys = await redis.keys('rl:*');
    
    if (keys.length === 0) {
      console.log('✓ No rate limit entries found in Redis.');
      process.exit(0);
    }

    console.log(`📋 Found ${keys.length} rate limit entries`);
    
    // Delete all rate limit keys
    await redis.del(...keys);
    
    console.log('✅ Rate limit cache cleared successfully!');
    console.log('💡 You can now make login attempts again.');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error clearing rate limits:', error.message);
    process.exit(1);
  }
}

clearRateLimits();
