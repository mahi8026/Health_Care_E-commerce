# 🚀 MedCore BD - Deployment Documentation

## 📌 Quick Navigation

### 🔴 **URGENT - Start Here:**
- **[START_HERE.md](START_HERE.md)** - Main entry point, read this first!

### ⚡ **Quick Deployment:**
- **[QUICK_DEPLOY_REFERENCE.md](QUICK_DEPLOY_REFERENCE.md)** - Quick reference card
- **[DEPLOY_NOW.md](DEPLOY_NOW.md)** - Step-by-step deployment guide

### 🔒 **Security:**
- **[SECURITY_FIX_URGENT.md](SECURITY_FIX_URGENT.md)** - Critical security fix guide

### 📚 **Detailed Guides:**
- **[DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)** - Comprehensive deployment guide
- **[DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)** - Detailed checklist
- **[DEPLOYMENT_STATUS.md](DEPLOYMENT_STATUS.md)** - Current deployment status
- **[DEPLOYMENT_FIXED.md](DEPLOYMENT_FIXED.md)** - What was fixed

### 🛠️ **Scripts:**
- **[generate-secrets.ps1](generate-secrets.ps1)** - Generate new secrets
- **[remove-env-from-git.ps1](remove-env-from-git.ps1)** - Remove .env from Git

---

## 🎯 What You Need to Know

### The Situation:
GitGuardian detected **exposed secrets** in your GitHub repository. Your API keys and credentials are publicly visible and need to be rotated immediately.

### The Solution:
1. Rotate all compromised secrets
2. Remove .env files from Git
3. Deploy to Vercel (frontend) and Render (backend)
4. Configure GitHub Actions for CI/CD

### Time Required:
~1.5-2 hours total

---

## 🚀 Quick Start

### Option 1: Fast Track (Recommended)
```powershell
# 1. Generate new secrets
.\generate-secrets.ps1

# 2. Remove .env from Git
.\remove-env-from-git.ps1

# 3. Follow the deployment guide
# Open: DEPLOY_NOW.md
```

### Option 2: Read First
```
1. Read: START_HERE.md
2. Read: QUICK_DEPLOY_REFERENCE.md
3. Follow: DEPLOY_NOW.md
```

---

## 📋 Documentation Structure

```
📁 Health Care/
│
├── 🔴 START_HERE.md                    ← Read this first!
│
├── ⚡ Quick Deployment
│   ├── QUICK_DEPLOY_REFERENCE.md      ← Quick reference
│   └── DEPLOY_NOW.md                  ← Step-by-step guide
│
├── 🔒 Security
│   └── SECURITY_FIX_URGENT.md         ← Security fix details
│
├── 📚 Detailed Guides
│   ├── DEPLOYMENT_GUIDE.md            ← Comprehensive guide
│   ├── DEPLOYMENT_CHECKLIST.md        ← Detailed checklist
│   ├── DEPLOYMENT_STATUS.md           ← Current status
│   └── DEPLOYMENT_FIXED.md            ← What was fixed
│
├── 🛠️ Scripts
│   ├── generate-secrets.ps1           ← Generate secrets
│   └── remove-env-from-git.ps1        ← Remove .env files
│
├── 📝 Templates
│   ├── health-care/.env.example       ← Frontend template
│   └── health-care/backend/.env.example ← Backend template
│
└── 📖 This File
    └── README_DEPLOYMENT.md           ← You are here
```

---

## ✅ Deployment Checklist

### Phase 1: Security (35 min)
- [ ] Generate new JWT secrets
- [ ] Rotate Cloudinary API secret
- [ ] Rotate Google OAuth credentials
- [ ] Rotate MongoDB password
- [ ] Rotate Redis password
- [ ] Remove .env files from Git
- [ ] Push changes to GitHub

### Phase 2: Backend Deployment (20 min)
- [ ] Create Render Web Service
- [ ] Configure service settings
- [ ] Add environment variables
- [ ] Deploy backend
- [ ] Verify health endpoint

### Phase 3: Frontend Deployment (15 min)
- [ ] Import project to Vercel
- [ ] Configure project settings
- [ ] Add environment variables
- [ ] Deploy frontend
- [ ] Verify site loads

### Phase 4: CI/CD Setup (10 min)
- [ ] Create Vercel token
- [ ] Add GitHub secrets
- [ ] Test workflow
- [ ] Verify auto-deployment

### Phase 5: External Services (15 min)
- [ ] Update Google OAuth URIs
- [ ] Configure Stripe webhooks
- [ ] Configure MongoDB network access
- [ ] Test all integrations

### Phase 6: Verification (10 min)
- [ ] Test backend API
- [ ] Test frontend
- [ ] Test database connection
- [ ] Test Redis connection
- [ ] Test image uploads
- [ ] Test payments
- [ ] Test OAuth
- [ ] Check logs

---

## 🔗 Important Links

### Your Project
- **GitHub:** https://github.com/mahi8026/Health_Care_E-commerce
- **Vercel Dashboard:** https://vercel.com/mahis-projects/health-care-e-commerce
- **Render Dashboard:** https://dashboard.render.com

### Deployed URLs
- **Frontend:** https://health-care-e-commerce-murex.vercel.app
- **Backend:** https://health-care-e-commerce.onrender.com
- **API Health:** https://health-care-e-commerce.onrender.com/api/health

### External Services
- **MongoDB Atlas:** https://cloud.mongodb.com/
- **Redis Cloud:** https://app.redislabs.com/
- **Cloudinary:** https://cloudinary.com/console
- **Stripe:** https://dashboard.stripe.com/
- **Google Cloud:** https://console.cloud.google.com/

---

## 🆘 Troubleshooting

### Common Issues

**Backend won't start:**
- Check Render logs
- Verify MongoDB connection string
- Check all environment variables are set

**Frontend build fails:**
- Check Vercel logs
- Verify `HUSKY=0` is set
- Check API URL is correct

**CORS errors:**
- Update `CORS_ORIGINS` in Render
- Must match Vercel URL exactly
- No trailing slashes

**Database connection fails:**
- MongoDB Atlas → Network Access → Add `0.0.0.0/0`
- Check connection string format
- Verify user has read/write permissions

**Redis connection fails:**
- Check Redis Cloud dashboard
- Verify host, port, and password
- App works without Redis (graceful fallback)

---

## 📞 Support

### Documentation
- All guides are in this folder
- Start with `START_HERE.md`
- Use `QUICK_DEPLOY_REFERENCE.md` for quick lookups

### Platform Support
- **Vercel:** https://vercel.com/support
- **Render:** https://render.com/docs
- **MongoDB:** https://www.mongodb.com/support
- **Stripe:** https://support.stripe.com/

---

## 🎯 Success Criteria

Your deployment is successful when:

✅ All secrets rotated and secure
✅ .env files not in Git repository
✅ Backend deployed and responding
✅ Frontend deployed and loading
✅ Database connected
✅ Redis connected (optional)
✅ Images uploading to Cloudinary
✅ Stripe payments working
✅ Google OAuth working
✅ GitHub Actions passing
✅ Auto-deployment working

---

## 📊 Project Information

**Project Name:** MedCore BD
**Type:** Medical E-commerce Platform
**Tech Stack:**
- Frontend: Next.js 16, React 19, Tailwind CSS 4
- Backend: Node.js, Express, MongoDB, Redis
- Deployment: Vercel (Frontend), Render (Backend)
- CI/CD: GitHub Actions

**Repository:** mahi8026/Health_Care_E-commerce
**Vercel Org:** team_Vs50A8r6DWiPWiLHPpQ8spZF
**Vercel Project:** prj_fOVFeTY3DlsqXnyMEyi4nFdqUVuk

---

## 🎓 What You'll Learn

By completing this deployment, you'll learn:
- How to secure sensitive credentials
- How to deploy full-stack applications
- How to set up CI/CD pipelines
- How to configure external services
- How to monitor production applications
- Best practices for environment variables
- How to troubleshoot deployment issues

---

## 💡 Best Practices

### Security
- Never commit .env files
- Rotate secrets regularly
- Use different secrets for dev/staging/prod
- Enable 2FA on all accounts
- Use secret scanning tools

### Deployment
- Test locally before deploying
- Use staging environment
- Monitor logs after deployment
- Set up uptime monitoring
- Have a rollback plan

### Development
- Use .env.example for templates
- Document all environment variables
- Keep dependencies updated
- Write tests
- Use linting and formatting

---

## 🚀 Ready to Deploy?

**Your next action:**

1. Open `START_HERE.md`
2. Choose your path (Quick or Detailed)
3. Follow the guide step-by-step
4. Don't skip the security steps!

**Or run the scripts:**

```powershell
# Navigate to project
cd "c:\Projects\Health Care"

# Generate new secrets
.\generate-secrets.ps1

# Remove .env from Git
.\remove-env-from-git.ps1

# Continue with DEPLOY_NOW.md
```

---

## 📝 Notes

- All documentation is up to date as of May 8, 2026
- Scripts are tested and working
- Configuration files are verified
- All links are current

---

## 🎉 Final Words

You have everything you need to deploy successfully:
- ✅ Comprehensive documentation
- ✅ Step-by-step guides
- ✅ Automated scripts
- ✅ Quick reference cards
- ✅ Troubleshooting guides

**The only thing left is to start!**

**Open `START_HERE.md` and begin your deployment journey!** 🚀

---

**Priority:** 🔴 CRITICAL
**Status:** ✅ READY TO DEPLOY
**Action:** 🚀 START NOW

**Good luck!** 💪

