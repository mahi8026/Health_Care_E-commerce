# ⚡ Quick Deploy Guide — MedCore BD

**Time to Deploy:** ~15 minutes  
**Prerequisites:** All services configured (MongoDB, Redis, Cloudinary, etc.)

---

## 🚀 Deploy Frontend to Vercel

### Step 1: Connect Repository

1. Go to [vercel.com](https://vercel.com) and login
2. Click **"Add New Project"**
3. Import your GitHub repository: `mahi8026/Health_Care_E-commerce`
4. Select the repository

### Step 2: Configure Build Settings

```
Framework Preset: Next.js
Root Directory: health-care
Build Command: npm run build
Output Directory: .next
Install Command: npm install
Node.js Version: 20.x
```

### Step 3: Add Environment Variables

Click **"Environment Variables"** and add these for **Production**:

```bash
NEXT_PUBLIC_API_URL=https://api.medcorebd.com/api
NEXT_PUBLIC_SITE_URL=https://medcorebd.com
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=your_verification_code
NEXT_PUBLIC_BING_SITE_VERIFICATION=your_verification_code
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_preset
```

### Step 4: Deploy

1. Click **"Deploy"**
2. Wait 2-3 minutes for build to complete
3. You'll get a URL like: `https://health-care-xyz.vercel.app`

### Step 5: Add Custom Domain

1. Go to **Settings → Domains**
2. Add domain: `medcorebd.com`
3. Add domain: `www.medcorebd.com` (redirects to apex)
4. Update DNS records as shown by Vercel:
   ```
   Type: A
   Name: @
   Value: 76.76.21.21 (Vercel IP)
   
   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   ```
5. Wait for SSL certificate (automatic, ~5 minutes)

### Step 6: Verify

Visit `https://medcorebd.com` — should load successfully!

---

## 🔧 Deploy Backend to Render

### Step 1: Create Web Service

1. Go to [render.com](https://render.com) and login
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Select the repository

### Step 2: Configure Service

```
Name: medcore-api
Region: Singapore (closest to Bangladesh)
Branch: main
Root Directory: health-care/backend
Runtime: Node
Build Command: npm install
Start Command: npm start
Instance Type: Starter ($7/month) or Standard ($25/month)
```

### Step 3: Add Environment Variables

Click **"Environment"** and add all these:

```bash
NODE_ENV=production
PORT=5001
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/medcore
JWT_SECRET=your_32_char_secret_here
JWT_REFRESH_SECRET=your_32_char_refresh_secret_here
REDIS_URL=redis://default:password@host:port
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
FRONTEND_URL=https://medcorebd.com
GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_CALLBACK_URL=https://api.medcorebd.com/api/auth/google/callback
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=noreply@medcorebd.com
EMAIL_PASSWORD=your_app_password
SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
BKASH_APP_KEY=your_bkash_key
BKASH_APP_SECRET=your_bkash_secret
BKASH_BASE_URL=https://checkout.pay.bka.sh/v1.2.0-beta
NAGAD_MERCHANT_ID=your_nagad_id
NAGAD_MERCHANT_KEY=your_nagad_key
NAGAD_BASE_URL=https://api.mynagad.com
```

### Step 4: Deploy

1. Click **"Create Web Service"**
2. Wait 3-5 minutes for build and deploy
3. You'll get a URL like: `https://medcore-api.onrender.com`

### Step 5: Add Custom Domain

1. Go to **Settings → Custom Domain**
2. Add domain: `api.medcorebd.com`
3. Update DNS records:
   ```
   Type: CNAME
   Name: api
   Value: medcore-api.onrender.com
   ```
4. Wait for SSL certificate (automatic, ~5 minutes)

### Step 6: Verify

Visit `https://api.medcorebd.com/api/health` — should return:
```json
{
  "success": true,
  "status": "healthy",
  "message": "MedCore BD API is running",
  "version": "2.0.0",
  "services": {
    "api": "operational",
    "database": {
      "status": "connected",
      "connected": true
    },
    "redis": {
      "status": "connected"
    }
  }
}
```

---

## 🔗 Update Frontend API URL

After backend is deployed, update Vercel environment variable:

1. Go to Vercel dashboard → Your project
2. Settings → Environment Variables
3. Edit `NEXT_PUBLIC_API_URL`
4. Change to: `https://api.medcorebd.com/api`
5. Click **"Save"**
6. Go to **Deployments** → Click **"Redeploy"** on latest deployment

---

## ✅ Post-Deployment Tests

### 1. Test Frontend
```bash
# Homepage loads
curl -I https://medcorebd.com
# Should return: 200 OK

# Products page loads
curl -I https://medcorebd.com/products
# Should return: 200 OK
```

### 2. Test Backend
```bash
# Health check
curl https://api.medcorebd.com/api/health

# Products API
curl https://api.medcorebd.com/api/products?limit=5

# Categories API
curl https://api.medcorebd.com/api/categories
```

### 3. Test API Documentation
Visit: `https://api.medcorebd.com/api-docs`

### 4. Test Critical Flows

**Registration:**
1. Go to `https://medcorebd.com/register`
2. Fill form and submit
3. Should redirect to dashboard

**Login:**
1. Go to `https://medcorebd.com/login`
2. Enter credentials
3. Should redirect to dashboard

**Google OAuth:**
1. Go to `https://medcorebd.com/login`
2. Click "Continue with Google"
3. Authorize app
4. Should redirect to dashboard

**Product Browsing:**
1. Go to `https://medcorebd.com/products`
2. Products should load with images
3. Filters should work
4. Search should work

**Add to Cart:**
1. Click "Add to Cart" on any product
2. Cart count should increase
3. Open cart sidebar
4. Product should be in cart

**Checkout:**
1. Go to cart
2. Click "Proceed to Checkout"
3. Fill shipping details
4. Select payment method
5. Complete order

**Admin Dashboard:**
1. Go to `https://medcorebd.com/admin`
2. Login with: `admin@medcorebd.com` / `admin123`
3. Dashboard should load with analytics
4. Test product creation
5. Test order management

---

## 🐛 Troubleshooting

### Frontend Issues

**Build fails:**
- Check environment variables are set
- Check Node version is 18.x or 20.x
- Check build logs in Vercel dashboard

**API calls fail (CORS errors):**
- Verify `NEXT_PUBLIC_API_URL` is correct
- Check backend CORS configuration includes frontend URL
- Check backend is running

**Images don't load:**
- Verify Cloudinary credentials
- Check `next.config.mjs` has Cloudinary domain in `remotePatterns`

### Backend Issues

**Build fails:**
- Check all environment variables are set
- Check Node version matches package.json
- Check build logs in Render dashboard

**Database connection fails:**
- Verify MongoDB URI is correct
- Check MongoDB Atlas IP whitelist includes Render IPs (or 0.0.0.0/0)
- Test connection with `mongosh`

**Redis connection fails:**
- Verify Redis URL is correct
- Check Redis instance is running
- Backend will fall back to in-memory cache

**Health check returns 503:**
- Database is not connected
- Check MongoDB Atlas status
- Check environment variables

---

## 📊 Monitoring

### Vercel Dashboard
- **Analytics:** View page views, top pages, performance
- **Logs:** Real-time function logs
- **Deployments:** View deployment history

### Render Dashboard
- **Metrics:** CPU, memory, response time
- **Logs:** Real-time application logs
- **Events:** Deployment events, crashes

### Sentry
- **Errors:** Real-time error tracking
- **Performance:** Transaction monitoring
- **Releases:** Track deployments

### Google Analytics
- **Real-time:** Current active users
- **Events:** Track user interactions
- **E-commerce:** Track purchases

---

## 🔄 Continuous Deployment

Both Vercel and Render support automatic deployment on git push:

```bash
# Make changes
git add .
git commit -m "feat: add new feature"
git push origin main

# Vercel automatically deploys frontend
# Render automatically deploys backend
# Wait 2-5 minutes for deployment
```

---

## 🎉 You're Live!

Your MedCore BD platform is now live at:
- **Frontend:** https://medcorebd.com
- **Backend API:** https://api.medcorebd.com/api
- **API Docs:** https://api.medcorebd.com/api-docs
- **Admin:** https://medcorebd.com/admin

**Next Steps:**
1. Monitor error rates in Sentry
2. Check Google Analytics for traffic
3. Test payment flows with real transactions
4. Submit sitemap to Google Search Console
5. Set up uptime monitoring
6. Create backup strategy
7. Train team on admin dashboard

---

**Need Help?**
- Vercel Docs: https://vercel.com/docs
- Render Docs: https://render.com/docs
- Next.js Docs: https://nextjs.org/docs
- Express Docs: https://expressjs.com

**🚀 Happy Launching!**
