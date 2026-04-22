# 🔐 Environment Variables Guide

## 📋 Overview

This guide explains how to properly manage environment variables for MedCore BD.

---

## 🗂️ File Structure

```
health-care/
├── .env.example              # Frontend template (COMMIT THIS)
├── .env.local                # Frontend development (DO NOT COMMIT)
├── .env.production           # Frontend production template (COMMIT THIS)
├── .env.production.local     # Frontend production secrets (DO NOT COMMIT)
└── backend/
    ├── .env.example          # Backend template (COMMIT THIS)
    ├── .env                  # Backend actual values (DO NOT COMMIT)
    └── .env.production       # Backend production template (COMMIT THIS)
```

---

## 🚀 Quick Setup

### For Development:

```bash
# Frontend
cd health-care
cp .env.example .env.local
nano .env.local  # Edit with your values

# Backend
cd backend
cp .env.example .env
nano .env  # Edit with your values
```

### For Production:

```bash
# Frontend
cd health-care
cp .env.production .env.production.local
nano .env.production.local  # Edit with production values

# Backend
cd backend
nano .env  # Update with production values
```

---

## 📝 Variable Descriptions

### Frontend Variables

#### **NEXT_PUBLIC_API_URL** (Required)
- **Development**: `http://localhost:5000/api`
- **Production**: `https://api.medcorebd.com/api`
- **Note**: Must include `/api` at the end

#### **NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY** (Required)
- **Development**: `pk_test_...` (test key)
- **Production**: `pk_live_...` (live key)
- **Get from**: https://dashboard.stripe.com/apikeys

#### **NEXT_PUBLIC_GA4_MEASUREMENT_ID** (Optional)
- **Format**: `G-XXXXXXXXXX`
- **Get from**: https://analytics.google.com/

#### **NEXT_PUBLIC_SITE_URL** (Required)
- **Development**: `http://localhost:3000`
- **Production**: `https://medcorebd.com`

#### **Feature Flags** (Optional)
- `NEXT_PUBLIC_ENABLE_STRIPE=true`
- `NEXT_PUBLIC_ENABLE_BKASH=true`
- `NEXT_PUBLIC_ENABLE_NAGAD=true`
- `NEXT_PUBLIC_ENABLE_B2B_CREDIT=true`
- `NEXT_PUBLIC_ENABLE_ANALYTICS=true`

---

### Backend Variables

#### **PORT** (Required)
- **Default**: `5000`
- **Production**: Usually `5000` or `8080`

#### **NODE_ENV** (Required)
- **Development**: `development`
- **Production**: `production`

#### **MONGODB_URI** (Required)
- **Format**: `mongodb+srv://username:password@cluster.mongodb.net/database?options`
- **Get from**: MongoDB Atlas dashboard

#### **JWT_SECRET** (Required)
- **Generate with**: 
  ```bash
  node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
  ```
- **Must be**: 128 characters (64 bytes hex)

#### **JWT_REFRESH_SECRET** (Required)
- **Generate with**: Same command as JWT_SECRET
- **Must be**: Different from JWT_SECRET

#### **CORS_ORIGIN** (Required)
- **Development**: `http://localhost:3000`
- **Production**: `https://medcorebd.com`

#### **STRIPE_SECRET_KEY** (Required)
- **Development**: `sk_test_...`
- **Production**: `sk_live_...`
- **Get from**: https://dashboard.stripe.com/apikeys

#### **SMTP Settings** (Required for emails)
- **SMTP_HOST**: `smtp.gmail.com` or `smtp.sendgrid.net`
- **SMTP_PORT**: `587`
- **SMTP_USER**: Your email or API key
- **SMTP_PASS**: Your password or API key

#### **bKash Credentials** (Optional)
- **BKASH_APP_KEY**: From bKash merchant portal
- **BKASH_APP_SECRET**: From bKash merchant portal
- **BKASH_USERNAME**: From bKash merchant portal
- **BKASH_PASSWORD**: From bKash merchant portal

---

## 🔒 Security Best Practices

### ✅ DO:
- Use `.env.example` files as templates
- Keep `.env` files in `.gitignore`
- Use different values for development and production
- Rotate secrets regularly
- Use strong, random JWT secrets
- Store production secrets in hosting platform (Vercel, Railway, etc.)

### ❌ DON'T:
- Commit `.env` files to Git
- Share `.env` files via email or chat
- Use weak or predictable secrets
- Use production credentials in development
- Hardcode secrets in source code
- Use the same JWT secret for multiple environments

---

## 🔄 Updating Environment Variables

### Local Development:
1. Edit `.env.local` or `backend/.env`
2. Restart the development server
3. Changes take effect immediately

### Production (Vercel):
1. Go to Vercel Dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Add/Update variables
5. Redeploy the application

### Production (Railway):
1. Go to Railway Dashboard
2. Select your project
3. Go to Variables tab
4. Add/Update variables
5. Railway auto-redeploys

### Production (Self-hosted):
1. SSH into your server
2. Edit `.env` files
3. Restart services:
   ```bash
   pm2 restart medcore-api
   pm2 restart medcore-frontend
   ```

---

## 🧪 Testing Environment Variables

### Frontend:
```bash
cd health-care
npm run build
npm start
# Check if variables are loaded correctly
```

### Backend:
```bash
cd backend
node -e "require('dotenv').config(); console.log(process.env.MONGODB_URI)"
# Should print your MongoDB URI
```

---

## 🆘 Troubleshooting

### "Environment variable not found"
- Check file name: `.env.local` not `.env`
- Restart development server
- Verify variable name starts with `NEXT_PUBLIC_` for frontend

### "Cannot connect to database"
- Check `MONGODB_URI` is correct
- Verify MongoDB Atlas IP whitelist
- Ensure database name is in URI

### "Stripe not loading"
- Verify `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` is set
- Check it's a valid Stripe key (starts with `pk_`)
- Restart Next.js dev server

### "CORS error"
- Check `CORS_ORIGIN` matches frontend URL
- Verify `FRONTEND_URL` is correct
- Restart backend server

---

## 📚 Additional Resources

- **Next.js Environment Variables**: https://nextjs.org/docs/basic-features/environment-variables
- **MongoDB Connection Strings**: https://docs.mongodb.com/manual/reference/connection-string/
- **Stripe API Keys**: https://stripe.com/docs/keys
- **bKash Developer Portal**: https://developer.bka.sh/

---

## 🔐 Secrets Checklist

Before going to production, ensure:

- [ ] All `.env` files are in `.gitignore`
- [ ] JWT secrets are strong and random
- [ ] Production uses LIVE Stripe keys
- [ ] CORS is configured for production domain
- [ ] SMTP is configured for production emails
- [ ] MongoDB IP whitelist includes production server
- [ ] All secrets are stored securely (not in code)
- [ ] Team members have access to secrets vault
- [ ] Backup of production `.env` exists (encrypted)

---

**Need help?** Check `DEPLOYMENT_GUIDE.md` or `QUICK_PRODUCTION_SETUP.md`
