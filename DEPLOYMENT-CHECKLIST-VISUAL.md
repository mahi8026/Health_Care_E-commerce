# 🚀 Backend Deployment Checklist

## 📋 Pre-Deployment Checklist

### ✅ Prerequisites
- [ ] Have access to GitHub repository
- [ ] Have Render.com account (or can create one)
- [ ] Have MongoDB Atlas account (or can create one)
- [ ] Have terminal access to run `openssl` command
- [ ] Have 15 minutes of uninterrupted time

---

## 🔐 Step 1: Generate Secrets (1 minute)

### Commands to Run
```bash
# Generate JWT Secret
openssl rand -hex 64

# Generate JWT Refresh Secret
openssl rand -hex 64
```

### Save These Values
- [ ] JWT Secret copied to notepad
- [ ] JWT Refresh Secret copied to notepad

**⚠️ Keep these secrets safe! You'll need them in Step 4.**

---

## 🗄️ Step 2: MongoDB Atlas Setup (5 minutes)

### 2.1 Create Cluster
- [ ] Go to https://cloud.mongodb.com
- [ ] Sign up / Login
- [ ] Click "Build a Database"
- [ ] Select **FREE** tier (M0 Sandbox)
- [ ] Cloud Provider: AWS
- [ ] Region: Singapore (ap-southeast-1)
- [ ] Cluster Name: `medcore-cluster`
- [ ] Click "Create Cluster" (wait 3-5 minutes)

### 2.2 Database Access
- [ ] Security → Database Access → Add New Database User
- [ ] Username: `medcore-admin`
- [ ] Password: Click "Autogenerate Secure Password" → **Copy it!**
- [ ] Privileges: "Atlas admin"
- [ ] Click "Add User"

### 2.3 Network Access
- [ ] Security → Network Access → Add IP Address
- [ ] Click "Allow Access from Anywhere"
- [ ] IP Address: `0.0.0.0/0`
- [ ] Click "Confirm"

### 2.4 Get Connection String
- [ ] Database → Connect → Drivers
- [ ] Copy connection string
- [ ] Replace `<password>` with your database password
- [ ] Add database name `medcore-bd` before the `?`

**Example:**
```
mongodb+srv://medcore-admin:YOUR_PASSWORD@medcore-cluster.xxxxx.mongodb.net/medcore-bd?retryWrites=true&w=majority
```

- [ ] Connection string saved to notepad

---

## 🚢 Step 3: Render.com Setup (2 minutes)

### 3.1 Create Account
- [ ] Go to https://render.com
- [ ] Sign up with GitHub (fastest)
- [ ] Authorize GitHub access

### 3.2 Create Web Service
- [ ] Dashboard → Click "New +" → "Web Service"
- [ ] Select your repository
- [ ] Click "Connect"

---

## ⚙️ Step 4: Configure Web Service (5 minutes)

### 4.1 Basic Settings
- [ ] **Name**: `health-care-backend`
- [ ] **Region**: Singapore
- [ ] **Branch**: `main`
- [ ] **Root Directory**: `health-care/backend`
- [ ] **Runtime**: Node
- [ ] **Build Command**: `npm install`
- [ ] **Start Command**: `npm start`
- [ ] **Instance Type**: Starter ($7/mo) or Free

### 4.2 Environment Variables

Click "Advanced" → "Add Environment Variable"

#### Critical Variables (Required)
- [ ] `NODE_ENV` = `production`
- [ ] `PORT` = `5000`
- [ ] `MONGODB_URI` = `<paste-from-step-2>`
- [ ] `JWT_SECRET` = `<paste-from-step-1>`
- [ ] `JWT_REFRESH_SECRET` = `<paste-from-step-1>`
- [ ] `FRONTEND_URL` = `https://health-care-e-commerce-murex.vercel.app`
- [ ] `CORS_ORIGIN` = `https://health-care-e-commerce-murex.vercel.app`
- [ ] `BACKEND_URL` = `https://health-care-e-commerce.onrender.com`

#### Recommended Variables (Optional)
- [ ] `SMTP_HOST` = `smtp.gmail.com`
- [ ] `SMTP_PORT` = `587`
- [ ] `EMAIL_FROM` = `MedCore BD <noreply@medcorebd.com>`
- [ ] `SMS_PROVIDER` = `mock`
- [ ] `LOG_LEVEL` = `info`
- [ ] `CLOUDINARY_CLOUD_NAME` = `dm8eqxwlz`

### 4.3 Deploy
- [ ] Click "Create Web Service"
- [ ] Wait for deployment (5-10 minutes)

---

## 🔍 Step 5: Monitor Deployment (5 minutes)

### 5.1 Watch Logs
- [ ] Render Dashboard → Your Service → Logs
- [ ] Look for: `✓ MongoDB Connected`
- [ ] Look for: `MedCore BD API v2.0 running on port 5000`

### 5.2 Check for Errors

| Error Message | Solution |
|---------------|----------|
| "MongoDB Connection Error" | Check MongoDB URI, verify Network Access |
| "JWT_SECRET is not defined" | Add JWT_SECRET to environment variables |
| "Application failed to respond" | Check PORT=5000, NODE_ENV=production |
| "Redis connection failed" | Ignore (non-critical) |

---

## ✅ Step 6: Verify Deployment (2 minutes)

### 6.1 Test Health Endpoint
- [ ] Open: https://health-care-e-commerce.onrender.com/api/health
- [ ] Expected: `{"success": true, "status": "healthy"}`
- [ ] Status Code: 200 OK

### 6.2 Test Stats Endpoint
- [ ] Open: https://health-care-e-commerce.onrender.com/api/stats
- [ ] Expected: `{"success": true, "data": {...}}`
- [ ] Status Code: 200 OK

### 6.3 Test Categories Endpoint
- [ ] Open: https://health-care-e-commerce.onrender.com/api/categories
- [ ] Expected: `{"success": true, "data": []}`
- [ ] Status Code: 200 OK

### 6.4 Test Products Endpoint
- [ ] Open: https://health-care-e-commerce.onrender.com/api/products
- [ ] Expected: `{"success": true, "data": []}`
- [ ] Status Code: 200 OK

---

## 🌐 Step 7: Test Frontend (1 minute)

### 7.1 Open Frontend
- [ ] Open: https://health-care-e-commerce-murex.vercel.app
- [ ] Homepage loads (no errors)

### 7.2 Check Browser Console
- [ ] Press F12 → Console tab
- [ ] Refresh page
- [ ] No 500 errors
- [ ] No CORS errors

### 7.3 Check Network Tab
- [ ] Press F12 → Network tab
- [ ] Refresh page
- [ ] All API calls return 200 OK (or 404 if no data)
- [ ] No 500 errors

---

## 🎉 Success Criteria

### Minimum Success (Site is Functional)
- [x] Backend health endpoint returns 200 OK
- [x] Frontend loads without 500 errors
- [x] No CORS errors in browser console
- [x] API endpoints respond (even if empty)

### Full Success (Site is Ready)
- [ ] Database seeded with products
- [ ] User registration works
- [ ] User login works
- [ ] Products display on homepage
- [ ] Search works
- [ ] Cart works

---

## 🐛 Troubleshooting

### Backend Not Starting

**Symptom**: Render logs show errors

**Check:**
1. [ ] MongoDB URI is correct (no spaces, has database name)
2. [ ] JWT secrets are set (64 characters each)
3. [ ] PORT=5000 and NODE_ENV=production are set
4. [ ] MongoDB Atlas Network Access allows 0.0.0.0/0

**Fix:**
- Update environment variables in Render
- Click "Manual Deploy" → "Deploy latest commit"

### Frontend Still Shows 500 Errors

**Symptom**: Browser console shows 500 errors

**Check:**
1. [ ] Backend health endpoint returns 200 OK
2. [ ] FRONTEND_URL matches Vercel URL exactly
3. [ ] CORS_ORIGIN matches Vercel URL exactly
4. [ ] No typos in environment variables

**Fix:**
- Update environment variables in Render
- Redeploy backend

### CORS Errors

**Symptom**: Browser console shows "blocked by CORS policy"

**Check:**
1. [ ] FRONTEND_URL is set correctly
2. [ ] CORS_ORIGIN is set correctly
3. [ ] Backend logs show "CORS rejected origin"

**Fix:**
- Update FRONTEND_URL and CORS_ORIGIN
- Redeploy backend

---

## 📊 Post-Deployment Tasks

### Immediate (Today)
- [ ] Verify all endpoints work
- [ ] Test frontend functionality
- [ ] Check for errors in logs

### Short-term (This Week)
- [ ] Seed database with products
- [ ] Create admin user
- [ ] Test all features end-to-end
- [ ] Set up monitoring (UptimeRobot)

### Medium-term (This Month)
- [ ] Configure email (Gmail SMTP)
- [ ] Enable Redis caching (Upstash)
- [ ] Set up error tracking (Sentry)
- [ ] Configure payment gateways
- [ ] Set up custom domain

---

## 📝 Notes Section

### MongoDB Connection String
```
[Write your connection string here]
```

### JWT Secrets
```
JWT_SECRET: [Write here]
JWT_REFRESH_SECRET: [Write here]
```

### Render Service URL
```
https://health-care-e-commerce.onrender.com
```

### Deployment Date
```
[Write date here]
```

### Issues Encountered
```
[Write any issues you encountered and how you fixed them]
```

---

## 🆘 Need Help?

### Documentation
- **Main Guide**: `FIX-PRODUCTION-500-ERRORS.md`
- **Quick Reference**: `QUICK-DEPLOYMENT-CHECKLIST.md`
- **Architecture**: `PRODUCTION-ARCHITECTURE.md`

### External Resources
- **Render Docs**: https://render.com/docs
- **MongoDB Atlas**: https://docs.atlas.mongodb.com
- **Vercel Docs**: https://vercel.com/docs

### Support
- **Render Support**: https://render.com/support
- **MongoDB Support**: https://support.mongodb.com

---

## ✨ Completion

### Deployment Complete
- [ ] Backend deployed successfully
- [ ] All endpoints verified
- [ ] Frontend tested
- [ ] No errors in logs
- [ ] Documentation reviewed

### Next Steps
- [ ] Seed database
- [ ] Test all features
- [ ] Set up monitoring
- [ ] Configure optional services

---

**🎊 Congratulations! Your backend is now deployed and your production site is functional!**

---

**Last Updated**: June 1, 2026
**Estimated Time**: 15 minutes
**Difficulty**: Easy
**Priority**: 🔴 CRITICAL
