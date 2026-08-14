# Backend 503 Error - Service Unavailable

## Problem
Frontend is showing **HTTP 503** errors:
- `[HomePage] Failed to load data: Error: HTTP 503`
- `[BestSellingSection] Failed to fetch products: Error: HTTP 503`

This means the backend API server at **https://health-care-e-commerce-ubyy.onrender.com** is either:
1. **Down/Crashed** - Server process stopped
2. **Deploying** - Mid-deployment restart
3. **Database Connection Failed** - MongoDB Atlas unreachable
4. **Resource Limits** - Render free tier CPU/memory exceeded
5. **Cold Start** - Render free tier spins down after inactivity (takes 30-60s to wake up)

## Quick Diagnosis

### Step 1: Check Backend Health
Open in browser: **https://health-care-e-commerce-ubyy.onrender.com/api/health**

**Expected Response:**
```json
{
  "success": true,
  "status": "healthy",
  "message": "MediportBD API is running",
  "version": "2.0.0",
  "timestamp": "2026-08-14T..."
}
```

**If you get 503 or timeout:**
- Backend is down or cold-starting
- Go to Render dashboard: https://dashboard.render.com/
- Check deployment logs for errors

### Step 2: Check Detailed Health
**https://health-care-e-commerce-ubyy.onrender.com/api/health/detailed**

**Expected Response:**
```json
{
  "success": true,
  "status": "healthy",
  "services": {
    "api": "operational",
    "database": {
      "status": "connected",
      "connected": true,
      "host": "..."
    },
    "redis": {
      "status": "connected"
    }
  }
}
```

**If database status is "disconnected" or "connecting":**
- MongoDB Atlas may be down or blocking Render IP
- Check MongoDB Atlas dashboard
- Verify `MONGODB_URI` environment variable in Render

### Step 3: Check Render Dashboard

Go to: **https://dashboard.render.com/**

1. Find your backend service (health-care-backend or similar)
2. Check status:
   - ✅ **Live** - Server is running
   - 🔴 **Failed** - Deployment failed
   - ⚙️ **Building** - Currently deploying
   - 💤 **Sleeping** - Free tier spun down (wait 30-60s for wake up)

3. Click **Logs** tab:
   - Look for errors in recent logs
   - Common issues:
     ```
     Error: connect ETIMEDOUT
     MongooseServerSelectionError: Could not connect to any servers
     Error: ECONNREFUSED Redis
     FATAL ERROR: Ineffective mark-compacts near heap limit
     ```

## Common Fixes

### Fix 1: Cold Start (Free Tier)
**If backend is sleeping:**
- Render free tier spins down after 15 minutes of inactivity
- First request takes 30-60 seconds to wake up
- **Solution**: Wait 60 seconds and refresh page
- **Long-term**: Upgrade to paid plan ($7/mo) for always-on

### Fix 2: MongoDB Connection Failed
**If logs show "MongooseServerSelectionError":**

1. Check MongoDB Atlas:
   - Go to https://cloud.mongodb.com
   - Click "Network Access"
   - Ensure `0.0.0.0/0` (Allow All) is in IP whitelist
   - Or add Render's IP range

2. Verify `MONGODB_URI` in Render:
   - Go to Render dashboard → Your service → Environment
   - Check `MONGODB_URI` is set correctly
   - Format: `mongodb+srv://username:password@cluster.mongodb.net/mediport-bd?retryWrites=true&w=majority`
   - Database name should be `mediport-bd` (not `medcore-bd` or `mediport`)

3. Test connection locally:
   ```bash
   cd health-care/backend
   node -e "require('dotenv').config(); const mongoose = require('mongoose'); mongoose.connect(process.env.MONGODB_URI).then(() => console.log('✅ Connected')).catch(err => console.error('❌ Error:', err.message));"
   ```

### Fix 3: Redis Connection Failed
**If logs show Redis connection errors:**

- Redis is **optional** - backend continues with in-memory cache
- If you want Redis working:
  - Verify `REDIS_URL` in Render environment variables
  - Or remove `REDIS_URL` to use in-memory fallback

### Fix 4: Memory/CPU Limit
**If logs show "heap limit" or "out of memory":**

- Render free tier: 512MB RAM limit
- **Quick fix**: Restart service in Render dashboard
- **Long-term**: Upgrade to $7/mo plan (1GB RAM)

### Fix 5: Deployment Failed
**If latest deployment shows "Failed":**

1. Check build logs in Render for errors
2. Common issues:
   - Missing environment variables
   - npm install failures
   - Port binding errors

3. Manual redeploy:
   - Click "Manual Deploy" → "Deploy latest commit"

### Fix 6: Environment Variables Missing
**Required environment variables in Render:**

```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your-secret-key
FRONTEND_URL=https://health-care-e-commerce-murex.vercel.app
CLOUDINARY_CLOUD_NAME=dm8eqxwlz
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

## Testing Backend Locally

If backend works locally but not on Render:

```bash
cd health-care/backend
npm install
npm run dev
```

Then open: http://localhost:5000/api/health

If local works but Render doesn't:
- Environment variable mismatch
- MongoDB IP whitelist blocking Render
- Port binding issue (Render requires `process.env.PORT`)

## Frontend Fallback

While backend is down, you can temporarily update frontend to show better error messages:

**health-care/src/views/HomePage.jsx:**
```javascript
} catch (err) {
  console.error('[HomePage] Failed to load data:', err);
  setError('Backend server is temporarily unavailable. Please try again in a minute.');
}
```

## Next Steps

1. ✅ Check backend health URL
2. ✅ Check Render dashboard logs
3. ✅ Verify MongoDB Atlas connection
4. ✅ Check environment variables
5. ✅ Wait 60 seconds if cold-starting
6. ✅ Manual redeploy if needed

## Current Status

**Backend URL**: https://health-care-e-commerce-ubyy.onrender.com
**Frontend URL**: https://health-care-e-commerce-murex.vercel.app

**Most Likely Cause**: Render free tier cold start (wait 60 seconds and refresh)

## Contact Support

If none of these work:
- Render Support: https://render.com/support
- MongoDB Atlas Support: https://cloud.mongodb.com/support
