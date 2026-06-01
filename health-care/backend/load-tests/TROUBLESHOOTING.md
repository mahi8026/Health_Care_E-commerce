# Load Testing Troubleshooting Guide

## Your Test Results Analysis

Based on your test results, here's what happened:

### ❌ Issue: 49.4% Failure Rate with 404 Errors

```
errors.Failed capture or match: 3673
http.codes.404: 7436
vusers.failed: 3673
vusers.completed: 2027
```

**Problem**: All API requests returned 404 Not Found errors

**Root Cause**: The test configuration was using incorrect JSON paths to capture data from API responses.

### ✅ What Was Good

- **Response Time**: Excellent (p95: 4ms, p99: 19ms)
- **Server Performance**: Fast and responsive
- **No Timeouts**: Server handled all requests
- **No Crashes**: System remained stable

---

## ✅ Fixed Issues

I've updated the test configurations to fix the 404 errors:

### 1. **Fixed JSON Path for Product Data**

**Before** (Wrong):
```yaml
capture:
  - json: "$.products[0]._id"  # ❌ Wrong path
    as: "productId"
```

**After** (Correct):
```yaml
capture:
  - json: "$.data[0]._id"  # ✅ Correct path
    as: "productId"
```

Your API returns:
```json
{
  "success": true,
  "data": [...],  // ← Products are in "data", not "products"
  "pagination": {...}
}
```

### 2. **Fixed Category Data Path**

**Before**:
```yaml
capture:
  - json: "$.categories[0]._id"  # ❌ Wrong
```

**After**:
```yaml
capture:
  - json: "$.data[0]._id"  # ✅ Correct
```

### 3. **Added Conditional Requests**

Added `ifTrue` checks to prevent requests with missing data:

```yaml
- get:
    url: "/api/products/{{ productId }}"
    ifTrue: "productId"  # ✅ Only run if productId exists
```

---

## 🔧 How to Run Fixed Tests

### Step 1: Run Diagnostic Test First

This will verify your API is working correctly:

```bash
cd health-care/backend
npm run load-test:diagnostic
```

**Expected Output**:
```
All VUs finished. Total time: 10 seconds

Summary report:
  Scenarios launched:  10
  Scenarios completed: 10
  http.codes.200: 10
  Errors: 0
```

If you see 404 errors here, your backend might not be running or database is empty.

---

### Step 2: Ensure Database Has Products

Check if you have products in your database:

```bash
# Connect to MongoDB
mongosh "your-mongodb-uri"

# Check product count
use medcore
db.products.countDocuments()
```

**If count is 0**, seed your database:

```bash
cd health-care/backend
npm run seed
```

---

### Step 3: Run Basic Load Test

```bash
npm run load-test
```

**Expected Results** (Good):
```
Summary report:
  Scenarios launched:  5700
  Scenarios completed: 5700  # ✅ All completed
  http.codes.200: 7400+      # ✅ All successful
  http.codes.404: 0          # ✅ No 404 errors
  errors: 0                  # ✅ No errors
  
  Response time (msec):
    p95: <500ms              # ✅ Fast
    p99: <1000ms             # ✅ Consistent
```

---

## 🐛 Common Issues & Solutions

### Issue 1: Still Getting 404 Errors

**Symptoms**:
```
http.codes.404: 7436
errors.Failed capture or match: 3673
```

**Possible Causes**:
1. Backend not running
2. Database empty (no products)
3. Wrong API URL

**Solutions**:

**A. Check Backend is Running**:
```bash
curl http://localhost:5000/api/health
```

Expected: `{"status":"ok"}`

**B. Check Products Exist**:
```bash
curl http://localhost:5000/api/products
```

Expected: JSON with `"data": [...]` containing products

**C. Seed Database**:
```bash
cd health-care/backend
npm run seed
```

---

### Issue 2: "ECONNREFUSED" Errors

**Symptoms**:
```
errors.ECONNREFUSED: 100
```

**Solution**:
```bash
# Start backend
cd health-care/backend
npm run dev

# Wait for:
# ✓ MongoDB connected
# ✓ Server running on port 5000
```

---

### Issue 3: "Failed capture or match" Errors

**Symptoms**:
```
errors.Failed capture or match: 3673
```

**Cause**: API response structure doesn't match test expectations

**Solution**: Run diagnostic test to see actual API responses:

```bash
npm run load-test:diagnostic
```

Check the output for actual response structure.

---

### Issue 4: High Response Times

**Symptoms**:
```
Response time (msec):
  p95: 2000+
  p99: 5000+
```

**Possible Causes**:
1. Database not indexed
2. No caching enabled
3. Slow queries
4. Server overloaded

**Solutions**:

**A. Enable Redis Caching**:
Check `.env` has:
```
REDIS_URL=redis://localhost:6379
```

**B. Add Database Indexes**:
```javascript
// In MongoDB
db.products.createIndex({ name: "text", description: "text" })
db.products.createIndex({ category: 1 })
db.products.createIndex({ brand: 1 })
db.products.createIndex({ price: 1 })
```

**C. Check Server Resources**:
```bash
# Windows
wmic cpu get loadpercentage
wmic OS get FreePhysicalMemory
```

---

### Issue 5: MongoDB Connection Errors

**Symptoms**:
```
errors.ECONNREFUSED: 100
http.codes.503: 100
```

**Solution**:

**A. Check MongoDB URI**:
```bash
# In backend/.env
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/medcore
```

**B. Test Connection**:
```bash
cd health-care/backend
npm run diagnose
```

---

### Issue 6: Rate Limiting (429 Errors)

**Symptoms**:
```
http.codes.429: 500
```

**Cause**: Rate limiter blocking test traffic

**Solution**: Temporarily increase limits for testing

Edit `backend/src/middleware/rateLimiter.js`:
```javascript
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000, // Increase from 100 to 1000 for testing
});
```

**Remember**: Reset to 100 after testing!

---

## 📊 Understanding Your Results

### Good Results Example

```
Summary report:
  Scenarios launched:  5700
  Scenarios completed: 5700  ← 100% completion ✅
  
  Response time (msec):
    p95: 450              ← 95% under 450ms ✅
    p99: 890              ← 99% under 890ms ✅
  
  Codes:
    200: 7400             ← All successful ✅
    404: 0                ← No errors ✅
  
  Errors: 0               ← No failures ✅
```

**Interpretation**: Your system can handle 50 users/sec comfortably!

---

### Warning Signs Example

```
Summary report:
  Scenarios launched:  5700
  Scenarios completed: 5400  ← 5% failed ⚠️
  
  Response time (msec):
    p95: 1500             ← Slow responses ⚠️
    p99: 3000             ← Very slow ⚠️
  
  Codes:
    200: 7000
    500: 400              ← Server errors ⚠️
  
  Errors: 300             ← Some failures ⚠️
```

**Interpretation**: System is struggling. Optimize or upgrade server.

---

### Critical Issues Example

```
Summary report:
  Scenarios launched:  5700
  Scenarios completed: 3000  ← 47% failed ❌
  
  Response time (msec):
    p95: 5000             ← Very slow ❌
    p99: 10000            ← Extremely slow ❌
  
  Codes:
    200: 4000
    500: 2000             ← Many errors ❌
    503: 1000             ← Service unavailable ❌
  
  Errors: 2700            ← High failure rate ❌
```

**Interpretation**: System is overloaded. Immediate action needed.

---

## 🎯 Next Steps After Fixing

1. **Run diagnostic test**: `npm run load-test:diagnostic`
2. **Verify no 404 errors**: Check output shows all 200 responses
3. **Run basic test**: `npm run load-test`
4. **Check results**: Should see 0 errors, all scenarios completed
5. **Run stress test**: `npm run load-test:stress`
6. **Find your limit**: Note when errors start appearing

---

## 📝 Quick Checklist

Before running load tests:

- [ ] Backend is running (`npm run dev`)
- [ ] MongoDB is connected (check logs)
- [ ] Database has products (`npm run seed` if empty)
- [ ] Redis is running (optional, but recommended)
- [ ] Rate limits increased for testing
- [ ] Diagnostic test passes (`npm run load-test:diagnostic`)

---

## 🆘 Still Having Issues?

### Check Backend Logs

```bash
cd health-care/backend
npm run dev

# Watch for errors in the output
```

### Check MongoDB

```bash
mongosh "your-mongodb-uri"
use medcore
db.products.countDocuments()  # Should be > 0
```

### Check API Manually

```bash
# Test products endpoint
curl http://localhost:5000/api/products

# Test health endpoint
curl http://localhost:5000/api/health

# Test categories endpoint
curl http://localhost:5000/api/categories
```

### Run Diagnostic Test

```bash
npm run load-test:diagnostic
```

This will show you exactly which endpoints are failing.

---

## 📚 Additional Resources

- **Artillery Docs**: https://www.artillery.io/docs
- **Debugging Guide**: https://www.artillery.io/docs/guides/guides/debugging
- **Backend Logs**: `health-care/backend/logs/`
- **MongoDB Logs**: Check Atlas dashboard

---

## ✅ Summary

**Your original issue**: 49.4% failure rate with 404 errors

**Root cause**: Incorrect JSON paths in test configuration

**Fix applied**: Updated all test files to use correct API response structure

**Next step**: Run `npm run load-test:diagnostic` to verify the fix!
