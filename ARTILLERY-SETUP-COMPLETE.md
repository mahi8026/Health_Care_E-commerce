# ✅ Artillery Load Testing Setup Complete

## 📦 What Was Created

### Load Test Configurations
```
health-care/backend/load-tests/
├── basic-load-test.yml          # Normal traffic patterns (5-50 users/sec)
├── stress-test.yml              # Find breaking point (10-300 users/sec)
├── authenticated-test.yml       # Logged-in user flows (10-25 users/sec)
├── b2b-test.yml                 # B2B workflows (5-15 users/sec)
├── test-helpers.js              # Helper functions for tests
├── package.json                 # NPM scripts for easy testing
├── README.md                    # Comprehensive documentation
├── QUICK-START.md               # Quick reference guide
└── .gitignore                   # Ignore test reports
```

### Documentation
```
Health Care/
├── LOAD-TESTING-GUIDE.md        # Complete guide for load testing
└── ARTILLERY-SETUP-COMPLETE.md  # This file
```

### NPM Scripts Added
```json
"load-test": "Run basic load test"
"load-test:stress": "Run stress test to find limits"
"load-test:auth": "Test authenticated user flows"
"load-test:b2b": "Test B2B workflows"
"load-test:report": "Generate HTML report with charts"
"load-test:quick": "Quick 30-second health check"
```

---

## 🚀 How to Use (3 Steps)

### Step 1: Install Artillery (One Time Only)

```bash
npm install -g artillery@latest
```

Verify installation:
```bash
artillery --version
```

Expected output: `Artillery 2.x.x` or higher

---

### Step 2: Start Your Backend

```bash
cd health-care/backend
npm run dev
```

Wait for:
```
✓ MongoDB connected successfully
✓ Redis connected successfully
✓ Server running on port 5000
```

---

### Step 3: Run Your First Test

```bash
npm run load-test
```

This will:
- Simulate 5-50 users per second
- Test product browsing, search, cart operations
- Run for 4 minutes
- Show real-time results

---

## 📊 Understanding Results

### Example Output

```
Summary report @ 14:30:25(+0600)
  Scenarios launched:  6000        ← Total simulated users
  Scenarios completed: 5950        ← Successfully completed (99.2%)
  Requests completed:  23800       ← Total API calls
  Mean response/sec:   79.33       ← Throughput
  
  Response time (msec):
    min: 12
    max: 3456
    median: 145                     ← Half faster, half slower
    p95: 450                        ← 95% under 450ms ✅
    p99: 890                        ← 99% under 890ms ✅
  
  Scenario counts:
    Browse Products: 2400 (40%)
    Search Products: 1200 (20%)
    Browse Categories: 900 (15%)
    Browse Brands: 600 (10%)
    Guest Cart: 600 (10%)
    Order Tracking: 300 (5%)
  
  Codes:
    200: 23500                      ← Successful (98.7%) ✅
    500: 300                        ← Errors (1.3%) ⚠️
```

---

## ✅ What's Good?

Your system is **healthy** if you see:

- ✅ **p95 < 500ms**: Fast response times
- ✅ **p99 < 1000ms**: Consistent performance
- ✅ **Error rate < 1%**: Stable system
- ✅ **All scenarios complete**: No crashes
- ✅ **CPU < 80%**: Not overloaded

---

## ⚠️ Warning Signs

Your system **needs optimization** if you see:

- ⚠️ **p95 > 1000ms**: Slow responses
- ⚠️ **Error rate > 1%**: System struggling
- ⚠️ **Increasing response times**: Overloaded
- ⚠️ **ETIMEDOUT errors**: Can't keep up
- ⚠️ **CPU > 80%**: Resource constrained

---

## 🎯 Test Scenarios Explained

### 1. Basic Load Test (Start Here)

**Command**: `npm run load-test`

**What it tests**:
- Product browsing (40% of traffic)
- Product search (20%)
- Category browsing (15%)
- Brand browsing (10%)
- Guest cart operations (10%)
- Order tracking (5%)

**Load profile**:
- Warm up: 5 users/sec for 1 minute
- Normal: 20 users/sec for 2 minutes
- Peak: 50 users/sec for 1 minute

**Duration**: 4 minutes

**Purpose**: Simulate normal daily traffic

---

### 2. Stress Test (Find Your Limits)

**Command**: `npm run load-test:stress`

**What it tests**:
- Heavy product browsing
- Rapid search queries
- Parallel API calls

**Load profile**:
- Ramp up: 10 users/sec
- Sustained: 50 users/sec
- High: 100 users/sec
- Stress: 200 users/sec
- Breaking point: 300 users/sec

**Duration**: 7 minutes

**Purpose**: Find maximum capacity before system fails

---

### 3. Authenticated User Test

**Command**: `npm run load-test:auth`

**What it tests**:
- Login flow (30%)
- Cart operations (25%)
- Wishlist (20%)
- Order history (15%)
- Profile updates (10%)

**Prerequisites**: Create test user first:
```bash
curl -X POST http://localhost:5000/api/auth/register -H "Content-Type: application/json" -d "{\"name\":\"Load Test User\",\"email\":\"loadtest@medcorebd.com\",\"password\":\"LoadTest123!\",\"phone\":\"+8801700000000\"}"
```

**Duration**: 3 minutes

**Purpose**: Test logged-in user workflows

---

### 4. B2B Test

**Command**: `npm run load-test:b2b`

**What it tests**:
- Bulk orders (40%)
- Quote requests (30%)
- B2B dashboard (20%)
- Credit terms (10%)

**Prerequisites**: Create B2B test user:
```bash
curl -X POST http://localhost:5000/api/auth/register -H "Content-Type: application/json" -d "{\"name\":\"B2B Hospital\",\"email\":\"b2b@hospital.com\",\"password\":\"B2BTest123!\",\"phone\":\"+8801800000000\",\"accountType\":\"b2b\"}"
```

**Duration**: 3 minutes

**Purpose**: Test B2B-specific workflows

---

### 5. Quick Test

**Command**: `npm run load-test:quick`

**What it tests**: Product listing endpoint only

**Load**: 100 requests with 10 concurrent users

**Duration**: 30 seconds

**Purpose**: Fast health check

---

### 6. HTML Report

**Command**: `npm run load-test:report`

**What it does**:
- Runs basic load test
- Generates JSON report
- Creates HTML file with charts

**Output**: `report.json.html` (open in browser)

**Includes**:
- Response time graphs
- Request rate charts
- Error rate visualization
- Detailed metrics

---

## 💡 Expected Capacity by Hosting Tier

### Render.com Free Tier
- **Concurrent users**: 10-20
- **Cost**: $0/month
- **Test result**: Basic test may show errors at 20+ users/sec
- **Recommendation**: Good for development only

### Render.com Starter
- **Concurrent users**: 50-100
- **Cost**: $7/month
- **Test result**: Basic test passes comfortably
- **Recommendation**: Good for small clinics/hospitals

### Render.com Standard
- **Concurrent users**: 200-500
- **Cost**: $25/month
- **Test result**: Stress test passes up to 100 users/sec
- **Recommendation**: Good for medium healthcare platforms

### Render.com Pro
- **Concurrent users**: 500+
- **Cost**: $85/month
- **Test result**: All tests pass
- **Recommendation**: Good for large B2B platforms

---

## 🔧 Troubleshooting

### Issue: "ECONNREFUSED"

**Problem**: Backend server not running

**Solution**:
```bash
cd health-care/backend
npm run dev
```

---

### Issue: "401 Unauthorized" on authenticated tests

**Problem**: Test user doesn't exist

**Solution**: Create test users (see commands in test descriptions above)

---

### Issue: "429 Too Many Requests"

**Problem**: Rate limiter blocking test traffic

**Solution**: Temporarily increase rate limits for testing

Edit `backend/src/middleware/rateLimiter.js`:
```javascript
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000, // Increase from 100 to 1000
});
```

---

### Issue: High response times (>2000ms)

**Possible causes**:
1. Database not indexed
2. No caching enabled
3. Slow queries
4. Server overloaded

**Solutions**:
- Enable Redis caching
- Add database indexes
- Optimize Mongoose queries
- Upgrade server tier

---

### Issue: MongoDB connection errors

**Problem**: Connection pool exhausted

**Solution**: Increase pool size in `backend/src/config/database.js`:
```javascript
mongoose.connect(process.env.MONGODB_URI, {
  maxPoolSize: 50, // Increase from 10
});
```

---

## 📈 Optimization Checklist

If tests show poor performance:

### Backend
- [ ] Enable compression middleware
- [ ] Add Redis caching for products/categories
- [ ] Optimize Mongoose queries
- [ ] Enable connection pooling
- [ ] Remove unnecessary middleware

### Database
- [ ] Add indexes to frequently queried fields
- [ ] Use MongoDB aggregation pipeline
- [ ] Enable query result caching
- [ ] Optimize schema design

### Infrastructure
- [ ] Upgrade server tier
- [ ] Use CDN for static assets
- [ ] Enable HTTP/2
- [ ] Use load balancer

---

## 📚 Documentation

### Quick Reference
- **Quick Start**: `health-care/backend/load-tests/QUICK-START.md`
- **Detailed Guide**: `health-care/backend/load-tests/README.md`
- **Full Tutorial**: `LOAD-TESTING-GUIDE.md` (project root)

### External Resources
- **Artillery Docs**: https://www.artillery.io/docs
- **Load Testing Best Practices**: https://www.artillery.io/docs/guides/guides/load-testing-best-practices

---

## 🎯 Recommended Testing Workflow

### 1. Initial Setup (One Time)
```bash
npm install -g artillery@latest
```

### 2. Before Each Test Session
```bash
cd health-care/backend
npm run dev
```

### 3. Run Tests in Order

**Step 1**: Basic test
```bash
npm run load-test
```
Check if p95 < 500ms and errors < 1%

**Step 2**: If basic test passes, run stress test
```bash
npm run load-test:stress
```
Note when errors start appearing

**Step 3**: Test authenticated flows
```bash
# Create test user first (see above)
npm run load-test:auth
```

**Step 4**: Test B2B flows
```bash
# Create B2B user first (see above)
npm run load-test:b2b
```

**Step 5**: Generate report
```bash
npm run load-test:report
```
Open `report.json.html` in browser

### 4. Analyze & Optimize
- Review results
- Identify bottlenecks
- Apply optimizations
- Re-run tests

### 5. Document Capacity
- Note maximum concurrent users
- Document response times
- Set up monitoring alerts
- Plan for scaling

---

## 🚀 Next Steps

1. ✅ **Install Artillery**: `npm install -g artillery@latest`
2. ✅ **Start backend**: `cd health-care/backend && npm run dev`
3. ✅ **Run basic test**: `npm run load-test`
4. 📊 **Check results**: Look for p95 < 500ms, errors < 1%
5. 🔧 **Optimize if needed**: Follow optimization checklist
6. 💪 **Run stress test**: `npm run load-test:stress`
7. 📝 **Document capacity**: Note your system's limits
8. 🎯 **Set up monitoring**: Add APM tools (New Relic, Datadog)
9. 🔄 **Automate**: Add to CI/CD pipeline
10. 🚀 **Deploy with confidence**: You know your capacity!

---

## 📞 Support

For questions or issues:
- Check `health-care/backend/load-tests/README.md` for detailed docs
- Review Artillery docs: https://www.artillery.io/docs
- Check backend logs: `health-care/backend/logs/`
- Monitor MongoDB: Check Atlas dashboard
- Monitor Redis: `redis-cli monitor`

---

## ✨ Summary

You now have a complete load testing setup that can:

✅ Simulate realistic user traffic
✅ Test different user scenarios (guest, authenticated, B2B)
✅ Find your system's breaking point
✅ Generate detailed HTML reports
✅ Identify performance bottlenecks
✅ Validate optimizations

**To answer "How many users can my website handle?"**

Just run: `npm run load-test`

The results will show you exactly how many concurrent users your system can handle before performance degrades!

---

**Created**: May 30, 2026
**Version**: 1.0.0
**Status**: ✅ Ready to use
