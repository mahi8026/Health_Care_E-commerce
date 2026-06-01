# Artillery Load Testing - Quick Start

## 🚀 3 Steps to Test Your System

### 1️⃣ Install Artillery (One Time)

```bash
npm install -g artillery@latest
```

### 2️⃣ Start Backend

```bash
cd health-care/backend
npm run dev
```

### 3️⃣ Run Test

```bash
npm run load-test
```

---

## 📊 What You'll See

```
Summary report @ 14:30:25(+0600)
  Scenarios launched:  6000
  Scenarios completed: 5950
  Response time (msec):
    p95: 450          ← 95% of requests under 450ms ✅
    p99: 890          ← 99% of requests under 890ms ✅
  Codes:
    200: 23500        ← Successful responses ✅
    500: 300          ← Errors (1.3%) ⚠️
```

---

## ✅ Good Results

- **p95 < 500ms**: Fast response times
- **p99 < 1000ms**: Consistent performance
- **Errors < 1%**: Stable system
- **All scenarios complete**: No crashes

---

## ⚠️ Warning Signs

- **p95 > 1000ms**: Slow responses
- **Errors > 1%**: System struggling
- **Increasing response times**: Overloaded
- **ETIMEDOUT errors**: Server can't keep up

---

## 🎯 Available Tests

| Test | Command | Purpose | Load |
|------|---------|---------|------|
| **Basic** | `npm run load-test` | Normal traffic | 5-50 users/sec |
| **Stress** | `npm run load-test:stress` | Find limits | 10-300 users/sec |
| **Auth** | `npm run load-test:auth` | Logged-in users | 10-25 users/sec |
| **B2B** | `npm run load-test:b2b` | B2B workflows | 5-15 users/sec |
| **Quick** | `npm run load-test:quick` | Fast check | 100 requests |
| **Report** | `npm run load-test:report` | HTML report | 5-50 users/sec |

---

## 💡 Expected Capacity

| Hosting Tier | Concurrent Users | Cost | Test Result |
|--------------|------------------|------|-------------|
| **Render Free** | 10-20 | $0 | Basic test may struggle |
| **Render Starter** | 50-100 | $7/mo | Basic test passes ✅ |
| **Render Standard** | 200-500 | $25/mo | Stress test passes ✅ |
| **Render Pro** | 500+ | $85/mo | All tests pass ✅ |

---

## 🔧 Quick Fixes

### Slow Response Times?
1. Enable Redis caching
2. Add database indexes
3. Optimize queries

### Too Many Errors?
1. Check backend logs
2. Monitor database connections
3. Increase rate limits for testing

### Connection Refused?
1. Ensure backend is running: `npm run dev`
2. Check port 5000 is available
3. Verify MongoDB is connected

---

## 📈 Next Steps

1. ✅ Run basic test
2. 📊 Check results
3. 🔧 Optimize if needed
4. 💪 Run stress test
5. 📝 Document capacity
6. 🚀 Deploy with confidence

---

## 📚 More Info

- **Detailed Guide**: See `README.md` in this directory
- **Full Documentation**: See `LOAD-TESTING-GUIDE.md` in project root
- **Artillery Docs**: https://www.artillery.io/docs

---

## 🆘 Common Issues

**"ECONNREFUSED"** → Backend not running
**"401 Unauthorized"** → Create test user first
**"429 Too Many Requests"** → Increase rate limits
**High response times** → Enable caching, add indexes

See `README.md` for detailed solutions.
