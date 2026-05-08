# 🚀 MedCore BD - Deployment Documentation

## 📚 Available Guides

This project includes comprehensive deployment documentation:

### 1. **QUICK_DEPLOY.md** ⚡
**For:** Quick deployment in 5 minutes
**Use when:** You want to get the app live fast
- Step-by-step quick deployment
- Minimal configuration
- Get running immediately

### 2. **DEPLOYMENT_GUIDE.md** 📖
**For:** Complete deployment reference
**Use when:** You need detailed explanations
- Comprehensive setup instructions
- All configuration options explained
- Troubleshooting guide included
- Post-deployment verification steps

### 3. **DEPLOYMENT_CHECKLIST.md** ✅
**For:** Ensuring nothing is missed
**Use when:** You want to track progress
- Interactive checklist format
- Track completion status
- Verify all steps completed
- Perfect for team deployments

---

## 🎯 Quick Start

### Option 1: Fast Deploy (Recommended for First Time)
```bash
# Read the quick deploy guide
cat QUICK_DEPLOY.md

# Follow the 3 main steps:
# 1. Deploy Backend to Render (2 min)
# 2. Deploy Frontend to Vercel (2 min)
# 3. Verify Deployment (1 min)
```

### Option 2: Detailed Deploy (Recommended for Production)
```bash
# Read the comprehensive guide
cat DEPLOYMENT_GUIDE.md

# Follow all sections carefully
# Use the checklist to track progress
```

---

## 🌐 Deployment Targets

### Frontend (Vercel)
- **Platform:** Vercel
- **Framework:** Next.js 16
- **URL:** https://health-care-e-commerce-murex.vercel.app
- **Auto-deploy:** Yes (on push to main)

### Backend (Render)
- **Platform:** Render
- **Runtime:** Node.js
- **URL:** https://health-care-e-commerce.onrender.com
- **Auto-deploy:** Yes (on push to main)

---

## 📋 Prerequisites Checklist

Before deploying, ensure you have:

- [x] GitHub repository access
- [ ] Vercel account (free signup)
- [ ] Render account (free signup)
- [x] MongoDB Atlas database
- [x] Redis Cloud instance
- [x] Cloudinary account
- [x] Stripe account
- [x] Google OAuth credentials
- [ ] SMTP email service (Gmail recommended)

---

## 🔑 Required Environment Variables

### Backend (Render)
```
✅ Database: MONGODB_URI
✅ Cache: REDIS_HOST, REDIS_PORT, REDIS_PASSWORD
✅ Auth: JWT_SECRET, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
✅ Payment: STRIPE_SECRET_KEY
✅ Storage: CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
⚠️  Email: SMTP_USER, SMTP_PASS (needs configuration)
```

### Frontend (Vercel)
```
✅ API: NEXT_PUBLIC_API_URL
✅ Site: NEXT_PUBLIC_SITE_URL
✅ Payment: NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
✅ Storage: NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
✅ Analytics: NEXT_PUBLIC_GA4_MEASUREMENT_ID
```

---

## 🚦 Deployment Status

### Current Status
- **Code:** ✅ Ready for deployment
- **Tests:** ✅ All passing
- **Configuration:** ✅ Files prepared
- **Documentation:** ✅ Complete

### Deployment Steps Status
- [ ] Backend deployed to Render
- [ ] Frontend deployed to Vercel
- [ ] GitHub Actions configured
- [ ] Environment variables set
- [ ] External services configured
- [ ] Deployment verified
- [ ] Monitoring set up

---

## 📞 Support & Resources

### Documentation
- [Quick Deploy Guide](./QUICK_DEPLOY.md)
- [Complete Deployment Guide](./DEPLOYMENT_GUIDE.md)
- [Deployment Checklist](./DEPLOYMENT_CHECKLIST.md)

### Platform Documentation
- [Vercel Docs](https://vercel.com/docs)
- [Render Docs](https://render.com/docs)
- [Next.js Docs](https://nextjs.org/docs)

### External Services
- [MongoDB Atlas](https://www.mongodb.com/docs/atlas/)
- [Redis Cloud](https://redis.io/docs/latest/operate/rc/)
- [Cloudinary](https://cloudinary.com/documentation)
- [Stripe](https://stripe.com/docs)

---

## 🔄 Continuous Deployment

### Automatic Deployment
Every push to `main` branch triggers:
1. ✅ Lint and test checks
2. ✅ Frontend deployment to Vercel
3. ✅ Backend deployment to Render
4. ✅ Post-deployment health checks

### Manual Deployment
```bash
# Frontend only
cd health-care
vercel --prod

# Backend redeploy
# Go to Render Dashboard → Manual Deploy
```

---

## 🛠️ Troubleshooting

### Common Issues

**Backend not responding:**
- Check Render logs
- Verify MongoDB connection
- Check environment variables

**CORS errors:**
- Update CORS_ORIGINS in backend
- Verify frontend URL matches

**Build fails:**
- Check build logs
- Verify all dependencies
- Ensure HUSKY=0 is set

**For detailed troubleshooting, see DEPLOYMENT_GUIDE.md**

---

## 📊 Monitoring

### Health Endpoints
```bash
# Backend health
curl https://health-care-e-commerce.onrender.com/api/health

# Frontend
curl https://health-care-e-commerce-murex.vercel.app
```

### Logs
- **Render:** Dashboard → Logs
- **Vercel:** Dashboard → Deployments → Function Logs

---

## 🎉 Post-Deployment

After successful deployment:

1. ✅ Test all major features
2. ✅ Verify payment integration
3. ✅ Check email functionality
4. ✅ Monitor error logs
5. ✅ Set up uptime monitoring
6. ✅ Configure alerts
7. ✅ Update team documentation

---

## 🔐 Security Notes

- ✅ All secrets stored in environment variables
- ✅ No .env files in repository
- ✅ HTTPS enforced on all services
- ✅ CORS properly configured
- ✅ Rate limiting enabled
- ✅ Input validation active

---

## 📈 Next Steps

1. **Immediate:**
   - Deploy to staging/production
   - Verify all functionality
   - Set up monitoring

2. **Short-term:**
   - Configure custom domain
   - Enable production Stripe keys
   - Set up email service
   - Configure SMS service

3. **Long-term:**
   - Scale infrastructure as needed
   - Optimize performance
   - Add additional features
   - Implement advanced monitoring

---

## 📝 Version History

- **v1.0.0** (May 8, 2026) - Initial deployment documentation
  - Complete deployment guides created
  - All configuration files prepared
  - GitHub Actions workflow configured

---

## 👥 Team

For deployment support, contact:
- **DevOps:** Check Render/Vercel dashboards
- **Backend:** Check API logs and database
- **Frontend:** Check Vercel deployment logs

---

**Last Updated:** May 8, 2026
**Status:** Ready for Deployment ✅
