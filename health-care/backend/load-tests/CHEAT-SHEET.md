# Artillery Load Testing Cheat Sheet

## 🚀 Quick Commands

```bash
# Install (one time)
npm install -g artillery@latest

# Start backend
cd health-care/backend && npm run dev

# Run tests
npm run load-test              # Basic test (4 min)
npm run load-test:stress       # Stress test (7 min)
npm run load-test:auth         # Auth test (3 min)
npm run load-test:b2b          # B2B test (3 min)
npm run load-test:quick        # Quick test (30 sec)
npm run load-test:report       # Generate HTML report
```

---

## 📊 Reading Results

```
Response time (msec):
  p95: 450    ← 95% of requests under this
  p99: 890    ← 99% of requests under this

Codes:
  200: 23500  ← Successful
  500: 300    ← Errors
```

**Good**: p95 < 500ms, errors < 1%
**Warning**: p95 > 1000ms, errors > 1%
**Critical**: p95 > 2000ms, errors > 5%

---

## 💡 Capacity Guide

| Hosting | Users | Cost | Test |
|---------|-------|------|------|
| Free | 10-20 | $0 | May fail |
| Starter | 50-100 | $7 | Basic ✅ |
| Standard | 200-500 | $25 | Stress ✅ |
| Pro | 500+ | $85 | All ✅ |

---

## 🔧 Quick Fixes

**Slow?** → Enable caching, add indexes
**Errors?** → Check logs, increase rate limits
**Refused?** → Start backend: `npm run dev`
**401?** → Create test user (see README)

---

## 📈 Test Order

1. Basic → Check health
2. Stress → Find limits
3. Auth → Test login flows
4. B2B → Test bulk orders
5. Report → Generate charts

---

## 🎯 What Each Test Does

**Basic**: Normal traffic (5-50 users/sec)
**Stress**: Find breaking point (10-300 users/sec)
**Auth**: Logged-in users (10-25 users/sec)
**B2B**: Bulk orders (5-15 users/sec)
**Quick**: Fast health check (30 sec)

---

## 📚 More Info

- **Quick Start**: `QUICK-START.md`
- **Full Guide**: `README.md`
- **Tutorial**: `../../LOAD-TESTING-GUIDE.md`
