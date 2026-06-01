# Production Architecture — MedCore BD

## Current Architecture (Broken)

```
┌─────────────────────────────────────────────────────────────┐
│                         USERS                                │
│                    (Bangladesh)                              │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ HTTPS
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    VERCEL (Frontend)                         │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Next.js 16 App Router                                 │ │
│  │  - React 19.2.4                                        │ │
│  │  - Tailwind CSS 4                                      │ │
│  │  - Google Analytics 4                                  │ │
│  │  - Sentry Error Tracking                               │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  URL: https://health-care-e-commerce-murex.vercel.app       │
│  Status: ✅ DEPLOYED                                         │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ API Calls
                         │ https://health-care-e-commerce.onrender.com/api
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  RENDER.COM (Backend)                        │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  ❌ NOT DEPLOYED OR MISCONFIGURED                      │ │
│  │                                                         │ │
│  │  Expected:                                              │ │
│  │  - Express.js API                                       │ │
│  │  - Node.js Runtime                                      │ │
│  │  - JWT Authentication                                   │ │
│  │  - Rate Limiting                                        │ │
│  │  - Security Middleware                                  │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  URL: https://health-care-e-commerce.onrender.com           │
│  Status: ❌ NOT RESPONDING (500 errors)                     │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ (Should connect to)
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              MONGODB ATLAS (Database)                        │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  ❓ UNKNOWN STATUS                                      │ │
│  │                                                         │ │
│  │  - Products Collection                                  │ │
│  │  - Users Collection                                     │ │
│  │  - Orders Collection                                    │ │
│  │  - Categories Collection                                │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  Status: ❓ May not exist or not configured                 │
└─────────────────────────────────────────────────────────────┘

RESULT: Frontend shows 500 errors because backend is not responding
```

---

## Target Architecture (Working)

```
┌─────────────────────────────────────────────────────────────┐
│                         USERS                                │
│                    (Bangladesh)                              │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ HTTPS
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    VERCEL (Frontend)                         │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Next.js 16 App Router                                 │ │
│  │  - React 19.2.4                                        │ │
│  │  - Tailwind CSS 4                                      │ │
│  │  - Google Analytics 4                                  │ │
│  │  - Sentry Error Tracking                               │ │
│  │  - Image Optimization (Cloudinary)                     │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  URL: https://health-care-e-commerce-murex.vercel.app       │
│  Status: ✅ DEPLOYED                                         │
│  Region: Global CDN                                          │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ API Calls (HTTPS)
                         │ GET /api/products
                         │ POST /api/auth/login
                         │ POST /api/orders
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  RENDER.COM (Backend)                        │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Express.js API Server                                 │ │
│  │  ┌──────────────────────────────────────────────────┐ │ │
│  │  │  Security Layer                                   │ │ │
│  │  │  - Helmet (CSP, HSTS, X-Frame-Options)           │ │ │
│  │  │  - CORS (Vercel domain whitelist)                │ │ │
│  │  │  - Rate Limiting (100 req/15min)                 │ │ │
│  │  │  - XSS Protection                                 │ │ │
│  │  │  - MongoDB Sanitization                           │ │ │
│  │  └──────────────────────────────────────────────────┘ │ │
│  │  ┌──────────────────────────────────────────────────┐ │ │
│  │  │  Authentication                                   │ │ │
│  │  │  - JWT (Access + Refresh Tokens)                 │ │ │
│  │  │  - Google OAuth 2.0                               │ │ │
│  │  │  - 2FA (TOTP)                                     │ │ │
│  │  │  - Phone OTP                                      │ │ │
│  │  └──────────────────────────────────────────────────┘ │ │
│  │  ┌──────────────────────────────────────────────────┐ │ │
│  │  │  Business Logic                                   │ │ │
│  │  │  - Product Management                             │ │ │
│  │  │  - Order Processing                               │ │ │
│  │  │  - Cart & Wishlist                                │ │ │
│  │  │  - B2B Quotes                                     │ │ │
│  │  │  - Payment Integration                            │ │ │
│  │  │  - Analytics & Reporting                          │ │ │
│  │  └──────────────────────────────────────────────────┘ │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  URL: https://health-care-e-commerce.onrender.com           │
│  Status: ✅ DEPLOYED & RUNNING                              │
│  Region: Singapore (ap-southeast-1)                          │
│  Health: /api/health → 200 OK                               │
└────────────┬───────────────────────┬────────────────────────┘
             │                       │
             │ MongoDB Driver        │ ioredis Client
             ▼                       ▼
┌────────────────────────┐  ┌───────────────────────────────┐
│  MONGODB ATLAS         │  │  REDIS CLOUD / UPSTASH        │
│  (Database)            │  │  (Cache & Sessions)           │
│  ┌──────────────────┐  │  │  ┌─────────────────────────┐ │
│  │  Collections:    │  │  │  │  Cached Data:           │ │
│  │  - products      │  │  │  │  - Product listings     │ │
│  │  - users         │  │  │  │  - Categories           │ │
│  │  - orders        │  │  │  │  - Manufacturers        │ │
│  │  - categories    │  │  │  │  - Rate limit counters  │ │
│  │  - manufacturers │  │  │  │  - Session data         │ │
│  │  - reviews       │  │  │  └─────────────────────────┘ │
│  │  - carts         │  │  │                               │
│  │  - wishlists     │  │  │  Status: ✅ CONNECTED         │
│  │  - quotes        │  │  │  TTL: 1 hour (3600s)          │
│  └──────────────────┘  │  │  Fallback: In-memory cache    │
│                        │  └───────────────────────────────┘
│  Status: ✅ CONNECTED  │
│  Region: Singapore     │
│  Tier: M0 (Free)       │
│  Storage: 512 MB       │
└────────────────────────┘

RESULT: Frontend works perfectly, no 500 errors
```

---

## Data Flow Example: User Loads Homepage

### Current (Broken) Flow

```
1. User visits: https://health-care-e-commerce-murex.vercel.app
   └─> Vercel serves Next.js app ✅

2. Frontend makes API call: GET /api/categories
   └─> https://health-care-e-commerce.onrender.com/api/categories
   └─> ❌ 500 Internal Server Error (backend not responding)

3. Frontend makes API call: GET /api/products?page=1&limit=10
   └─> https://health-care-e-commerce.onrender.com/api/products
   └─> ❌ 500 Internal Server Error (backend not responding)

4. Frontend makes API call: GET /api/stats
   └─> https://health-care-e-commerce.onrender.com/api/stats
   └─> ❌ 500 Internal Server Error (backend not responding)

RESULT: User sees error messages, no products, no categories
```

### Target (Working) Flow

```
1. User visits: https://health-care-e-commerce-murex.vercel.app
   └─> Vercel serves Next.js app ✅

2. Frontend makes API call: GET /api/categories
   └─> Render backend receives request ✅
   └─> Check Redis cache for "categories:all" ✅
   └─> Cache HIT → Return cached data (5ms) ✅
   └─> Frontend receives: {"success": true, "data": [...]} ✅

3. Frontend makes API call: GET /api/products?page=1&limit=10
   └─> Render backend receives request ✅
   └─> Check Redis cache for "products:page:1:limit:10" ✅
   └─> Cache MISS → Query MongoDB ✅
   └─> MongoDB returns products (50ms) ✅
   └─> Cache result in Redis (TTL: 1 hour) ✅
   └─> Frontend receives: {"success": true, "data": [...]} ✅

4. Frontend makes API call: GET /api/stats
   └─> Render backend receives request ✅
   └─> Check Redis cache for "stats:public" ✅
   └─> Cache HIT → Return cached data (5ms) ✅
   └─> Frontend receives: {"success": true, "data": {...}} ✅

RESULT: User sees homepage with products, categories, stats (< 1 second)
```

---

## Security Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    SECURITY LAYERS                           │
└─────────────────────────────────────────────────────────────┘

Layer 1: Network Security
├─ HTTPS/TLS 1.3 (Vercel + Render)
├─ CORS whitelist (Vercel domain only)
├─ DDoS protection (Vercel + Render)
└─ Firewall (MongoDB Atlas IP whitelist)

Layer 2: Application Security
├─ Helmet (CSP, HSTS, X-Frame-Options)
├─ Rate Limiting (100 req/15min per IP)
├─ XSS Protection (xss-clean middleware)
├─ SQL Injection Protection (express-mongo-sanitize)
├─ HPP Protection (hpp middleware)
└─ Input Validation (express-validator)

Layer 3: Authentication & Authorization
├─ JWT Access Tokens (15 min expiry)
├─ JWT Refresh Tokens (7 day expiry, httpOnly cookie)
├─ Google OAuth 2.0
├─ 2FA (TOTP via speakeasy)
├─ Phone OTP verification
└─ Role-based access control (admin, b2b_customer, customer)

Layer 4: Data Security
├─ Password hashing (bcrypt, 10 rounds)
├─ JWT secret rotation (manual)
├─ Environment variable encryption (Render)
├─ MongoDB encryption at rest (Atlas)
└─ Redis TLS connection (optional)

Layer 5: Monitoring & Logging
├─ Winston logging (info, warn, error)
├─ Sentry error tracking
├─ Request ID tracking (UUID v4)
├─ Performance monitoring
└─ Slow query logging (>100ms)
```

---

## Performance Optimizations

### Frontend (Vercel)

```
┌─────────────────────────────────────────────────────────────┐
│  OPTIMIZATION                │  IMPACT                       │
├──────────────────────────────┼───────────────────────────────┤
│  Next.js Image Optimization  │  -60% image size (AVIF/WebP)  │
│  Font Preloading             │  -200ms LCP                   │
│  Code Splitting              │  -40% initial bundle          │
│  Dynamic Imports (Admin)     │  -500KB main bundle           │
│  SWC Minification            │  -20% bundle size             │
│  Vercel Edge Network         │  <50ms TTFB globally          │
│  React Server Components     │  -30% client JS               │
└──────────────────────────────┴───────────────────────────────┘
```

### Backend (Render)

```
┌─────────────────────────────────────────────────────────────┐
│  OPTIMIZATION                │  IMPACT                       │
├──────────────────────────────┼───────────────────────────────┤
│  Redis Caching               │  -95% database queries        │
│  MongoDB Indexing            │  -80% query time              │
│  Connection Pooling          │  -50% connection overhead     │
│  Compression Middleware      │  -70% response size           │
│  ETag Caching                │  -100% unchanged responses    │
│  Aggregation Pipelines       │  -60% complex query time      │
│  Field Filtering             │  -40% response payload        │
└──────────────────────────────┴───────────────────────────────┘
```

---

## Deployment Checklist

### Phase 1: Backend Deployment (15 minutes)

- [ ] Generate JWT secrets (openssl rand -hex 64)
- [ ] Create MongoDB Atlas cluster (M0 Free)
- [ ] Configure MongoDB Network Access (0.0.0.0/0)
- [ ] Get MongoDB connection string
- [ ] Create Render.com web service
- [ ] Configure Render environment variables
- [ ] Deploy backend to Render
- [ ] Verify health endpoint (200 OK)
- [ ] Verify API endpoints (no 500 errors)

### Phase 2: Database Setup (10 minutes)

- [ ] Seed database with initial data
- [ ] Create admin user
- [ ] Add product categories
- [ ] Add manufacturers/brands
- [ ] Add sample products
- [ ] Verify data via API endpoints

### Phase 3: Frontend Verification (5 minutes)

- [ ] Test homepage loads
- [ ] Test product search
- [ ] Test user registration
- [ ] Test user login
- [ ] Test cart functionality
- [ ] Test checkout flow
- [ ] Verify no 500 errors
- [ ] Verify no CORS errors

### Phase 4: Optional Enhancements (Later)

- [ ] Set up Redis caching (Upstash)
- [ ] Configure email (Gmail SMTP)
- [ ] Configure payment gateways (bKash, Nagad)
- [ ] Set up error tracking (Sentry)
- [ ] Set up monitoring (UptimeRobot)
- [ ] Configure custom domain
- [ ] Enable SSL certificates
- [ ] Set up automated backups

---

## Cost Analysis

### Free Tier (Development)

```
Service              | Plan        | Cost    | Limits
---------------------|-------------|---------|---------------------------
Vercel               | Hobby       | $0/mo   | 100 GB bandwidth
Render.com           | Free        | $0/mo   | Cold starts after 15 min
MongoDB Atlas        | M0 Sandbox  | $0/mo   | 512 MB storage
Redis (Upstash)      | Free        | $0/mo   | 10,000 commands/day
Cloudinary           | Free        | $0/mo   | 25 GB storage, 25 GB/mo
Sentry               | Developer   | $0/mo   | 5,000 errors/month
---------------------|-------------|---------|---------------------------
TOTAL                |             | $0/mo   |
```

### Recommended Tier (Production)

```
Service              | Plan        | Cost    | Limits
---------------------|-------------|---------|---------------------------
Vercel               | Hobby       | $0/mo   | 100 GB bandwidth
Render.com           | Starter     | $7/mo   | No cold starts, 512 MB RAM
MongoDB Atlas        | M0 Sandbox  | $0/mo   | 512 MB storage
Redis (Upstash)      | Free        | $0/mo   | 10,000 commands/day
Cloudinary           | Free        | $0/mo   | 25 GB storage, 25 GB/mo
Sentry               | Developer   | $0/mo   | 5,000 errors/month
---------------------|-------------|---------|---------------------------
TOTAL                |             | $7/mo   |
```

### Production Tier (High Traffic)

```
Service              | Plan        | Cost     | Limits
---------------------|-------------|----------|---------------------------
Vercel               | Pro         | $20/mo   | 1 TB bandwidth
Render.com           | Standard    | $15/mo   | 2 GB RAM, auto-scaling
MongoDB Atlas        | M10         | $10/mo   | 2 GB storage, backups
Redis (Upstash)      | Pay-as-go   | $5/mo    | 100K commands/day
Cloudinary           | Plus        | $89/mo   | 100 GB storage, 100 GB/mo
Sentry               | Team        | $26/mo   | 50,000 errors/month
---------------------|-------------|----------|---------------------------
TOTAL                |             | $165/mo  |
```

---

## Monitoring & Alerts

### Health Checks

```
Endpoint                                              | Expected | Alert If
------------------------------------------------------|----------|----------
https://health-care-e-commerce.onrender.com/api/health | 200 OK   | Down > 5 min
https://health-care-e-commerce-murex.vercel.app       | 200 OK   | Down > 5 min
MongoDB Atlas cluster                                 | Online   | Down > 1 min
Redis connection                                      | Online   | Down > 5 min
```

### Performance Metrics

```
Metric                    | Target   | Alert If
--------------------------|----------|----------
API Response Time (p95)   | <200ms   | >500ms
Database Query Time (p95) | <100ms   | >300ms
Cache Hit Rate            | >80%     | <60%
Error Rate                | <1%      | >5%
Uptime                    | >99.9%   | <99%
```

---

## Next Steps

1. **Deploy backend** following `FIX-PRODUCTION-500-ERRORS.md`
2. **Verify deployment** using health checks
3. **Seed database** with initial data
4. **Test frontend** end-to-end
5. **Set up monitoring** (UptimeRobot, Sentry)
6. **Configure optional services** (Redis, email, payments)

---

**Last Updated**: June 1, 2026
**Status**: Backend deployment pending
**Priority**: 🔴 CRITICAL
