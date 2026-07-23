const CacheService = require('../cacheService');

describe('CacheService', () => {
  let cacheService;

  beforeEach(() => {
    cacheService = new CacheService(300); // 5 minutes TTL
  });

  afterEach(() => {
    // Clear cache after each test
    cacheService.cache.flushAll();
  });

  describe('get and set', () => {
    it('should store and retrieve values', () => {
      const key = 'test:key';
      const value = { data: 'test data' };

      cacheService.set(key, value);
      const retrieved = cacheService.get(key);

      expect(retrieved).toEqual(value);
    });

    it('should return null for non-existent keys', () => {
      const retrieved = cacheService.get('non:existent:key');
      expect(retrieved).toBeNull();
    });

    it('should support custom TTL', () => {
      const key = 'test:ttl';
      const value = 'test value';

      cacheService.set(key, value, 1); // 1 second TTL
      expect(cacheService.get(key)).toBe(value);
    });
  });

  describe('del', () => {
    it('should delete a specific key', () => {
      const key = 'test:delete';
      const value = 'test value';

      cacheService.set(key, value);
      expect(cacheService.get(key)).toBe(value);

      cacheService.del(key);
      expect(cacheService.get(key)).toBeNull();
    });
  });

  describe('delPattern', () => {
    it('should delete all keys matching pattern', () => {
      cacheService.set('sales:2024-01-01:2024-01-31', { total: 1000 });
      cacheService.set('sales:2024-02-01:2024-02-28', { total: 2000 });
      cacheService.set('orders:2024-01-01:2024-01-31', { count: 50 });

      cacheService.delPattern('sales:*');

      expect(cacheService.get('sales:2024-01-01:2024-01-31')).toBeNull();
      expect(cacheService.get('sales:2024-02-01:2024-02-28')).toBeNull();
      expect(cacheService.get('orders:2024-01-01:2024-01-31')).not.toBeNull();
    });

    it('should handle patterns with no matches', () => {
      cacheService.set('test:key', 'value');
      
      // Should not throw error
      expect(() => {
        cacheService.delPattern('nonexistent:*');
      }).not.toThrow();

      // Original key should still exist
      expect(cacheService.get('test:key')).toBe('value');
    });
  });

  describe('generateKey', () => {
    it('should generate consistent keys from same parameters', () => {
      const params1 = { startDate: '2024-01-01', endDate: '2024-01-31', groupBy: 'day' };
      const params2 = { endDate: '2024-01-31', startDate: '2024-01-01', groupBy: 'day' };

      const key1 = cacheService.generateKey('sales', params1);
      const key2 = cacheService.generateKey('sales', params2);

      expect(key1).toBe(key2);
    });

    it('should generate different keys for different parameters', () => {
      const params1 = { startDate: '2024-01-01', endDate: '2024-01-31' };
      const params2 = { startDate: '2024-02-01', endDate: '2024-02-28' };

      const key1 = cacheService.generateKey('sales', params1);
      const key2 = cacheService.generateKey('sales', params2);

      expect(key1).not.toBe(key2);
    });

    it('should include prefix in generated key', () => {
      const params = { startDate: '2024-01-01', endDate: '2024-01-31' };
      const key = cacheService.generateKey('sales', params);

      expect(key).toMatch(/^sales:/);
    });
  });

  describe('invalidateAnalytics', () => {
    it('should invalidate all analytics cache entries', () => {
      // Set various analytics cache entries
      cacheService.set('sales:2024-01-01:2024-01-31', { total: 1000 });
      cacheService.set('orders:2024-01-01:2024-01-31', { count: 50 });
      cacheService.set('products:2024-01-01:2024-01-31', { top: [] });
      cacheService.set('customers:2024-01-01:2024-01-31', { new: 10 });
      cacheService.set('payments:2024-01-01:2024-01-31', { methods: [] });
      cacheService.set('realtime:2024-01-15', { sales: 500 });
      cacheService.set('other:key', 'should remain');

      cacheService.invalidateAnalytics();

      // All analytics entries should be deleted
      expect(cacheService.get('sales:2024-01-01:2024-01-31')).toBeNull();
      expect(cacheService.get('orders:2024-01-01:2024-01-31')).toBeNull();
      expect(cacheService.get('products:2024-01-01:2024-01-31')).toBeNull();
      expect(cacheService.get('customers:2024-01-01:2024-01-31')).toBeNull();
      expect(cacheService.get('payments:2024-01-01:2024-01-31')).toBeNull();
      expect(cacheService.get('realtime:2024-01-15')).toBeNull();

      // Non-analytics entries should remain
      expect(cacheService.get('other:key')).toBe('should remain');
    });
  });

  describe('getStats', () => {
    it('should return cache statistics', () => {
      cacheService.set('test:key1', 'value1');
      cacheService.set('test:key2', 'value2');

      const stats = cacheService.getStats();

      expect(stats).toHaveProperty('keys');
      expect(stats).toHaveProperty('hits');
      expect(stats).toHaveProperty('misses');
      expect(stats.keys).toBe(2);
    });
  });
});
