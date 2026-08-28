/**
 * T13 — Token blacklist fail-open regression.
 *
 * Locks in the P4-2 fixes:
 * 1. revocations written during a Redis outage are mirrored in memory and must
 *    STILL hold once Redis recovers (isBlacklisted consults memory first);
 * 2. the "Redis not connected" write paths also record in memory (previously
 *    they returned early, losing the revocation entirely);
 * 3. user-wide invalidation + secret rotation survive recovery (merged, newest
 *    wins);
 * 4. expired mirror rows are lazy-evicted; the mirror map is pruned on write.
 */
jest.mock('../redisCache', () => ({
  isRedisConnected: jest.fn(() => false),
  getRedisClient: jest.fn(() => null),
  delPattern: jest.fn(async () => 0)
}));

const redisCache = require('../redisCache');
const tokenBlacklist = require('../tokenBlacklist');

describe('TokenBlacklist (P4-2 fail-open closure)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    redisCache.isRedisConnected.mockReturnValue(false);
    redisCache.getRedisClient.mockReturnValue(null);
    tokenBlacklist.memoryTokens.clear();
    tokenBlacklist.memorySecretRotation = null;
    tokenBlacklist.memoryUserInvalidations.clear();
  });

  test('blacklists into the memory mirror even while Redis is down', async () => {
    const result = await tokenBlacklist.blacklistToken('tok-a', 3600);
    expect(result).toBe(false); // Redis write failed
    expect(tokenBlacklist.memoryTokens.has('tok-a')).toBe(true);
    expect(await tokenBlacklist.isBlacklisted('tok-a')).toBe(true);
  });

  test('a memory-only revocation survives Redis recovery', async () => {
    await tokenBlacklist.blacklistToken('tok-a', 3600);

    // Redis returns but does NOT know about the token (exists -> 0).
    const fakeClient = {
      exists: jest.fn(async () => 0),
      get: jest.fn(async () => null),
      del: jest.fn(async () => 1)
    };
    redisCache.isRedisConnected.mockReturnValue(true);
    redisCache.getRedisClient.mockReturnValue(fakeClient);

    expect(await tokenBlacklist.isBlacklisted('tok-a')).toBe(true);
  });

  test('user-wide invalidation from an outage is not forgotten', async () => {
    await tokenBlacklist.blacklistAllUserTokens('user-1');
    const fakeClient = { get: jest.fn(async () => null) };
    redisCache.isRedisConnected.mockReturnValue(true);
    redisCache.getRedisClient.mockReturnValue(fakeClient);

    expect(await tokenBlacklist.isUserTokenInvalidated('user-1', Date.now() / 1000 - 600)).toBe(true);
  });

  test('secret rotation merge keeps the newest (memory) timestamp', async () => {
    await tokenBlacklist.recordSecretRotation(); // memory gets a fresh Date.now()
    const olderRotation = (tokenBlacklist.memorySecretRotation || Date.now()) - 5000;
    const fakeClient = { get: jest.fn(async (key) => String(olderRotation)) };
    redisCache.isRedisConnected.mockReturnValue(true);
    redisCache.getRedisClient.mockReturnValue(fakeClient);

    expect(await tokenBlacklist.getSecretRotationTimestamp()).toBe(tokenBlacklist.memorySecretRotation);
  });

  test('expired mirror rows are lazy-evicted on the read path', async () => {
    tokenBlacklist.memoryTokens.set('tok-expired', Date.now() - 5000);
    const fakeClient = { exists: jest.fn(async () => 0), get: jest.fn(async () => null) };
    redisCache.isRedisConnected.mockReturnValue(true);
    redisCache.getRedisClient.mockReturnValue(fakeClient);

    expect(await tokenBlacklist.isBlacklisted('tok-expired')).toBe(false);
    expect(tokenBlacklist.memoryTokens.has('tok-expired')).toBe(false);
  });

  test('prune reclaims only expired rows and caps the mirror map', () => {
    for (let i = 0; i < 9950; i++) tokenBlacklist.memoryTokens.set(`live-${i}`, Date.now() + 60000);
    for (let i = 0; i < 200; i++) tokenBlacklist.memoryTokens.set(`stale-${i}`, Date.now() - 5000);

    tokenBlacklist._pruneMemoryTokens();

    expect(tokenBlacklist.memoryTokens.has('stale-0')).toBe(false);
    expect(tokenBlacklist.memoryTokens.size).toBeLessThanOrEqual(10000);
  });
});