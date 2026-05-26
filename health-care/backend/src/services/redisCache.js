const Redis = require('ioredis');
const logger = require('../utils/logger');

/**
 * Redis Cache Service
 * Replaces node-cache with Redis for distributed caching
 */

let redisClient = null;
let isConnected = false;

/**
 * Initialize Redis connection
 */
function initRedis() {
  if (redisClient) {
    return redisClient;
  }

  try {
    const redisHost = process.env.REDIS_HOST || 'localhost';
    const redisPort = parseInt(process.env.REDIS_PORT) || 6379;
    
    // Auto-detect if TLS is needed (Redis Cloud uses non-standard ports and requires TLS)
    const needsTLS = process.env.REDIS_TLS === 'true' || 
                     (redisHost.includes('redislabs.com') || redisHost.includes('redis.cloud')) ||
                     (redisPort !== 6379 && redisHost !== 'localhost');
    
    const redisConfig = {
      host: redisHost,
      port: redisPort,
      password: process.env.REDIS_PASSWORD || undefined,
      db: parseInt(process.env.REDIS_DB) || 0,
      // Redis Cloud requires TLS on non-local connections
      tls: needsTLS ? { rejectUnauthorized: false } : undefined,
      retryStrategy: (times) => {
        // Stop retrying after 3 attempts
        if (times > 3) {
          logger.warn('[Redis] Max retries reached. Stopping reconnection attempts.');
          return null;
        }
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: false,
      connectTimeout: 10000
    };

    redisClient = new Redis(redisConfig);

    redisClient.on('connect', () => {
      logger.info('[Redis] Connecting...');
    });

    redisClient.on('ready', () => {
      isConnected = true;
      logger.info('[Redis] Connected and ready');
    });

    redisClient.on('error', (err) => {
      isConnected = false;
      logger.error(`[Redis] Error: ${err.message}`);
    });

    redisClient.on('close', () => {
      isConnected = false;
      logger.warn('[Redis] Connection closed');
    });

    redisClient.on('reconnecting', () => {
      logger.info('[Redis] Reconnecting...');
    });

    return redisClient;
  } catch (error) {
    logger.error(`[Redis] Initialization error: ${error.message}`);
    return null;
  }
}

/**
 * Get Redis client instance
 */
function getRedisClient() {
  if (!redisClient) {
    return initRedis();
  }
  return redisClient;
}

/**
 * Check if Redis is connected
 */
function isRedisConnected() {
  return isConnected && redisClient && redisClient.status === 'ready';
}

/**
 * Set cache value
 * @param {String} key - Cache key
 * @param {*} value - Value to cache (will be JSON stringified)
 * @param {Number} ttl - Time to live in seconds (default: 300)
 */
async function set(key, value, ttl = 300) {
  try {
    if (!isRedisConnected()) {
      logger.warn('[Redis] Not connected, skipping cache set');
      return false;
    }

    const serialized = JSON.stringify(value);
    
    if (ttl > 0) {
      await redisClient.setex(key, ttl, serialized);
    } else {
      await redisClient.set(key, serialized);
    }

    logger.debug(`[Redis] Set key: ${key}, TTL: ${ttl}s`);
    return true;
  } catch (error) {
    logger.error(`[Redis] Set error for key ${key}: ${error.message}`);
    return false;
  }
}

/**
 * Get cache value
 * @param {String} key - Cache key
 * @returns {*} Cached value or null
 */
async function get(key) {
  try {
    if (!isRedisConnected()) {
      logger.warn('[Redis] Not connected, skipping cache get');
      return null;
    }

    const value = await redisClient.get(key);
    
    if (!value) {
      return null;
    }

    const deserialized = JSON.parse(value);
    logger.debug(`[Redis] Get key: ${key} - HIT`);
    return deserialized;
  } catch (error) {
    logger.error(`[Redis] Get error for key ${key}: ${error.message}`);
    return null;
  }
}

/**
 * Delete cache key
 * @param {String} key - Cache key
 */
async function del(key) {
  try {
    if (!isRedisConnected()) {
      return false;
    }

    await redisClient.del(key);
    logger.debug(`[Redis] Deleted key: ${key}`);
    return true;
  } catch (error) {
    logger.error(`[Redis] Delete error for key ${key}: ${error.message}`);
    return false;
  }
}

/**
 * Delete multiple keys matching pattern
 * @param {String} pattern - Key pattern (e.g., 'products:*')
 */
async function delPattern(pattern) {
  try {
    if (!isRedisConnected()) {
      return false;
    }

    const keys = await redisClient.keys(pattern);
    
    if (keys.length > 0) {
      await redisClient.del(...keys);
      logger.debug(`[Redis] Deleted ${keys.length} keys matching pattern: ${pattern}`);
    }

    return true;
  } catch (error) {
    logger.error(`[Redis] Delete pattern error for ${pattern}: ${error.message}`);
    return false;
  }
}

/**
 * Check if key exists
 * @param {String} key - Cache key
 * @returns {Boolean}
 */
async function exists(key) {
  try {
    if (!isRedisConnected()) {
      return false;
    }

    const result = await redisClient.exists(key);
    return result === 1;
  } catch (error) {
    logger.error(`[Redis] Exists error for key ${key}: ${error.message}`);
    return false;
  }
}

/**
 * Get TTL for key
 * @param {String} key - Cache key
 * @returns {Number} TTL in seconds, -1 if no expiry, -2 if key doesn't exist
 */
async function ttl(key) {
  try {
    if (!isRedisConnected()) {
      return -2;
    }

    return await redisClient.ttl(key);
  } catch (error) {
    logger.error(`[Redis] TTL error for key ${key}: ${error.message}`);
    return -2;
  }
}

/**
 * Flush all cache
 */
async function flushAll() {
  try {
    if (!isRedisConnected()) {
      return false;
    }

    await redisClient.flushdb();
    logger.info('[Redis] Flushed all cache');
    return true;
  } catch (error) {
    logger.error(`[Redis] Flush error: ${error.message}`);
    return false;
  }
}

/**
 * Get cache statistics
 */
async function getStats() {
  try {
    if (!isRedisConnected()) {
      return {
        connected: false,
        keys: 0,
        memory: 0
      };
    }

    const info = await redisClient.info('stats');
    const dbsize = await redisClient.dbsize();
    const memory = await redisClient.info('memory');

    return {
      connected: true,
      keys: dbsize,
      info: info,
      memory: memory
    };
  } catch (error) {
    logger.error(`[Redis] Stats error: ${error.message}`);
    return {
      connected: false,
      error: error.message
    };
  }
}

/**
 * Close Redis connection
 */
async function close() {
  try {
    if (redisClient) {
      await redisClient.quit();
      redisClient = null;
      isConnected = false;
      logger.info('[Redis] Connection closed');
    }
  } catch (error) {
    logger.error(`[Redis] Close error: ${error.message}`);
  }
}

// Initialize Redis on module load
initRedis();

// Graceful shutdown
process.on('SIGTERM', close);
process.on('SIGINT', close);

module.exports = {
  initRedis,
  getRedisClient,
  isRedisConnected,
  set,
  get,
  del,
  delPattern,
  exists,
  ttl,
  flushAll,
  getStats,
  close
};
