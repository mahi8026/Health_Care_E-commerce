# 🚀 Complete Deployment Guide - MedCore BD

## 📋 Table of Contents
1. [Prerequisites](#prerequisites)
2. [GitHub Setup](#github-setup)
3. [Backend Deployment (Render)](#backend-deployment-render)
4. [Frontend Deployment (Vercel)](#frontend-deployment-vercel)
5. [Environment Variables](#environment-variables)
6. [Post-Deployment Verification](#post-deployment-verification)
7. [Troubleshooting](#troubleshooting)

---

## ✅ Prerequisites

Before deploying, ensure you have:
- [x] GitHub account with repository access
- [x] Vercel account (sign up at https://vercel.com)
- [x] Render account (sign up at https://render.com)
- [x] MongoDB Atlas database (already configured)
- [x] Redis Cloud instance (already configured)
- [x] Cloudinary account (already configured)
- [x] Stripe account (already configured)
- [x] Google OAuth credentials (already configured)

---

## 🔧 GitHub Setup

### Step 1: Verify Repository
Your repository is already set up at:
```
https://github.com/mahi8026/Health_Care_E-commerce.git
```

### Step 2: Configure GitHub Secrets
Go to: `https://github.com/mahi8026/Health_Care_E-commerce/settings/secrets/actions`

Add the following secrets:

#### Vercel Secrets
```
VERCEL_TOKEN=<your-vercel-token>
VERCEL_ORG_ID=<your-vercel-org-id>
VERCEL_PROJECT_ID=<your-vercel-project-id>
```

#### Frontend Environment Variables
```
NEXT_PUBLIC_API_URL=https://health-care-e-commerce.onrender.com/api
NEXT_PUBLIC_SITE_URL=https://health-care-e-commerce-murex.vercel.app
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51TP5b9CMsCu3AGhEV6JBixF9RGlrSWkw9NlEWuTcgq4PDDbcogpB6HbEt2oGAO6OLafP8KPrZKjekSqEGT6v3KWW00VYiImXJB
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=dm8eqxwlz
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=ml_default
NEXT_PUBLIC_GA4_MEASUREMENT_ID=G-VCQNJESVNM
```

### Step 3: Get Vercel Credentials

1. **Get Vercel Token:**
   - Go to https://vercel.com/account/tokens
   - Click "Create Token"
   - Name it "GitHub Actions"
   - Copy the token and add to GitHub secrets as `VERCEL_TOKEN`

2. **Get Vercel Org ID:**
   - Go to https://vercel.com/account
   - Copy your Team/User ID
   - Add to GitHub secrets as `VERCEL_ORG_ID`

3. **Get Vercel Project ID:**
   - After creating project on Vercel (see below)
   - Go to Project Settings → General
   - Copy Project ID
   - Add to GitHub secrets as `VERCEL_PROJECT_ID`

---

## 🖥️ Backend Deployment (Render)

### Step 1: Create New Web Service

1. Go to https://dashboard.render.com
2. Click "New +" → "Web Service"
3. Connect your GitHub repository: `mahi8026/Health_Care_E-commerce`

### Step 2: Configure Service

**Basic Settings:**
```
Name: health-care-backend
Region: Singapore (or closest to your users)
Branch: main
Root Directory: health-care/backend
Runtime: Node
Build Command: npm install
Start Command: npm start
```

**Instance Type:**
- Free tier (for testing)
- Starter ($7/month) - Recommended for production

### Step 3: Add Environment Variables

In Render Dashboard → Environment → Add Environment Variables:

```bash
# Environment
NODE_ENV=production
PORT=5000

# URLs
FRONTEND_URL=https://health-care-e-commerce-murex.vercel.app
BACKEND_URL=https://health-care-e-commerce.onrender.com

# Database
MONGODB_URI=mongodb+srv://Health_Care_E-commerce:ibQkT9ppTdivDtXt@cluster0.rqyzhey.mongodb.net/medcore-bd?retryWrites=true&w=majority&appName=Cluster0

# JWT Secrets
JWT_SECRET=f22c149106748947deef9b0990564b4778aeb219a60e8cbde8b5d5b924e19dab5e4db8384ac822b0050792b57b618908f8b33f43f4dc6a14bd575cdbff4e29e0
JWT_REFRESH_SECRET=289383302baf1b90e7afde7b2f667fc99db3f20c83f6126e8ff2161312248c99193c3022ee30e30c0c0aa6abce291bbc4e3085ed029aec96e148bbe6e1ed081f

# Google OAuth
GOOGLE_CLIENT_ID=423878511800-qmtst4hibgsrf8e6gjcle1e7bqgsncgo.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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

# Email Configuration (Update with your SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-specific-password
EMAIL_FROM=noreply@medcorebd.com
EMAIL_FROM_NAME=MedCore BD

# CORS
CORS_ORIGINS=https://health-care-e-commerce-murex.vercel.app

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# File Upload
MAX_FILE_SIZE=5242880

# Logging
LOG_LEVEL=info

# Stripe
STRIPE_SECRET_KEY=sk_test_51TP5b9CMsCu3AGhEsL2UkhfNLUWZcavE0pAyGhQ3WGIUFkWlP18w1PeJAKPIsci3W5gakbmbNQm98AoZ5bgYsVSU00cq2s59iY
STRIPE_PUBLISHABLE_KEY=pk_test_51TP5b9CMsCu3AGhEV6JBixF9RGlrSWkw9NlEWuTcgq4PDDbcogpB6HbEt2oGAO6OLafP8KPrZKjekSqEGT6v3KWW00VYiImXJB
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# SMS Service
SMS_PROVIDER=ssl_wireless
SMS_API_KEY=
SMS_API_URL=https://smsplus.sslwireless.com/api/v3/send-sms
SMS_SENDER_ID=MedCoreBD
ADMIN_PHONE=+8801646886795

# Cloudinary
CLOUDINARY_CLOUD_NAME=dm8eqxwlz
CLOUDINARY_API_KEY=397344892624316
CLOUDINARY_API_SECRET=TPAt1OgyLGu3vHBwPIRmt0jgbr8

# Redis
REDIS_HOST=redis-19674.c264.ap-south-1-1.ec2.cloud.redislabs.com
REDIS_PORT=19674
REDIS_PASSWORD=Q0FxsMrbzG4foYdOWeATbxfeRF9Gn5b3
REDIS_DB=0
REDIS_TTL=3600
```

### Step 4: Deploy

1. Click "Create Web Service"
2. Wait for deployment (5-10 minutes)
3. Your backend will be available at: `https://health-care-e-commerce.onrender.com`

### Step 5: Configure Health Check

In Render Dashboard → Settings:
```
Health Check Path: /api/health
```

---

## 🌐 Frontend Deployment (Vercel)

### Step 1: Install Vercel CLI (Optional)

```bash
npm install -g vercel
```

### Step 2: Deploy via Vercel Dashboard

1. Go to https://vercel.com/new
2. Import your GitHub repository: `mahi8026/Health_Care_E-commerce`
3. Configure project:

```
Framework Preset: Next.js
Root Directory: health-care
Build Command: npm run build
Output Directory: .next
Install Command: npm install
```

### Step 3: Add Environment Variables

In Vercel Dashboard → Settings → Environment Variables:

**Production Environment:**
```bash
# API Configuration
NEXT_PUBLIC_API_URL=https://health-care-e-commerce.onrender.com/api

# Site Configuration
NEXT_PUBLIC_SITE_URL=https://health-care-e-commerce-murex.vercel.app
NEXT_PUBLIC_SITE_NAME=MedCore BD
NEXT_PUBLIC_APP_NAME=MedCore BD

# Google Analytics
NEXT_PUBLIC_GA4_MEASUREMENT_ID=G-VCQNJESVNM

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51TP5b9CMsCu3AGhEV6JBixF9RGlrSWkw9NlEWuTcgq4PDDbcogpB6HbEt2oGAO6OLafP8KPrZKjekSqEGT6v3KWW00VYiImXJB

# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=dm8eqxwlz
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=ml_default

# Feature Flags
NEXT_PUBLIC_ENABLE_STRIPE=true
NEXT_PUBLIC_ENABLE_BKASH=true
NEXT_PUBLIC_ENABLE_NAGAD=true
NEXT_PUBLIC_ENABLE_B2B_CREDIT=true
NEXT_PUBLIC_ENABLE_ANALYTICS=true

# WhatsApp
NEXT_PUBLIC_WHATSAPP_NUMBER=8801646886795

# Build Configuration
NODE_ENV=production
HUSKY=0
```

### Step 4: Deploy

1. Click "Deploy"
2. Wait for deployment (3-5 minutes)
3. Your frontend will be available at: `https://health-care-e-commerce-murex.vercel.app`

### Step 5: Configure Custom Domain (Optional)

1. Go to Vercel Dashboard → Settings → Domains
2. Add your custom domain
3. Update DNS records as instructed
4. Update environment variables with new domain

---

## 🔐 Environment Variables Checklist

### Backend (Render)
- [x] NODE_ENV
- [x] PORT
- [x] FRONTEND_URL
- [x] BACKEND_URL
- [x] MONGODB_URI
- [x] JWT_SECRET
- [x] JWT_REFRESH_SECRET
- [x] GOOGLE_CLIENT_ID
- [x] GOOGLE_CLIENT_SECRET
- [ ] SMTP_USER (Update with your email)
- [ ] SMTP_PASS (Update with app password)
- [x] STRIPE_SECRET_KEY
- [x] CLOUDINARY_API_SECRET
- [x] REDIS_PASSWORD

### Frontend (Vercel)
- [x] NEXT_PUBLIC_API_URL
- [x] NEXT_PUBLIC_SITE_URL
- [x] NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
- [x] NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
- [x] NEXT_PUBLIC_GA4_MEASUREMENT_ID
- [x] HUSKY=0

---

## ✅ Post-Deployment Verification

### 1. Check Backend Health
```bash
curl https://health-care-e-commerce.onrender.com/api/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2026-05-08T...",
  "database": "connected",
  "redis": "connected"
}
```

### 2. Check Frontend
Visit: https://health-care-e-commerce-murex.vercel.app

Verify:
- [x] Homepage loads
- [x] Products display
- [x] Search works
- [x] Cart functionality
- [x] User authentication
- [x] Checkout process

### 3. Test API Endpoints

```bash
# Test products endpoint
curl https://health-care-e-commerce.onrender.com/api/products

# Test categories endpoint
curl https://health-care-e-commerce.onrender.com/api/categories

# Test auth endpoint
curl https://health-care-e-commerce.onrender.com/api/auth/status
```

### 4. Monitor Logs

**Render:**
- Go to Dashboard → Logs
- Monitor for errors

**Vercel:**
- Go to Dashboard → Deployments → View Function Logs
- Monitor for errors

---

## 🔧 Troubleshooting

### Issue: Backend not connecting to MongoDB

**Solution:**
1. Check MongoDB Atlas network access
2. Add `0.0.0.0/0` to IP whitelist
3. Verify connection string in Render environment variables

### Issue: CORS errors

**Solution:**
1. Verify `CORS_ORIGINS` in backend includes your Vercel URL
2. Check `FRONTEND_URL` matches your Vercel deployment
3. Ensure no trailing slashes in URLs

### Issue: Environment variables not loading

**Solution:**
1. Redeploy after adding environment variables
2. Check variable names match exactly (case-sensitive)
3. Verify no extra spaces in values

### Issue: Build fails on Vercel

**Solution:**
1. Check build logs for specific errors
2. Verify all required environment variables are set
3. Ensure `HUSKY=0` is set to skip git hooks
4. Check Node.js version compatibility

### Issue: Render service keeps restarting

**Solution:**
1. Check logs for errors
2. Verify `PORT` environment variable is set
3. Ensure MongoDB connection is successful
4. Check Redis connection

### Issue: Images not loading

**Solution:**
1. Verify Cloudinary credentials
2. Check `next.config.mjs` remote patterns
3. Ensure CORS is configured on Cloudinary

---

## 🚀 Deployment Commands

### Manual Deployment

**Backend (from local):**
```bash
cd health-care/backend
git push origin main
# Render auto-deploys on push
```

**Frontend (from local):**
```bash
cd health-care
vercel --prod
```

### Rollback Deployment

**Render:**
1. Go to Dashboard → Deploys
2. Click on previous successful deployment
3. Click "Redeploy"

**Vercel:**
1. Go to Dashboard → Deployments
2. Find previous deployment
3. Click "..." → "Promote to Production"

---

## 📊 Monitoring

### Uptime Monitoring
- Use UptimeRobot (free): https://uptimerobot.com
- Monitor both frontend and backend URLs

### Error Tracking
- Sentry is already configured
- Check Sentry dashboard for errors

### Performance Monitoring
- Vercel Analytics (built-in)
- Google Analytics (configured)

---

## 🔄 Continuous Deployment

Your GitHub Actions workflow is configured to:
1. Run tests on every push
2. Deploy frontend to Vercel on main branch
3. Backend auto-deploys via Render webhook

**Workflow file:** `.github/workflows/deploy.yml`

---

## 📝 Important Notes

1. **Free Tier Limitations:**
   - Render free tier sleeps after 15 minutes of inactivity
   - First request after sleep takes 30-60 seconds
   - Consider upgrading to Starter plan for production

2. **Database Backups:**
   - MongoDB Atlas auto-backups enabled
   - Configure backup schedule in Atlas dashboard

3. **SSL Certificates:**
   - Both Vercel and Render provide free SSL
   - Automatically renewed

4. **Custom Domains:**
   - Update all environment variables when adding custom domain
   - Update Google OAuth redirect URIs
   - Update Stripe webhook URLs

5. **Security:**
   - Never commit `.env` files
   - Rotate secrets regularly
   - Use strong JWT secrets
   - Enable 2FA on all accounts

---

## 🎉 Deployment Complete!

Your application is now live:
- **Frontend:** https://health-care-e-commerce-murex.vercel.app
- **Backend:** https://health-care-e-commerce.onrender.com
- **Repository:** https://github.com/mahi8026/Health_Care_E-commerce

---

## 📞 Support

If you encounter issues:
1. Check logs in Render and Vercel dashboards
2. Review this guide's troubleshooting section
3. Check GitHub Actions workflow runs
4. Verify all environment variables are set correctly

---

**Last Updated:** May 8, 2026
**Version:** 1.0.0
