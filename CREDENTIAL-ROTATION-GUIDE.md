# 🔐 Credential Rotation Quick Action Guide

**Status**: 🚨 REQUIRED BEFORE FULL PRODUCTION LAUNCH  
**Time Required**: ~30-45 minutes  
**Priority**: CRITICAL

---

## ✅ Pre-Rotation Checklist

- [ ] Backup current `.env` files (save locally, NOT in git)
- [ ] Coordinate with team (if applicable)
- [ ] Schedule maintenance window (if already in production)
- [ ] Have access to all service dashboards

---

## 🔄 Step-by-Step Rotation Process

### 1. MongoDB Atlas Password ✅ DONE

**Status**: ✅ Password rotated — new password applied to `.env` and `.env.production`

**Current Location**: `MONGODB_URI` in backend `.env`

```bash
# Steps:
1. Login to MongoDB Atlas: https://cloud.mongodb.com
2. Navigate to: Database Access → Edit User
3. Click "Edit Password" → "Autogenerate Secure Password"
4. Copy new password
5. Update MONGODB_URI in backend/.env:
   mongodb+srv://username:NEW_PASSWORD@cluster.mongodb.net/medcore
```

**Test**:
```bash
cd health-care/backend
npm run diagnose  # Should connect successfully
```

---

### 2. JWT Secrets ✅ DONE

**Status**: ✅ New 128-char hex secrets generated and applied to `.env` and `.env.production`

> ⚠️ All existing user sessions are now invalidated — users will need to log in again.

**Current Location**: `JWT_SECRET` and `JWT_REFRESH_SECRET` in backend `.env`

```bash
# Generate new secrets (run twice):
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Update in backend/.env:
JWT_SECRET=<first_generated_secret>
JWT_REFRESH_SECRET=<second_generated_secret>
```

**Note**: All existing user sessions will be invalidated. Users must re-login.

---

### 3. Cloudinary API Secret ✅ DONE

**Status**: ✅ New API key (`786772158861556`) and secret applied to `.env` and `.env.production`

> Old Root key (`397344892624316`) can be disabled in Cloudinary dashboard once you've verified uploads work.

**Current Location**: `CLOUDINARY_API_SECRET` in backend `.env`

```bash
# Steps:
1. Login to Cloudinary: https://cloudinary.com/console
2. Navigate to: Settings → Security
3. Click "Regenerate API Secret"
4. Copy new secret
5. Update in backend/.env:
   CLOUDINARY_API_SECRET=<new_secret>
```

**Test**:
```bash
# Upload a test image through admin panel
# Should work without errors
```

---

### 4. Redis Password ✅ DONE

**Status**: ✅ New password set in Redis Cloud and applied to `.env` and `.env.production`. Redis now connects successfully.

**Current Location**: `REDIS_URL` in backend `.env`

```bash
# If using Redis Cloud:
1. Login to Redis Cloud: https://app.redislabs.com
2. Navigate to: Database → Configuration
3. Click "Change Password"
4. Copy new password
5. Update REDIS_URL in backend/.env:
   redis://:NEW_PASSWORD@redis-host:port

# If using Upstash:
1. Login to Upstash: https://console.upstash.com
2. Navigate to: Database → Details
3. Click "Rotate Password"
4. Copy new connection string
5. Update REDIS_URL in backend/.env
```

**Test**:
```bash
# Backend should start without Redis errors
npm run dev
```

---

### 5. Google OAuth Credentials ✅ DONE

**Status**: ✅ New Client ID and Secret applied to `.env` and `.env.production`
**Redirect URIs configured**:
- `http://localhost:5001/api/auth/google/callback` ✅
- `https://health-care-e-commerce.onrender.com/api/auth/google/callback` ✅
**JS Origins configured**:
- `http://localhost:3000` ✅
- `https://health-care-e-commerce-murex.vercel.app` ✅

**Current Location**: `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in backend `.env`

```bash
# Steps:
1. Login to Google Cloud Console: https://console.cloud.google.com
2. Navigate to: APIs & Services → Credentials
3. Find your OAuth 2.0 Client ID
4. Click "Delete" (or create new one)
5. Click "Create Credentials" → "OAuth 2.0 Client ID"
6. Application type: Web application
7. Authorized redirect URIs:
   - http://localhost:3000/auth/google/callback (dev)
   - https://medcorebd.com/auth/google/callback (prod)
8. Copy Client ID and Client Secret
9. Update in backend/.env:
   GOOGLE_CLIENT_ID=<new_client_id>
   GOOGLE_CLIENT_SECRET=<new_client_secret>
```

**Test**:
```bash
# Try Google OAuth login on frontend
# Should redirect and authenticate successfully
```

---

### 6. Twilio Credentials ✅ DONE

**Status**: ✅ New API Key (SK...) applied to `.env` and `.env.production`. Backend updated to support API Key auth (more secure than Auth Token). Old Auth Token cleared.

**Current Location**: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER` in backend `.env`

```bash
# Steps:
1. Login to Twilio Console: https://console.twilio.com
2. Navigate to: Account → API Keys & Tokens
3. Click "Create new API Key"
4. Key type: Standard
5. Copy SID and Secret
6. Update in backend/.env:
   TWILIO_ACCOUNT_SID=<new_sid>
   TWILIO_AUTH_TOKEN=<new_token>
   # TWILIO_PHONE_NUMBER stays the same
```

**Test**:
```bash
# Test SMS from admin panel: Admin → SMS Settings → Send Test SMS
```

---

### 7. Gmail SMTP Password ✅ DONE

**Status**: ✅ New App Password applied to `.env` and `.env.production`

**Current Location**: `SMTP_PASS` in backend `.env`

```bash
# Steps:
1. Login to Google Account: https://myaccount.google.com
2. Navigate to: Security → 2-Step Verification → App Passwords
3. Delete old "MedCore Backend" app password
4. Click "Generate" → Select "Mail" and "Other (Custom name)"
5. Name: "MedCore Backend"
6. Copy 16-character password
7. Update in backend/.env:
   SMTP_PASS=<new_app_password>
```

**Test**:
```bash
# Test email from backend (e.g., password reset)
# Should receive email successfully
```

---

### 8. Update Frontend Environment Variables (2 min)

**Current Location**: `health-care/.env.local`

```bash
# Most frontend vars are public (NEXT_PUBLIC_*), but verify:
NEXT_PUBLIC_API_URL=https://api.medcorebd.com/api  # Update for production
NEXT_PUBLIC_SITE_URL=https://medcorebd.com
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=<your_cloud_name>
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=<your_preset>
```

---

## 🗑️ Remove .env from Git History

**⚠️ WARNING**: This rewrites git history. Coordinate with team first!

```bash
# 1. Backup your repository
git clone <repo_url> medcore-backup

# 2. Remove .env files from history
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch health-care/backend/.env health-care/backend/.env.production health-care/.env.local" \
  --prune-empty --tag-name-filter cat -- --all

# 3. Clean up
rm -rf .git/refs/original/
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# 4. Force push (DANGEROUS - coordinate with team)
git push origin --force --all
git push origin --force --tags

# 5. Notify team to re-clone repository
# All team members must delete local repo and re-clone
```

**Alternative (Safer)**: Use BFG Repo-Cleaner
```bash
# Install BFG
# Download from: https://rtyley.github.io/bfg-repo-cleaner/

# Run BFG
java -jar bfg.jar --delete-files .env
java -jar bfg.jar --delete-files .env.local
java -jar bfg.jar --delete-files .env.production

# Clean up
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# Force push
git push origin --force --all
```

---

## ✅ Post-Rotation Verification

### Backend Tests
```bash
cd health-care/backend

# 1. Test MongoDB connection
npm run diagnose

# 2. Start backend
npm run dev

# 3. Test API endpoints
curl http://localhost:5000/api/health
# Should return: {"status":"ok"}

# 4. Test authentication
# Login through frontend, check JWT works

# 5. Test file upload
# Upload image through admin panel

# 6. Test email
# Trigger password reset email

# 7. Test SMS
# Send test SMS from admin panel
```

### Frontend Tests
```bash
cd health-care

# 1. Build frontend
npm run build
# Should complete with Exit Code: 0

# 2. Start frontend
npm start

# 3. Test OAuth
# Try Google login

# 4. Test API integration
# Browse products, add to cart, checkout
```

---

## 🚀 Deploy to Production

### Vercel (Frontend)
```bash
# 1. Login to Vercel
vercel login

# 2. Set environment variables
vercel env add NEXT_PUBLIC_API_URL production
vercel env add NEXT_PUBLIC_SITE_URL production
vercel env add NEXT_PUBLIC_GA_MEASUREMENT_ID production
# ... (add all NEXT_PUBLIC_* vars)

# 3. Deploy
vercel --prod
```

### Render/Heroku (Backend)
```bash
# Render:
1. Login to Render Dashboard
2. Navigate to: Your Service → Environment
3. Update all environment variables with new credentials
4. Click "Save Changes" (auto-deploys)

# Heroku:
heroku config:set MONGODB_URI="<new_uri>" --app medcore-backend
heroku config:set JWT_SECRET="<new_secret>" --app medcore-backend
# ... (set all vars)
```

---

## 📋 Final Security Checklist

- [ ] All 7 credentials rotated
- [ ] `.env` files removed from git history
- [ ] Team notified to re-clone repository
- [ ] Backend tests passing
- [ ] Frontend tests passing
- [ ] Environment variables set on Vercel
- [ ] Environment variables set on Render/Heroku
- [ ] Production deployment successful
- [ ] OAuth login working
- [ ] Email sending working
- [ ] SMS sending working
- [ ] File uploads working
- [ ] Database connection stable
- [ ] Redis cache working
- [ ] Monitoring enabled (Sentry)
- [ ] Backup strategy in place

---

## 🆘 Troubleshooting

### MongoDB Connection Fails
```bash
# Check connection string format:
mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority

# Common issues:
- Password contains special characters (URL encode them)
- IP whitelist not configured (add 0.0.0.0/0 for testing)
- Database name incorrect
```

### JWT Errors
```bash
# If users can't login after rotation:
1. Clear browser cookies
2. Clear localStorage
3. Try login again

# If still failing:
- Check JWT_SECRET is set correctly
- Check JWT_REFRESH_SECRET is set correctly
- Verify no extra spaces in .env file
```

### Cloudinary Upload Fails
```bash
# Check:
1. API secret is correct (no spaces)
2. Cloud name matches
3. Upload preset exists and is unsigned
4. CORS settings allow your domain
```

### Redis Connection Fails
```bash
# Check:
1. Redis URL format: redis://:password@host:port
2. Redis server is running
3. Password is correct
4. Firewall allows connection

# Fallback:
# Backend will use in-memory cache if Redis fails
```

---

## 📞 Support

If you encounter issues during rotation:

1. **Check logs**: `npm run dev` and look for error messages
2. **Verify .env format**: No spaces, no quotes (unless needed)
3. **Test one service at a time**: Isolate the failing component
4. **Rollback if needed**: Use backup .env files temporarily

**Emergency Contact**: security@medcorebd.com

---

## ✅ Success Criteria

You've successfully completed credential rotation when:

1. ✅ Backend starts without errors
2. ✅ Frontend builds successfully
3. ✅ Users can login (JWT working)
4. ✅ Google OAuth works
5. ✅ File uploads work (Cloudinary)
6. ✅ Emails send (SMTP)
7. ✅ SMS sends (Twilio)
8. ✅ Database queries work (MongoDB)
9. ✅ Cache works (Redis)
10. ✅ No credentials in git history

---

**Estimated Total Time**: 30-45 minutes  
**Difficulty**: Medium  
**Risk Level**: Low (if following guide)

**After completion, you can proceed with full production launch!** 🚀
