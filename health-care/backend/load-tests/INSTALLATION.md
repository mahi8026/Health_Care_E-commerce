# Artillery Installation & Setup Guide

## Step-by-Step Installation

### Step 1: Install Artillery Globally

**Windows (PowerShell or CMD):**
```bash
npm install -g artillery@latest
```

**Verify installation:**
```bash
artillery --version
```

Expected output: `Artillery 2.x.x` or higher

---

### Step 2: Install Dependencies (if needed)

Artillery uses Node.js, which you already have. But if you see errors, ensure you have:

```bash
node --version    # Should be v18 or higher
npm --version     # Should be v9 or higher
```

---

### Step 3: Verify Backend Dependencies

The test helper scripts use `axios`. Install it in the backend:

```bash
cd health-care/backend
npm install axios
```

---

## Quick Test

### 1. Start Backend

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

### 2. Create Test Users (One Time)

```bash
npm run load-test:create-users
```

This creates:
- Regular user: `loadtest@medcorebd.com`
- B2B user: `b2b@hospital.com`

---

### 3. Run Your First Test

```bash
npm run load-test
```

You should see output like:
```
Started phase 0 (Warm up - 5 users/sec), duration: 60s @ 14:30:25(+0600)
Started phase 1 (Normal load - 20 users/sec), duration: 120s @ 14:31:25(+0600)
Started phase 2 (Peak load - 50 users/sec), duration: 60s @ 14:33:25(+0600)

Summary report @ 14:34:25(+0600)
  Scenarios launched:  6000
  Scenarios completed: 5950
  ...
```

---

## Troubleshooting Installation

### Issue: "artillery: command not found"

**Problem**: Artillery not installed globally or not in PATH

**Solution**:
```bash
# Reinstall globally
npm install -g artillery@latest

# Or use npx (no installation needed)
npx artillery@latest run basic-load-test.yml
```

---

### Issue: "npm install -g" permission denied

**Problem**: Need admin rights on Windows

**Solution**:
1. Open PowerShell as Administrator
2. Run: `npm install -g artillery@latest`

Or use npx instead (no admin needed):
```bash
npx artillery@latest run basic-load-test.yml
```

---

### Issue: "Cannot find module 'axios'"

**Problem**: Missing dependency for test user creation script

**Solution**:
```bash
cd health-care/backend
npm install axios
```

---

### Issue: Backend not accessible

**Problem**: Backend not running or wrong port

**Solution**:
```bash
# Start backend
cd health-care/backend
npm run dev

# Verify it's running
curl http://localhost:5000/api/health
```

---

### Issue: MongoDB connection error

**Problem**: MongoDB not connected

**Solution**:
1. Check `.env` file has correct `MONGODB_URI`
2. Verify MongoDB Atlas is accessible
3. Check network connection

---

### Issue: Redis connection error

**Problem**: Redis not connected

**Solution**:
1. Check `.env` file has correct `REDIS_URL`
2. Or let it use in-memory fallback (tests will still work)

---

## Alternative: Use npx (No Installation)

If you don't want to install Artillery globally, use npx:

```bash
# Instead of: npm run load-test
cd health-care/backend/load-tests
npx artillery@latest run basic-load-test.yml

# Instead of: npm run load-test:stress
npx artillery@latest run stress-test.yml

# Instead of: npm run load-test:report
npx artillery@latest run basic-load-test.yml --output report.json
npx artillery@latest report report.json
```

---

## Verify Everything Works

Run this checklist:

```bash
# 1. Check Artillery installed
artillery --version
# Expected: Artillery 2.x.x

# 2. Check Node.js version
node --version
# Expected: v18.x.x or higher

# 3. Check backend dependencies
cd health-care/backend
npm list axios
# Expected: axios@x.x.x

# 4. Start backend
npm run dev
# Expected: Server running on port 5000

# 5. Create test users (in new terminal)
npm run load-test:create-users
# Expected: ✅ Successfully created users

# 6. Run quick test
npm run load-test:quick
# Expected: Summary report with results

# 7. Run basic test
npm run load-test
# Expected: 4-minute test with detailed results
```

---

## What's Installed?

After installation, you have:

### Global Tools
- **Artillery CLI**: `artillery` command available globally

### Local Files
- **Test configs**: `health-care/backend/load-tests/*.yml`
- **Helper scripts**: `health-care/backend/load-tests/*.js`
- **Documentation**: `health-care/backend/load-tests/*.md`

### NPM Scripts
- `npm run load-test` - Basic load test
- `npm run load-test:stress` - Stress test
- `npm run load-test:auth` - Authenticated test
- `npm run load-test:b2b` - B2B test
- `npm run load-test:quick` - Quick test
- `npm run load-test:report` - Generate HTML report
- `npm run load-test:create-users` - Create test users

---

## Next Steps

1. ✅ Artillery installed
2. ✅ Backend running
3. ✅ Test users created
4. 🚀 Run your first test: `npm run load-test`

See `QUICK-START.md` for usage guide!

---

## Uninstall (if needed)

To remove Artillery:

```bash
npm uninstall -g artillery
```

To remove test files:

```bash
cd health-care/backend
rmdir /s load-tests
```

---

## Support

- **Artillery Docs**: https://www.artillery.io/docs
- **Installation Guide**: https://www.artillery.io/docs/get-started/installation
- **GitHub Issues**: https://github.com/artilleryio/artillery/issues
