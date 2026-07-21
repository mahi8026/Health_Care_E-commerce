const loyaltyService = require('../loyaltyService');
const User = require('../../models/User');
const LoyaltyTransaction = require('../../models/LoyaltyTransaction');
const config = require('../../config/loyaltyConfig');

jest.mock('../../models/User');
jest.mock('../../models/LoyaltyTransaction');
jest.mock('../../utils/logger');

describe('Loyalty Service', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Configuration Tests', () => {
    test('should have correct conversion rates', () => {
      expect(config.POINTS_PER_TAKA).toBe(0.01); // 1 point per ৳100
      expect(config.POINTS_TO_TAKA).toBe(0.01);  // 1000 points = ৳10
      expect(config.MIN_REDEEM_POINTS).toBe(500);
      expect(config.MAX_REDEEM_PERCENT).toBe(20);
    });

    test('should have correct bonus values', () => {
      expect(config.BONUS_FIRST_ORDER).toBe(200);
      expect(config.BONUS_REVIEW).toBe(50);
      expect(config.BONUS_REFERRAL_REFERRER).toBe(500);
      expect(config.BONUS_REFERRAL_REFEREE).toBe(200);
    });

    test('should have 4 tier levels', () => {
      expect(Object.keys(config.TIERS)).toEqual(['BRONZE', 'SILVER', 'GOLD', 'PLATINUM']);
    });
  });

  describe('calculateEarnedPoints', () => {
    test('should calculate points correctly for ৳10,000 order', () => {
      const points = loyaltyService.calculateEarnedPoints(10000);
      expect(points).toBe(100); // 10000 * 0.01 = 100
    });

    test('should calculate points correctly for ৳50,000 order', () => {
      const points = loyaltyService.calculateEarnedPoints(50000);
      expect(points).toBe(500); // 50000 * 0.01 = 500
    });

    test('should floor fractional points', () => {
      const points = loyaltyService.calculateEarnedPoints(5550);
      expect(points).toBe(55); // 5550 * 0.01 = 55.5 → 55
    });

    test('should return 0 for small orders', () => {
      const points = loyaltyService.calculateEarnedPoints(50);
      expect(points).toBe(0); // 50 * 0.01 = 0.5 → 0
    });
  });

  describe('pointsToTaka - CRITICAL TEST', () => {
    test('should convert 1000 points to ৳10 (NOT ৳100)', () => {
      const taka = loyaltyService.pointsToTaka(1000);
      expect(taka).toBe(10); // 1000 * 0.01 = 10 ✅
    });

    test('should convert 500 points to ৳5', () => {
      const taka = loyaltyService.pointsToTaka(500);
      expect(taka).toBe(5); // 500 * 0.01 = 5
    });

    test('should convert 10000 points to ৳100', () => {
      const taka = loyaltyService.pointsToTaka(10000);
      expect(taka).toBe(100); // 10000 * 0.01 = 100
    });

    test('should floor fractional taka values', () => {
      const taka = loyaltyService.pointsToTaka(555);
      expect(taka).toBe(5.55); // 555 * 0.01 = 5.55
    });
  });

  describe('maxRedeemablePoints', () => {
    test('should enforce 20% max redemption for ৳1,000 order', () => {
      const maxPoints = loyaltyService.maxRedeemablePoints(1000);
      // Max taka: 1000 * 0.20 = 200
      // Max points: 200 / 0.01 = 20,000
      expect(maxPoints).toBe(20000);
    });

    test('should enforce 20% max redemption for ৳5,000 order', () => {
      const maxPoints = loyaltyService.maxRedeemablePoints(5000);
      // Max taka: 5000 * 0.20 = 1000
      // Max points: 1000 / 0.01 = 100,000
      expect(maxPoints).toBe(100000);
    });

    test('should return 0 for very small orders', () => {
      const maxPoints = loyaltyService.maxRedeemablePoints(10);
      // Max taka: 10 * 0.20 = 2
      // Max points: 2 / 0.01 = 200
      expect(maxPoints).toBe(200);
    });
  });

  describe('getTier', () => {
    test('should return BRONZE for 0-999 points', () => {
      expect(loyaltyService.getTier(0).label).toBe('Bronze');
      expect(loyaltyService.getTier(500).label).toBe('Bronze');
      expect(loyaltyService.getTier(999).label).toBe('Bronze');
    });

    test('should return SILVER for 1000-4999 points', () => {
      expect(loyaltyService.getTier(1000).label).toBe('Silver');
      expect(loyaltyService.getTier(2500).label).toBe('Silver');
      expect(loyaltyService.getTier(4999).label).toBe('Silver');
    });

    test('should return GOLD for 5000-9999 points', () => {
      expect(loyaltyService.getTier(5000).label).toBe('Gold');
      expect(loyaltyService.getTier(7500).label).toBe('Gold');
      expect(loyaltyService.getTier(9999).label).toBe('Gold');
    });

    test('should return PLATINUM for 10000+ points', () => {
      expect(loyaltyService.getTier(10000).label).toBe('Platinum');
      expect(loyaltyService.getTier(50000).label).toBe('Platinum');
      expect(loyaltyService.getTier(999999).label).toBe('Platinum');
    });
  });

  describe('awardOrderPoints', () => {
    const mockUser = { _id: 'user123', loyaltyPoints: 100 };
    const mockOrder = { _id: 'order123' };

    beforeEach(() => {
      User.findById.mockReturnValue({
        session: jest.fn().mockResolvedValue(mockUser)
      });
      User.findByIdAndUpdate.mockResolvedValue({ ...mockUser, loyaltyPoints: 200 });
      LoyaltyTransaction.create.mockResolvedValue({});
    });

    test('should award correct points for regular order', async () => {
      const result = await loyaltyService.awardOrderPoints('user123', 'order123', 10000, false);
      
      expect(result.earnedPoints).toBe(100); // 10000 * 0.01
      expect(result.bonusPoints).toBe(0);
      expect(result.totalPoints).toBe(100);
      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        'user123',
        { $inc: { loyaltyPoints: 100 } },
        expect.any(Object)
      );
    });

    test('should award bonus points for first order', async () => {
      const result = await loyaltyService.awardOrderPoints('user123', 'order123', 10000, true);
      
      expect(result.earnedPoints).toBe(100);
      expect(result.bonusPoints).toBe(200); // BONUS_FIRST_ORDER
      expect(result.totalPoints).toBe(300);
      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        'user123',
        { $inc: { loyaltyPoints: 300 } },
        expect.any(Object)
      );
    });

    test('should not award points for order < ৳100', async () => {
      const result = await loyaltyService.awardOrderPoints('user123', 'order123', 50, false);
      expect(result).toBeNull(); // totalPoints <= 0
    });
  });

  describe('redeemPoints', () => {
    const mockUser = { _id: 'user123', loyaltyPoints: 2000 };

    beforeEach(() => {
      User.findById.mockReturnValue({
        session: jest.fn().mockResolvedValue(mockUser)
      });
      User.findByIdAndUpdate.mockResolvedValue({});
      LoyaltyTransaction.create.mockResolvedValue({});
    });

    test('should successfully redeem valid points', async () => {
      const result = await loyaltyService.redeemPoints('user123', 1000, 'order123', 5000);
      
      expect(result.pointsRedeemed).toBe(1000);
      expect(result.discountAmount).toBe(10); // 1000 * 0.01 = ৳10
      expect(result.newBalance).toBe(1000); // 2000 - 1000
      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        'user123',
        { $inc: { loyaltyPoints: -1000 } },
        expect.any(Object)
      );
    });

    test('should reject redemption below minimum (500 points)', async () => {
      await expect(
        loyaltyService.redeemPoints('user123', 400, 'order123', 5000)
      ).rejects.toThrow('Minimum 500 points required to redeem');
    });

    test('should reject redemption with insufficient points', async () => {
      await expect(
        loyaltyService.redeemPoints('user123', 3000, 'order123', 5000)
      ).rejects.toThrow('Insufficient loyalty points');
    });

    test('should reject redemption exceeding max allowed (20%)', async () => {
      // Mock user with enough points to pass insufficient check
      User.findById.mockReturnValue({
        session: jest.fn().mockResolvedValue({ _id: 'user123', loyaltyPoints: 25000 })
      });

      // Order total: ৳1000
      // Max 20% = ৳200
      // Max points = ৳200 / 0.01 = 20,000 points
      await expect(
        loyaltyService.redeemPoints('user123', 21000, 'order123', 1000)
      ).rejects.toThrow('Cannot redeem more than');
    });
  });

  describe('getUserLoyaltySummary', () => {
    beforeEach(() => {
      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue({
          _id: 'user123',
          name: 'Test User',
          email: 'test@example.com',
          loyaltyPoints: 1500
        })
      });
      LoyaltyTransaction.aggregate.mockResolvedValue([{ _id: null, total: 2500 }]);
    });

    test('should return complete summary with tier info', async () => {
      const summary = await loyaltyService.getUserLoyaltySummary('user123');
      
      expect(summary.currentPoints).toBe(1500);
      expect(summary.totalEarned).toBe(2500);
      expect(summary.tier.label).toBe('Silver'); // 2500 total earned
      expect(summary.redeemableValue).toBe(15); // 1500 * 0.01 = ৳15
      expect(summary.canRedeem).toBe(true); // 1500 >= 500
      expect(summary.minRedeemPoints).toBe(500);
      expect(summary.pointsToTakaRate).toBe(0.01);
    });

    test('should calculate next tier correctly', async () => {
      const summary = await loyaltyService.getUserLoyaltySummary('user123');
      
      expect(summary.nextTier.label).toBe('Gold'); // Next after Silver
      expect(summary.pointsToNextTier).toBe(2500); // 5000 - 2500 = 2500
    });
  });
});
