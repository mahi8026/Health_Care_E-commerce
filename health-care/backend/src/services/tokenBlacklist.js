const redisCache = require('../services/redisCache');
const logger = require('../utils/logger');

/**
 * Token Blacklist Service
 * 
 * Provides token revocation functionality using Redis for JWT security.
 * Blacklisted tokens are stored in Redis with TTL matching token expiration.
 * 
 * ✅ Security Fix #2: Prevent token reuse after logout/password reset
 */

class TokenBlacklistService {
  constructor() {
    this.keyPrefix = 'blacklist:token:';
    this.secretRotationKey = 'jwt:secret:rotated_at';
    // S8 — in-memory fail-safe mirrors so revocations still hold when Redis is down
    this.memoryTokens = new Map();
    this.memorySecretRotation = null;
    this.memoryUserInvalidations = new Map();
  }

  /**
   * Get raw Redis client for direct operations
   * @returns {Object|null} Redis client or null if not connected
   */
  getClient() {
    if (!redisCache.isRedisConnected()) {
      return null;
    }
    return redisCache.getRedisClient();
  }

  /**
   * Blacklist a JWT token
   * @param {string} token - JWT token to blacklist
   * @param {number} expiresIn - Token expiration time in seconds
   * @returns {Promise<boolean>} Success status
   */
  async blacklistToken(token, expiresIn = 604800) { // Default 7 days
    try {
      if (!token || typeof token !== 'string') {
        logger.warn('[TokenBlacklist] Invalid token provided for blacklisting');
        return false;
      }

      const client = this.getClient();
      if (!client) {
        logger.warn('[TokenBlacklist] Redis not connected, token not blacklisted');
        return false;
      }

      const key = `${this.keyPrefix}${token}`;
      
      // Store token in Redis with TTL
      // After expiration, token is automatically removed (no need to check blacklist)
      await client.setex(key, expiresIn, Date.now().toString());

      // Mirror into memory so the revocation survives a Redis outage
      this.memoryTokens.set(token, Date.now() + expiresIn * 1000);
      
      logger.info('[TokenBlacklist] Token blacklisted successfully', {
        tokenPrefix: token.substring(0, 20) + '...',
        expiresIn
      });
      
      return true;
    } catch (error) {
      logger.error(`[TokenBlacklist] Failed to blacklist token: ${error.message}`);
      // Keep the memory mirror even if Redis failed
      this.memoryTokens.set(token, Date.now() + (expiresIn || 604800) * 1000);
      return false;
    }
  }

  /**
   * Check if a token is blacklisted
   * @param {string} token - JWT token to check
   * @returns {Promise<boolean>} True if blacklisted
   */
  async isBlacklisted(token) {
    try {
      if (!token || typeof token !== 'string') {
        return false;
      }

      const client = this.getClient();
      if (!client) {
        // S8 — Redis down: consult the in-memory mirror (fail-safe, not fail-open)
        const expiresAt = this.memoryTokens.get(token);
        if (!expiresAt) {
          return false;
        }
        if (expiresAt < Date.now()) {
          this.memoryTokens.delete(token);
          return false;
        }
        return true;
      }

      const key = `${this.keyPrefix}${token}`;
      const exists = await client.exists(key);
      
      return exists === 1;
    } catch (error) {
      logger.error(`[TokenBlacklist] Failed to check blacklist: ${error.message}`);
      // S8 — Redis error: fail safe via the in-memory mirror
      const expiresAt = this.memoryTokens.get(token);
      if (!expiresAt || expiresAt < Date.now()) {
        return false;
      }
      return true;
    }
  }

  /**
   * Record JWT secret rotation timestamp
   * Tokens issued before this timestamp should be considered invalid
   * @returns {Promise<boolean>} Success status
   */
  async recordSecretRotation() {
    try {
      const client = this.getClient();
      if (!client) {
        logger.warn('[TokenBlacklist] Redis not connected, rotation not recorded');
        return false;
      }

      const timestamp = Date.now();
      await client.set(this.secretRotationKey, timestamp.toString());

      // Mirror into memory so rotation checks hold during a Redis outage
      this.memorySecretRotation = timestamp;
      
      logger.info('[TokenBlacklist] JWT secret rotation recorded', { timestamp });
      
      return true;
    } catch (error) {
      logger.error(`[TokenBlacklist] Failed to record secret rotation: ${error.message}`);
      this.memorySecretRotation = Date.now();
      return false;
    }
  }

  /**
   * Get the timestamp of the last JWT secret rotation
   * @returns {Promise<number|null>} Timestamp or null if never rotated
   */
  async getSecretRotationTimestamp() {
    try {
      const client = this.getClient();
      if (!client) {
        // S8 — Redis down: use the mirrored rotation timestamp
        return this.memorySecretRotation;
      }

      const timestamp = await client.get(this.secretRotationKey);
      
      if (!timestamp) {
        return null;
      }
      
      return parseInt(timestamp, 10);
    } catch (error) {
      logger.error(`[TokenBlacklist] Failed to get rotation timestamp: ${error.message}`);
      return this.memorySecretRotation;
    }
  }

  /**
   * Check if a token was issued before the last secret rotation
   * @param {number} tokenIssuedAt - Token 'iat' claim (issued at timestamp)
   * @returns {Promise<boolean>} True if token is from before rotation
   */
  async isTokenFromBeforeRotation(tokenIssuedAt) {
    try {
      const rotationTimestamp = await this.getSecretRotationTimestamp();
      
      // If no rotation recorded, all tokens are valid
      if (!rotationTimestamp) {
        return false;
      }

      // Convert JWT 'iat' (seconds) to milliseconds
      const tokenIssuedAtMs = tokenIssuedAt * 1000;
      
      // Token is invalid if issued before rotation
      return tokenIssuedAtMs < rotationTimestamp;
    } catch (error) {
      logger.error(`[TokenBlacklist] Failed to check token rotation: ${error.message}`);
      return false;
    }
  }

  /**
   * Blacklist all tokens for a specific user
   * Useful when user changes password or account is compromised
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} Success status
   */
  async blacklistAllUserTokens(userId) {
    try {
      const client = this.getClient();
      if (!client) {
        logger.warn('[TokenBlacklist] Redis not connected, user tokens not blacklisted');
        return false;
      }

      const key = `blacklist:user:${userId}`;
      const timestamp = Date.now();
      
      // Store timestamp when all user tokens were invalidated
      // Tokens issued before this timestamp are invalid
      await client.set(key, timestamp.toString());

      // Mirror into memory for Redis-outage protection
      this.memoryUserInvalidations.set(userId, timestamp);
      
      logger.info('[TokenBlacklist] All tokens invalidated for user', { userId });
      
      return true;
    } catch (error) {
      logger.error(`[TokenBlacklist] Failed to blacklist user tokens: ${error.message}`);
      this.memoryUserInvalidations.set(userId, Date.now());
      return false;
    }
  }

  /**
   * Check if a user's token was issued before their tokens were invalidated
   * @param {string} userId - User ID
   * @param {number} tokenIssuedAt - Token 'iat' claim
   * @returns {Promise<boolean>} True if token is invalid
   */
  async isUserTokenInvalidated(userId, tokenIssuedAt) {
    try {
      const client = this.getClient();
      if (!client) {
        // S8 — Redis down: consult the in-memory mirror
        const invalidationMs = this.memoryUserInvalidations.get(userId);
        if (!invalidationMs) {
          return false;
        }
        return tokenIssuedAt * 1000 < invalidationMs;
      }

      const key = `blacklist:user:${userId}`;
      const invalidationTimestamp = await client.get(key);
      
      if (!invalidationTimestamp) {
        return false;
      }

      const tokenIssuedAtMs = tokenIssuedAt * 1000;
      const invalidationMs = parseInt(invalidationTimestamp, 10);
      
      return tokenIssuedAtMs < invalidationMs;
    } catch (error) {
      logger.error(`[TokenBlacklist] Failed to check user token invalidation: ${error.message}`);
      const invalidationMs = this.memoryUserInvalidations.get(userId);
      if (!invalidationMs) {
        return false;
      }
      return tokenIssuedAt * 1000 < invalidationMs;
    }
  }

  /**
   * Clear blacklist for testing purposes (use with caution)
   * @returns {Promise<boolean>} Success status
   */
  async clearAll() {
    try {
      const client = this.getClient();
      if (!client) {
        return false;
      }

      const pattern = `${this.keyPrefix}*`;
      const keys = await client.keys(pattern);
      
      if (keys.length > 0) {
        await client.del(...keys);
      }

      this.memoryTokens.clear();
      this.memorySecretRotation = null;
      this.memoryUserInvalidations.clear();
      
      logger.info('[TokenBlacklist] Cleared all blacklisted tokens', { count: keys.length });
      
      return true;
    } catch (error) {
      logger.error(`[TokenBlacklist] Failed to clear blacklist: ${error.message}`);
      return false;
    }
  }
}

module.exports = new TokenBlacklistService();
