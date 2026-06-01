# Production Deployment Checklist

## 🚨 Current Issue
Frontend is deployed but backend is NOT deployed, causing 500 errors on all API calls.

## ✅ Quick Fix Steps

### 1. Deploy Backend to Render (15 minutes)

- [ ] Go to https://render.com and sign up/login
- [ ] Click "New +" → "Web Service"
- [ ] Connect GitHub repository
- [ ] Configure service:
  - Root Directory: `health-care/backend`
  - Build Command: `npm install`
  - Start Command: `npm start`
  - Region: Singapore
- [ ] Set environment variables (see below)
- [ ] Click "Create Web Service"
- [ ] Wait for deployment (5-10 minutes)
- [ ] Copy the deployed URL (e.g., `https://health-care-backend.onrender.com`)

### 2. Update Vercel Environment Variables (2 minutes)

- [ ] Go to https://vercel.com/dashboard
- [ ] Select your project
- [ ] Settings → Environment Variables
- [ ] Update `NEXT_PUBLIC_API_URL` to your Render backend URL + `/api`
  - Example: `https://health-care-backend.onrender.com/api`
- [ ] Save changes
- [ ] Redeploy: Deployments → Latest → "..." → "Redeploy"

### 3. Verify Everything Works (2 minutes)

- [ ] Test backend health: `https://your-backend.onrender.com/api/health`
- [ ] Test categories API: `https://your-backend.onrender.com/api/categories`
- [ ] Visit frontend: `https://health-care-e-commerce-murex.vercel.app`
- [ ] Verify products load without errors

---

## 📋 Required Environment Variables for Render

### Minimum to Get Started (Must Have)

```bash
NODE_ENV=production
PORT=5000
FRONTEND_URL=https://health-care-e-commerce-murex.vercel.app
CORS_ORIGINS=https://health-care-e-commerce-murex.vercel.app

# Database - Get from MongoDB Atlas (free tier)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/medcore

# Security - Generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=<generate-64-char-random-string>
JWT_REFRESH_SECRET=<generate-64-char-random-string>

# Images - Get from Cloudinary dashboard
CLOUDINARY_CLOUD_NAME=dm8eqxwlz
CLOUDINARY_API_KEY=<your-api-key>
CLOUDINARY_API_SECRET=<your-api-secret>

# Email - Use Gmail app password
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=<your-email@gmail.com>
SMTP_PASS=<gmail-app-password>
EMAIL_FROM=noreply@medcorebd.com
EMAIL_FROM_NAME=MedCore BD

# Google OAuth - Get from Google Cloud Console
GOOGLE_CLIENT_ID=<your-client-id>
GOOGLE_CLIENT_SECRET=<your-client-secret>
```

### Optional (Can Add Later)

```bash
# Redis caching (recommended for production)
REDIS_HOST=<redis-cloud-host>
REDIS_PORT=6379
REDIS_PASSWORD=<redis-password>

# Payment gateway
STRIPE_SECRET_KEY=<stripe-secret>

# SMS service
SMS_API_KEY=<sms-api-key>
```

---

## 🔑 How to Get Credentials (Quick Links)

| Service | URL | What You Need |
|---------|-----|---------------|
| **MongoDB Atlas** | https://www.mongodb.com/cloud/atlas | Free M0 cluster → Connection string |
| **Cloudinary** | https://cloudinary.com/console | API Key + API Secret from dashboard |
| **Gmail App Password** | https://myaccount.google.com/apppasswords | Enable 2FA → Generate app password |
| **Google OAuth** | https://console.cloud.google.com/apis/credentials | Create OAuth 2.0 Client ID |
| **Redis Cloud** | https://redis.com/try-free/ | Free database → Connection details |
| **Generate JWT Secrets** | Terminal | `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"` |

---

## 🎯 Expected Results

### Before Deployment
❌ Frontend: 500 errors on all API calls
❌ Backend: Not deployed

### After Deployment
✅ Frontend: Loads correctly with products
✅ Backend: Responds to API calls
✅ Health check: Returns `{"status":"healthy"}`
✅ Products page: Shows product listings
✅ Categories: Load correctly

---

## 🐛 Common Issues & Fixes

### Issue: "MongoDB connection failed"
**Fix**: Check MONGODB_URI format and IP whitelist (use `0.0.0.0/0`)

### Issue: "CORS error"
**Fix**: Verify CORS_ORIGINS matches your Vercel URL exactly

### Issue: "Frontend still shows 500 errors"
**Fix**: 
1. Verify backend health endpoint works
2. Check NEXT_PUBLIC_API_URL in Vercel
3. Redeploy frontend after changing env vars

### Issue: "Images not uploading"
**Fix**: Verify Cloudinary credentials and cloud name match

---

## 📊 Deployment Timeline

| Step | Time | Status |
|------|------|--------|
| Create Render account | 2 min | ⏳ Pending |
| Configure web service | 3 min | ⏳ Pending |
| Set environment variables | 5 min | ⏳ Pending |
| Deploy backend | 5-10 min | ⏳ Pending |
| Update Vercel env vars | 2 min | ⏳ Pending |
| Redeploy frontend | 2 min | ⏳ Pending |
| Test & verify | 2 min | ⏳ Pending |
| **Total** | **~20 min** | |

---

## 💰 Cost

- **Render Free Tier**: $0/month (sleeps after 15 min inactivity)
- **Render Starter**: $7/month (always on, recommended)
- **MongoDB Atlas M0**: $0/month (free forever)
- **Cloudinary Free**: $0/month (25 credits)
- **Vercel Hobby**: $0/month (already deployed)

**Recommended**: $7/month for production-ready setup

---

## 📞 Need Help?

1. Check `PRODUCTION-DEPLOYMENT-GUIDE.md` for detailed instructions
2. Review Render deployment logs for errors
3. Test backend endpoints directly before testing frontend
4. Verify all environment variables are set correctly

---

**Last Updated**: June 1, 2026
**Next Action**: Deploy backend to Render.com
