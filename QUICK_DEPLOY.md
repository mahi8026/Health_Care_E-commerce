# ⚡ Quick Deploy Guide - 5 Minutes to Production

## 🎯 Prerequisites
- GitHub account
- Vercel account (free)
- Render account (free)

---

## 🚀 Step 1: Deploy Backend to Render (2 minutes)

### 1.1 Create Service
1. Go to https://dashboard.render.com/select-repo
2. Click "New +" → "Web Service"
3. Connect GitHub: `mahi8026/Health_Care_E-commerce`
4. Click "Connect"

### 1.2 Configure
```
Name: health-care-backend
Region: Singapore
Branch: main
Root Directory: health-care/backend
Runtime: Node
Build Command: npm install
Start Command: npm start
Plan: Free (or Starter for production)
```

### 1.3 Add Environment Variables
Click "Advanced" → "Add Environment Variable" → "Add from .env"

Paste this (update SMTP values):
```env
NODE_ENV=production
PORT=5000
FRONTEND_URL=https://health-care-e-commerce-murex.vercel.app
BACKEND_URL=https://health-care-e-commerce.onrender.com
MONGODB_URI=mongodb+srv://Health_Care_E-commerce:ibQkT9ppTdivDtXt@cluster0.rqyzhey.mongodb.net/medcore-bd?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET=f22c149106748947deef9b0990564b4778aeb219a60e8cbde8b5d5b924e19dab5e4db8384ac822b0050792b57b618908f8b33f43f4dc6a14bd575cdbff4e29e0
JWT_REFRESH_SECRET=289383302baf1b90e7afde7b2f667fc99db3f20c83f6126e8ff2161312248c99193c3022ee30e30c0c0aa6abce291bbc4e3085ed029aec96e148bbe6e1ed081f
GOOGLE_CLIENT_ID=423878511800-qmtst4hibgsrf8e6gjcle1e7bqgsncgo.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=noreply@medcorebd.com
EMAIL_FROM_NAME=MedCore BD
CORS_ORIGINS=https://health-care-e-commerce-murex.vercel.app
STRIPE_SECRET_KEY=sk_test_51TP5b9CMsCu3AGhEsL2UkhfNLUWZcavE0pAyGhQ3WGIUFkWlP18w1PeJAKPIsci3W5gakbmbNQm98AoZ5bgYsVSU00cq2s59iY
STRIPE_PUBLISHABLE_KEY=pk_test_51TP5b9CMsCu3AGhEV6JBixF9RGlrSWkw9NlEWuTcgq4PDDbcogpB6HbEt2oGAO6OLafP8KPrZKjekSqEGT6v3KWW00VYiImXJB
CLOUDINARY_CLOUD_NAME=dm8eqxwlz
CLOUDINARY_API_KEY=397344892624316
CLOUDINARY_API_SECRET=TPAt1OgyLGu3vHBwPIRmt0jgbr8
REDIS_HOST=redis-19674.c264.ap-south-1-1.ec2.cloud.redislabs.com
REDIS_PORT=19674
REDIS_PASSWORD=Q0FxsMrbzG4foYdOWeATbxfeRF9Gn5b3
REDIS_DB=0
LOG_LEVEL=info
```

### 1.4 Deploy
Click "Create Web Service" → Wait 5-10 minutes

✅ Backend URL: `https://health-care-e-commerce.onrender.com`

---

## 🌐 Step 2: Deploy Frontend to Vercel (2 minutes)

### 2.1 Import Project
1. Go to https://vercel.com/new
2. Click "Import Git Repository"
3. Select `mahi8026/Health_Care_E-commerce`
4. Click "Import"

### 2.2 Configure
```
Framework Preset: Next.js
Root Directory: health-care
Build Command: npm run build
Install Command: npm install
```

### 2.3 Add Environment Variables
Click "Environment Variables" → Add these:

```env
NEXT_PUBLIC_API_URL=https://health-care-e-commerce.onrender.com/api
NEXT_PUBLIC_SITE_URL=https://health-care-e-commerce-murex.vercel.app
NEXT_PUBLIC_SITE_NAME=MedCore BD
NEXT_PUBLIC_APP_NAME=MedCore BD
NEXT_PUBLIC_GA4_MEASUREMENT_ID=G-VCQNJESVNM
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51TP5b9CMsCu3AGhEV6JBixF9RGlrSWkw9NlEWuTcgq4PDDbcogpB6HbEt2oGAO6OLafP8KPrZKjekSqEGT6v3KWW00VYiImXJB
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=dm8eqxwlz
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=ml_default
NEXT_PUBLIC_ENABLE_STRIPE=true
NEXT_PUBLIC_ENABLE_BKASH=true
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_WHATSAPP_NUMBER=8801646886795
NODE_ENV=production
HUSKY=0
```

### 2.4 Deploy
Click "Deploy" → Wait 3-5 minutes

✅ Frontend URL: `https://health-care-e-commerce-murex.vercel.app`

---

## ✅ Step 3: Verify Deployment (1 minute)

### Test Backend
```bash
curl https://health-care-e-commerce.onrender.com/api/health
```

Expected: `{"status":"ok",...}`

### Test Frontend
Visit: https://health-care-e-commerce-murex.vercel.app

Check:
- ✅ Homepage loads
- ✅ Products display
- ✅ Search works
- ✅ Login works

---

## 🔧 Step 4: Configure GitHub Actions (Optional)

### 4.1 Get Vercel Credentials
1. Token: https://vercel.com/account/tokens → Create
2. Org ID: https://vercel.com/account → Copy Team ID
3. Project ID: Vercel Dashboard → Project Settings → Copy ID

### 4.2 Add GitHub Secrets
Go to: https://github.com/mahi8026/Health_Care_E-commerce/settings/secrets/actions

Add:
```
VERCEL_TOKEN=<your-token>
VERCEL_ORG_ID=<your-org-id>
VERCEL_PROJECT_ID=<your-project-id>
NEXT_PUBLIC_API_URL=https://health-care-e-commerce.onrender.com/api
NEXT_PUBLIC_SITE_URL=https://health-care-e-commerce-murex.vercel.app
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51TP5b9CMsCu3AGhEV6JBixF9RGlrSWkw9NlEWuTcgq4PDDbcogpB6HbEt2oGAO6OLafP8KPrZKjekSqEGT6v3KWW00VYiImXJB
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=dm8eqxwlz
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=ml_default
NEXT_PUBLIC_GA4_MEASUREMENT_ID=G-VCQNJESVNM
```

Now every push to `main` auto-deploys! 🎉

---

## 🎉 You're Live!

**Frontend:** https://health-care-e-commerce-murex.vercel.app
**Backend:** https://health-care-e-commerce.onrender.com
**Admin:** https://health-care-e-commerce-murex.vercel.app/admin

---

## ⚠️ Important Notes

1. **Free Tier:** Backend sleeps after 15 min inactivity (first request takes 30-60s)
2. **Email:** Update SMTP credentials in Render for email to work
3. **Production:** Use Stripe live keys when ready for real payments
4. **Custom Domain:** Add in Vercel/Render settings

---

## 🆘 Quick Troubleshooting

**Backend not responding?**
- Check Render logs
- Verify MongoDB connection (IP whitelist: 0.0.0.0/0)

**CORS errors?**
- Verify CORS_ORIGINS in Render matches Vercel URL
- No trailing slashes in URLs

**Build fails?**
- Check HUSKY=0 is set in Vercel
- Verify all environment variables added

**Images not loading?**
- Check Cloudinary credentials
- Verify upload preset is "Unsigned"

---

## 📚 Full Documentation

For detailed guides, see:
- `DEPLOYMENT_GUIDE.md` - Complete deployment guide
- `DEPLOYMENT_CHECKLIST.md` - Step-by-step checklist

---

**Need Help?** Check logs in Render/Vercel dashboards first!

**Last Updated:** May 8, 2026
