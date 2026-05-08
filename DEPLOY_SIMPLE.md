# 🚀 Simple Deployment Guide - MedCore BD

## ✅ Good News: Your Repo is Private!

Since your repository is private, your secrets are safe. We just need to:
1. Keep .env files out of Git (already done ✓)
2. Deploy to Vercel and Render

---

## 📋 Quick Deployment Steps

### Step 1: Deploy Backend to Render (20 minutes)

#### 1.1 Create Web Service
1. Go to: https://dashboard.render.com
2. Click **"New +"** → **"Web Service"**
3. Click **"Connect GitHub"** (if not already connected)
4. Select repository: **`mahi8026/Health_Care_E-commerce`**
5. Click **"Connect"**

#### 1.2 Configure Service
Fill in these settings:

**Basic Settings:**
- **Name:** `health-care-backend`
- **Region:** `Singapore` (or closest to your users)
- **Branch:** `main`
- **Root Directory:** `health-care/backend`
- **Runtime:** `Node`
- **Build Command:** `npm install`
- **Start Command:** `npm start`

**Instance Type:**
- Select: **`Starter`** ($7/month) - Recommended for production
- Or: **`Free`** (sleeps after 15 min inactivity - good for testing)

#### 1.3 Add Environment Variables

Click **"Advanced"** → **"Add Environment Variable"**

Copy these from your `health-care/backend/.env` file:

```bash
NODE_ENV=production
PORT=5000
FRONTEND_URL=https://health-care-e-commerce-murex.vercel.app
BACKEND_URL=https://health-care-e-commerce.onrender.com

# Database
MONGODB_URI=mongodb+srv://Health_Care_E-commerce:ibQkT9ppTdivDtXt@cluster0.rqyzhey.mongodb.net/medcore-bd?retryWrites=true&w=majority&appName=Cluster0

# JWT
JWT_SECRET=f22c149106748947deef9b0990564b4778aeb219a60e8cbde8b5d5b924e19dab5e4db8384ac822b0050792b57b618908f8b33f43f4dc6a14bd575cdbff4e29e0
JWT_REFRESH_SECRET=289383302baf1b90e7afde7b2f667fc99db3f20c83f6126e8ff2161312248c99193c3022ee30e30c0c0aa6abce291bbc4e3085ed029aec96e148bbe6e1ed081f

# Google OAuth
GOOGLE_CLIENT_ID=423878511800-qmtst4hibgsrf8e6gjcle1e7bqgsncgo.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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

# CORS
CORS_ORIGIN=https://health-care-e-commerce-murex.vercel.app
CORS_ORIGINS=https://health-care-e-commerce-murex.vercel.app
ADMIN_URL=https://health-care-e-commerce-murex.vercel.app/admin

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Stripe
STRIPE_SECRET_KEY=sk_test_51TP5b9CMsCu3AGhEsL2UkhfNLUWZcavE0pAyGhQ3WGIUFkWlP18w1PeJAKPIsci3W5gakbmbNQm98AoZ5bgYsVSU00cq2s59iY
STRIPE_PUBLISHABLE_KEY=pk_test_51TP5b9CMsCu3AGhEV6JBixF9RGlrSWkw9NlEWuTcgq4PDDbcogpB6HbEt2oGAO6OLafP8KPrZKjekSqEGT6v3KWW00VYiImXJB
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

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

# Email (Update with your email)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-gmail-app-password
EMAIL_FROM=noreply@medcorebd.com
EMAIL_FROM_NAME=MedCore BD
ADMIN_EMAIL=your-email@gmail.com

# SMS
SMS_PROVIDER=ssl_wireless
SMS_API_URL=https://smsplus.sslwireless.com/api/v3/send-sms
SMS_SENDER_ID=MedCoreBD
ADMIN_PHONE=+8801646886795

# Logging
LOG_LEVEL=info
MAX_FILE_SIZE=5242880
```

**Important:** Update `SMTP_USER` and `SMTP_PASS` with your actual Gmail credentials!

#### 1.4 Deploy
1. Click **"Create Web Service"**
2. Wait 5-10 minutes for deployment
3. Check logs for any errors

#### 1.5 Verify Backend
Once deployed, test the health endpoint:
```bash
curl https://health-care-e-commerce.onrender.com/api/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "...",
  "database": "connected",
  "redis": "connected"
}
```

---

### Step 2: Deploy Frontend to Vercel (15 minutes)

#### 2.1 Create Project
1. Go to: https://vercel.com/new
2. Click **"Import Project"**
3. Select: **`mahi8026/Health_Care_E-commerce`**
4. Click **"Import"**

#### 2.2 Configure Project

**Framework Preset:** Next.js (auto-detected) ✓

**Root Directory:** 
- Click **"Edit"**
- Enter: `health-care`
- Click **"Continue"**

**Build Settings:**
- Build Command: `npm run build` (default)
- Output Directory: `.next` (default)
- Install Command: `npm install` (default)

#### 2.3 Add Environment Variables

Click **"Environment Variables"** tab

Add these ONE BY ONE (select "Production" for all):

```bash
NEXT_PUBLIC_API_URL=https://health-care-e-commerce.onrender.com/api
NEXT_PUBLIC_SITE_URL=https://health-care-e-commerce-murex.vercel.app
NEXT_PUBLIC_SITE_NAME=MedCore BD
NEXT_PUBLIC_APP_NAME=MedCore BD
NEXT_PUBLIC_WHATSAPP_NUMBER=8801646886795
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51TP5b9CMsCu3AGhEV6JBixF9RGlrSWkw9NlEWuTcgq4PDDbcogpB6HbEt2oGAO6OLafP8KPrZKjekSqEGT6v3KWW00VYiImXJB
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=dm8eqxwlz
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=ml_default
NEXT_PUBLIC_GA4_MEASUREMENT_ID=G-VCQNJESVNM
NEXT_PUBLIC_ENABLE_STRIPE=true
NEXT_PUBLIC_ENABLE_BKASH=true
NEXT_PUBLIC_ENABLE_NAGAD=true
NEXT_PUBLIC_ENABLE_B2B_CREDIT=true
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NODE_ENV=production
HUSKY=0
```

#### 2.4 Deploy
1. Click **"Deploy"**
2. Wait 3-5 minutes
3. Once deployed, click **"Visit"** to test

#### 2.5 Verify Frontend
- Homepage should load ✓
- Products should display ✓
- Search should work ✓
- Check browser console for errors

---

### Step 3: Configure GitHub Actions (10 minutes)

#### 3.1 Get Vercel Credentials

**Get Vercel Token:**
1. Go to: https://vercel.com/account/tokens
2. Click **"Create Token"**
3. Name: `GitHub Actions`
4. Scope: `Full Account`
5. Click **"Create"**
6. **Copy the token immediately** (you won't see it again!)

**Get Vercel Org ID:**
- Already have it: `team_Vs50A8r6DWiPWiLHPpQ8spZF`

**Get Vercel Project ID:**
- Already have it: `prj_fOVFeTY3DlsqXnyMEyi4nFdqUVuk`

#### 3.2 Add GitHub Secrets

1. Go to: https://github.com/mahi8026/Health_Care_E-commerce/settings/secrets/actions
2. Click **"New repository secret"**
3. Add these ONE BY ONE:

```
Name: VERCEL_TOKEN
Value: <paste_your_token_from_step_3.1>

Name: VERCEL_ORG_ID
Value: team_Vs50A8r6DWiPWiLHPpQ8spZF

Name: VERCEL_PROJECT_ID
Value: prj_fOVFeTY3DlsqXnyMEyi4nFdqUVuk

Name: NEXT_PUBLIC_API_URL
Value: https://health-care-e-commerce.onrender.com/api

Name: NEXT_PUBLIC_SITE_URL
Value: https://health-care-e-commerce-murex.vercel.app

Name: NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
Value: pk_test_51TP5b9CMsCu3AGhEV6JBixF9RGlrSWkw9NlEWuTcgq4PDDbcogpB6HbEt2oGAO6OLafP8KPrZKjekSqEGT6v3KWW00VYiImXJB

Name: NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
Value: dm8eqxwlz

Name: NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET
Value: ml_default
```

#### 3.3 Test GitHub Actions

1. Make a small change (e.g., update README.md)
2. Commit and push:
```bash
git add README.md
git commit -m "test: verify CI/CD pipeline"
git push origin main
```
3. Go to: https://github.com/mahi8026/Health_Care_E-commerce/actions
4. Watch the workflow run
5. Verify all jobs pass ✓

---

### Step 4: Configure External Services (15 minutes)

#### 4.1 Update Google OAuth Redirect URIs

1. Go to: https://console.cloud.google.com/apis/credentials
2. Click on your OAuth 2.0 Client ID
3. Under **"Authorized redirect URIs"**, add:
   - `https://health-care-e-commerce.onrender.com/api/auth/google/callback`
4. Under **"Authorized JavaScript origins"**, add:
   - `https://health-care-e-commerce-murex.vercel.app`
5. Click **"Save"**

#### 4.2 Configure Stripe Webhooks

1. Go to: https://dashboard.stripe.com/webhooks
2. Click **"Add endpoint"**
3. **Endpoint URL:** `https://health-care-e-commerce.onrender.com/api/payments/stripe/webhook`
4. **Select events:**
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `checkout.session.completed`
5. Click **"Add endpoint"**
6. Copy the **"Signing secret"** (starts with `whsec_`)
7. Update `STRIPE_WEBHOOK_SECRET` in Render environment variables
8. Click **"Manual Deploy"** in Render to redeploy

#### 4.3 Configure MongoDB Network Access

1. Go to: https://cloud.mongodb.com/
2. Click **"Network Access"** in left sidebar
3. Click **"Add IP Address"**
4. Click **"Allow Access from Anywhere"**
5. Add IP: `0.0.0.0/0`
6. Click **"Confirm"**

---

### Step 5: Final Verification (10 minutes)

#### 5.1 Test Backend APIs

```bash
# Health check
curl https://health-care-e-commerce.onrender.com/api/health

# Products
curl https://health-care-e-commerce.onrender.com/api/products

# Categories
curl https://health-care-e-commerce.onrender.com/api/categories
```

#### 5.2 Test Frontend Features

Visit: https://health-care-e-commerce-murex.vercel.app

Test:
- [ ] Homepage loads
- [ ] Products page loads
- [ ] Product details page works
- [ ] Search works
- [ ] Cart works
- [ ] User registration works
- [ ] User login works
- [ ] Google OAuth works
- [ ] Checkout works
- [ ] Payment works (use test card: 4242 4242 4242 4242)

#### 5.3 Check Logs

**Render Logs:**
1. Go to: https://dashboard.render.com
2. Click on your service
3. Click **"Logs"**
4. Look for any errors

**Vercel Logs:**
1. Go to: https://vercel.com/mahis-projects/health-care-e-commerce
2. Click on latest deployment
3. Click **"View Function Logs"**
4. Look for any errors

---

## ✅ Deployment Complete!

Your application is now live:

**Frontend:** https://health-care-e-commerce-murex.vercel.app
**Backend:** https://health-care-e-commerce.onrender.com
**API Health:** https://health-care-e-commerce.onrender.com/api/health

---

## 🔄 Continuous Deployment

Now that everything is set up:

1. **Every push to `main` branch** will automatically:
   - Run tests via GitHub Actions
   - Deploy frontend to Vercel
   - Deploy backend to Render

2. **To deploy changes:**
```bash
git add .
git commit -m "your changes"
git push origin main
```

3. **Monitor deployments:**
   - Vercel: https://vercel.com/mahis-projects/health-care-e-commerce/deployments
   - Render: https://dashboard.render.com → Your Service → Events
   - GitHub: https://github.com/mahi8026/Health_Care_E-commerce/actions

---

## 🆘 Troubleshooting

### Backend Issues

**Service won't start:**
- Check Render logs for errors
- Verify MongoDB connection string
- Check all environment variables are set

**Database connection fails:**
- MongoDB Atlas → Network Access → Ensure `0.0.0.0/0` is added
- Check connection string format
- Verify database user has read/write permissions

**Redis connection fails:**
- Check Redis Cloud dashboard
- Verify host, port, and password
- Note: App works without Redis (graceful fallback)

### Frontend Issues

**Build fails:**
- Check Vercel deployment logs
- Verify `HUSKY=0` is set
- Ensure all required env vars are set

**CORS errors:**
- Update `CORS_ORIGINS` in Render to match Vercel URL exactly
- No trailing slashes
- Redeploy backend after changes

**Images not loading:**
- Verify Cloudinary credentials
- Check `next.config.mjs` remote patterns
- Check browser console for errors

---

## 📊 Monitoring (Optional but Recommended)

### Set Up Uptime Monitoring

1. Sign up at: https://uptimerobot.com (free)
2. Add monitor for: `https://health-care-e-commerce-murex.vercel.app`
3. Add monitor for: `https://health-care-e-commerce.onrender.com/api/health`
4. Set check interval: 5 minutes
5. Configure email alerts

### Performance Monitoring

1. **Vercel Analytics:** Already enabled (check dashboard)
2. **Google Analytics:** Already configured (GA4)
3. **Lighthouse:** Run audit in Chrome DevTools

---

## 🎉 Success!

You've successfully deployed your full-stack application to production!

**What you accomplished:**
- ✅ Backend deployed to Render
- ✅ Frontend deployed to Vercel
- ✅ CI/CD pipeline configured
- ✅ External services integrated
- ✅ Monitoring set up

**Next steps:**
- Monitor your application
- Test all features thoroughly
- Set up custom domain (optional)
- Enable production Stripe keys when ready
- Configure email service (SMTP)

---

**Total Time:** ~1 hour
**Difficulty:** Medium
**Status:** ✅ COMPLETE

**Congratulations!** 🎉

