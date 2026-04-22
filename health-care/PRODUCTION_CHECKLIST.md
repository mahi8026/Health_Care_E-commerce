# 🚀 MedCore BD - Production Deployment Checklist

## ✅ Pre-Deployment (Do These First)

### 1. Environment Variables
- [ ] Create `.env.production.local` in frontend
- [ ] Update `backend/.env` with production values
- [ ] Set `NODE_ENV=production` in backend
- [ ] Configure CORS with production domain
- [ ] Add Stripe LIVE keys (not test keys!)
- [ ] Add bKash production credentials
- [ ] Configure SMTP for production emails

### 2. Security
- [ ] Verify JWT secrets are secure (✅ Already done)
- [ ] Remove test credentials from LoginPage
- [ ] Enable MongoDB IP whitelist
- [ ] Set up SSL certificates
- [ ] Configure firewall rules
- [ ] Review rate limiting settings

### 3. Code Changes
- [ ] Remove `console.log` statements (Next.js does this automatically)
- [ ] Test all payment flows
- [ ] Verify all API endpoints work
- [ ] Check mobile responsiveness
- [ ] Test with real data

---

## 🔧 Quick Setup Commands

### Run Setup Script:
```bash
cd health-care
./setup-production.sh
```

### Manual Setup:
```bash
# Frontend
cp .env.production .env.production.local
nano .env.production.local  # Edit with your values

# Backend
cd backend
nano .env  # Update with production values
```

---

## 📝 Required Credentials

### Stripe (https://dashboard.stripe.com/)
```
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### bKash (https://developer.bka.sh/)
```
BKASH_APP_KEY=...
BKASH_APP_SECRET=...
BKASH_USERNAME=...
BKASH_PASSWORD=...
```

### Google Analytics (https://analytics.google.com/)
```
NEXT_PUBLIC_GA4_MEASUREMENT_ID=G-...
```

### SMTP (Choose one)
**Gmail:**
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=app-password
```

**SendGrid:**
```
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-api-key
```

---

## 🧪 Testing Before Deployment

### 1. Build Test
```bash
# Frontend
cd health-care
npm run build
npm start

# Backend
cd backend
NODE_ENV=production npm start
```

### 2. Functionality Test
- [ ] User registration works
- [ ] Login/logout works
- [ ] Product browsing works
- [ ] Search and filters work
- [ ] Add to cart works
- [ ] Checkout flow completes
- [ ] Payment processing works
- [ ] Order tracking works
- [ ] Email notifications send
- [ ] PDF invoices generate
- [ ] Admin dashboard loads
- [ ] B2B dashboard loads

### 3. Performance Test
- [ ] Page load time < 3 seconds
- [ ] API response time < 500ms
- [ ] Images load properly
- [ ] No console errors
- [ ] Mobile view works

---

## 🚀 Deployment Commands

### Vercel (Frontend):
```bash
cd health-care
vercel --prod
```

### Railway (Backend):
```bash
cd health-care/backend
railway up
```

### PM2 (Self-hosted):
```bash
# Backend
cd health-care/backend
pm2 start src/server.js --name medcore-api
pm2 save

# Frontend
cd health-care
npm run build
pm2 start npm --name medcore-frontend -- start
pm2 save
```

---

## 📊 Post-Deployment

### 1. Verify Deployment
- [ ] Visit https://medcorebd.com
- [ ] Check https://api.medcorebd.com/api/health
- [ ] Test user registration
- [ ] Test payment with real card
- [ ] Check email delivery
- [ ] Monitor error logs

### 2. Setup Monitoring
- [ ] Configure PM2 monitoring (if using PM2)
- [ ] Set up uptime monitoring (e.g., UptimeRobot)
- [ ] Configure error tracking (e.g., Sentry)
- [ ] Set up log aggregation
- [ ] Enable Google Analytics

### 3. DNS & SSL
- [ ] Point domain to server
- [ ] Configure SSL certificate
- [ ] Test HTTPS redirect
- [ ] Verify www redirect

---

## 🆘 Troubleshooting

### Frontend Issues:
```bash
# Check build logs
npm run build

# Check runtime logs
pm2 logs medcore-frontend

# Restart
pm2 restart medcore-frontend
```

### Backend Issues:
```bash
# Check logs
pm2 logs medcore-api

# Test health endpoint
curl https://api.medcorebd.com/api/health

# Restart
pm2 restart medcore-api
```

### Database Issues:
```bash
# Check MongoDB Atlas dashboard
# Verify connection string
# Check IP whitelist
```

---

## 📞 Support Resources

- **Deployment Guide**: `DEPLOYMENT_GUIDE.md`
- **MongoDB Atlas**: https://cloud.mongodb.com/
- **Vercel Dashboard**: https://vercel.com/dashboard
- **Railway Dashboard**: https://railway.app/dashboard
- **Stripe Dashboard**: https://dashboard.stripe.com/
- **bKash Developer**: https://developer.bka.sh/

---

## 🎯 Success Criteria

Your deployment is successful when:
- ✅ Website loads at https://medcorebd.com
- ✅ API responds at https://api.medcorebd.com/api/health
- ✅ Users can register and login
- ✅ Products load from database
- ✅ Payments process successfully
- ✅ Emails send correctly
- ✅ No console errors
- ✅ SSL certificate is valid
- ✅ Mobile view works properly
- ✅ Admin dashboard accessible

---

**Ready to deploy? Start with the setup script:**
```bash
cd health-care
./setup-production.sh
```

Then follow the **DEPLOYMENT_GUIDE.md** for detailed instructions!
