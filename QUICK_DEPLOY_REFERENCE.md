# 🚀 Quick Deploy Reference Card

## 🔴 CRITICAL: Security Issue Detected!

GitGuardian found exposed secrets in your repository. **Act immediately!**

---

## ⚡ Quick Actions (Do These NOW)

### 1. Rotate Secrets (30 min)
```powershell
# Generate new JWT secrets
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

- [ ] Cloudinary: https://cloudinary.com/console/settings/security → Regenerate
- [ ] Google OAuth: https://console.cloud.google.com/apis/credentials → Delete & Recreate
- [ ] MongoDB: https://cloud.mongodb.com/ → Change password
- [ ] Redis: https://app.redislabs.com/ → Change password
- [ ] JWT Secrets: Generate 3 new ones (above command)

### 2. Remove .env from Git (5 min)
```powershell
cd "c:\Projects\Health Care"
git rm --cached health-care/.env.local
git rm --cached health-care/.env.production
git rm --cached health-care/backend/.env
git rm --cached health-care/backend/.env.production
git add .gitignore
git commit -m "security: remove exposed .env files"
git push origin main
```

### 3. Deploy Backend to Render (20 min)
1. https://dashboard.render.com → New Web Service
2. Connect: `mahi8026/Health_Care_E-commerce`
3. Settings:
   - Name: `health-care-backend`
   - Root: `health-care/backend`
   - Build: `npm install`
   - Start: `npm start`
4. Add environment variables (see DEPLOY_NOW.md)
5. Deploy!

### 4. Deploy Frontend to Vercel (15 min)
1. https://vercel.com/new
2. Import: `mahi8026/Health_Care_E-commerce`
3. Root: `health-care`
4. Add environment variables (see DEPLOY_NOW.md)
5. Deploy!

### 5. Configure GitHub Secrets (10 min)
1. https://github.com/mahi8026/Health_Care_E-commerce/settings/secrets/actions
2. Add:
   - `VERCEL_TOKEN` (from https://vercel.com/account/tokens)
   - `VERCEL_ORG_ID`: `team_Vs50A8r6DWiPWiLHPpQ8spZF`
   - `VERCEL_PROJECT_ID`: `prj_fOVFeTY3DlsqXnyMEyi4nFdqUVuk`
   - Other public env vars

---

## 📋 Environment Variables Checklist

### Vercel (Frontend)
```
✓ NEXT_PUBLIC_API_URL
✓ NEXT_PUBLIC_SITE_URL
✓ NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
✓ NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
✓ NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET
✓ NEXT_PUBLIC_GA4_MEASUREMENT_ID
✓ NODE_ENV=production
✓ HUSKY=0
```

### Render (Backend)
```
✓ NODE_ENV=production
✓ PORT=5000
✓ FRONTEND_URL
✓ BACKEND_URL
✓ MONGODB_URI (NEW!)
✓ JWT_SECRET (NEW!)
✓ JWT_REFRESH_SECRET (NEW!)
✓ GOOGLE_CLIENT_ID (NEW!)
✓ GOOGLE_CLIENT_SECRET (NEW!)
✓ STRIPE_SECRET_KEY
✓ CLOUDINARY_API_SECRET (NEW!)
✓ REDIS_PASSWORD (NEW!)
✓ SMTP_USER
✓ SMTP_PASS
✓ CORS_ORIGINS
```

---

## 🔗 Important Links

### Deployment Platforms
- **Vercel Dashboard:** https://vercel.com/mahis-projects/health-care-e-commerce
- **Render Dashboard:** https://dashboard.render.com
- **GitHub Actions:** https://github.com/mahi8026/Health_Care_E-commerce/actions

### External Services
- **MongoDB Atlas:** https://cloud.mongodb.com/
- **Redis Cloud:** https://app.redislabs.com/
- **Cloudinary:** https://cloudinary.com/console
- **Stripe:** https://dashboard.stripe.com/
- **Google Cloud:** https://console.cloud.google.com/

### Your Deployed URLs
- **Frontend:** https://health-care-e-commerce-murex.vercel.app
- **Backend:** https://health-care-e-commerce.onrender.com
- **API Health:** https://health-care-e-commerce.onrender.com/api/health

---

## ✅ Verification Commands

```powershell
# Test backend health
curl https://health-care-e-commerce.onrender.com/api/health

# Test products API
curl https://health-care-e-commerce.onrender.com/api/products

# Test categories API
curl https://health-care-e-commerce.onrender.com/api/categories
```

---

## 🆘 Quick Troubleshooting

### Backend won't start
- Check Render logs
- Verify MongoDB connection string
- Check all env vars are set

### Frontend build fails
- Check Vercel logs
- Verify `HUSKY=0` is set
- Check API URL is correct

### CORS errors
- Update `CORS_ORIGINS` in Render
- Must match Vercel URL exactly
- No trailing slashes

### Database connection fails
- MongoDB Atlas → Network Access → Add `0.0.0.0/0`
- Check connection string format
- Verify user has read/write permissions

---

## 📚 Full Documentation

- **Complete Guide:** `DEPLOY_NOW.md`
- **Security Fix:** `SECURITY_FIX_URGENT.md`
- **Deployment Guide:** `DEPLOYMENT_GUIDE.md`
- **Checklist:** `DEPLOYMENT_CHECKLIST.md`

---

## ⏱️ Time Estimate

- Rotate secrets: 30 min
- Remove from git: 5 min
- Deploy backend: 20 min
- Deploy frontend: 15 min
- Configure GitHub: 10 min
- Verify: 10 min
- **Total: ~1.5 hours**

---

## 🎯 Success Criteria

- [ ] All secrets rotated
- [ ] .env files removed from git
- [ ] Backend deployed and responding
- [ ] Frontend deployed and loading
- [ ] Database connected
- [ ] Redis connected
- [ ] Images uploading to Cloudinary
- [ ] Stripe payments working
- [ ] Google OAuth working
- [ ] GitHub Actions passing

---

**Priority:** 🔴 CRITICAL
**Action:** ⚡ IMMEDIATE
**Status:** 🚨 SECURITY BREACH

**START NOW!**

