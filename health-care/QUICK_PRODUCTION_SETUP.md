# ⚡ Quick Production Setup Guide

## 🎯 Goal
Get MedCore BD running in production in 30 minutes.

---

## Step 1: Run Setup Script (2 minutes)

```bash
cd health-care
./setup-production.sh
```

This will create `.env.production.local` with your configuration.

---

## Step 2: Get Required Credentials (15 minutes)

### A. Stripe (5 min)
1. Go to https://dashboard.stripe.com/
2. Switch to **Live mode** (toggle top-right)
3. Go to **Developers → API keys**
4. Copy:
   - **Publishable key** → Add to `.env.production.local`
   - **Secret key** → Add to `backend/.env`

### B. Google Analytics (3 min)
1. Go to https://analytics.google.com/
2. Create GA4 property
3. Copy **Measurement ID** (G-XXXXXXXXXX)
4. Add to `.env.production.local`

### C. Email SMTP (5 min)

**Option 1 - Gmail (Easiest):**
1. Go to https://myaccount.google.com/apppasswords
2. Generate app password
3. Add to `backend/.env`:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

**Option 2 - SendGrid (Recommended):**
1. Sign up at https://sendgrid.com/
2. Create API key
3. Add to `backend/.env`:
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
```

### D. bKash (Optional - can do later)
1. Contact bKash merchant support
2. Get production credentials
3. Add to `backend/.env`

---

## Step 3: Update Backend Config (3 minutes)

Edit `backend/.env`:

```bash
cd backend
nano .env
```

Update these lines:
```env
NODE_ENV=production
CORS_ORIGIN=https://medcorebd.com
FRONTEND_URL=https://medcorebd.com
ADMIN_URL=https://medcorebd.com/admin

# Add your Stripe secret key
STRIPE_SECRET_KEY=sk_live_YOUR_KEY_HERE

# Add your SMTP settings (from Step 2C)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

---

## Step 4: Test Build Locally (5 minutes)

```bash
# Test frontend build
cd health-care
npm run build
npm start
# Visit http://localhost:3000

# Test backend
cd backend
NODE_ENV=production npm start
# Visit http://localhost:5000/api/health
```

---

## Step 5: Deploy (5 minutes)

### Option A: Vercel + Railway (Recommended)

**Frontend (Vercel):**
```bash
cd health-care
npm install -g vercel
vercel login
vercel --prod
```

**Backend (Railway):**
```bash
cd backend
npm install -g @railway/cli
railway login
railway init
railway up
```

### Option B: Single Server (DigitalOcean/AWS)

See `DEPLOYMENT_GUIDE.md` for detailed instructions.

---

## ✅ Verification Checklist

After deployment, verify:

- [ ] Website loads: https://medcorebd.com
- [ ] API health check: https://api.medcorebd.com/api/health
- [ ] Can register new user
- [ ] Can login
- [ ] Products load
- [ ] Can add to cart
- [ ] Can complete checkout
- [ ] Email notifications work
- [ ] SSL certificate valid (🔒 in browser)

---

## 🆘 Quick Troubleshooting

### "Cannot connect to API"
- Check `NEXT_PUBLIC_API_URL` in `.env.production.local`
- Verify backend is running
- Check CORS settings in `backend/.env`

### "Stripe not loading"
- Verify `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` is set
- Make sure it's a LIVE key (pk_live_...) not test key

### "Emails not sending"
- Check SMTP credentials in `backend/.env`
- Test with: `curl http://localhost:5000/api/health`
- Check backend logs for errors

### "Database connection failed"
- Verify MongoDB URI in `backend/.env`
- Check MongoDB Atlas IP whitelist
- Ensure database name is in URI: `/medcore-bd?`

---

## 📚 Need More Help?

- **Full Guide**: `DEPLOYMENT_GUIDE.md`
- **Checklist**: `PRODUCTION_CHECKLIST.md`
- **Audit Report**: `AUDIT_REPORT.md`

---

## 🎉 You're Done!

Your MedCore BD platform is now live in production!

**Next steps:**
1. Test all features thoroughly
2. Set up monitoring (PM2, Sentry, etc.)
3. Configure backups
4. Add real product images
5. Complete bKash integration
6. Train your team

**Questions?** Check the documentation or contact support.
