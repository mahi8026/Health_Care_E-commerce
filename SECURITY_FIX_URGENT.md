# 🚨 URGENT SECURITY FIX REQUIRED

## Date: May 8, 2026
## Status: **CRITICAL - IMMEDIATE ACTION REQUIRED**

---

## ⚠️ SECURITY BREACH DETECTED

GitGuardian has detected **2 internal secret incidents** in your repository:

1. **Cloudinary API keys** - Exposed in commits
2. **Google OAuth2 Keys** - Exposed in commits

### Additional Exposed Secrets Found:
- MongoDB connection string with credentials
- JWT secrets
- Redis password
- Stripe API keys
- SMTP credentials

---

## 🔥 IMMEDIATE ACTIONS REQUIRED

### Step 1: Rotate ALL Compromised Credentials (DO THIS NOW!)

#### 1.1 Cloudinary
1. Go to: https://cloudinary.com/console/settings/security
2. Click "Regenerate API Secret"
3. Update the new secret in Vercel and Render (NOT in code)

#### 1.2 Google OAuth2
1. Go to: https://console.cloud.google.com/apis/credentials
2. Delete the compromised OAuth 2.0 Client ID
3. Create a new OAuth 2.0 Client ID
4. Update the new credentials in Vercel and Render (NOT in code)

#### 1.3 MongoDB Atlas
1. Go to: https://cloud.mongodb.com/
2. Database Access → Delete user `Health_Care_E-commerce`
3. Create new user with strong password
4. Update connection string in Render (NOT in code)

#### 1.4 Redis Cloud
1. Go to: https://app.redislabs.com/
2. Change database password
3. Update in Render (NOT in code)

#### 1.5 Stripe
1. Go to: https://dashboard.stripe.com/apikeys
2. Roll keys (click "Roll key" for both Secret and Publishable keys)
3. Update in Vercel and Render (NOT in code)

#### 1.6 JWT Secrets
Generate new secrets:
```bash
# Run these commands to generate new secrets
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```
Update in Render (NOT in code)

---

### Step 2: Remove Secrets from Git History

**CRITICAL:** The secrets are in your git history. You need to remove them.

#### Option A: Use BFG Repo-Cleaner (Recommended)

```bash
# 1. Download BFG
# Go to: https://rtyley.github.io/bfg-repo-cleaner/

# 2. Create a file with secrets to remove
# Create secrets.txt with patterns like:
# ibQkT9ppTdivDtXt
# TPAt1OgyLGu3vHBwPIRmt0jgbr8
# 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
# etc.

# 3. Run BFG
java -jar bfg.jar --replace-text secrets.txt Health_Care_E-commerce.git

# 4. Clean up
cd Health_Care_E-commerce.git
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# 5. Force push (WARNING: This rewrites history)
git push --force
```

#### Option B: Delete and Recreate Repository (Simpler but loses history)

```bash
# 1. Backup your code locally
# 2. Delete the GitHub repository
# 3. Create a new repository
# 4. Push clean code (without .env files)
```

---

### Step 3: Fix .gitignore and Remove .env Files from Repo

The .env files should NEVER be in the repository!

```bash
# Remove .env files from git tracking
git rm --cached health-care/.env.local
git rm --cached health-care/.env.production
git rm --cached health-care/backend/.env
git rm --cached health-care/backend/.env.production

# Commit the removal
git commit -m "security: remove exposed .env files from repository"

# Push
git push origin main
```

---

### Step 4: Create .env.example Files (Safe Templates)

Create template files WITHOUT real secrets:

**health-care/.env.example:**
```env
# Frontend Environment Variables Template
NEXT_PUBLIC_API_URL=https://your-backend-url.com/api
NEXT_PUBLIC_SITE_URL=https://your-frontend-url.com
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_preset
NEXT_PUBLIC_GA4_MEASUREMENT_ID=G-XXXXXXXXXX
```

**health-care/backend/.env.example:**
```env
# Backend Environment Variables Template
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database
JWT_SECRET=generate_with_crypto_randomBytes
JWT_REFRESH_SECRET=generate_with_crypto_randomBytes
GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret
STRIPE_SECRET_KEY=sk_test_your_key
CLOUDINARY_API_SECRET=your_secret
REDIS_PASSWORD=your_password
```

---

## ✅ PROPER DEPLOYMENT SETUP

### Vercel Environment Variables

Go to: https://vercel.com/mahis-projects/health-care-e-commerce/settings/environment-variables

Add these (with NEW rotated values):

```
NEXT_PUBLIC_API_URL=https://health-care-e-commerce.onrender.com/api
NEXT_PUBLIC_SITE_URL=https://health-care-e-commerce-murex.vercel.app
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=<NEW_STRIPE_PUBLISHABLE_KEY>
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=dm8eqxwlz
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=ml_default
NEXT_PUBLIC_GA4_MEASUREMENT_ID=G-VCQNJESVNM
NEXT_PUBLIC_ENABLE_STRIPE=true
NEXT_PUBLIC_ENABLE_BKASH=true
NEXT_PUBLIC_ENABLE_NAGAD=true
NEXT_PUBLIC_ENABLE_B2B_CREDIT=true
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_WHATSAPP_NUMBER=8801646886795
NODE_ENV=production
HUSKY=0
```

### Render Environment Variables

Go to: https://dashboard.render.com → Your Service → Environment

Add these (with NEW rotated values):

```
NODE_ENV=production
PORT=5000
FRONTEND_URL=https://health-care-e-commerce-murex.vercel.app
BACKEND_URL=https://health-care-e-commerce.onrender.com
MONGODB_URI=<NEW_MONGODB_CONNECTION_STRING>
JWT_SECRET=<NEW_JWT_SECRET>
JWT_REFRESH_SECRET=<NEW_JWT_REFRESH_SECRET>
GOOGLE_CLIENT_ID=<NEW_GOOGLE_CLIENT_ID>
GOOGLE_CLIENT_SECRET=<NEW_GOOGLE_CLIENT_SECRET>
STRIPE_SECRET_KEY=<NEW_STRIPE_SECRET_KEY>
STRIPE_PUBLISHABLE_KEY=<NEW_STRIPE_PUBLISHABLE_KEY>
CLOUDINARY_CLOUD_NAME=dm8eqxwlz
CLOUDINARY_API_KEY=397344892624316
CLOUDINARY_API_SECRET=<NEW_CLOUDINARY_API_SECRET>
REDIS_HOST=redis-19674.c264.ap-south-1-1.ec2.cloud.redislabs.com
REDIS_PORT=19674
REDIS_PASSWORD=<NEW_REDIS_PASSWORD>
REDIS_DB=0
REDIS_TTL=3600
CORS_ORIGINS=https://health-care-e-commerce-murex.vercel.app
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=<YOUR_EMAIL>
SMTP_PASS=<YOUR_APP_PASSWORD>
EMAIL_FROM=noreply@medcorebd.com
EMAIL_FROM_NAME=MedCore BD
```

### GitHub Secrets

Go to: https://github.com/mahi8026/Health_Care_E-commerce/settings/secrets/actions

Add these:

```
VERCEL_TOKEN=<get_from_vercel.com/account/tokens>
VERCEL_ORG_ID=team_Vs50A8r6DWiPWiLHPpQ8spZF
VERCEL_PROJECT_ID=prj_fOVFeTY3DlsqXnyMEyi4nFdqUVuk
NEXT_PUBLIC_API_URL=https://health-care-e-commerce.onrender.com/api
NEXT_PUBLIC_SITE_URL=https://health-care-e-commerce-murex.vercel.app
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=<NEW_STRIPE_PUBLISHABLE_KEY>
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=dm8eqxwlz
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=ml_default
```

---

## 📋 DEPLOYMENT CHECKLIST

### Before Deploying:

- [ ] All secrets rotated
- [ ] .env files removed from git
- [ ] .env.example files created
- [ ] Git history cleaned (optional but recommended)
- [ ] Environment variables set in Vercel
- [ ] Environment variables set in Render
- [ ] GitHub secrets configured

### Deploy Backend to Render:

1. [ ] Go to https://dashboard.render.com
2. [ ] Click "New +" → "Web Service"
3. [ ] Connect GitHub: `mahi8026/Health_Care_E-commerce`
4. [ ] Configure:
   - Name: `health-care-backend`
   - Region: `Singapore`
   - Branch: `main`
   - Root Directory: `health-care/backend`
   - Build Command: `npm install`
   - Start Command: `npm start`
5. [ ] Add all environment variables (see above)
6. [ ] Click "Create Web Service"
7. [ ] Wait for deployment
8. [ ] Test: `curl https://health-care-e-commerce.onrender.com/api/health`

### Deploy Frontend to Vercel:

1. [ ] Go to https://vercel.com/new
2. [ ] Import: `mahi8026/Health_Care_E-commerce`
3. [ ] Configure:
   - Framework: `Next.js`
   - Root Directory: `health-care`
   - Build Command: `npm run build`
   - Install Command: `npm install`
4. [ ] Add all environment variables (see above)
5. [ ] Click "Deploy"
6. [ ] Wait for deployment
7. [ ] Test: Visit `https://health-care-e-commerce-murex.vercel.app`

### Verify Deployment:

- [ ] Frontend loads without errors
- [ ] Backend API responds
- [ ] Database connection works
- [ ] Redis cache works
- [ ] Image uploads work (Cloudinary)
- [ ] Stripe payments work
- [ ] Google OAuth works
- [ ] Email sending works

---

## 🔒 SECURITY BEST PRACTICES GOING FORWARD

### 1. Never Commit Secrets
- Always use `.env.example` for templates
- Never commit `.env` files
- Use environment variables in CI/CD

### 2. Use Secret Scanning
- Enable GitHub secret scanning
- Use GitGuardian or similar tools
- Set up pre-commit hooks

### 3. Rotate Secrets Regularly
- Rotate production secrets every 90 days
- Use different secrets for dev/staging/prod
- Document rotation procedures

### 4. Use Secret Management
- Consider using HashiCorp Vault
- Or AWS Secrets Manager
- Or Azure Key Vault

### 5. Audit Access
- Review who has access to secrets
- Use principle of least privilege
- Enable 2FA on all accounts

---

## 📞 SUPPORT

If you need help:
1. Vercel Support: https://vercel.com/support
2. Render Support: https://render.com/docs
3. GitHub Security: https://docs.github.com/en/code-security

---

## ⏱️ TIME ESTIMATE

- Rotating secrets: 30-45 minutes
- Cleaning git history: 15-30 minutes
- Setting up deployments: 30-45 minutes
- **Total: 1.5-2 hours**

---

**PRIORITY: CRITICAL**
**ACTION: IMMEDIATE**
**DO NOT DELAY - YOUR SECRETS ARE PUBLIC!**

