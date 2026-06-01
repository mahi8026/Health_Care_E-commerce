# Production Deployment Guide — MedCore BD

## Current Status

**Frontend**: ✅ Deployed on Vercel
- URL: https://health-care-e-commerce-murex.vercel.app
- Status: Running but getting 500 errors from backend API calls

**Backend**: ❌ Not deployed or misconfigured on Render.com
- Expected URL: https://health-care-e-commerce.onrender.com/api
- Status: Not responding (500 Internal Server Error)

## Issue Summary

The frontend is successfully deployed on Vercel and attempting to call the backend API at `https://health-care-e-commerce.onrender.com/api`, but the backend is either:
1. Not deployed yet on Render.com
2. Deployed but crashed/not running
3. Missing critical environment variables (MongoDB URI, JWT secrets)
4. Database connection failing

## Backend Deployment Steps (Render.com)

### Step 1: Create Render.com Account & Service

1. Go to https://render.com and sign up/login
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Configure the service:
   - **Name**: `health-care-backend` (or `medcore-bd-api`)
   - **Region**: Singapore (closest to Bangladesh)
   - **Branch**: `main`
   - **Root Directory**: `health-care/backend`
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Starter ($7/month) or Free (with limitations)

### Step 2: Configure Environment Variables

In Render.com dashboard, add these environment variables:

#### ✅ CRITICAL (Required for server to start)

```bash
NODE_ENV=production
PORT=5000

# MongoDB Atlas (REQUIRED)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/medcore-bd?retryWrites=true&w=majority

# JWT Secrets (REQUIRED - generate with: openssl rand -hex 64)
JWT_SECRET=<generate-64-char-secret>
JWT_REFRESH_SECRET=<generate-64-char-secret>

# CORS & Frontend URLs (REQUIRED)
FRONTEND_URL=https://health-care-e-commerce-murex.vercel.app
CORS_ORIGIN=https://health-care-e-commerce-murex.vercel.app
BACKEND_URL=https://health-care-e-commerce.onrender.com
```

#### ⚠️ RECOMMENDED (For full functionality)

```bash
# Redis Cache (Upstash or Redis Cloud)
REDIS_HOST=<your-redis-host>
REDIS_PORT=6379
REDIS_PASSWORD=<your-redis-password>
REDIS_DB=0
REDIS_TTL=3600

# Cloudinary (Image uploads)
CLOUDINARY_CLOUD_NAME=dm8eqxwlz
CLOUDINARY_API_KEY=<your-api-key>
CLOUDINARY_API_SECRET=<your-api-secret>

# Email (Gmail SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=<your-email@gmail.com>
SMTP_PASS=<your-app-password>
SMTP_FROM=MedCore BD <noreply@medcorebd.com>
ADMIN_EMAIL=admin@medcorebd.com

# Google OAuth (Optional)
GOOGLE_CLIENT_ID=<your-client-id>
GOOGLE_CLIENT_SECRET=<your-client-secret>

# SMS (Optional - use 'mock' for now)
SMS_PROVIDER=mock
ADMIN_PHONE=+8801XXXXXXXXX

# Error Tracking (Sentry - Optional)
SENTRY_DSN=<your-sentry-dsn>
SENTRY_ENVIRONMENT=production
SENTRY_TRACES_SAMPLE_RATE=0.1
```

#### ❌ OPTIONAL (Can be added later)

```bash
# Payment Gateways
BKASH_APP_KEY=
BKASH_APP_SECRET=
BKASH_USERNAME=
BKASH_PASSWORD=
BKASH_BASE_URL=https://tokenized.pay.bka.sh/v1.2.0-beta

NAGAD_MERCHANT_ID=
NAGAD_MERCHANT_KEY=

SSLCOMMERZ_STORE_ID=
SSLCOMMERZ_STORE_PASSWORD=

# WhatsApp Business API
WHATSAPP_PROVIDER=mock
WHATSAPP_BUSINESS_PHONE=8801XXXXXXXXX
```

### Step 3: Set Up MongoDB Atlas (If Not Already Done)

1. Go to https://cloud.mongodb.com
2. Create a free cluster (M0 Sandbox - 512 MB storage)
3. **Database Access**: Create a database user with read/write permissions
4. **Network Access**: Add `0.0.0.0/0` to allow connections from anywhere (Render uses dynamic IPs)
5. **Connect**: Get connection string and replace `<password>` with your database user password
6. Copy the connection string to `MONGODB_URI` in Render

Example:
```
mongodb+srv://medcore-admin:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/medcore-bd?retryWrites=true&w=majority
```

### Step 4: Set Up Redis Cache (Optional but Recommended)

**Option A: Upstash (Recommended - Free tier available)**
1. Go to https://upstash.com
2. Create a Redis database
3. Copy connection details to Render environment variables

**Option B: Redis Cloud**
1. Go to https://redis.com/try-free
2. Create a free database (30 MB)
3. Copy connection details to Render environment variables

**Option C: Skip Redis (Use in-memory fallback)**
- Leave `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD` empty
- Backend will use in-memory cache (not recommended for production)

### Step 5: Deploy Backend

1. Click **"Create Web Service"** in Render
2. Wait for deployment to complete (5-10 minutes)
3. Check deployment logs for errors
4. Verify health endpoint: `https://health-care-e-commerce.onrender.com/api/health`

Expected response:
```json
{
  "success": true,
  "status": "healthy",
  "message": "MedCore BD API is running",
  "version": "2.0.0",
  "services": {
    "api": "operational",
    "database": {
      "status": "connected",
      "connected": true
    },
    "redis": {
      "status": "connected"
    }
  }
}
```

### Step 6: Verify Backend Endpoints

Test these endpoints in your browser or Postman:

1. **Health Check**: https://health-care-e-commerce.onrender.com/api/health
2. **Stats**: https://health-care-e-commerce.onrender.com/api/stats
3. **Categories**: https://health-care-e-commerce.onrender.com/api/categories
4. **Products**: https://health-care-e-commerce.onrender.com/api/products?page=1&limit=10

All should return JSON responses (not 500 errors).

### Step 7: Update Frontend Environment Variables (If Needed)

If you change the backend URL, update Vercel environment variables:

1. Go to Vercel dashboard → Your project → Settings → Environment Variables
2. Update `NEXT_PUBLIC_API_URL` if backend URL changed
3. Redeploy frontend

## Common Deployment Issues & Solutions

### Issue 1: Backend crashes on startup

**Symptoms**: Render logs show "Application failed to respond"

**Solutions**:
- Check `MONGODB_URI` is correct and database user has permissions
- Verify MongoDB Atlas Network Access allows `0.0.0.0/0`
- Check `JWT_SECRET` and `JWT_REFRESH_SECRET` are set
- Review Render logs for specific error messages

### Issue 2: CORS errors in browser console

**Symptoms**: Frontend shows CORS policy errors

**Solutions**:
- Verify `FRONTEND_URL` and `CORS_ORIGIN` match your Vercel URL exactly
- Check backend logs for "CORS rejected origin" messages
- Ensure Vercel preview URLs are allowed (backend allows `*.vercel.app`)

### Issue 3: Database connection timeout

**Symptoms**: Backend logs show "MongoDB Connection Error"

**Solutions**:
- Verify MongoDB Atlas Network Access allows `0.0.0.0/0`
- Check connection string format and credentials
- Ensure database user has read/write permissions
- Try connecting from MongoDB Compass to verify credentials

### Issue 4: Redis connection failed

**Symptoms**: Backend logs show "Redis connection failed"

**Solutions**:
- This is non-critical - backend will use in-memory cache
- Verify Redis credentials if you want caching
- Or leave Redis variables empty to skip Redis

### Issue 5: 500 errors on specific endpoints

**Symptoms**: Some endpoints work, others return 500

**Solutions**:
- Check Render logs for specific error messages
- Verify all required environment variables are set
- Check if database has required collections/data
- Run database seed script if needed: `npm run seed`

## Post-Deployment Checklist

- [ ] Backend health endpoint returns 200 OK
- [ ] Frontend can fetch categories (no 500 errors)
- [ ] Frontend can fetch products (no 500 errors)
- [ ] User registration works
- [ ] User login works
- [ ] Product search works
- [ ] Cart functionality works
- [ ] Order creation works (test mode)
- [ ] Admin dashboard accessible
- [ ] Image uploads work (Cloudinary)
- [ ] Email notifications work (if SMTP configured)
- [ ] Redis cache working (check backend logs)
- [ ] No CORS errors in browser console
- [ ] SSL/HTTPS working on both frontend and backend
- [ ] Google Analytics tracking (check GA4 dashboard)
- [ ] Sentry error tracking (check Sentry dashboard)

## Monitoring & Maintenance

### Health Checks

Set up monitoring for these endpoints:
- Backend health: `https://health-care-e-commerce.onrender.com/api/health`
- Frontend: `https://health-care-e-commerce-murex.vercel.app`

### Logs

- **Backend logs**: Render dashboard → Your service → Logs
- **Frontend logs**: Vercel dashboard → Your project → Deployments → View Function Logs
- **Error tracking**: Sentry dashboard (if configured)

### Performance Monitoring

- **Backend metrics**: `https://health-care-e-commerce.onrender.com/api/monitoring/metrics`
- **Lighthouse CI**: Run `npm run lighthouse` in frontend directory
- **Google Analytics**: Check GA4 dashboard for user metrics

## Security Checklist

- [ ] JWT secrets are strong (64+ characters)
- [ ] MongoDB user has minimal required permissions
- [ ] MongoDB Network Access restricted (or use VPC peering)
- [ ] CORS_ORIGIN set to exact frontend URL
- [ ] HTTPS enabled on both frontend and backend
- [ ] Environment variables not committed to Git
- [ ] Cloudinary upload preset is unsigned (or signed with backend validation)
- [ ] Rate limiting enabled (100 req/15min per IP)
- [ ] Helmet security headers enabled
- [ ] XSS and SQL injection protection enabled

## Rollback Plan

If deployment fails:

1. **Revert Git commit**: `git revert HEAD` and push
2. **Redeploy previous version**: Render → Deployments → Redeploy previous
3. **Check environment variables**: Verify all required variables are set
4. **Review logs**: Check Render logs for specific errors
5. **Test locally**: Run `npm run dev` in backend to reproduce issue

## Support Resources

- **Render Documentation**: https://render.com/docs
- **MongoDB Atlas**: https://docs.atlas.mongodb.com
- **Vercel Documentation**: https://vercel.com/docs
- **Next.js Documentation**: https://nextjs.org/docs
- **Express.js Documentation**: https://expressjs.com

## Next Steps

1. **Deploy backend to Render.com** following steps above
2. **Verify all endpoints** return proper responses
3. **Test frontend** to ensure no more 500 errors
4. **Set up monitoring** (Sentry, Uptime Robot, etc.)
5. **Configure payment gateways** (bKash, Nagad, SSL Commerz)
6. **Set up email notifications** (Gmail SMTP or SendGrid)
7. **Enable Redis caching** for better performance
8. **Run database seed** if needed: `npm run seed`
9. **Test all features** end-to-end
10. **Set up custom domain** (optional)

---

**Last Updated**: June 1, 2026
**Status**: Backend deployment pending
**Priority**: HIGH - Production site is down
