# Quick Deployment Checklist — Fix Production 500 Errors

## Problem
Frontend on Vercel is getting 500 errors because backend API is not responding.

## Solution
Deploy backend to Render.com with proper environment variables.

---

## 🚀 Quick Start (15 minutes)

### 1. Generate JWT Secrets (2 minutes)

Run these commands locally to generate secure secrets:

```bash
# JWT Secret
openssl rand -hex 64

# JWT Refresh Secret
openssl rand -hex 64
```

Copy both outputs - you'll need them in Step 3.

---

### 2. Set Up MongoDB Atlas (5 minutes)

**If you already have MongoDB Atlas:**
- Skip to Step 3

**If you need to create MongoDB Atlas:**

1. Go to https://cloud.mongodb.com
2. Sign up / Login
3. Create a **FREE** cluster (M0 Sandbox)
4. **Database Access** → Add Database User:
   - Username: `medcore-admin`
   - Password: (generate strong password)
   - Role: `Atlas admin` or `Read and write to any database`
5. **Network Access** → Add IP Address:
   - Click "Allow Access from Anywhere"
   - IP: `0.0.0.0/0` (required for Render.com)
6. **Connect** → Drivers → Copy connection string:
   ```
   mongodb+srv://medcore-admin:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
7. Replace `<password>` with your database user password
8. Add database name: `medcore-bd` before the `?`
   ```
   mongodb+srv://medcore-admin:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/medcore-bd?retryWrites=true&w=majority
   ```

---

### 3. Deploy Backend to Render.com (8 minutes)

1. **Go to https://render.com** → Sign up / Login

2. **New Web Service**:
   - Click **"New +"** → **"Web Service"**
   - Connect GitHub repository
   - Select your repository

3. **Configure Service**:
   - **Name**: `health-care-backend`
   - **Region**: Singapore
   - **Branch**: `main`
   - **Root Directory**: `health-care/backend`
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Starter ($7/month) or Free

4. **Add Environment Variables** (click "Advanced" → "Add Environment Variable"):

   **Copy-paste these (replace values in `<brackets>`):**

   ```
   NODE_ENV=production
   PORT=5000
   MONGODB_URI=<your-mongodb-atlas-connection-string>
   JWT_SECRET=<generated-secret-from-step-1>
   JWT_REFRESH_SECRET=<generated-secret-from-step-1>
   FRONTEND_URL=https://health-care-e-commerce-murex.vercel.app
   CORS_ORIGIN=https://health-care-e-commerce-murex.vercel.app
   BACKEND_URL=https://health-care-e-commerce.onrender.com
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   EMAIL_FROM=MedCore BD <noreply@medcorebd.com>
   SMS_PROVIDER=mock
   LOG_LEVEL=info
   ```

   **Optional (can add later):**
   ```
   CLOUDINARY_CLOUD_NAME=dm8eqxwlz
   CLOUDINARY_API_KEY=<your-key>
   CLOUDINARY_API_SECRET=<your-secret>
   REDIS_HOST=<your-redis-host>
   REDIS_PORT=6379
   REDIS_PASSWORD=<your-redis-password>
   ```

5. **Create Web Service** → Wait for deployment (5-10 minutes)

---

### 4. Verify Deployment (2 minutes)

Open these URLs in your browser:

1. **Health Check**: https://health-care-e-commerce.onrender.com/api/health
   - Should return: `{"success": true, "status": "healthy"}`

2. **Stats**: https://health-care-e-commerce.onrender.com/api/stats
   - Should return: `{"success": true, "data": {...}}`

3. **Categories**: https://health-care-e-commerce.onrender.com/api/categories
   - Should return: `{"success": true, "data": [...]}`

**If any return 500 errors:**
- Check Render logs: Dashboard → Your service → Logs
- Verify MongoDB connection string is correct
- Verify JWT secrets are set
- See troubleshooting section below

---

### 5. Test Frontend (1 minute)

1. Open: https://health-care-e-commerce-murex.vercel.app
2. Check browser console (F12) - should see NO 500 errors
3. Homepage should load products and categories
4. Try searching for products
5. Try adding to cart

**Success!** 🎉 Your site is now live!

---

## 🔧 Troubleshooting

### Backend won't start

**Check Render logs for:**

1. **"MongoDB Connection Error"**
   - Verify MongoDB Atlas Network Access allows `0.0.0.0/0`
   - Check connection string format
   - Test connection with MongoDB Compass

2. **"JWT_SECRET is not defined"**
   - Add `JWT_SECRET` and `JWT_REFRESH_SECRET` to Render environment variables
   - Redeploy

3. **"Application failed to respond"**
   - Check `PORT=5000` is set
   - Verify `NODE_ENV=production` is set
   - Check for syntax errors in recent commits

### CORS errors in browser

**Browser console shows: "blocked by CORS policy"**

1. Verify `FRONTEND_URL` matches Vercel URL exactly
2. Verify `CORS_ORIGIN` matches Vercel URL exactly
3. Check backend logs for "CORS rejected origin" messages
4. Redeploy backend after fixing

### Some endpoints work, others don't

**Categories work but products return 500**

1. Check Render logs for specific error
2. Likely missing data in database
3. Run seed script: SSH into Render or run locally then sync

### Redis connection failed (non-critical)

**Backend logs: "Redis connection failed. Continuing without cache."**

- This is OK - backend uses in-memory cache
- To fix: Add Redis credentials from Upstash or Redis Cloud
- Or ignore - site will work without Redis (just slower)

---

## 📊 Post-Deployment Monitoring

### Set Up Uptime Monitoring (Optional)

Use **UptimeRobot** (free) or **Pingdom**:
- Monitor: `https://health-care-e-commerce.onrender.com/api/health`
- Alert if down for > 5 minutes

### Check Logs Regularly

- **Backend**: Render dashboard → Logs
- **Frontend**: Vercel dashboard → Function Logs
- **Errors**: Sentry dashboard (if configured)

### Performance Metrics

- **Backend**: https://health-care-e-commerce.onrender.com/api/monitoring/metrics
- **Frontend**: Run `npm run lighthouse` locally

---

## 🔐 Security Notes

- ✅ JWT secrets are 64+ characters (generated with openssl)
- ✅ HTTPS enabled on both frontend and backend
- ✅ CORS restricted to Vercel domain
- ✅ Rate limiting enabled (100 req/15min)
- ✅ Helmet security headers enabled
- ⚠️ MongoDB allows all IPs (required for Render) - consider VPC peering later
- ⚠️ Environment variables not in Git (verified)

---

## 📝 What's Next?

After backend is deployed and working:

1. **Seed Database** (if empty):
   ```bash
   # Run locally with production MongoDB URI
   cd health-care/backend
   npm run seed
   ```

2. **Configure Payment Gateways**:
   - bKash: Get credentials from https://developer.bka.sh
   - Nagad: Get credentials from Nagad merchant portal
   - SSL Commerz: Get credentials from https://sslcommerz.com

3. **Set Up Email**:
   - Gmail: Create App Password at https://myaccount.google.com
   - Or use SendGrid: https://sendgrid.com (free 100 emails/day)

4. **Enable Redis Caching**:
   - Upstash: https://upstash.com (free tier)
   - Or Redis Cloud: https://redis.com (free 30 MB)

5. **Set Up Error Tracking**:
   - Sentry: https://sentry.io (free tier)
   - Add `SENTRY_DSN` to Render environment variables

6. **Custom Domain** (Optional):
   - Buy domain from Namecheap or GoDaddy
   - Configure DNS in Vercel and Render
   - Enable SSL certificates

---

## 🆘 Need Help?

**Backend not deploying?**
- Check Render logs for specific error
- Verify all required environment variables are set
- Test MongoDB connection with MongoDB Compass

**Frontend still showing 500 errors?**
- Verify backend health endpoint returns 200 OK
- Check browser console for CORS errors
- Verify `NEXT_PUBLIC_API_URL` in Vercel matches backend URL

**Database empty?**
- Run seed script: `npm run seed` in backend directory
- Or manually add products via admin dashboard

---

**Last Updated**: June 1, 2026
**Estimated Time**: 15 minutes
**Difficulty**: Easy
**Cost**: Free (MongoDB Atlas M0 + Render Free) or $7/month (Render Starter)
