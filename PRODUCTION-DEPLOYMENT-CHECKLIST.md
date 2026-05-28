# 🚀 Production Deployment Checklist

**Project:** MedCore BD  
**Status:** Ready for Production Deployment  
**Date:** May 28, 2026

---

## ✅ Pre-Deployment Verification

### 1. Environment Variables

#### Frontend (Vercel)
```bash
# Verify these are set in Vercel dashboard
NEXT_PUBLIC_API_URL=https://api.medcorebd.com/api
NEXT_PUBLIC_SITE_URL=https://medcorebd.com
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=xxx
NEXT_PUBLIC_BING_SITE_VERIFICATION=xxx
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=xxx
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=xxx
```

**Verification Steps:**
- [ ] Log into Vercel dashboard
- [ ] Navigate to Project Settings → Environment Variables
- [ ] Verify all 7 variables are set for Production
- [ ] Test build with production variables

#### Backend (Render/Heroku)
```bash
# Verify these are set in hosting dashboard
NODE_ENV=production
PORT=5001
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/medcore
JWT_SECRET=xxx (min 32 characters)
JWT_REFRESH_SECRET=xxx (min 32 characters)
REDIS_URL=redis://default:xxx@redis-cloud.com:12345
CLOUDINARY_CLOUD_NAME=xxx
CLOUDINARY_API_KEY=xxx
CLOUDINARY_API_SECRET=xxx
FRONTEND_URL=https://medcorebd.com
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxx
GOOGLE_CALLBACK_URL=https://api.medcorebd.com/api/auth/google/callback
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=noreply@medcorebd.com
EMAIL_PASSWORD=xxx
SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
BKASH_APP_KEY=xxx
BKASH_APP_SECRET=xxx
BKASH_BASE_URL=https://checkout.pay.bka.sh/v1.2.0-beta
NAGAD_MERCHANT_ID=xxx
NAGAD_MERCHANT_KEY=xxx
NAGAD_BASE_URL=https://api.mynagad.com
```

**Verification Steps:**
- [ ] Log into Render/Heroku dashboard
- [ ] Navigate to Environment Variables section
- [ ] Verify all 24 variables are set
- [ ] Ensure JWT secrets are strong (32+ chars)
- [ ] Test backend deployment

---

## 2. Database Configuration

### MongoDB Atlas
- [ ] Database cluster is running
- [ ] Connection string is correct in `MONGODB_URI`
- [ ] IP whitelist includes hosting provider IPs (or 0.0.0.0/0 for all)
- [ ] Database user has read/write permissions
- [ ] Test connection: `mongosh "mongodb+srv://..."`
- [ ] Verify collections exist: users, products, orders, categories, etc.
- [ ] Check indexes are created (especially on products, orders)
- [ ] Backup strategy is configured (Atlas automatic backups)

**Quick Test:**
```bash
# From backend directory
node -e "require('dotenv').config(); require('./src/config/database')();"
```

### Redis Cloud/Upstash
- [ ] Redis instance is running
- [ ] Connection string is correct in `REDIS_URL`
- [ ] Test connection from backend
- [ ] Verify cache is working (check logs for "Redis cache initialized")
- [ ] Set eviction policy to `allkeys-lru` (recommended)
- [ ] Monitor memory usage

**Quick Test:**
```bash
# Test Redis connection
redis-cli -u $REDIS_URL ping
# Should return: PONG
```

---

## 3. Third-Party Services

### Cloudinary (Image CDN)
- [ ] Account is active
- [ ] Cloud name matches `CLOUDINARY_CLOUD_NAME`
- [ ] API key and secret are correct
- [ ] Upload preset is configured (unsigned or signed)
- [ ] Test image upload from admin dashboard
- [ ] Verify images load on frontend
- [ ] Check transformation settings (auto-format, quality)
- [ ] Monitor bandwidth usage

**Test Upload:**
```bash
# Upload test image via API
curl -X POST https://api.cloudinary.com/v1_1/YOUR_CLOUD_NAME/image/upload \
  -F "file=@test.jpg" \
  -F "upload_preset=YOUR_PRESET"
```

### Google OAuth
- [ ] OAuth 2.0 Client ID created in Google Cloud Console
- [ ] Authorized redirect URIs include:
  - `https://api.medcorebd.com/api/auth/google/callback`
  - `http://localhost:5001/api/auth/google/callback` (for testing)
- [ ] Client ID and secret match environment variables
- [ ] Test Google login flow
- [ ] Verify user data is saved correctly

**Test Flow:**
1. Visit `https://medcorebd.com/login`
2. Click "Continue with Google"
3. Authorize app
4. Verify redirect to dashboard
5. Check user is created in database

### Google Analytics 4
- [ ] GA4 property created
- [ ] Measurement ID matches `NEXT_PUBLIC_GA_MEASUREMENT_ID`
- [ ] Data stream is configured for website
- [ ] Test events are firing (use GA4 DebugView)
- [ ] E-commerce events are configured
- [ ] Conversion events are set up

**Test Events:**
- page_view
- view_item
- add_to_cart
- begin_checkout
- purchase
- cart_sidebar_open
- scroll_to_top_click

### Sentry (Error Tracking)
- [ ] Sentry project created
- [ ] DSN matches `SENTRY_DSN`
- [ ] Test error tracking (trigger a test error)
- [ ] Verify errors appear in Sentry dashboard
- [ ] Set up alerts for critical errors
- [ ] Configure release tracking

**Test Error:**
```javascript
// In browser console
throw new Error('Test Sentry error');
```

### Email Service (Nodemailer)
- [ ] SMTP credentials are correct
- [ ] Test email sending (password reset, order confirmation)
- [ ] Verify emails are not going to spam
- [ ] Set up SPF and DKIM records for domain
- [ ] Configure email templates

**Test Email:**
```bash
# From backend, trigger password reset
curl -X POST https://api.medcorebd.com/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

---

## 4. Payment Gateways

### bKash
- [ ] Merchant account is active
- [ ] App key and secret are correct
- [ ] Base URL is set to production: `https://checkout.pay.bka.sh/v1.2.0-beta`
- [ ] Test payment flow with real credentials
- [ ] Verify payment confirmation webhook
- [ ] Check transaction logs
- [ ] Set up refund process

**Test Payment:**
1. Add product to cart
2. Proceed to checkout
3. Select bKash payment
4. Complete payment with test account
5. Verify order status changes to "paid"

### Nagad
- [ ] Merchant account is active
- [ ] Merchant ID and key are correct
- [ ] Base URL is set to production: `https://api.mynagad.com`
- [ ] Test payment flow
- [ ] Verify payment confirmation
- [ ] Check transaction logs

### Card Payments (if applicable)
- [ ] Payment gateway integrated (Stripe/SSLCommerz)
- [ ] API keys are set
- [ ] Test card payment flow
- [ ] Verify PCI compliance
- [ ] Set up webhook for payment events

---

## 5. Domain & SSL

### Domain Configuration
- [ ] Domain `medcorebd.com` is registered
- [ ] DNS records are configured:
  - `A` record: `medcorebd.com` → Vercel IP
  - `CNAME` record: `www.medcorebd.com` → `cname.vercel-dns.com`
  - `CNAME` record: `api.medcorebd.com` → Render/Heroku domain
- [ ] DNS propagation is complete (check with `dig medcorebd.com`)
- [ ] SSL certificates are issued (automatic with Vercel/Render)
- [ ] HTTPS is enforced (no HTTP access)
- [ ] Test all subdomains load correctly

**DNS Check:**
```bash
dig medcorebd.com
dig www.medcorebd.com
dig api.medcorebd.com
```

---

## 6. SEO & Search Console

### Google Search Console
- [ ] Property added for `https://medcorebd.com`
- [ ] Ownership verified (via meta tag or DNS)
- [ ] Sitemap submitted: `https://medcorebd.com/sitemap.xml`
- [ ] Test sitemap loads correctly
- [ ] Check for crawl errors
- [ ] Monitor indexing status

### Bing Webmaster Tools
- [ ] Site added and verified
- [ ] Sitemap submitted
- [ ] Check for crawl errors

### Robots.txt
- [ ] Verify `https://medcorebd.com/robots.txt` loads
- [ ] Check admin routes are disallowed
- [ ] Sitemap URL is included

**Expected robots.txt:**
```
User-agent: *
Allow: /
Disallow: /admin
Disallow: /account
Disallow: /checkout
Disallow: /cart
Disallow: /api

Sitemap: https://medcorebd.com/sitemap.xml
```

---

## 7. Performance & Monitoring

### Lighthouse Audit
- [ ] Run Lighthouse on homepage
- [ ] Performance score > 90 (desktop)
- [ ] Performance score > 80 (mobile)
- [ ] Accessibility score > 90
- [ ] Best Practices score > 90
- [ ] SEO score > 90

**Run Audit:**
```bash
cd health-care
npm run lighthouse
```

### Uptime Monitoring
- [ ] Set up uptime monitoring (UptimeRobot, Pingdom, etc.)
- [ ] Monitor frontend: `https://medcorebd.com`
- [ ] Monitor backend: `https://api.medcorebd.com/api/health`
- [ ] Set up alerts for downtime
- [ ] Configure status page

### Performance Monitoring
- [ ] Sentry performance monitoring enabled
- [ ] Monitor API response times
- [ ] Check database query performance
- [ ] Monitor Redis cache hit rate
- [ ] Set up alerts for slow endpoints

---

## 8. Security Checklist

### SSL/TLS
- [ ] HTTPS enforced on all pages
- [ ] SSL certificate is valid (not expired)
- [ ] TLS 1.2+ is used
- [ ] HSTS header is set
- [ ] Test with SSL Labs: https://www.ssllabs.com/ssltest/

### Security Headers
- [ ] Content-Security-Policy is set
- [ ] X-Frame-Options: DENY
- [ ] X-Content-Type-Options: nosniff
- [ ] X-XSS-Protection: 1; mode=block
- [ ] Referrer-Policy is set

**Check Headers:**
```bash
curl -I https://api.medcorebd.com/api/health
```

### Rate Limiting
- [ ] Rate limiting is active on auth endpoints
- [ ] Test login rate limit (5 attempts per 15 min)
- [ ] Test registration rate limit
- [ ] Test API rate limits
- [ ] Monitor for abuse

### Authentication
- [ ] JWT tokens expire correctly (1h access, 7d refresh)
- [ ] Password reset tokens expire (1h)
- [ ] 2FA is working for admin and customers
- [ ] Google OAuth is working
- [ ] Test logout functionality

---

## 9. Functional Testing

### Critical User Flows
- [ ] **Registration:** New user can register
- [ ] **Login:** User can login with email/password
- [ ] **Google OAuth:** User can login with Google
- [ ] **Browse Products:** Products load with images
- [ ] **Search:** Search returns relevant results
- [ ] **Filter:** Category/brand filters work
- [ ] **Add to Cart:** Products can be added to cart
- [ ] **Cart Persistence:** Cart persists across sessions
- [ ] **Checkout:** Checkout flow completes
- [ ] **Payment:** bKash/Nagad payment works
- [ ] **Order Confirmation:** Order confirmation email sent
- [ ] **Order Tracking:** User can track order
- [ ] **2FA Setup:** Customer can enable 2FA
- [ ] **2FA Login:** 2FA code is required at login
- [ ] **Password Reset:** Password reset email works
- [ ] **Admin Login:** Admin can access dashboard
- [ ] **Product CRUD:** Admin can create/edit/delete products
- [ ] **Order Management:** Admin can update order status
- [ ] **B2B Portal:** B2B customer can request quote
- [ ] **Return Request:** Customer can request return
- [ ] **WhatsApp View:** Admin can view WhatsApp conversations

### Mobile Testing
- [ ] Test on iOS Safari
- [ ] Test on Android Chrome
- [ ] Test responsive design (320px to 1920px)
- [ ] Test touch interactions
- [ ] Test mobile payment flows

### Browser Testing
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

---

## 10. Deployment Steps

### Frontend (Vercel)

1. **Connect Repository**
   ```bash
   # Vercel will auto-detect Next.js
   # Build command: npm run build
   # Output directory: .next
   # Install command: npm install
   ```

2. **Configure Build Settings**
   - [ ] Root directory: `health-care`
   - [ ] Framework preset: Next.js
   - [ ] Node version: 18.x or 20.x
   - [ ] Build command: `npm run build`
   - [ ] Output directory: `.next`

3. **Set Environment Variables**
   - [ ] Add all `NEXT_PUBLIC_*` variables
   - [ ] Set for Production environment
   - [ ] Redeploy after adding variables

4. **Configure Domain**
   - [ ] Add custom domain: `medcorebd.com`
   - [ ] Add `www.medcorebd.com` (redirect to apex)
   - [ ] Wait for SSL certificate provisioning
   - [ ] Test HTTPS access

5. **Deploy**
   ```bash
   git push origin main
   # Vercel auto-deploys on push
   ```

### Backend (Render/Heroku)

#### Option A: Render

1. **Create Web Service**
   - [ ] Connect GitHub repository
   - [ ] Root directory: `health-care/backend`
   - [ ] Build command: `npm install`
   - [ ] Start command: `npm start`
   - [ ] Environment: Node

2. **Configure Service**
   - [ ] Instance type: Starter or Standard
   - [ ] Region: Singapore (closest to Bangladesh)
   - [ ] Auto-deploy: Enabled

3. **Set Environment Variables**
   - [ ] Add all 24 backend variables
   - [ ] Ensure `NODE_ENV=production`
   - [ ] Set `PORT=5001` (or use Render's default)

4. **Configure Custom Domain**
   - [ ] Add custom domain: `api.medcorebd.com`
   - [ ] Update DNS CNAME record
   - [ ] Wait for SSL provisioning

5. **Deploy**
   - [ ] Trigger manual deploy
   - [ ] Monitor build logs
   - [ ] Check health endpoint: `https://api.medcorebd.com/api/health`

#### Option B: Heroku

1. **Create App**
   ```bash
   heroku create medcore-api
   heroku git:remote -a medcore-api
   ```

2. **Set Environment Variables**
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set MONGODB_URI=xxx
   # ... set all 24 variables
   ```

3. **Configure Buildpack**
   ```bash
   heroku buildpacks:set heroku/nodejs
   ```

4. **Deploy**
   ```bash
   git subtree push --prefix health-care/backend heroku main
   # Or use Heroku GitHub integration
   ```

5. **Scale Dynos**
   ```bash
   heroku ps:scale web=1
   ```

---

## 11. Post-Deployment Verification

### Smoke Tests (Run Immediately After Deploy)

1. **Frontend Health**
   - [ ] Visit `https://medcorebd.com`
   - [ ] Homepage loads without errors
   - [ ] Images load from Cloudinary
   - [ ] Navigation works
   - [ ] No console errors

2. **Backend Health**
   - [ ] Visit `https://api.medcorebd.com/api/health`
   - [ ] Returns 200 status
   - [ ] Database status: "connected"
   - [ ] Redis status: "connected"

3. **API Documentation**
   - [ ] Visit `https://api.medcorebd.com/api-docs`
   - [ ] Swagger UI loads
   - [ ] Can view endpoint documentation

4. **Critical Endpoints**
   ```bash
   # Test products endpoint
   curl https://api.medcorebd.com/api/products?limit=5
   
   # Test categories endpoint
   curl https://api.medcorebd.com/api/categories
   
   # Test health endpoint
   curl https://api.medcorebd.com/api/health
   ```

5. **Authentication Flow**
   - [ ] Register new user
   - [ ] Login with credentials
   - [ ] Login with Google OAuth
   - [ ] Test 2FA setup
   - [ ] Test password reset

6. **E-Commerce Flow**
   - [ ] Browse products
   - [ ] Add to cart
   - [ ] Proceed to checkout
   - [ ] Complete payment (use test account)
   - [ ] Verify order confirmation email
   - [ ] Check order in admin dashboard

7. **Admin Dashboard**
   - [ ] Login as admin
   - [ ] View dashboard analytics
   - [ ] Create test product
   - [ ] Update order status
   - [ ] View WhatsApp conversations

---

## 12. Monitoring & Alerts

### Set Up Alerts

1. **Uptime Alerts**
   - [ ] Email alert if site is down > 5 minutes
   - [ ] SMS alert for critical downtime

2. **Error Alerts**
   - [ ] Sentry alert for critical errors
   - [ ] Email digest for daily errors

3. **Performance Alerts**
   - [ ] Alert if API response time > 2s
   - [ ] Alert if database connections > 80%

4. **Security Alerts**
   - [ ] Alert for failed login attempts > 10/min
   - [ ] Alert for suspicious activity

### Daily Monitoring

- [ ] Check Sentry for new errors
- [ ] Review Vercel/Render logs
- [ ] Monitor database performance
- [ ] Check Redis cache hit rate
- [ ] Review payment transactions
- [ ] Check email delivery rate

---

## 13. Backup & Disaster Recovery

### Database Backups
- [ ] MongoDB Atlas automatic backups enabled
- [ ] Backup retention: 7 days minimum
- [ ] Test restore process
- [ ] Document restore procedure

### Code Backups
- [ ] Code is in GitHub (already done)
- [ ] Protected main branch
- [ ] Regular commits

### Disaster Recovery Plan
- [ ] Document rollback procedure
- [ ] Keep previous deployment accessible
- [ ] Test rollback process
- [ ] Document emergency contacts

---

## 14. Legal & Compliance

- [ ] Privacy Policy page created
- [ ] Terms of Service page created
- [ ] Cookie consent banner (if required)
- [ ] GDPR compliance (if serving EU customers)
- [ ] Payment gateway compliance (PCI DSS)
- [ ] DGDA registration displayed for products
- [ ] Return policy documented
- [ ] Shipping policy documented

---

## 15. Launch Checklist

### Pre-Launch (1 day before)
- [ ] All tests passing
- [ ] No critical bugs
- [ ] Performance benchmarks met
- [ ] Security audit passed
- [ ] Backups configured
- [ ] Monitoring active
- [ ] Team briefed on launch plan

### Launch Day
- [ ] Deploy to production
- [ ] Run smoke tests
- [ ] Monitor error rates
- [ ] Monitor performance
- [ ] Check payment flows
- [ ] Verify email delivery
- [ ] Test critical user flows
- [ ] Monitor social media for feedback

### Post-Launch (First Week)
- [ ] Daily error monitoring
- [ ] Daily performance checks
- [ ] User feedback collection
- [ ] Bug triage and fixes
- [ ] Performance optimization
- [ ] SEO monitoring (indexing status)

---

## 🎯 Quick Deployment Commands

### Deploy Frontend (Vercel)
```bash
# Automatic on git push
git push origin main

# Or manual deploy
cd health-care
vercel --prod
```

### Deploy Backend (Render)
```bash
# Automatic on git push
git push origin main

# Or trigger manual deploy in Render dashboard
```

### Deploy Backend (Heroku)
```bash
# Deploy backend subdirectory
git subtree push --prefix health-care/backend heroku main

# Or use Heroku GitHub integration (recommended)
```

---

## 📞 Emergency Contacts

**Technical Issues:**
- DevOps Lead: [contact]
- Backend Lead: [contact]
- Frontend Lead: [contact]

**Business Issues:**
- Product Manager: [contact]
- Customer Support: info@medcorebd.com

**Service Providers:**
- Vercel Support: https://vercel.com/support
- Render Support: https://render.com/support
- MongoDB Atlas Support: https://support.mongodb.com
- Cloudinary Support: https://support.cloudinary.com

---

## ✅ Final Sign-Off

- [ ] All checklist items completed
- [ ] Production environment tested
- [ ] Team trained on monitoring
- [ ] Documentation updated
- [ ] Launch approved by stakeholders

**Deployed By:** _______________  
**Date:** _______________  
**Approved By:** _______________  

---

**🚀 Ready for Production Launch!**
