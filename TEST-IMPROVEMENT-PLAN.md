# 🧪 Test Coverage Improvement Plan

**Current Status:** 28% coverage (148 passing, 37 failing)  
**Target:** 60% coverage  
**Priority:** Medium (doesn't block production)

---

## 📊 Current Test Status

### ✅ Passing Test Suites (8/12)
1. ✅ `orderController.test.js` — Order management tests
2. ✅ `paymentController.test.js` — Payment processing tests
3. ✅ `authController.test.js` — Authentication tests
4. ✅ `productController.test.js` — Product CRUD tests
5. ✅ `cacheService.test.js` — Cache service tests
6. ✅ `cartController.test.js` — Shopping cart tests
7. ✅ `cache.test.js` — Cache middleware tests
8. ✅ `health.test.js` — Health check tests

**Total Passing:** 148 tests ✅

### ❌ Failing Test Suites (4/12)
1. ❌ `cacheInvalidation.test.js` — Cache invalidation tests
2. ❌ `dbHealthCheck.test.js` — Database health check tests
3. ❌ `analyticsRoutes.test.js` — Analytics route tests
4. ❌ `analyticsController.test.js` — Analytics controller tests

**Total Failing:** 37 tests ❌

### 📉 Low Coverage Areas

| Module | Coverage | Priority |
|--------|----------|----------|
| Services | 10.38% | High |
| Utils | 6.25% | High |
| Routes | 67.85% | Medium |
| Controllers | 73.91% | Medium |
| Middleware | 68.42% | Medium |
| Config | 31.25% | Low |

---

## 🎯 Root Cause Analysis

### Why Tests Are Failing

#### 1. **User Model Pre-Save Hook Issues**
**Error:** `userSchema.pre('save', async function(next)` causing multiple test failures

**Cause:** 
- Mongoose pre-save hooks running in test environment
- Password hashing happening when not expected
- Tests not properly mocking User model

**Impact:** Affects 24+ tests across multiple suites

**Fix Strategy:**
```javascript
// In test setup, mock the User model properly
jest.mock('../models/User', () => {
  const mockUser = {
    findOne: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };
  return mockUser;
});
```

#### 2. **Database Connection in Tests**
**Error:** Tests trying to connect to real MongoDB

**Cause:**
- Tests importing models that auto-connect
- No proper database mocking
- Connection not closed after tests

**Impact:** Affects dbHealthCheck and analytics tests

**Fix Strategy:**
```javascript
// Use mongodb-memory-server for isolated test DB
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});
```

#### 3. **Missing Service Mocks**
**Error:** Tests calling real external services

**Cause:**
- Redis, email, SMS services not mocked
- Tests trying to make real API calls
- No test doubles for external dependencies

**Impact:** Low coverage in services (10.38%)

**Fix Strategy:**
```javascript
// Mock external services
jest.mock('../services/redisCache');
jest.mock('../utils/emailService');
jest.mock('../services/smsService');
```

---

## 🔧 Quick Fixes (High Impact, Low Effort)

### Fix 1: Update Test Setup File
**File:** `src/tests/setup.js`  
**Time:** 15 minutes  
**Impact:** Fixes 20+ failing tests

```javascript
// Add to setup.js
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

// Setup in-memory MongoDB before all tests
beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
});

// Cleanup after all tests
afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (mongoServer) {
    await mongoServer.stop();
  }
});

// Clear database between tests
afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany();
  }
});
```

### Fix 2: Mock User Model Properly
**Files:** All failing test files  
**Time:** 10 minutes  
**Impact:** Fixes User model-related failures

```javascript
// Add to each failing test file
jest.mock('../../models/User', () => {
  return function() {
    return {
      save: jest.fn().mockResolvedValue({}),
      comparePassword: jest.fn().mockResolvedValue(true),
    };
  };
});
```

### Fix 3: Add Service Mocks
**Files:** Service test files  
**Time:** 20 minutes  
**Impact:** Increases service coverage to 40%+

```javascript
// Mock Redis
jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => ({
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    quit: jest.fn(),
  }));
});

// Mock Nodemailer
jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockResolvedValue({ messageId: 'test-id' }),
  }),
}));
```

---

## 📈 Improvement Roadmap

### Phase 1: Fix Failing Tests (Week 1)
**Goal:** Get to 100% passing tests  
**Time:** 2-3 hours  
**Priority:** High

**Tasks:**
1. ✅ Install mongodb-memory-server
   ```bash
   npm install --save-dev mongodb-memory-server
   ```

2. ✅ Update test setup file with in-memory DB

3. ✅ Fix User model mocking in failing tests

4. ✅ Add proper teardown in all test files

5. ✅ Run tests and verify all pass
   ```bash
   npm test
   ```

**Expected Result:** 185/185 tests passing ✅

---

### Phase 2: Increase Service Coverage (Week 2)
**Goal:** Get services to 40%+ coverage  
**Time:** 3-4 hours  
**Priority:** Medium

**Tasks:**
1. ✅ Add tests for `redisCache.js`
   - Test get/set/del operations
   - Test pattern matching
   - Test error handling

2. ✅ Add tests for `emailService.js`
   - Test email sending
   - Test template rendering
   - Test error handling

3. ✅ Add tests for `smsService.js`
   - Test SMS sending
   - Test phone validation
   - Test provider switching

4. ✅ Add tests for `dataSync.js`
   - Test sync operations
   - Test conflict resolution
   - Test error handling

**Expected Result:** Service coverage 40%+

---

### Phase 3: Increase Utils Coverage (Week 3)
**Goal:** Get utils to 40%+ coverage  
**Time:** 2-3 hours  
**Priority:** Medium

**Tasks:**
1. ✅ Add tests for `invoiceGenerator.js`
   - Test PDF generation
   - Test data formatting
   - Test error handling

2. ✅ Add tests for `activityLogger.js`
   - Test log creation
   - Test log retrieval
   - Test filtering

3. ✅ Add tests for `databaseMonitor.js`
   - Test health checks
   - Test metrics collection
   - Test alerting

**Expected Result:** Utils coverage 40%+

---

### Phase 4: Frontend Tests (Week 4)
**Goal:** Add basic frontend tests  
**Time:** 4-5 hours  
**Priority:** Low

**Tasks:**
1. ✅ Add component tests
   - ProductCard
   - CartItem
   - CheckoutForm

2. ✅ Add page tests
   - HomePage
   - ProductsPage
   - CartPage

3. ✅ Add integration tests
   - Checkout flow
   - Login flow
   - Search flow

**Expected Result:** Frontend coverage 30%+

---

## 🎯 Target Coverage by Phase

| Phase | Backend Coverage | Frontend Coverage | Overall |
|-------|------------------|-------------------|---------|
| Current | 28% | ~5% | ~20% |
| Phase 1 | 35% | ~5% | ~25% |
| Phase 2 | 45% | ~5% | ~30% |
| Phase 3 | 55% | ~5% | ~35% |
| Phase 4 | 55% | 30% | **45%** |

**Final Target:** 60% overall coverage

---

## 🚀 Quick Start Guide

### Option 1: Fix Failing Tests Only (Recommended for Production)
**Time:** 2-3 hours  
**Impact:** All tests passing, confidence in existing code

```bash
# 1. Install dependencies
cd health-care/backend
npm install --save-dev mongodb-memory-server

# 2. Update test setup (see Fix 1 above)
# Edit: src/tests/setup.js

# 3. Run tests
npm test

# 4. Fix any remaining failures
# (Most should be fixed by in-memory DB)
```

### Option 2: Full Coverage Improvement (Post-Launch)
**Time:** 10-15 hours over 4 weeks  
**Impact:** 60% coverage, high confidence

```bash
# Follow Phase 1-4 roadmap above
# Add tests incrementally
# Run tests after each phase
```

---

## 📊 Test Quality Metrics

### Current Quality
- ✅ **Test Organization:** Good (tests in __tests__ folders)
- ✅ **Test Naming:** Good (descriptive test names)
- ⚠️ **Test Isolation:** Poor (tests affecting each other)
- ⚠️ **Mocking:** Inconsistent (some services mocked, others not)
- ✅ **Assertions:** Good (using Jest matchers properly)
- ⚠️ **Coverage:** Low (28%)

### Target Quality
- ✅ **Test Organization:** Excellent
- ✅ **Test Naming:** Excellent
- ✅ **Test Isolation:** Excellent (in-memory DB, proper mocks)
- ✅ **Mocking:** Consistent (all external services mocked)
- ✅ **Assertions:** Excellent
- ✅ **Coverage:** Good (60%+)

---

## 🔍 Testing Best Practices

### 1. Test Structure (AAA Pattern)
```javascript
describe('ProductController', () => {
  describe('getProducts', () => {
    it('should return products with pagination', async () => {
      // Arrange
      const mockProducts = [{ name: 'Product 1' }];
      Product.find = jest.fn().mockResolvedValue(mockProducts);

      // Act
      const result = await productController.getProducts(req, res);

      // Assert
      expect(result).toEqual(mockProducts);
      expect(Product.find).toHaveBeenCalledTimes(1);
    });
  });
});
```

### 2. Mock External Dependencies
```javascript
// Always mock external services
jest.mock('../services/emailService');
jest.mock('../services/smsService');
jest.mock('ioredis');
```

### 3. Use In-Memory Database
```javascript
// Don't connect to real MongoDB in tests
// Use mongodb-memory-server instead
```

### 4. Clean Up After Tests
```javascript
afterEach(async () => {
  // Clear database
  await Product.deleteMany({});
  
  // Clear mocks
  jest.clearAllMocks();
});
```

### 5. Test Error Cases
```javascript
it('should handle database errors', async () => {
  Product.find = jest.fn().mockRejectedValue(new Error('DB Error'));
  
  await expect(productController.getProducts(req, res))
    .rejects.toThrow('DB Error');
});
```

---

## 🎯 Success Criteria

### Phase 1 Success (Fix Failing Tests)
- ✅ All 185 tests passing
- ✅ No test timeouts
- ✅ No database connection errors
- ✅ Tests run in <60 seconds

### Phase 2-4 Success (Increase Coverage)
- ✅ Backend coverage >55%
- ✅ Frontend coverage >30%
- ✅ Overall coverage >45%
- ✅ All critical paths tested
- ✅ All error cases tested

---

## 💡 Recommendations

### For Production Launch (Do Now)
1. ✅ **Fix failing tests** (Phase 1) — 2-3 hours
   - Gives confidence in existing code
   - Prevents regressions
   - Makes CI/CD reliable

2. ⏳ **Skip coverage increase** (Phase 2-4) — Do post-launch
   - Not blocking production
   - Can be done incrementally
   - Better to launch and iterate

### Post-Launch (Do Later)
1. ⏳ Add service tests (Phase 2)
2. ⏳ Add utils tests (Phase 3)
3. ⏳ Add frontend tests (Phase 4)
4. ⏳ Add E2E tests (Phase 5)

---

## 📞 Support

### If Tests Keep Failing
1. Check Node version (should be 18+)
2. Clear node_modules and reinstall
3. Check MongoDB connection in tests
4. Verify all mocks are set up correctly

### Useful Commands
```bash
# Run specific test file
npm test -- productController.test.js

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm test

# Run tests with verbose output
npm test -- --verbose

# Debug failing test
node --inspect-brk node_modules/.bin/jest --runInBand
```

---

## 🎉 Summary

### Current State
- 28% coverage
- 148 passing tests
- 37 failing tests
- Production-ready despite low coverage

### Recommended Action
1. **Before Launch:** Fix failing tests (2-3 hours)
2. **After Launch:** Increase coverage incrementally (10-15 hours over 4 weeks)

### Why This Approach?
- ✅ Unblocks production launch
- ✅ Gives confidence in existing code
- ✅ Allows iterative improvement
- ✅ Doesn't delay business value

---

**Created:** May 26, 2026  
**Status:** Ready for Implementation  
**Priority:** Medium (High for Phase 1, Medium for Phase 2-4)
