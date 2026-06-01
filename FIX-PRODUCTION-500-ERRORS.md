# Fix Production 500 Errors — Action Plan

## Current Situation

**Problem**: Frontend on Vercel is live but getting 500 errors from backend API

**Root Cause**: Backend is not deployed on Render.com (or misconfigured)

**Impact**: Production site is completely non-functional

**Priority**: 🔴 CRITICAL - Immediate action required

---

## Solution Overview

Deploy the backend API to Render.com with proper environment variables. This is a **15-minute fix**.

---

## Prerequisites

Before starting, you need:

1. ✅ GitHub repository (already have it)
2. ✅ Vercel account with frontend deployed (already done)
3. ⚠️ Render.com account (create if needed - free)
4. ⚠️ MongoDB Atlas account (create if needed - free)
5. ⚠️ Two JWT secrets (generate in Step 1 below)

---

## Step-by-Step Fix

### Step 1: Generate JWT Secrets (1 minute)

Open terminal and run:

```bash
# Generate JWT Secret
openssl rand -hex 64

# Generate JWT Refresh Secret
openssl rand -hex 64
```

**Save both outputs** - you'll need them in Step 4.

---

### Step 2: Set Up MongoDB Atlas (5 minutes)

**Option A: If you already have MongoDB Atlas**
- Get your connection string
- Ensure Network Access allows `0.0.0.0/0`
- Skip to Step 3

**Option B: Create new MongoDB Atlas (first time)**

1. Go to https://cloud.mongodb.com
2. Sign up with Google/GitHub (fastest)
3. Create Organization → Create Project → Build Database
4. Choose **FREE** tier (M0 Sandbox - 512 MB)
5. Cloud Provider: AWS, Region: Singapore (ap-southeast-1)
6. Cluster Name: `medcore-cluster` (or any name)
7. Click "Create Cluster" (takes 3-5 minutes)

**Configure Database Access:**
1. Security → Database Access → Add New Database User
2. Username: `medcore-admin`
3. Password: Click "Autogenerate Secure Password" → Copy it
4. Database User Privileges: "Atlas admin"
5. Click "Add User"

**Configure Network Access:**
1. Security → Network Access → Add IP Address
2. Click "Allow Access from Anywhere"
3. IP Address: `0.0.0.0/0` (required for Render.com)
4. Click "Confirm"

**Get Connection String:**
1. Database → Connect → Drivers
2. Driver: Node.js, Version: 5.5 or later
3. Copy connection string:
   ```
   mongodb+srv://medcore-admin:<password>@medcore-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
4. Replace `<password>` with the password you copied earlier
5. Add database name `medcore-bd` before the `?`:
   ```
   mongodb+srv://medcore-admin:YOUR_PASSWORD@medcore-cluster.xxxxx.mongodb.net/medcore-bd?retryWrites=true&w=majority
   ```

**Save this connection string** - you'll need it in Step 4.

---

### Step 3: Create Render.com Web Service (2 minutes)

1. Go to https://render.com
2. Sign up with GitHub (fastest - auto-connects repos)
3. Dashboard → Click "New +" → "Web Service"
4. Connect your GitHub repository (authorize if needed)
5. Select your repository from the list

---

### Step 4: Configure Render Web Service (5 minutes)

**Basic Settings:**
- **Name**: `health-care-backend` (or `medcore-api`)
- **Region**: Singapore (closest to Bangladesh)
- **Branch**: `main`
- **Root Directory**: `health-care/backend`
- **Runtime**: Node
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Instance Type**: Starter ($7/month) or Free (with cold starts)

**Environment Variables:**

Click "Advanced" → "Add Environment Variable" and add these:

**CRITICAL (Required):**
```
NODE_ENV=production
PORT=5000
MONGODB_URI=<paste-your-mongodb-connection-string-from-step-2>
JWT_SECRET=<paste-first-secret-from-step-1>
JWT_REFRESH_SECRET=<paste-second-secret-from-step-1>
FRONTEND_URL=https://health-care-e-commerce-murex.vercel.app
CORS_ORIGIN=https://health-care-e-commerce-murex.vercel.app
BACKEND_URL=https://health-care-e-commerce.onrender.com
```

**RECOMMENDED (For full functionality):**
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
EMAIL_FROM=MedCore BD <noreply@medcorebd.com>
SMS_PROVIDER=mock
LOG_LEVEL=info
CLOUDINARY_CLOUD_NAME=dm8eqxwlz
```

**OPTIONAL (Can add later):**
```
SMTP_USER=<your-gmail>
SMTP_PASS=<your-gmail-app-password>
CLOUDINARY_API_KEY=<your-key>
CLOUDINARY_API_SECRET=<your-secret>
REDIS_HOST=<your-redis-host>
REDIS_PORT=6379
REDIS_PASSWORD=<your-redis-password>
```

**Important Notes:**
- Replace `<paste-...>` with actual values
- Don't include the `<>` brackets
- Make sure `MONGODB_URI` has no spaces
- Make sure `FRONTEND_URL` matches your Vercel URL exactly

Click "Create Web Service" → Wait for deployment (5-10 minutes)

---

### Step 5: Monitor Deployment (5 minutes)

**Watch the deployment logs:**
1. Render dashboard → Your service → Logs
2. Look for these success messages:
   ```
   ✓ MongoDB Connected: medcore-cluster.xxxxx.mongodb.net
   MedCore BD API v2.0 running on port 5000 [production]
   ```

**Common errors and fixes:**

| Error | Solution |
|-------|----------|
| "MongoDB Connection Error" | Check MongoDB URI, verify Network Access allows 0.0.0.0/0 |
| "JWT_SECRET is not defined" | Add JWT_SECRET to environment variables, redeploy |
| "Application failed to respond" | Check PORT=5000 is set, verify NODE_ENV=production |
| "Redis connection failed" | Ignore (non-critical) or add Redis credentials |

---

### Step 6: Verify Backend is Working (2 minutes)

Open these URLs in your browser:

**1. Health Check:**
```
https://health-care-e-commerce.onrender.com/api/health
```
Expected response:
```json
{
  "success": true,
  "status": "healthy",
  "message": "MedCore BD API is running",
  "version": "2.0.0"
}
```

**2. Stats Endpoint:**
```
https://health-care-e-commerce.onrender.com/api/stats
```
Expected response:
```json
{
  "success": true,
  "data": {
    "totalProducts": 0,
    "totalBrands": 0,
    "totalOrders": 0,
    "totalB2BClients": 0
  }
}
```

**3. Categories Endpoint:**
```
https://health-care-e-commerce.onrender.com/api/categories
```
Expected response:
```json
{
  "success": true,
  "data": []
}
```

**If any return 500 errors:**
- Check Render logs for specific error message
- Verify MongoDB connection string is correct
- Verify JWT secrets are set
- See troubleshooting section below

---

### Step 7: Test Frontend (1 minute)

1. Open: https://health-care-e-commerce-murex.vercel.app
2. Open browser console (F12 → Console tab)
3. Refresh the page
4. Check for errors:
   - ✅ No 500 errors = SUCCESS!
   - ❌ Still seeing 500 errors = Check troubleshooting below

**Expected behavior:**
- Homepage loads without errors
- Categories appear (if database has data)
- Products appear (if database has data)
- No CORS errors in console
- No 500 errors in Network tab

---

## Troubleshooting

### Backend won't start

**Error: "MongoDB Connection Error"**

1. Check MongoDB Atlas → Network Access → Verify `0.0.0.0/0` is allowed
2. Check connection string format (should have `medcore-bd` database name)
3. Test connection with MongoDB Compass:
   - Download: https://www.mongodb.com/try/download/compass
   - Paste connection string
   - Click "Connect"
   - If fails, credentials are wrong

**Error: "JWT_SECRET is not defined"**

1. Render dashboard → Your service → Environment
2. Verify `JWT_SECRET` and `JWT_REFRESH_SECRET` are set
3. Click "Manual Deploy" → "Deploy latest commit"

**Error: "Application failed to respond"**

1. Check Render logs for specific error
2. Verify `PORT=5000` is set
3. Verify `NODE_ENV=production` is set
4. Check for syntax errors in recent commits

---

### Frontend still shows 500 errors

**Error: "Failed to fetch" or "Network Error"**

1. Verify backend health endpoint returns 200 OK
2. Check backend URL in Vercel:
   - Vercel dashboard → Your project → Settings → Environment Variables
   - Verify `NEXT_PUBLIC_API_URL=https://health-care-e-commerce.onrender.com/api`
3. If URL is wrong, update and redeploy frontend

**Error: "blocked by CORS policy"**

1. Check backend logs for "CORS rejected origin"
2. Verify `FRONTEND_URL` and `CORS_ORIGIN` match Vercel URL exactly
3. Redeploy backend after fixing

---

### Database is empty

**Categories and products return empty arrays**

This is normal for a fresh deployment. Options:

**Option A: Seed database (recommended)**
```bash
# Run locally with production MongoDB URI
cd health-care/backend
# Add MONGODB_URI to .env file (use production URI)
npm run seed
```

**Option B: Add data via admin dashboard**
1. Create admin user via API or database
2. Login to admin dashboard
3. Add categories, manufacturers, products manually

**Option C: Import existing data**
1. Export from development database
2. Import to production database using MongoDB Compass

---

## Post-Deployment Checklist

After backend is deployed and working:

- [ ] Backend health endpoint returns 200 OK
- [ ] Frontend loads without 500 errors
- [ ] No CORS errors in browser console
- [ ] Database connection working
- [ ] Seed database with initial data (if needed)
- [ ] Test user registration
- [ ] Test user login
- [ ] Test product search
- [ ] Test cart functionality
- [ ] Test order creation
- [ ] Set up monitoring (UptimeRobot, Pingdom)
- [ ] Configure email (Gmail SMTP or SendGrid)
- [ ] Configure payment gateways (bKash, Nagad)
- [ ] Enable Redis caching (Upstash or Redis Cloud)
- [ ] Set up error tracking (Sentry)
- [ ] Configure custom domain (optional)

---

## Next Steps

### Immediate (Today)
1. ✅ Deploy backend to Render.com
2. ✅ Verify all endpoints work
3. ✅ Test frontend functionality
4. ⚠️ Seed database with initial data

### Short-term (This Week)
1. Set up monitoring (UptimeRobot - free)
2. Configure email notifications (Gmail SMTP)
3. Enable Redis caching (Upstash - free tier)
4. Set up error tracking (Sentry - free tier)
5. Test all features end-to-end

### Medium-term (This Month)
1. Configure payment gateways (bKash, Nagad)
2. Set up custom domain
3. Enable SSL certificates
4. Configure CDN (Cloudflare)
5. Set up automated backups (MongoDB Atlas)

---

## Cost Breakdown

**Free Tier (Total: $0/month)**
- MongoDB Atlas M0: Free (512 MB)
- Render Free: Free (with cold starts)
- Vercel Hobby: Free (100 GB bandwidth)
- Upstash Redis: Free (10,000 commands/day)
- Sentry: Free (5,000 errors/month)

**Recommended Tier (Total: $7/month)**
- MongoDB Atlas M0: Free (512 MB)
- Render Starter: $7/month (no cold starts)
- Vercel Hobby: Free (100 GB bandwidth)
- Upstash Redis: Free (10,000 commands/day)
- Sentry: Free (5,000 errors/month)

**Production Tier (Total: $32/month)**
- MongoDB Atlas M10: $10/month (2 GB)
- Render Standard: $15/month (2 GB RAM)
- Vercel Pro: $20/month (1 TB bandwidth)
- Upstash Redis: Free (10,000 commands/day)
- Sentry: Free (5,000 errors/month)

---

## Support Resources

- **Render Documentation**: https://render.com/docs
- **MongoDB Atlas Docs**: https://docs.atlas.mongodb.com
- **Vercel Documentation**: https://vercel.com/docs
- **Backend API Docs**: https://health-care-e-commerce.onrender.com/api-docs (after deployment)

---

## Summary

**Time Required**: 15 minutes
**Difficulty**: Easy
**Cost**: Free or $7/month
**Impact**: Fixes production site completely

**What you're doing:**
1. Generate JWT secrets (1 min)
2. Set up MongoDB Atlas (5 min)
3. Deploy backend to Render.com (5 min)
4. Verify deployment (2 min)
5. Test frontend (1 min)

**Result**: Production site fully functional with no 500 errors

---

**Last Updated**: June 1, 2026
**Status**: Ready to deploy
**Priority**: 🔴 CRITICAL
