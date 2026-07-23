const request = require('supertest');
const app = require('../../server');
const User = require('../../models/User');
const LoyaltyTransaction = require('../../models/LoyaltyTransaction');
const loyaltyService = require('../../services/loyaltyService');

jest.mock('../../models/User');
jest.mock('../../models/LoyaltyTransaction');
jest.mock('../../services/loyaltyService');
jest.mock('../../utils/logger');

describe('Loyalty Controller API Tests', () => {
  let authToken;
  let adminToken;

  beforeEach(() => {
    // Mock authentication middleware
    authToken = 'Bearer mock-token';
    adminToken = 'Bearer mock-admin-token';
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/loyalty/summary', () => {
    test('should return user loyalty summary', async () => {
      const mockSummary = {
        currentPoints: 1500,
        totalEarned: 2500,
        tier: { label: 'Silver', discount: 5 },
        nextTier: { label: 'Gold', min: 5000 },
        pointsToNextTier: 2500,
        redeemableValue: 15,
        canRedeem: true,
        minRedeemPoints: 500,
        pointsToTakaRate: 0.01
      };

      loyaltyService.getUserLoyaltySummary.mockResolvedValue(mockSummary);

      const response = await request(app)
        .get('/api/loyalty/summary')
        .set('Authorization', authToken);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.currentPoints).toBe(1500);
      expect(response.body.data.tier.label).toBe('Silver');
    });

    test('should require authentication', async () => {
      const response = await request(app)
        .get('/api/loyalty/summary');

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/loyalty/validate-redeem', () => {
    beforeEach(() => {
      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue({ loyaltyPoints: 2000 })
      });
      loyaltyService.config = {
        MIN_REDEEM_POINTS: 500,
        MAX_REDEEM_PERCENT: 20
      };
      loyaltyService.maxRedeemablePoints.mockReturnValue(20000);
      loyaltyService.pointsToTaka.mockReturnValue(10);
    });

    test('should validate correct redemption request', async () => {
      const response = await request(app)
        .post('/api/loyalty/validate-redeem')
        .set('Authorization', authToken)
        .send({ points: 1000, orderTotal: 5000 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.pointsToRedeem).toBe(1000);
      expect(response.body.data.discountAmount).toBe(10);
      expect(response.body.data.remainingPoints).toBe(1000); // 2000 - 1000
    });

    test('should reject redemption below minimum', async () => {
      const response = await request(app)
        .post('/api/loyalty/validate-redeem')
        .set('Authorization', authToken)
        .send({ points: 400, orderTotal: 5000 });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Minimum 500 points');
    });

    test('should reject redemption with insufficient points', async () => {
      const response = await request(app)
        .post('/api/loyalty/validate-redeem')
        .set('Authorization', authToken)
        .send({ points: 3000, orderTotal: 5000 });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Insufficient loyalty points');
    });

    test('should reject missing required fields', async () => {
      const response = await request(app)
        .post('/api/loyalty/validate-redeem')
        .set('Authorization', authToken)
        .send({ points: 1000 }); // Missing orderTotal

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('points and orderTotal are required');
    });
  });

  describe('GET /api/loyalty/transactions', () => {
    test('should return paginated transaction history', async () => {
      const mockTransactions = [
        {
          _id: 'tx1',
          type: 'earn',
          points: 100,
          balance: 100,
          description: 'Earned 100 pts for order',
          createdAt: new Date()
        },
        {
          _id: 'tx2',
          type: 'redeem',
          points: -50,
          balance: 50,
          description: 'Redeemed 50 pts',
          createdAt: new Date()
        }
      ];

      LoyaltyTransaction.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockTransactions)
      });

      LoyaltyTransaction.countDocuments.mockResolvedValue(2);

      const response = await request(app)
        .get('/api/loyalty/transactions?page=1&limit=10')
        .set('Authorization', authToken);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.pagination.total).toBe(2);
      expect(response.body.pagination.page).toBe(1);
    });
  });

  describe('Admin Endpoints', () => {
    describe('POST /api/loyalty/admin/adjust', () => {
      beforeEach(() => {
        User.findById.mockResolvedValue({
          _id: 'user123',
          loyaltyPoints: 500
        });
        User.findByIdAndUpdate.mockResolvedValue({});
        LoyaltyTransaction.create.mockResolvedValue({});
      });

      test('should allow admin to adjust points', async () => {
        const response = await request(app)
          .post('/api/loyalty/admin/adjust')
          .set('Authorization', adminToken)
          .send({
            userId: 'user123',
            points: 100,
            description: 'Manual adjustment for issue #123'
          });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.newBalance).toBe(600); // 500 + 100
        expect(response.body.data.adjustment).toBe(100);
      });

      test('should prevent negative balances', async () => {
        const response = await request(app)
          .post('/api/loyalty/admin/adjust')
          .set('Authorization', adminToken)
          .send({
            userId: 'user123',
            points: -1000,
            description: 'Deduct points'
          });

        expect(response.status).toBe(200);
        // Should cap at 0, not go negative
        expect(response.body.data.newBalance).toBe(0);
      });

      test('should require all fields', async () => {
        const response = await request(app)
          .post('/api/loyalty/admin/adjust')
          .set('Authorization', adminToken)
          .send({
            userId: 'user123',
            points: 100
            // Missing description
          });

        expect(response.status).toBe(400);
        expect(response.body.message).toContain('description are required');
      });

      test('should require admin role', async () => {
        const response = await request(app)
          .post('/api/loyalty/admin/adjust')
          .set('Authorization', authToken) // Regular user token
          .send({
            userId: 'user123',
            points: 100,
            description: 'Test'
          });

        expect(response.status).toBe(403);
      });
    });

    describe('GET /api/loyalty/admin/stats', () => {
      test('should return program statistics', async () => {
        User.countDocuments.mockResolvedValue(150);
        User.find.mockReturnValue({
          select: jest.fn().mockReturnThis(),
          lean: jest.fn().mockResolvedValue([
            { loyaltyPoints: 500 },
            { loyaltyPoints: 1500 },
            { loyaltyPoints: 8000 }
          ])
        });
        LoyaltyTransaction.aggregate.mockResolvedValueOnce([{ total: 50000 }])
          .mockResolvedValueOnce([{ total: -5000 }]);
        LoyaltyTransaction.find.mockReturnValue({
          populate: jest.fn().mockReturnThis(),
          sort: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          lean: jest.fn().mockResolvedValue([])
        });

        const response = await request(app)
          .get('/api/loyalty/admin/stats')
          .set('Authorization', adminToken);

        expect(response.status).toBe(200);
        expect(response.body.data.totalMembers).toBe(150);
        expect(response.body.data.totalPointsIssued).toBe(50000);
        expect(response.body.data.totalPointsRedeemed).toBe(5000);
        expect(response.body.data.tierDistribution).toBeDefined();
      });
    });
  });
});
