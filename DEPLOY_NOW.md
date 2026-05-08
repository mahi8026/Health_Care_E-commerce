# 🚀 DEPLOY NOW - Step-by-Step Guide

## ⚠️ BEFORE YOU START

**CRITICAL:** You have exposed secrets in your repository. Follow these steps IN ORDER:

---

## STEP 1: ROTATE ALL SECRETS (30 minutes)

### 1.1 Generate New JWT Secrets

Open PowerShell and run:
```powershell
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Run it 3 times to get:
- New JWT_SECRET
- New JWT_REFRESH_SECRET  
- New CSRF_SECRET

**Save these somewhere safe (NOT in code)!**

### 1.2 Rotate Cloudinary API Secret

1. Go to: https://cloudinary.com/console/settings/security
2. Click "Regenerate API Secret"
3. Copy the new secret
4. **Save it somewhere safe (NOT in code)!**

### 1.3 Rotate Google OAuth2 Credentials

1. Go to: https://console.cloud.google.com/apis/credentials
2. Find your OAuth 2.0 Client ID
3. Delete it
4. Click "Create Credentials" → "OAuth 2.0 Client ID"
5. Application type: "Web application"
6. Authorized redirect URIs:
   - `https://health-care-e-commerce.onrender.com/api/auth/google/callback`
   - `http://localhost:5000/api/auth/google/callback`
7. Copy Client ID and Client Secret
8. **Save them somewhere safe (NOT in code)!**

### 1.4 Rotate MongoDB Password

1. Go to: https://cloud.mongodb.com/
2. Database Access → Find user `Health_Care_E-commerce`
3. Click "Edit"
4. Click "Edit Password"
5. Generate a new strong password
6. Copy the new connection string
7. **Save it somewhere safe (NOT in code)!**

### 1.5 Rotate Redis Password

1. Go to: https://app.redislabs.com/
2. Find your database: `Health-Care-E-commerce`
3. Configuration → Security
4. Change password
5. Copy new password
6. **Save it somewhere safe (NOT in code)!**

### 1.6 Rotate Stripe Keys (Optional for now)

If you're using Stripe in production:
1. Go to: https://dashboard.stripe.com/apikeys
2. Click "Roll key" for Secret key
3. Click "Roll key" for Publishable key
4. **Save them somewhere safe (NOT in code)!**

---

## STEP 2: REMOVE SECRETS FROM GIT (15 minutes)

### Option A: Remove .env files from tracking

```powershell
# Navigate to project
cd "c:\Projects\Health Care"

# Remove .env files from git (but keep them locally)
git rm --cached health-care/.env.local
git rm --cached health-care/.env.production
git rm --cached health-care/backend/.env
git rm --cached health-care/backend/.env.production

# Commit the removal
git add .gitignore
git add health-care/.env.example
git add health-care/backend/.env.example
git commit -m "security: remove exposed .env files and add templates"

# Push to GitHub
git push origin main
```

### Option B: Clean Git History (Recommended but Advanced)

**WARNING:** This rewrites git history. Coordinate with your team first!

1. Download BFG Repo-Cleaner: https://rtyley.github.io/bfg-repo-cleaner/
2. Create a file `secrets.txt` with your exposed secrets (one per line)
3. Run:
```powershell
java -jar bfg.jar --replace-text secrets.txt "c:\Projects\Health Care"
cd "c:\Projects\Health Care"
git reflog expire --expire=now --all
git gc --prune=now --aggressive
git push --force
```

---

## STEP 3: DEPLOY BACKEND TO RENDER (20 minutes)

### 3.1 Create Web Service

1. Go to: https://dashboard.render.com
2. Click "New +" → "Web Service"
3. Click "Connect GitHub"
4. Select repository: `mahi8026/Health_Care_E-commerce`
5. Click "Connect"

### 3.2 Configure Service

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
- Select: `Starter` ($7/month) - Recommended
- Or: `Free` (sleeps after 15 min inactivity)

### 3.3 Add Environment Variables

Click "Advanced" → "Add Environment Variable"

Add these ONE BY ONE (use your NEW rotated values):

```
NODE_ENV = production
PORT = 5000
FRONTEND_URL = https://health-care-e-commerce-murex.vercel.app
BACKEND_URL = https://health-care-e-commerce.onrender.com
MONGODB_URI = <YOUR_NEW_MONGODB_CONNECTION_STRING>
JWT_SECRET = <YOUR_NEW_JWT_SECRET>
JWT_REFRESH_SECRET = <YOUR_NEW_JWT_REFRESH_SECRET>
CSRF_SECRET = <YOUR_NEW_CSRF_SECRET>
GOOGLE_CLIENT_ID = <YOUR_NEW_GOOGLE_CLIENT_ID>
GOOGLE_CLIENT_SECRET = <YOUR_NEW_GOOGLE_CLIENT_SECRET>
CORS_ORIGIN = https://health-care-e-commerce-murex.vercel.app
CORS_ORIGINS = https://health-care-e-commerce-murex.vercel.app
ADMIN_URL = https://health-care-e-commerce-murex.vercel.app/admin
RATE_LIMIT_WINDOW_MS = 900000
RATE_LIMIT_MAX_REQUESTS = 100
MAX_FILE_SIZE = 5242880
LOG_LEVEL = info
STRIPE_SECRET_KEY = <YOUR_STRIPE_SECRET_KEY>
STRIPE_PUBLISHABLE_KEY = <YOUR_STRIPE_PUBLISHABLE_KEY>
STRIPE_WEBHOOK_SECRET = whsec_your_webhook_secret
CLOUDINARY_CLOUD_NAME = dm8eqxwlz
CLOUDINARY_API_KEY = 397344892624316
CLOUDINARY_API_SECRET = <YOUR_NEW_CLOUDINARY_API_SECRET>
REDIS_HOST = redis-19674.c264.ap-south-1-1.ec2.cloud.redislabs.com
REDIS_PORT = 19674
REDIS_PASSWORD = <YOUR_NEW_REDIS_PASSWORD>
REDIS_DB = 0
REDIS_TTL = 3600
SMTP_HOST = smtp.gmail.com
SMTP_PORT = 587
SMTP_USER = <YOUR_EMAIL>
SMTP_PASS = <YOUR_GMAIL_APP_PASSWORD>
EMAIL_FROM = noreply@medcorebd.com
EMAIL_FROM_NAME = MedCore BD
ADMIN_EMAIL = <YOUR_EMAIL>
SMS_PROVIDER = ssl_wireless
SMS_API_URL = https://smsplus.sslwireless.com/api/v3/send-sms
SMS_SENDER_ID = MedCoreBD
ADMIN_PHONE = +8801646886795
```

### 3.4 Deploy

1. Click "Create Web Service"
2. Wait 5-10 minutes for deployment
3. Check logs for errors
4. Once deployed, test the health endpoint:

```powershell
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

## STEP 4: DEPLOY FRONTEND TO VERCEL (15 minutes)

### 4.1 Create Project

1. Go to: https://vercel.com/new
2. Click "Import Project"
3. Import from GitHub: `mahi8026/Health_Care_E-commerce`
4. Click "Import"

### 4.2 Configure Project

**Framework Preset:** Next.js (auto-detected)

**Root Directory:** Click "Edit" → Enter: `health-care`

**Build Settings:**
- Build Command: `npm run build`
- Output Directory: `.next` (default)
- Install Command: `npm install`

### 4.3 Add Environment Variables

Click "Environment Variables" tab

Add these ONE BY ONE:

```
NEXT_PUBLIC_API_URL = https://health-care-e-commerce.onrender.com/api
NEXT_PUBLIC_SITE_URL = https://health-care-e-commerce-murex.vercel.app
NEXT_PUBLIC_SITE_NAME = MedCore BD
NEXT_PUBLIC_APP_NAME = MedCore BD
NEXT_PUBLIC_WHATSAPP_NUMBER = 8801646886795
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = <YOUR_STRIPE_PUBLISHABLE_KEY>
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME = dm8eqxwlz
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET = ml_default
NEXT_PUBLIC_GA4_MEASUREMENT_ID = G-VCQNJESVNM
NEXT_PUBLIC_ENABLE_STRIPE = true
NEXT_PUBLIC_ENABLE_BKASH = true
NEXT_PUBLIC_ENABLE_NAGAD = true
NEXT_PUBLIC_ENABLE_B2B_CREDIT = true
NEXT_PUBLIC_ENABLE_ANALYTICS = true
NODE_ENV = production
HUSKY = 0
```

**Important:** Select "Production" for all variables

### 4.4 Deploy

1. Click "Deploy"
2. Wait 3-5 minutes
3. Once deployed, click "Visit" to test
4. Check browser console for errors

---

## STEP 5: CONFIGURE GITHUB SECRETS (10 minutes)

### 5.1 Get Vercel Credentials

**Get Vercel Token:**
1. Go to: https://vercel.com/account/tokens
2. Click "Create Token"
3. Name: "GitHub Actions"
4. Scope: "Full Account"
5. Click "Create"
6. **Copy the token immediately** (you won't see it again)

**Get Vercel Org ID:**
1. Go to: https://vercel.com/account
2. Copy your Team/User ID
3. It's already in your project.json: `team_Vs50A8r6DWiPWiLHPpQ8spZF`

**Get Vercel Project ID:**
1. Already in your project.json: `prj_fOVFeTY3DlsqXnyMEyi4nFdqUVuk`

### 5.2 Add GitHub Secrets

1. Go to: https://github.com/mahi8026/Health_Care_E-commerce/settings/secrets/actions
2. Click "New repository secret"
3. Add these ONE BY ONE:

```
Name: VERCEL_TOKEN
Value: <YOUR_VERCEL_TOKEN_FROM_STEP_5.1>

Name: VERCEL_ORG_ID
Value: team_Vs50A8r6DWiPWiLHPpQ8spZF

Name: VERCEL_PROJECT_ID
Value: prj_fOVFeTY3DlsqXnyMEyi4nFdqUVuk

Name: NEXT_PUBLIC_API_URL
Value: https://health-care-e-commerce.onrender.com/api

Name: NEXT_PUBLIC_SITE_URL
Value: https://health-care-e-commerce-murex.vercel.app

Name: NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
Value: <YOUR_STRIPE_PUBLISHABLE_KEY>

Name: NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
Value: dm8eqxwlz

Name: NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET
Value: ml_default
```

---

## STEP 6: VERIFY DEPLOYMENT (10 minutes)

### 6.1 Test Backend

```powershell
# Health check
curl https://health-care-e-commerce.onrender.com/api/health

# Products API
curl https://health-care-e-commerce.onrender.com/api/products

# Categories API
curl https://health-care-e-commerce.onrender.com/api/categories
```

### 6.2 Test Frontend

1. Visit: https://health-care-e-commerce-murex.vercel.app
2. Check:
   - [ ] Homepage loads
   - [ ] Products page loads
   - [ ] Search works
   - [ ] Cart works
   - [ ] Login/Register works
   - [ ] Google OAuth works
   - [ ] Images load from Cloudinary

### 6.3 Test Integration

1. Add product to cart
2. Proceed to checkout
3. Test payment (use Stripe test card: 4242 4242 4242 4242)
4. Check order confirmation

### 6.4 Check Logs

**Render:**
1. Go to: https://dashboard.render.com
2. Click on your service
3. Click "Logs"
4. Look for errors

**Vercel:**
1. Go to: https://vercel.com/mahis-projects/health-care-e-commerce
2. Click on latest deployment
3. Click "View Function Logs"
4. Look for errors

---

## STEP 7: CONFIGURE EXTERNAL SERVICES (15 minutes)

### 7.1 Update Google OAuth Redirect URIs

1. Go to: https://console.cloud.google.com/apis/credentials
2. Click on your OAuth 2.0 Client ID
3. Under "Authorized redirect URIs", add:
   - `https://health-care-e-commerce.onrender.com/api/auth/google/callback`
4. Under "Authorized JavaScript origins", add:
   - `https://health-care-e-commerce-murex.vercel.app`
5. Click "Save"

### 7.2 Configure Stripe Webhooks

1. Go to: https://dashboard.stripe.com/webhooks
2. Click "Add endpoint"
3. Endpoint URL: `https://health-care-e-commerce.onrender.com/api/payments/stripe/webhook`
4. Select events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `checkout.session.completed`
5. Click "Add endpoint"
6. Copy the "Signing secret" (starts with `whsec_`)
7. Update `STRIPE_WEBHOOK_SECRET` in Render environment variables
8. Redeploy backend

### 7.3 Configure MongoDB Network Access

1. Go to: https://cloud.mongodb.com/
2. Network Access → Click "Add IP Address"
3. Click "Allow Access from Anywhere"
4. Add IP: `0.0.0.0/0`
5. Click "Confirm"

---

## STEP 8: ENABLE CONTINUOUS DEPLOYMENT (5 minutes)

### 8.1 Test GitHub Actions

1. Make a small change (e.g., update README.md)
2. Commit and push:
```powershell
cd "c:\Projects\Health Care"
git add README.md
git commit -m "test: verify CI/CD pipeline"
git push origin main
```

3. Go to: https://github.com/mahi8026/Health_Care_E-commerce/actions
4. Watch the workflow run
5. Verify all jobs pass:
   - Lint and Test
   - Deploy Frontend
   - Backend Deployment Status
   - Post-Deployment Checks

### 8.2 Verify Auto-Deployment

**Vercel:**
- Should auto-deploy on every push to `main`
- Check: https://vercel.com/mahis-projects/health-care-e-commerce/deployments

**Render:**
- Should auto-deploy on every push to `main`
- Check: https://dashboard.render.com → Your Service → Events

---

## ✅ DEPLOYMENT COMPLETE!

Your application is now live:

**Frontend:** https://health-care-e-commerce-murex.vercel.app
**Backend:** https://health-care-e-commerce.onrender.com
**Repository:** https://github.com/mahi8026/Health_Care_E-commerce

---

## 📊 MONITORING

### Set Up Uptime Monitoring

1. Sign up at: https://uptimerobot.com (free)
2. Add monitor for frontend
3. Add monitor for backend health endpoint
4. Set check interval: 5 minutes
5. Configure email alerts

### Check Performance

1. Run Lighthouse audit:
   - Open Chrome DevTools
   - Go to Lighthouse tab
   - Run audit on production URL

2. Monitor Vercel Analytics:
   - Go to: https://vercel.com/mahis-projects/health-care-e-commerce/analytics

3. Check Render Metrics:
   - Go to: https://dashboard.render.com → Your Service → Metrics

---

## 🔒 SECURITY CHECKLIST

- [ ] All secrets rotated
- [ ] .env files removed from git
- [ ] .env.example files created
- [ ] Environment variables set in Vercel
- [ ] Environment variables set in Render
- [ ] GitHub secrets configured
- [ ] Google OAuth redirect URIs updated
- [ ] Stripe webhooks configured
- [ ] MongoDB network access configured
- [ ] HTTPS enabled (automatic on Vercel/Render)
- [ ] CORS configured correctly
- [ ] Rate limiting enabled
- [ ] Git history cleaned (optional)

---

## 🚨 IF SOMETHING GOES WRONG

### Backend not starting:
1. Check Render logs
2. Verify all environment variables are set
3. Check MongoDB connection
4. Check Redis connection

### Frontend not loading:
1. Check Vercel deployment logs
2. Verify environment variables
3. Check browser console for errors
4. Verify API URL is correct

### Database connection errors:
1. Check MongoDB Atlas network access
2. Verify connection string
3. Check database user permissions

### Redis connection errors:
1. Check Redis Cloud dashboard
2. Verify host, port, and password
3. Redis is optional - app works without it

---

## 📞 SUPPORT

- **Vercel:** https://vercel.com/support
- **Render:** https://render.com/docs
- **MongoDB:** https://www.mongodb.com/support
- **Stripe:** https://support.stripe.com/

---

**Total Time: ~2 hours**
**Difficulty: Medium**
**Priority: CRITICAL**

**START NOW!** 🚀

