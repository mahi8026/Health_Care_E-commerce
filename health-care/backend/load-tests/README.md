# Artillery Load Testing for MediportBD

This directory contains Artillery load testing configurations for the MediportBD backend API.

## Prerequisites

### 1. Install Artillery

```bash
npm install -g artillery@latest
```

### 2. Verify Installation

```bash
artillery --version
```

### 3. Start Backend Server

```bash
cd health-care/backend
npm run dev
```

The server should be running on `http://localhost:5000`

### 4. Create Test User (for authenticated tests)

Before running authenticated tests, create a test user in your database or use the registration endpoint:

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Load Test User",
    "email": "loadtest@MediportBD.com",
    "password": "LoadTest123!",
    "phone": "+8801700000000"
  }'
```

For B2B tests, create a B2B user:

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "B2B Hospital",
    "email": "b2b@hospital.com",
    "password": "B2BTest123!",
    "phone": "+8801646886795",
    "accountType": "b2b"
  }'
```

## Test Configurations

### 1. Basic Load Test (`basic-load-test.yml`)

**Purpose**: Test normal user traffic patterns

**Load Profile**:
- Warm up: 5 users/sec for 1 minute
- Normal load: 20 users/sec for 2 minutes
- Peak load: 50 users/sec for 1 minute

**Scenarios**:
- Browse products (40% of traffic)
- Search products (20%)
- Browse categories (15%)
- Browse brands (10%)
- Guest cart operations (10%)
- Order tracking (5%)

**Run**:
```bash
cd health-care/backend/load-tests
artillery run basic-load-test.yml
```

**Expected Results**:
- Response time p95: <500ms
- Response time p99: <1000ms
- Error rate: <1%

---

### 2. Stress Test (`stress-test.yml`)

**Purpose**: Find the breaking point of your system

**Load Profile**:
- Ramp up: 10 users/sec for 1 minute
- Sustained: 50 users/sec for 2 minutes
- High load: 100 users/sec for 2 minutes
- Stress: 200 users/sec for 1 minute
- Breaking point: 300 users/sec for 1 minute

**Scenarios**:
- Heavy product browsing (50%)
- Rapid search (30%)
- API stress (20%)

**Run**:
```bash
artillery run stress-test.yml
```

**Expected Results**:
- System should handle 100 users/sec comfortably
- May start degrading at 200+ users/sec
- Monitor CPU, memory, and database connections

---

### 3. Authenticated Test (`authenticated-test.yml`)

**Purpose**: Test authenticated user flows

**Load Profile**:
- Normal: 10 users/sec for 1 minute
- Peak: 25 users/sec for 2 minutes

**Scenarios**:
- Login flow (30%)
- Authenticated cart (25%)
- Wishlist operations (20%)
- View orders (15%)
- Profile operations (10%)

**Run**:
```bash
artillery run authenticated-test.yml
```

**Note**: Requires test user to be created first (see Prerequisites)

---

### 4. B2B Test (`b2b-test.yml`)

**Purpose**: Test B2B-specific workflows

**Load Profile**:
- Normal: 5 users/sec for 1 minute
- Peak: 15 users/sec for 2 minutes

**Scenarios**:
- B2B bulk orders (40%)
- Quote requests (30%)
- B2B dashboard (20%)
- Credit terms (10%)

**Run**:
```bash
artillery run b2b-test.yml
```

**Note**: Requires B2B test user to be created first

---

## Advanced Usage

### Generate HTML Report

```bash
artillery run basic-load-test.yml --output report.json
artillery report report.json
```

This creates an HTML report with detailed metrics and charts.

### Run with Custom Target

```bash
artillery run basic-load-test.yml --target https://api.MediportBD.com
```

### Run Specific Scenario

```bash
artillery run basic-load-test.yml --scenario "Browse Products"
```

### Increase Load

Edit the YAML file and increase `arrivalRate` values:

```yaml
phases:
  - duration: 120
    arrivalRate: 100  # Increase from 50 to 100
```

### Run in Quiet Mode

```bash
artillery run basic-load-test.yml --quiet
```

### Run with Environment Variables

```bash
TARGET_URL=http://localhost:5000 artillery run basic-load-test.yml
```

## Monitoring During Tests

### 1. Backend Server Logs

Watch your backend logs in real-time:

```bash
cd health-care/backend
npm run dev
```

### 2. MongoDB Monitoring

```bash
# Connect to MongoDB
mongosh

# Check current operations
db.currentOp()

# Check connection stats
db.serverStatus().connections
```

### 3. Redis Monitoring

```bash
redis-cli monitor
```

### 4. System Resources

**Windows**:
```bash
# Task Manager or
wmic cpu get loadpercentage
wmic OS get FreePhysicalMemory
```

**Linux/Mac**:
```bash
htop
# or
top
```

## Interpreting Results

### Key Metrics

```
Summary report @ 14:30:25(+0600)
  Scenarios launched:  6000
  Scenarios completed: 5950
  Requests completed:  23800
  Mean response/sec:   79.33
  Response time (msec):
    min: 12
    max: 3456
    median: 145
    p95: 450
    p99: 890
  Scenario counts:
    Browse Products: 2400 (40%)
    Search Products: 1200 (20%)
  Codes:
    200: 23500
    500: 300
  Errors:
    ETIMEDOUT: 50
```

### What to Look For

✅ **Good Signs**:
- p95 response time <500ms
- p99 response time <1000ms
- Error rate <1%
- All scenarios complete successfully
- CPU usage <80%

⚠️ **Warning Signs**:
- p95 response time >1000ms
- Error rate >1%
- Increasing response times over duration
- CPU usage >80%
- Memory growing continuously

❌ **Critical Issues**:
- Error rate >5%
- ETIMEDOUT errors
- Connection refused errors
- 500 errors increasing
- System unresponsive

## Optimization Tips

If tests reveal performance issues:

### 1. Database Optimization
- Add indexes to frequently queried fields
- Use MongoDB aggregation pipeline
- Enable query caching
- Optimize Mongoose queries

### 2. Redis Caching
- Cache product listings
- Cache category/brand data
- Set appropriate TTL values
- Use Redis for session storage

### 3. Backend Optimization
- Enable compression middleware
- Use connection pooling
- Implement rate limiting
- Add CDN for static assets

### 4. Code Optimization
- Remove unnecessary middleware
- Optimize database queries
- Use async/await properly
- Implement pagination

## Continuous Integration

Add to `.github/workflows/load-test.yml`:

```yaml
name: Load Test

on:
  schedule:
    - cron: '0 2 * * 0'  # Weekly on Sunday 2 AM
  workflow_dispatch:

jobs:
  load-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install Artillery
        run: npm install -g artillery@latest
      - name: Run Load Test
        run: |
          cd health-care/backend/load-tests
          artillery run basic-load-test.yml --output report.json
      - name: Generate Report
        run: artillery report report.json
      - name: Upload Report
        uses: actions/upload-artifact@v3
        with:
          name: load-test-report
          path: report.json.html
```

## Troubleshooting

### Issue: "ECONNREFUSED"

**Solution**: Ensure backend server is running on `http://localhost:5000`

### Issue: "401 Unauthorized" on authenticated tests

**Solution**: Create test users first (see Prerequisites)

### Issue: "Too many requests"

**Solution**: Your rate limiter is blocking. Temporarily disable or increase limits for testing:

```javascript
// backend/src/middleware/rateLimiter.js
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000, // Increase from 100 to 1000 for testing
});
```

### Issue: Tests timeout

**Solution**: Increase Artillery timeout:

```yaml
config:
  timeout: 30  # Increase timeout to 30 seconds
```

### Issue: MongoDB connection pool exhausted

**Solution**: Increase pool size in `backend/src/config/database.js`:

```javascript
mongoose.connect(process.env.MONGODB_URI, {
  maxPoolSize: 50, // Increase from 10 to 50
});
```

## Next Steps

1. **Run basic test first**: `artillery run basic-load-test.yml`
2. **Analyze results**: Look for bottlenecks
3. **Optimize**: Fix performance issues
4. **Run stress test**: `artillery run stress-test.yml`
5. **Find breaking point**: Identify maximum capacity
6. **Set up monitoring**: Add APM tools (New Relic, Datadog)
7. **Automate**: Add to CI/CD pipeline

## Resources

- [Artillery Documentation](https://www.artillery.io/docs)
- [Load Testing Best Practices](https://www.artillery.io/docs/guides/guides/load-testing-best-practices)
- [Performance Optimization Guide](https://www.artillery.io/docs/guides/guides/performance-optimization)

## Support

For issues or questions:
- Check Artillery docs: https://www.artillery.io/docs
- Backend logs: `health-care/backend/logs/`
- MongoDB logs: Check MongoDB Atlas dashboard
- Redis logs: `redis-cli monitor`
