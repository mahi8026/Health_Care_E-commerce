# Load Testing Guide for MedCore BD

## Quick Start (5 Minutes)

### Step 1: Install Artillery

```bash
npm install -g artillery@latest
```

Verify installation:
```bash
artillery --version
```

### Step 2: Start Your Backend

```bash
cd health-care/backend
npm run dev
```

Server should be running on `http://localhost:5000`

### Step 3: Run Your First Load Test

```bash
cd health-care/backend
npm run load-test
```

That's it! You'll see real-time results showing how many users your system can handle.

---

## Understanding the Results

After running the test, you'll see output like this:

```
Summary report @ 14:30:25(+0600)
  Scenarios launched:  6000        ← Total test users
  Scenarios completed: 5950        ← Successfully completed
  Requests completed:  23800       ← Total API calls made
  Mean response/sec:   79.33       ← Requests per second
  
  Response time (msec):
    min: 12                         ← Fastest response
    max: 3456                       ← Slowest response
    median: 145                     ← Middle value (50% faster, 50% slower)
    p95: 450                        ← 95% of requests faster than this
    p99: 890                        ← 99% of requests faster than this
  
  Codes:
    200: 23500                      ← Successful responses
    500: 300                        ← Server errors
```

### What's Good?

✅ **Your system is healthy if:**
- p95 response time < 500ms
- p99 response time < 1000ms
- Error rate < 1%
- All scenarios complete successfully

⚠️ **Warning signs:**
- p95 response time > 1000ms
- Error rate > 1%
- Response times increasing over time

❌ **Critical issues:**
- Error rate > 5%
- Many ETIMEDOUT errors
- 500 errors increasing
- System becomes unresponsive

---

## Available Tests

### 1. Basic Load Test (Recommended First)

**What it tests**: Normal user traffic patterns

```bash
npm run load-test
```

**Load**: 5-50 users per second for 4 minutes

**Simulates**:
- Browsing products
- Searching
- Adding to cart
- Viewing categories

---

### 2. Stress Test (Find Your Limits)

**What it tests**: Maximum capacity before system breaks

```bash
npm run load-test:stress
```

**Load**: Gradually increases from 10 to 300 users per second

**Purpose**: Find the breaking point of your system

---

### 3. Authenticated User Test

**What it tests**: Logged-in user flows

```bash
npm run load-test:auth
```

**Prerequisites**: Create a test user first:

```bash
curl -X POST http://localhost:5000/api/auth/register -H "Content-Type: application/json" -d "{\"name\":\"Load Test User\",\"email\":\"loadtest@medcorebd.com\",\"password\":\"LoadTest123!\",\"phone\":\"+8801700000000\"}"
```

**Simulates**:
- Login
- Cart operations
- Wishlist
- Order history
- Profile updates

---

### 4. B2B Test

**What it tests**: B2B customer workflows

```bash
npm run load-test:b2b
```

**Prerequisites**: Create a B2B test user first:

```bash
curl -X POST http://localhost:5000/api/auth/register -H "Content-Type: application/json" -d "{\"name\":\"B2B Hospital\",\"email\":\"b2b@hospital.com\",\"password\":\"B2BTest123!\",\"phone\":\"+8801800000000\",\"accountType\":\"b2b\"}"
```

**Simulates**:
- Bulk orders
- Quote requests
- B2B dashboard
- Credit terms

---

### 5. Quick Test (30 Seconds)

**What it tests**: Quick health check

```bash
npm run load-test:quick
```

**Load**: 100 requests with 10 concurrent users

**Purpose**: Fast sanity check

---

## Generate HTML Report

Want a visual report with charts?

```bash
npm run load-test:report
```

This creates an HTML file with:
- Response time graphs
- Request rate charts
- Error rate visualization
- Detailed metrics

Open the generated `report.json.html` file in your browser.

---

## Interpreting Results for Your Hosting

### Render.com Free Tier
**Expected Capacity**: 10-20 concurrent users
- If you see errors at 20+ users/sec, this is normal
- Upgrade to paid tier for more capacity

### Render.com Starter ($7/month)
**Expected Capacity**: 50-100 concurrent users
- Should handle basic load test comfortably
- May struggle with stress test at 100+ users/sec

### Render.com Standard ($25/month)
**Expected Capacity**: 200-500 concurrent users
- Should handle stress test up to 200 users/sec
- Good for production traffic

### Vercel (Frontend)
**Expected Capacity**: 1000+ concurrent users
- Frontend can handle much more traffic than backend
- Backend is usually the bottleneck

---

## Common Issues & Solutions

### Issue: "ECONNREFUSED"

**Problem**: Backend server not running

**Solution**:
```bash
cd health-care/backend
npm run dev
```

---

### Issue: "401 Unauthorized"

**Problem**: Test user doesn't exist

**Solution**: Create test users (see Authenticated User Test section above)

---

### Issue: "Too many requests" or "429 errors"

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
1. **Database not indexed**: Add indexes to frequently queried fields
2. **No caching**: Enable Redis caching
3. **Slow queries**: Optimize Mongoose queries
4. **Too many requests**: Your server is overloaded

**Quick fixes**:
- Enable Redis caching
- Add database indexes
- Reduce test load
- Upgrade server resources

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

## Monitoring During Tests

### Watch Backend Logs

In a separate terminal:
```bash
cd health-care/backend
npm run dev
```

You'll see real-time API requests and errors.

### Monitor System Resources

**Windows Task Manager**:
- Press `Ctrl + Shift + Esc`
- Watch CPU and Memory usage
- Should stay below 80% CPU

**Command Line**:
```bash
# CPU usage
wmic cpu get loadpercentage

# Memory usage
wmic OS get FreePhysicalMemory
```

### Monitor MongoDB

If using MongoDB Atlas:
1. Go to your cluster dashboard
2. Click "Metrics"
3. Watch connections and operations during test

### Monitor Redis

```bash
redis-cli monitor
```

---

## What Capacity Do You Need?

### Small Clinic/Hospital Website
- **Expected traffic**: 10-50 concurrent users
- **Recommended**: Render.com Starter ($7/month)
- **Test to pass**: Basic load test with <500ms p95

### Medium Healthcare Platform
- **Expected traffic**: 100-200 concurrent users
- **Recommended**: Render.com Standard ($25/month)
- **Test to pass**: Stress test up to 100 users/sec

### Large B2B Platform
- **Expected traffic**: 500+ concurrent users
- **Recommended**: Render.com Pro ($85/month) or dedicated server
- **Test to pass**: Stress test up to 200+ users/sec

---

## Optimization Checklist

If tests show poor performance:

### Backend Optimizations
- [ ] Enable compression middleware
- [ ] Add Redis caching for products/categories
- [ ] Add database indexes
- [ ] Optimize Mongoose queries
- [ ] Enable connection pooling
- [ ] Remove unnecessary middleware

### Database Optimizations
- [ ] Add indexes to frequently queried fields
- [ ] Use MongoDB aggregation pipeline
- [ ] Enable query result caching
- [ ] Optimize schema design

### Infrastructure
- [ ] Upgrade server tier
- [ ] Use CDN for static assets (Cloudinary)
- [ ] Enable HTTP/2
- [ ] Use load balancer for multiple instances

---

## Next Steps

1. **Run basic test**: `npm run load-test`
2. **Check results**: Look for response times and errors
3. **Optimize if needed**: Follow optimization checklist
4. **Run stress test**: `npm run load-test:stress`
5. **Find your limit**: Note when errors start appearing
6. **Plan capacity**: Choose hosting tier based on results

---

## Advanced: Custom Tests

Want to test specific scenarios? Edit the YAML files in `health-care/backend/load-tests/`

Example - Test only product search:
```yaml
scenarios:
  - name: "Search Only"
    flow:
      - get:
          url: "/api/products/search?query=ECG"
      - think: 2
```

---

## Support & Resources

- **Artillery Docs**: https://www.artillery.io/docs
- **Test Files Location**: `health-care/backend/load-tests/`
- **Detailed README**: `health-care/backend/load-tests/README.md`

---

## Summary

**To check how many users your website can handle:**

1. Install Artillery: `npm install -g artillery@latest`
2. Start backend: `cd health-care/backend && npm run dev`
3. Run test: `npm run load-test`
4. Check p95 response time and error rate
5. If p95 < 500ms and errors < 1%, your system is healthy!

**Quick capacity estimates:**
- Free tier: ~20 concurrent users
- Starter ($7/mo): ~100 concurrent users
- Standard ($25/mo): ~500 concurrent users

The tests will tell you exactly where your system starts to struggle!
