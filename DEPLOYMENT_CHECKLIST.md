# 🚀 Deployment Checklist - MedCore BD

## Pre-Deployment Checklist

### 1. Code Quality ✅
- [x] All tests passing
- [x] No console errors
- [x] Code linted and formatted
- [x] No security vulnerabilities
- [x] Environment variables documented

### 2. Configuration Files ✅
- [x] `package.json` configured
- [x] `vercel.json` configured
- [x] `render.yaml` created
- [x] `Procfile` configured
- [x] `.env.production` files ready
- [x] `next.config.mjs` optimized

### 3. External Services ✅
- [x] MongoDB Atlas database ready
- [x] Redis Cloud instance configured
- [x] Cloudinary account set up
- [x] Stripe account configured
- [x] Google OAuth credentials ready
- [ ] SMTP email service configured (ACTION REQUIRED)

---

## GitHub Setup

### Step 1: Repository Access
- [x] Repository: https://github.com/mahi8026/Health_Care_E-commerce
- [x] Branch: main
- [x] All code committed and pushed

### Step 2: GitHub Secrets Configuration
Go to: https://github.com/mahi8026/Health_Care_E-commerce/settings/secrets/actions

Add these secrets:

#### Vercel Integration
```
☐ VERCEL_TOKEN
☐ VERCEL_ORG_ID
☐ VERCEL_PROJECT_ID
```

#### Environment Variables
```
☐ NEXT_PUBLIC_API_URL
☐ NEXT_PUBLIC_SITE_URL
☐ NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
☐ NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
☐ NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET
☐ NEXT_PUBLIC_GA4_MEASUREMENT_ID
```

---

## Backend Deployment (Render)

### Step 1: Create Web Service
1. ☐ Go to https://dashboard.render.com
2. ☐ Click "New +" → "Web Service"
3. ☐ Connect GitHub repository
4. ☐ Select `mahi8026/Health_Care_E-commerce`

### Step 2: Configure Service
```
☐ Name: health-care-backend
☐ Region: Singapore
☐ Branch: main
☐ Root Directory: health-care/backend
☐ Runtime: Node
☐ Build Command: npm install
☐ Start Command: npm start
☐ Instance Type: Starter ($7/month)
```

### Step 3: Environment Variables
Copy from `health-care/backend/.env.production` and add to Render:

**Critical Variables (Must Configure):**
```
☐ NODE_ENV=production
☐ PORT=5000
☐ FRONTEND_URL=https://health-care-e-commerce-murex.vercel.app
☐ BACKEND_URL=https://health-care-e-commerce.onrender.com
☐ MONGODB_URI=mongodb+srv://...
☐ JWT_SECRET=...
☐ JWT_REFRESH_SECRET=...
☐ GOOGLE_CLIENT_ID=...
☐ GOOGLE_CLIENT_SECRET=...
```

**Email Configuration (UPDATE REQUIRED):**
```
☐ SMTP_HOST=smtp.gmail.com
☐ SMTP_PORT=587
☐ SMTP_USER=your-email@gmail.com (CHANGE THIS)
☐ SMTP_PASS=your-app-password (CHANGE THIS)
☐ EMAIL_FROM=noreply@medcorebd.com
☐ EMAIL_FROM_NAME=MedCore BD
```

**Payment & Services:**
```
☐ STRIPE_SECRET_KEY=sk_test_...
☐ STRIPE_PUBLISHABLE_KEY=pk_test_...
☐ STRIPE_WEBHOOK_SECRET=whsec_...
☐ CLOUDINARY_CLOUD_NAME=dm8eqxwlz
☐ CLOUDINARY_API_KEY=...
☐ CLOUDINARY_API_SECRET=...
```

**Redis Cache:**
```
☐ REDIS_HOST=redis-19674.c264.ap-south-1-1.ec2.cloud.redislabs.com
☐ REDIS_PORT=19674
☐ REDIS_PASSWORD=...
☐ REDIS_DB=0
☐ REDIS_TTL=3600
```

**Other:**
```
☐ CORS_ORIGINS=https://health-care-e-commerce-murex.vercel.app
☐ RATE_LIMIT_WINDOW_MS=900000
☐ RATE_LIMIT_MAX_REQUESTS=100
☐ LOG_LEVEL=info
```

### Step 4: Deploy & Verify
```
☐ Click "Create Web Service"
☐ Wait for deployment (5-10 minutes)
☐ Check logs for errors
☐ Test health endpoint: https://health-care-e-commerce.onrender.com/api/health
```

---

## Frontend Deployment (Vercel)

### Step 1: Create Project
1. ☐ Go to https://vercel.com/new
2. ☐ Import GitHub repository
3. ☐ Select `mahi8026/Health_Care_E-commerce`

### Step 2: Configure Project
```
☐ Framework Preset: Next.js
☐ Root Directory: health-care
☐ Build Command: npm run build
☐ Output Directory: .next
☐ Install Command: npm install
```

### Step 3: Environment Variables
Add in Vercel Dashboard → Settings → Environment Variables:

**Production Environment:**
```
☐ NEXT_PUBLIC_API_URL=https://health-care-e-commerce.onrender.com/api
☐ NEXT_PUBLIC_SITE_URL=https://health-care-e-commerce-murex.vercel.app
☐ NEXT_PUBLIC_SITE_NAME=MedCore BD
☐ NEXT_PUBLIC_APP_NAME=MedCore BD
☐ NEXT_PUBLIC_GA4_MEASUREMENT_ID=G-VCQNJESVNM
☐ NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
☐ NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=dm8eqxwlz
☐ NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=ml_default
☐ NEXT_PUBLIC_ENABLE_STRIPE=true
☐ NEXT_PUBLIC_ENABLE_BKASH=true
☐ NEXT_PUBLIC_ENABLE_NAGAD=true
☐ NEXT_PUBLIC_ENABLE_B2B_CREDIT=true
☐ NEXT_PUBLIC_ENABLE_ANALYTICS=true
☐ NEXT_PUBLIC_WHATSAPP_NUMBER=8801646886795
☐ NODE_ENV=production
☐ HUSKY=0
```

### Step 4: Get Vercel Credentials
```
☐ Get VERCEL_TOKEN from https://vercel.com/account/tokens
☐ Get VERCEL_ORG_ID from https://vercel.com/account
☐ Get VERCEL_PROJECT_ID from Project Settings
☐ Add all three to GitHub Secrets
```

### Step 5: Deploy & Verify
```
☐ Click "Deploy"
☐ Wait for deployment (3-5 minutes)
☐ Check deployment logs
☐ Visit: https://health-care-e-commerce-murex.vercel.app
☐ Test all major features
```

---

## Post-Deployment Verification

### Backend Health Checks
```
☐ API Health: curl https://health-care-e-commerce.onrender.com/api/health
☐ Products API: curl https://health-care-e-commerce.onrender.com/api/products
☐ Categories API: curl https://health-care-e-commerce.onrender.com/api/categories
☐ Auth Status: curl https://health-care-e-commerce.onrender.com/api/auth/status
```

### Frontend Functionality
```
☐ Homepage loads correctly
☐ Product listing works
☐ Product details page works
☐ Search functionality works
☐ Cart operations work
☐ User registration works
☐ User login works
☐ Google OAuth works
☐ Checkout process works
☐ Payment integration works
☐ Order confirmation works
☐ User dashboard works
☐ Admin panel accessible
☐ Images load from Cloudinary
☐ Analytics tracking works
```

### Database & Cache
```
☐ MongoDB connection successful
☐ Redis cache working
☐ Data persists correctly
☐ Queries performing well
```

### Security Checks
```
☐ HTTPS enabled on both services
☐ CORS configured correctly
☐ Rate limiting active
☐ JWT authentication working
☐ Environment variables secure
☐ No sensitive data in logs
```

---

## GitHub Actions Workflow

### Verify Workflow
```
☐ Go to: https://github.com/mahi8026/Health_Care_E-commerce/actions
☐ Check workflow runs successfully
☐ Verify all jobs pass:
   ☐ Lint and Test
   ☐ Deploy Frontend
   ☐ Deploy Backend
   ☐ Post-Deployment Checks
```

### Test Automatic Deployment
```
☐ Make a small change to code
☐ Commit and push to main branch
☐ Watch GitHub Actions workflow
☐ Verify automatic deployment to Vercel
☐ Verify automatic deployment to Render
```

---

## External Service Configuration

### Google OAuth
```
☐ Go to: https://console.cloud.google.com/apis/credentials
☐ Update Authorized redirect URIs:
   ☐ https://health-care-e-commerce.onrender.com/api/auth/google/callback
   ☐ http://localhost:5000/api/auth/google/callback
☐ Update Authorized JavaScript origins:
   ☐ https://health-care-e-commerce-murex.vercel.app
   ☐ http://localhost:3000
```

### Stripe Webhooks
```
☐ Go to: https://dashboard.stripe.com/webhooks
☐ Add endpoint: https://health-care-e-commerce.onrender.com/api/webhooks/stripe
☐ Select events:
   ☐ payment_intent.succeeded
   ☐ payment_intent.payment_failed
   ☐ checkout.session.completed
☐ Copy webhook secret
☐ Update STRIPE_WEBHOOK_SECRET in Render
```

### MongoDB Atlas
```
☐ Go to: https://cloud.mongodb.com
☐ Network Access → Add IP: 0.0.0.0/0 (Allow from anywhere)
☐ Database Access → Verify user has read/write permissions
☐ Enable automatic backups
```

### Redis Cloud
```
☐ Go to: https://app.redislabs.com
☐ Verify database is active
☐ Check connection details match environment variables
☐ Test connection from Render logs
```

### Cloudinary
```
☐ Go to: https://cloudinary.com/console
☐ Verify upload preset exists: ml_default
☐ Set upload preset to "Unsigned"
☐ Configure allowed formats: jpg, png, webp
☐ Set max file size: 5MB
```

---

## Monitoring Setup

### Uptime Monitoring
```
☐ Sign up at: https://uptimerobot.com
☐ Add monitor for frontend: https://health-care-e-commerce-murex.vercel.app
☐ Add monitor for backend: https://health-care-e-commerce.onrender.com/api/health
☐ Set check interval: 5 minutes
☐ Configure email alerts
```

### Error Tracking
```
☐ Verify Sentry is configured
☐ Check Sentry dashboard for errors
☐ Set up error alerts
```

### Performance Monitoring
```
☐ Enable Vercel Analytics
☐ Configure Google Analytics
☐ Monitor Core Web Vitals
```

---

## Documentation Updates

```
☐ Update README.md with deployment URLs
☐ Document environment variables
☐ Add troubleshooting guide
☐ Create API documentation
☐ Update team wiki/docs
```

---

## Final Checks

### Security
```
☐ All secrets stored securely
☐ No .env files in repository
☐ HTTPS enforced
☐ CORS properly configured
☐ Rate limiting active
☐ Input validation working
☐ SQL injection protection active
☐ XSS protection enabled
```

### Performance
```
☐ Images optimized
☐ Caching configured
☐ CDN enabled (Vercel)
☐ Database indexes created
☐ Redis cache working
☐ Compression enabled
```

### Backup & Recovery
```
☐ Database backups enabled
☐ Backup schedule configured
☐ Recovery procedure documented
☐ Rollback plan ready
```

---

## Common Issues & Solutions

### Issue: Backend not responding
**Solution:**
- Check Render logs
- Verify MongoDB connection
- Check Redis connection
- Verify environment variables

### Issue: CORS errors
**Solution:**
- Update CORS_ORIGINS in backend
- Verify FRONTEND_URL matches Vercel URL
- Check for trailing slashes

### Issue: Build fails
**Solution:**
- Check build logs
- Verify all dependencies installed
- Ensure HUSKY=0 is set
- Check Node.js version

### Issue: Environment variables not loading
**Solution:**
- Redeploy after adding variables
- Check variable names (case-sensitive)
- Verify no extra spaces

---

## Deployment URLs

**Frontend:** https://health-care-e-commerce-murex.vercel.app
**Backend:** https://health-care-e-commerce.onrender.com
**Repository:** https://github.com/mahi8026/Health_Care_E-commerce

---

## Support Contacts

**Render Support:** https://render.com/docs
**Vercel Support:** https://vercel.com/support
**MongoDB Support:** https://www.mongodb.com/support

---

## Next Steps After Deployment

1. ☐ Monitor logs for 24 hours
2. ☐ Test all critical user flows
3. ☐ Set up monitoring alerts
4. ☐ Configure custom domain (optional)
5. ☐ Enable production Stripe keys
6. ☐ Set up email service
7. ☐ Configure SMS service
8. ☐ Train team on deployment process
9. ☐ Document any issues encountered
10. ☐ Plan for scaling if needed

---

**Deployment Date:** _____________
**Deployed By:** _____________
**Status:** ☐ In Progress  ☐ Completed  ☐ Issues Found

---

**Last Updated:** May 8, 2026
**Version:** 1.0.0
