# Implementation Plan: Project-Wide Optimization — MedCore BD

## Overview

This plan implements comprehensive optimization across 20 requirement areas for the MedCore BD platform (Next.js 16 / React 19 frontend + Express.js backend). The work is organized into 6 phases based on dependencies and impact priority.

**Execution Strategy:**
- Phase 1 (Security & Stability) must complete first — it establishes critical infrastructure
- Phases 2 (Backend Performance) and 3 (Frontend Performance) run in parallel after Phase 1
- Phases 4 (Code Quality), 5 (SEO/A11y/Docs), and 6 (Testing/Build) run in parallel after Phases 2 and 3
- Tasks within the same phase that modify different files can execute in parallel (see dependency graph)

**Key Implementation Notes:**
- All frontend code uses `@/` path aliases (never relative cross-directory imports)
- Backend follows Route → Controller → Service → Repository pattern (established in Phase 4)
- Design document contains code snippets and patterns to follow during implementation
- Each task references specific requirements for full traceability

---

## Tasks

### Phase 1: Security & Stability (Requirements 10, 11, 12)

- [x] 1. Harden security middleware and rate limiting
  - [x] 1.1 Audit and configure security middleware in `health-care/backend/src/server.js`
    - Verify `helmet()` configuration includes CSP, HSTS, X-Frame-Options, and other security headers
    - Confirm `express-mongo-sanitize` is applied before all routes to prevent MongoDB injection
    - Confirm `xss-clean` is applied before all routes to prevent XSS attacks
    - Confirm `hpp` (HTTP Parameter Pollution protection) is applied before all routes
    - Test each middleware by attempting common attacks (SQL injection, XSS, parameter pollution)
    - _Requirements: 10.5, 10.6, 10.7, 10.8_

  - [x] 1.2 Implement rate limiting in `health-care/backend/src/middleware/rateLimiter.js`
    - Create auth rate limiter: 5 requests per 15 minutes per IP for `/api/auth/login`, `/api/auth/register`
    - Create general API rate limiter: 100 requests per 15 minutes per IP for all `/api/*` routes
    - Configure Redis store for distributed rate limiting using `ioredis` client
    - Add rate limit headers to responses (`X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`)
    - Apply rate limiters in `server.js` before route definitions
    - _Requirements: 10.1, 10.2_

  - [x] 1.3 Add input validation with `express-validator` to route files
    - Add validation chains to `health-care/backend/src/routes/authRoutes.js` (email format, password strength, phone format)
    - Add validation chains to `health-care/backend/src/routes/productRoutes.js` (price range, category ID, pagination params)
    - Add validation chains to `health-care/backend/src/routes/orderRoutes.js` (order status, payment method, delivery address)
    - Add validation chains to `health-care/backend/src/routes/userRoutes.js` (profile updates, password changes)
    - Sanitize all string inputs using `trim()`, `escape()`, and `normalizeEmail()`
    - Reject requests with unexpected fields using `checkExact()` or custom middleware
    - _Requirements: 10.3_

  - [x] 1.4 Implement CSRF protection and JWT refresh mechanism
    - Install and configure `csurf` middleware for state-changing endpoints (POST/PUT/DELETE)
    - Exempt stateless JWT API routes from CSRF (use `ignoreMethods: ['GET', 'HEAD', 'OPTIONS']`)
    - Update JWT strategy in `health-care/backend/src/config/passport.js` to support access tokens (15 min TTL)
    - Implement refresh token generation (7 days TTL) stored in httpOnly cookie
    - Create `POST /api/auth/refresh` endpoint in `health-care/backend/src/routes/authRoutes.js` and `authController.js`
    - Add refresh token validation and rotation logic (invalidate old token on refresh)
    - _Requirements: 10.4, 10.10_

  - [x] 1.5 Add authentication failure logging in `health-care/backend/src/controllers/authController.js`
    - Import Winston logger from `health-care/backend/src/utils/logger.js`
    - Log `AUTH_FAILURE` events with structured data: `{ ip: req.ip, email: req.body.email, reason: 'invalid_password', timestamp: new Date() }`
    - Log failed login attempts, invalid tokens, expired sessions, and account lockouts
    - Ensure sensitive data (passwords, tokens) is never logged
    - _Requirements: 10.9_

- [x] 2. Implement centralized error handling and structured logging
  - [x] 2.1 Create request ID middleware in `health-care/backend/src/server.js`
    - Install `uuid` package if not already present
    - Create middleware that generates UUID v4 for each request: `req.id = uuidv4()`
    - Set `X-Request-ID` response header: `res.setHeader('X-Request-ID', req.id)`
    - Apply middleware before all routes so request ID is available in all handlers
    - _Requirements: 11.5_

  - [x] 2.2 Create centralized error handler in `health-care/backend/src/middleware/errorHandler.js`
    - Create error handler middleware with signature `(err, req, res, next)`
    - Extract status code from error object or default to 500
    - Log all errors with Winston including: `{ requestId: req.id, error: err.message, stack: err.stack, method: req.method, path: req.path }`
    - Forward 5xx errors to Sentry using `Sentry.captureException(err)` from `@sentry/node`
    - Return user-friendly error response: `{ success: false, message: status >= 500 ? 'Internal server error' : err.message, requestId: req.id }`
    - Return appropriate HTTP status codes for different error types (400 for validation, 401 for auth, 404 for not found, 500 for server errors)
    - Register error handler as the last middleware in `server.js`
    - _Requirements: 11.1, 11.2, 11.3, 11.9, 11.10_

  - [x] 2.3 Configure Winston logger with log rotation in `health-care/backend/src/utils/logger.js`
    - Install `winston-daily-rotate-file` if not already present
    - Add `DailyRotateFile` transport with config: `{ filename: 'logs/app-%DATE%.log', datePattern: 'YYYY-MM-DD', maxSize: '20m', maxFiles: '14d' }`
    - Add console transport for development with colorized output
    - Create helper functions for slow query logging: `logger.slowQuery({ query, duration, collection })`
    - Create helper functions for cache miss logging: `logger.cacheMiss({ key, operation })`
    - Export logger instance for use across the application
    - _Requirements: 11.6, 11.7, 11.8_

  - [x] 2.4 Integrate Sentry on the frontend in `health-care/src/`
    - Verify `@sentry/nextjs` is configured in `sentry.client.config.js` and `sentry.server.config.js`
    - Create `health-care/src/components/ui/ErrorBoundary.jsx` component using React error boundaries
    - Implement `componentDidCatch` to capture errors and send to Sentry
    - Display user-friendly fallback UI when errors occur
    - Wrap major page sections in `<ErrorBoundary>` in root layout or page components
    - Test error boundary by throwing test errors in development
    - _Requirements: 11.4, 13.7, 13.8_

- [x] 3. Configure database connection pooling and resilience
  - [x] 3.1 Update Mongoose connection config in `health-care/backend/src/config/database.js`
    - Set connection options: `{ minPoolSize: 10, maxPoolSize: 50, serverSelectionTimeoutMS: 5000 }`
    - Set additional options: `{ socketTimeoutMS: 10000, heartbeatFrequencyMS: 30000, waitQueueTimeoutMS: 5000 }`
    - Add connection event listeners: `mongoose.connection.on('connected', () => logger.info('MongoDB connected'))`
    - Add error event listener: `mongoose.connection.on('error', (err) => logger.error('MongoDB error', err))`
    - Log connection pool metrics periodically using `mongoose.connection.db.admin().serverStatus()`
    - Create helper function to check pool status: `getPoolMetrics()` returning active, idle, and waiting connections
    - _Requirements: 12.1, 12.3, 12.4, 12.6, 12.8_

  - [x] 3.2 Implement automatic reconnection and graceful shutdown in `health-care/backend/src/server.js`
    - Add `SIGTERM` handler: `process.on('SIGTERM', async () => { await mongoose.connection.close(); server.close(() => process.exit(0)); })`
    - Add `SIGINT` handler with same logic for Ctrl+C in development
    - Create health check middleware that returns 503 when `mongoose.connection.readyState !== 1`
    - Log reconnection events: `mongoose.connection.on('reconnected', () => logger.info('MongoDB reconnected'))`
    - Log disconnection events: `mongoose.connection.on('disconnected', () => logger.warn('MongoDB disconnected'))`
    - Test graceful shutdown by sending SIGTERM signal in development
    - _Requirements: 12.2, 12.5, 12.9, 12.10_

  - [x] 3.3 Add transaction support for multi-document operations
    - Update order creation logic in `health-care/backend/src/controllers/orderController.js`
    - Wrap order creation + stock decrement in transaction: `const session = await mongoose.startSession(); await session.withTransaction(async () => { ... })`
    - Apply transaction pattern to cart checkout flow in `cartController.js`
    - Apply transaction pattern to any other multi-document writes (inventory updates, user balance changes)
    - Add error handling to rollback transactions on failure
    - Test transaction rollback by simulating failures during multi-document operations
    - _Requirements: 12.7_

- [~] 4. Phase 1 Checkpoint
  - Verify all security middleware is active by testing with curl/Postman
  - Confirm error handler catches and logs errors with request IDs
  - Check database connection pool metrics are logged
  - Test graceful shutdown by stopping the server
  - Ensure all tests pass for Phase 1 changes
  - Ask the user if questions arise before proceeding to Phase 2/3

---

### Phase 2: Backend Performance (Requirements 4, 5, 6, 14)

- [x] 5. Optimize database queries and add indexes
  - [x] 5.1 Add compound indexes to Mongoose models
    - Update `health-care/backend/src/models/Product.js`: add `ProductSchema.index({ category: 1, brand: 1, price: 1 })`
    - Add `ProductSchema.index({ category: 1, isActive: 1, stock: 1 })` for filtered listings
    - Add `ProductSchema.index({ slug: 1 }, { unique: true })` for slug-based lookups
    - Add `ProductSchema.index({ name: 'text', description: 'text', brand: 'text' })` for text search
    - Update `health-care/backend/src/models/Order.js`: add `OrderSchema.index({ user: 1, createdAt: -1 })`
    - Add `OrderSchema.index({ status: 1, createdAt: -1 })` for status-based queries
    - Update `health-care/backend/src/models/Review.js`: add `ReviewSchema.index({ product: 1, createdAt: -1 })`
    - Test index creation by checking MongoDB logs or using `db.collection.getIndexes()`
    - _Requirements: 4.1, 4.2_

  - [x] 5.2 Refactor product listing queries to use projections and aggregation
    - Update `health-care/backend/src/controllers/productController.js` `getProducts` method
    - Replace `Product.find().populate('category').populate('brand')` with aggregation pipeline using `$lookup`
    - Apply `.select('name price images category brand slug stock isActive')` projection to all list queries
    - Implement cursor-based pagination: replace `skip(page * limit)` with `{ _id: { $gt: lastId } }.limit(limit)`
    - Add `lastId` parameter to pagination response for client to use in next request
    - Update frontend to use cursor-based pagination instead of page numbers
    - _Requirements: 4.3, 4.4, 4.6, 4.7_

  - [x] 5.3 Add slow query logging plugin to Mongoose
    - Create `health-care/backend/src/utils/mongooseSlowQueryPlugin.js`
    - Implement plugin that hooks into `pre` and `post` query hooks to measure duration
    - Log queries exceeding 100ms with: `{ method, collection, filter, duration, timestamp }`
    - Integrate with Winston logger from `health-care/backend/src/utils/logger.js`
    - Apply plugin globally: `mongoose.plugin(slowQueryPlugin)` in `database.js`
    - Test by running slow queries and verifying logs appear
    - _Requirements: 4.5, 4.8_

- [x] 6. Enhance Redis caching strategy
  - [x] 6.1 Standardize cache key schema and TTLs in `health-care/backend/src/services/redisCache.js`
    - Define cache key constants: `CACHE_KEYS = { PRODUCTS_LIST: 'products:list', PRODUCTS_DETAIL: 'products:detail', CATEGORIES_LIST: 'categories:list', HOMEPAGE_FEATURED: 'homepage:featured' }`
    - Define TTL constants: `CACHE_TTL = { PRODUCTS_LIST: 3600, PRODUCTS_DETAIL: 1800, CATEGORIES_LIST: 86400, HOMEPAGE_FEATURED: 300 }`
    - Implement key generation functions: `generateProductListKey(page, limit, filters)` that creates hash of filters
    - Implement key generation functions: `generateProductDetailKey(slug)`
    - Update all cache.get/set calls across controllers to use standardized keys and TTLs
    - _Requirements: 5.2, 5.3, 5.4_

  - [x] 6.2 Implement cache warming on server startup in `health-care/backend/src/server.js`
    - Create `warmCache()` async function that calls `cacheService.warmFeaturedProducts()` and `cacheService.warmCategories()`
    - Implement `warmFeaturedProducts()` in `redisCache.js`: fetch featured products from DB and store in cache
    - Implement `warmCategories()` in `redisCache.js`: fetch all categories from DB and store in cache
    - Call `warmCache()` after MongoDB connection is established but before server starts listening
    - Add error handling to prevent cache warming failures from blocking server startup
    - Log cache warming completion with timing metrics
    - _Requirements: 5.1_

  - [x] 6.3 Implement cache invalidation triggers in controllers
    - Update `health-care/backend/src/controllers/productController.js` create/update/delete methods
    - On product create/update/delete: call `cacheService.invalidateProductList()` and `cacheService.invalidateProductDetail(slug)`
    - Implement `invalidateProductList()` in `redisCache.js`: delete all keys matching `products:list:*` pattern
    - Implement `invalidateProductDetail(slug)` in `redisCache.js`: delete `products:detail:{slug}` key
    - Update `health-care/backend/src/controllers/categoryController.js` create/update/delete methods
    - On category create/update/delete: call `cacheService.invalidateCategories()`
    - Test invalidation by creating/updating products and verifying cache is cleared
    - _Requirements: 5.5, 5.6, 5.7_

  - [x] 6.4 Configure ioredis connection pooling and hit-rate monitoring
    - Update `health-care/backend/src/services/redisCache.js` Redis client configuration
    - Set ioredis options: `{ maxRetriesPerRequest: 3, enableReadyCheck: true, lazyConnect: false, retryStrategy: (times) => Math.min(times * 50, 2000) }`
    - Implement hit-rate tracking: maintain counters for cache hits and misses
    - Create `getHitRate()` function that calculates `hits / (hits + misses)` over rolling 5-minute window
    - Log warning when hit rate drops below 70%: `logger.warn('Cache hit rate below threshold', { hitRate, hits, misses })`
    - Implement graceful fallback: wrap all cache operations in try-catch that falls back to DB on Redis errors
    - Test fallback by stopping Redis and verifying app continues to work
    - _Requirements: 5.8, 5.9, 5.10_

- [x] 7. Optimize API responses
  - [x] 7.1 Add compression middleware to `health-care/backend/src/server.js`
    - Install `compression` package if not already present
    - Add `app.use(compression({ threshold: 1024, level: 6 }))` before route definitions
    - Configure to compress responses larger than 1KB
    - Test compression by checking `Content-Encoding: gzip` header in responses
    - Measure response size reduction using browser dev tools or curl
    - _Requirements: 6.1_

  - [x] 7.2 Create ETag middleware in `health-care/backend/src/middleware/etag.js`
    - Install `etag` package if not already present
    - Create middleware that generates ETag from response body: `const tag = etag(JSON.stringify(data))`
    - Set ETag header: `res.setHeader('ETag', tag)`
    - Check `If-None-Match` request header: if matches ETag, return `res.status(304).end()`
    - Add `Cache-Control` headers with appropriate `max-age` values based on route
    - Apply ETag middleware to GET endpoints for products, categories, and other cacheable resources
    - Test by making repeated requests and verifying 304 responses
    - _Requirements: 6.3, 6.4, 6.10_

  - [x] 7.3 Implement field filtering and null-field removal
    - Update all list endpoint controllers to accept `?fields=name,price,slug` query parameter
    - Parse fields parameter and apply as Mongoose `.select()` projection
    - Add Mongoose schema `toJSON` transform to strip null/undefined fields: `transform: (doc, ret) => { Object.keys(ret).forEach(key => ret[key] == null && delete ret[key]); return ret; }`
    - Apply transform to Product, Order, User, and other schemas
    - Test field filtering by requesting specific fields and verifying response only includes those fields
    - Measure payload size reduction using browser dev tools
    - _Requirements: 6.2, 6.6_

  - [x] 7.4 Standardize pagination on all list endpoints
    - Update all list endpoint controllers to use consistent pagination format
    - Set default limit to 20 items; accept `?limit` query parameter (max 100)
    - Include pagination metadata in response: `{ data: [...], pagination: { page, limit, total, totalPages, hasNext, hasPrev } }`
    - Implement response streaming for large datasets using Node.js streams
    - Create helper function `paginateResponse(query, page, limit)` in `health-care/backend/src/utils/pagination.js`
    - Apply pagination helper to all list endpoints (products, orders, users, reviews)
    - _Requirements: 6.5, 6.7, 6.8, 6.9_

- [x] 8. Implement backend performance monitoring
  - [x] 8.1 Add request timing middleware to `health-care/backend/src/server.js`
    - Create middleware that captures request start time: `const start = Date.now()`
    - Listen to response `finish` event to calculate duration: `res.on('finish', () => { const duration = Date.now() - start; })`
    - Log requests exceeding 1 second: `if (duration > 1000) logger.warn('SLOW_REQUEST', { method: req.method, path: req.path, status: res.statusCode, duration })`
    - Add `X-Response-Time` header to all responses: `res.setHeader('X-Response-Time', `${duration}ms`)`
    - Apply middleware early in the stack before all routes
    - _Requirements: 14.1, 14.8_

  - [x] 8.2 Create health and metrics endpoints in `health-care/backend/src/routes/healthRoutes.js`
    - Create `GET /api/health` endpoint that returns: `{ status: 'ok', db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected', redis: await redisClient.ping() === 'PONG' ? 'connected' : 'disconnected', uptime: process.uptime(), memory: process.memoryUsage() }`
    - Create `GET /api/metrics` endpoint that returns: `{ memory: process.memoryUsage(), cpu: process.cpuUsage(), requests: requestCounts, cacheHitRate, avgResponseTime }`
    - Implement request counting middleware that tracks requests per endpoint
    - Calculate average response time per endpoint using rolling window
    - Log warnings when memory usage exceeds 80%: `if (memoryUsage.heapUsed / memoryUsage.heapTotal > 0.8) logger.warn('High memory usage')`
    - Log warnings when endpoint response time exceeds 2 seconds
    - _Requirements: 14.2, 14.3, 14.4, 14.5, 14.6, 14.7, 14.9, 14.10_

- [x] 9. Phase 2 Checkpoint
  - Verify all database indexes are created using MongoDB Compass or shell
  - Test cache warming by restarting server and checking logs
  - Verify health endpoint returns 200 with correct status
  - Check slow query logs appear for queries >100ms
  - Measure API response time improvements using Postman or curl
  - Ask the user if questions arise before proceeding to Phase 4

---

### Phase 3: Frontend Performance (Requirements 1, 2, 3, 13)

- [x] 10. Optimize frontend bundle size
  - [x] 10.1 Enable bundle analyzer and configure optimizations in `health-care/next.config.mjs`
    - Install `@next/bundle-analyzer` if not already present
    - Add bundle analyzer configuration: `const withBundleAnalyzer = require('@next/bundle-analyzer')({ enabled: process.env.ANALYZE === 'true' })`
    - Wrap Next.js config with analyzer: `module.exports = withBundleAnalyzer(nextConfig)`
    - Add to `experimental` section: `optimizePackageImports: ['react-icons', 'recharts', 'date-fns', '@heroicons/react']`
    - Add to `compiler` section: `removeConsole: { exclude: ['error', 'warn'] }`
    - Enable source maps for Sentry: `productionBrowserSourceMaps: true`
    - Run `ANALYZE=true npm run build` to generate bundle report
    - _Requirements: 1.1, 1.6, 16.3, 16.4_

  - [x] 10.2 Convert heavy components to dynamic imports
    - Identify heavy below-the-fold components in admin dashboard (`health-care/src/app/admin/`)
    - Convert admin charts to dynamic imports: `const SalesChart = dynamic(() => import('@/components/admin/SalesChart'), { ssr: false, loading: () => <ChartSkeleton /> })`
    - Convert PDF generators to dynamic imports in order/invoice pages
    - Convert rich text editors (if any) to dynamic imports
    - Update Recharts imports from `import { LineChart, BarChart, PieChart } from 'recharts'` (named imports only)
    - Update react-icons imports from `import { FiSearch, FiShoppingCart } from 'react-icons/fi'` (direct path imports)
    - Test that dynamic components load correctly and show loading states
    - _Requirements: 1.2, 1.3, 1.9, 1.10_

  - [x] 10.3 Audit and remove unused npm dependencies
    - Run `npx depcheck` in `health-care/` directory
    - Review list of unused dependencies and confirm they are truly unused
    - Remove confirmed unused packages from `package.json`
    - Run `npm install` to update `package-lock.json`
    - Verify tree shaking is working by checking bundle analyzer report for unused exports
    - Run build and tests to ensure nothing breaks after dependency removal
    - _Requirements: 1.4, 1.5, 1.7, 1.8_

- [x] 11. Audit and fix all image components
  - [x] 11.1 Replace all `<img>` tags with Next.js `<Image>` component
    - Search for all `<img` tags in `health-care/src/` using grep or IDE search
    - Replace each `<img>` with `import Image from 'next/image'` and `<Image>`
    - Add explicit `width` and `height` props to every `<Image>` component
    - For responsive images, use `fill` prop with `sizes` attribute instead of width/height
    - Update ProductCard component to use `<Image>` with proper dimensions
    - Update category cards, hero images, and logo images
    - _Requirements: 2.1, 2.2, 2.3_

  - [x] 11.2 Configure image loading priorities, placeholders, and responsive sizes
    - Add `priority` prop to hero images in `health-care/src/app/page.jsx` (homepage)
    - Add `priority` prop to above-the-fold product images in product detail pages
    - Add `placeholder="blur"` to product images with Cloudinary-generated blur data URLs
    - Generate blur data URLs using Cloudinary transformation: `e_blur:200,q_1,f_auto`
    - Add `sizes` prop to product grid images: `sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"`
    - Add `sizes` prop to category grid images based on layout breakpoints
    - Test that images load with proper priorities and placeholders
    - _Requirements: 2.4, 2.5, 2.7, 2.9_

  - [x] 11.3 Configure Cloudinary delivery and image formats in `health-care/next.config.mjs`
    - Update `images` section: `formats: ['image/avif', 'image/webp']`
    - Verify Cloudinary remote patterns are configured: `remotePatterns: [{ protocol: 'https', hostname: 'res.cloudinary.com' }]`
    - Update Cloudinary URLs to use optimization parameters: `f_auto,q_auto,w_{width},dpr_auto`
    - Create helper function in `health-care/src/utils/cloudinary.js` for generating optimized URLs
    - Test that images are served in AVIF format with WebP fallback
    - _Requirements: 2.6, 2.8, 2.10_

- [x] 12. Optimize Core Web Vitals
  - [x] 12.1 Add preconnect hints and verify font loading in `health-care/src/app/layout.jsx`
    - Add `<link rel="preconnect" href="https://res.cloudinary.com" />` to head
    - Add `<link rel="preconnect" href="https://fonts.googleapis.com" />` to head
    - Add `<link rel="preconnect" href="https://www.google-analytics.com" />` to head
    - Verify `next/font` configuration uses `display: 'swap'` and `preload: true` for Plus Jakarta Sans and Lora
    - Check that fonts are defined at top of layout file and applied to body
    - _Requirements: 3.5, 3.6_

  - [x] 12.2 Defer non-critical scripts and add skeleton loaders
    - Move chat widgets to `next/script` with `strategy="lazyOnload"` in layout
    - Move non-critical analytics scripts to `strategy="lazyOnload"`
    - Create skeleton loader components in `health-care/src/components/ui/Skeleton.jsx`
    - Add skeleton loaders to product grids: `<ProductGridSkeleton />` shown while loading
    - Add skeleton loaders to product detail page for images and content
    - Test that skeletons prevent layout shifts during loading
    - _Requirements: 3.7, 3.8_

  - [x] 12.3 Configure Lighthouse CI in `.github/workflows/test.yml`
    - Install `@lhci/cli` as dev dependency in `health-care/`
    - Create `health-care/lighthouserc.js` configuration file
    - Set performance thresholds: desktop score ≥90, mobile score ≥80
    - Set Core Web Vitals thresholds: LCP <2.5s, FID <100ms, CLS <0.1
    - Add Lighthouse CI step to GitHub Actions workflow
    - Configure to fail build if thresholds are not met
    - Test locally using `npm run lighthouse` command
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.9, 3.10_

- [x] 13. Implement frontend performance monitoring
  - [x] 13.1 Create web vitals reporting utility in `health-care/src/utils/webVitals.js`
    - Install `web-vitals` package if not already present
    - Import vitals functions: `import { onCLS, onFID, onLCP, onTTFB, onINP } from 'web-vitals'`
    - Create `reportWebVitals(metric)` function that sends metrics to GA4: `gtag('event', metric.name, { value: Math.round(metric.value), metric_id: metric.id, metric_delta: metric.delta })`
    - Add threshold checking: log warnings when LCP >2500ms, FID >100ms, CLS >0.1, INP >200ms
    - Track page load times using Performance API: `performance.getEntriesByType('navigation')`
    - Track API response times from client perspective using `performance.mark()` and `performance.measure()`
    - Export function to be called from root layout or pages
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 13.9, 13.10_

- [x] 14. Phase 3 Checkpoint
  - Run production build and verify it completes without errors
  - Generate bundle analyzer report and verify bundle size reduction ≥20%
  - Search codebase for remaining `<img>` tags and verify none exist
  - Run Lighthouse CI locally and verify scores meet thresholds
  - Test web vitals reporting in browser console
  - Ask the user if questions arise before proceeding to Phase 4

---

### Phase 4: Code Quality (Requirements 7, 8, 18)

- [x] 15. Enforce ESLint rules and fix all violations
  - [x] 15.1 Update ESLint configurations for frontend and backend
    - Update `health-care/.eslintrc.json` to add rules: `"import/order": ["error", { "groups": ["builtin", "external", "internal", "parent", "sibling"], "newlines-between": "always" }]`
    - Add rule: `"no-console": ["error", { "allow": ["warn", "error"] }]`
    - Add rule: `"no-unused-vars": ["error", { "argsIgnorePattern": "^_" }]`
    - Add rule: `"no-restricted-imports": ["error", { "patterns": ["../**/components/*", "../**/utils/*"] }]` to enforce path aliases
    - Update `health-care/backend/.eslintrc.js` with same rules adapted for backend
    - Install `eslint-plugin-import` if not already present
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

  - [x] 15.2 Run ESLint fix and manually resolve remaining violations
    - Run `npm run lint:fix` in `health-care/` to auto-fix import order and unused imports
    - Run `npm run lint:fix` in `health-care/backend/` to auto-fix backend violations
    - Manually fix remaining import order violations that couldn't be auto-fixed
    - Replace all relative cross-directory imports with `@/` path aliases in frontend
    - Remove all `console.log` statements from backend except in `logger.js`
    - Remove all unused imports and variables flagged by ESLint
    - Verify `npm run lint` passes with zero warnings in both workspaces
    - _Requirements: 7.5, 7.6, 7.7, 7.8_

  - [x] 15.3 Configure Husky pre-commit hook to run lint
    - Verify Husky is installed and `.husky/` directory exists
    - Update `.husky/pre-commit` to include: `cd health-care && npm run lint || exit 1`
    - Add: `cd health-care/backend && npm run lint || exit 1`
    - Test pre-commit hook by making a commit with lint errors and verifying it's blocked
    - Test that valid commits pass through successfully
    - _Requirements: 7.9, 7.10_

- [ ] 16. Eliminate dead code
  - [x] 16.1 Audit and remove unused frontend code
    - Run `npx depcheck` in `health-care/` and save output
    - Review unused dependencies list and confirm each is truly unused
    - Remove unused npm packages from `package.json`
    - Search for components in `health-care/src/components/` not imported anywhere using grep: `grep -r "import.*ComponentName" src/`
    - Remove confirmed unused components and their test files
    - Search for unused utility functions in `health-care/src/utils/` and remove them
    - Search for unused constants in `health-care/src/constants/` and remove them
    - Remove commented-out code blocks >5 lines using regex search
    - _Requirements: 8.1, 8.2, 8.3, 8.7, 8.9_

  - [x] 16.2 Audit and remove unused backend code
    - Run `npx depcheck` in `health-care/backend/` and save output
    - Review unused dependencies list and confirm each is truly unused
    - Remove unused npm packages from `package.json`
    - Search for controller methods not referenced in route files: check each export in controllers against route imports
    - Remove confirmed unused controller methods
    - Search for unused middleware functions not applied in `server.js` or route files
    - Remove unused utility functions in `health-care/backend/src/utils/`
    - Remove commented-out code blocks >5 lines
    - _Requirements: 8.4, 8.5, 8.6, 8.8, 8.10_

- [x] 17. Refactor code architecture
  - [x] 17.1 Extract business logic from controllers into service layer
    - Create `health-care/backend/src/services/` directory if it doesn't exist
    - Create `productService.js` with functions: `createProduct(data)`, `updateProduct(id, data)`, `deleteProduct(id)`, `getProductsByFilters(filters)`
    - Create `orderService.js` with functions: `createOrder(orderData)`, `updateOrderStatus(orderId, status)`, `calculateOrderTotal(items)`
    - Create `userService.js` with functions: `createUser(userData)`, `updateUserProfile(userId, data)`, `getUserOrders(userId)`
    - Refactor controllers to call service functions instead of directly manipulating models
    - Create repository layer in `health-care/backend/src/repositories/` for database operations
    - Create `productRepository.js` with functions: `findBySlug(slug)`, `findWithFilters(filters, pagination)`, `create(data)`, `update(id, data)`
    - Update services to call repository functions instead of directly using Mongoose models
    - _Requirements: 18.4, 18.5, 18.6_

  - [x] 17.2 Standardize backend response format across all controllers
    - Create response helper in `health-care/backend/src/utils/responseHelper.js`
    - Implement `successResponse(res, data, message)` that returns: `{ success: true, data, message }`
    - Implement `errorResponse(res, message, errors, statusCode)` that returns: `{ success: false, message, errors, requestId }`
    - Implement `paginatedResponse(res, data, pagination)` that returns: `{ success: true, data, pagination }`
    - Update all controllers to use response helpers instead of direct `res.json()` calls
    - Ensure consistent error handling patterns: all errors thrown with proper status codes
    - _Requirements: 18.8, 18.10_

  - [x] 17.3 Refactor frontend components to separate concerns
    - Identify "smart" components that mix data fetching and presentation
    - Extract data fetching logic into custom hooks in `health-care/src/hooks/`
    - Create `useProductDetail(slug)` hook that fetches product data and returns `{ product, loading, error }`
    - Create `useProductList(filters, page)` hook that fetches product list
    - Update view components to use hooks and receive data as props
    - Organize components by feature domain: move related components into feature folders
    - Implement consistent loading state management: use `<Skeleton>` components everywhere
    - Implement consistent error handling: use `<ErrorMessage>` component everywhere
    - _Requirements: 18.1, 18.2, 18.3, 18.7, 18.9_

- [x] 18. Phase 4 Checkpoint
  - Run `npm run lint` in both workspaces and verify zero warnings
  - Verify dead code has been removed by checking file sizes and line counts
  - Test pre-commit hook by attempting to commit code with lint errors
  - Verify service layer is working by testing API endpoints
  - Ask the user if questions arise before proceeding to Phase 5

---

### Phase 5: SEO, Accessibility & Documentation (Requirements 15, 19, 20)

- [x] 19. Add SEO metadata and structured data
  - [x] 19.1 Add `generateMetadata()` to dynamic product and category pages
    - Update `health-care/src/app/products/[id]/page.jsx` to export `generateMetadata({ params })`
    - Fetch product data in `generateMetadata` and return metadata object with: `title`, `description`, `alternates.canonical`, `openGraph.images`, `twitter.card`
    - Use format: `title: ${product.name} — Price ৳${product.price} in Bangladesh | MedCore BD`
    - Use format: `description: Buy ${product.name} by ${product.brand} in Bangladesh. DGDA certified. Free delivery in Dhaka.`
    - Update `health-care/src/app/products/page.jsx` to export `generateMetadata()` for category filtering
    - Use `CATEGORY_SEO` from `health-care/src/config/seo.js` for category-specific metadata
    - Add Open Graph images using product's first image
    - Add Twitter Card metadata with `summary_large_image` type
    - _Requirements: 19.1, 19.2, 19.6, 19.9, 19.10_

  - [x] 19.2 Create SEO schema components in `health-care/src/components/seo/`
    - Create `ProductSchema.jsx` that generates Product JSON-LD with: `@type: "Product"`, `name`, `description`, `image`, `brand`, `offers: { price, priceCurrency: "BDT", availability }`, `aggregateRating`
    - Create `BreadcrumbSchema.jsx` that generates BreadcrumbList JSON-LD with: `@type: "BreadcrumbList"`, `itemListElement` array with position, name, and item URL
    - Create `FAQSchema.jsx` that generates FAQPage JSON-LD with: `@type: "FAQPage"`, `mainEntity` array of questions and answers
    - Each component should accept props and return `<script type="application/ld+json">` with JSON.stringify(schema)
    - Add schemas to appropriate pages: ProductSchema in product detail, BreadcrumbSchema in all pages, FAQSchema in product pages with FAQ section
    - _Requirements: 19.3, 19.4_

  - [x] 19.3 Update sitemap, robots, and image alt text
    - Update `health-care/src/app/sitemap.js` to fetch all products and categories from API
    - Include fields: `url`, `lastModified`, `changeFrequency: 'weekly'`, `priority: 0.8` for products
    - Include categories with `priority: 0.9` and homepage with `priority: 1.0`
    - Update `health-care/src/app/robots.js` to allow crawling of product/category pages
    - Disallow: `/admin/*`, `/account/*`, `/checkout/*`, `/cart`, `/api/*`
    - Audit all image components for alt text: search for `<Image` without `alt` prop
    - Update ProductCard alt text to: `${product.name} — ${product.brand} — Price ৳${product.price} Bangladesh`
    - Update category card alt text to: `${category.name} supplier Bangladesh — MedCore BD`
    - _Requirements: 19.5, 19.7, 19.8_

- [x] 20. Implement accessibility improvements
  - [x] 20.1 Fix semantic HTML and add ARIA attributes
    - Search for `<div onClick` patterns and replace with `<button>` elements
    - Add `aria-label` to all icon-only buttons: `<button aria-label="Add to cart"><FiShoppingCart /></button>`
    - Add `role="alert"` and `aria-live="polite"` to form error message containers
    - Add `aria-expanded` and `aria-controls` to accordion/dropdown components
    - Add `aria-current="page"` to active navigation links
    - Add `aria-label` to search inputs: `<input aria-label="Search products" />`
    - Test with screen reader (NVDA/JAWS on Windows, VoiceOver on Mac) to verify announcements
    - _Requirements: 20.1, 20.2, 20.7_

  - [x] 20.2 Implement keyboard navigation and focus management
    - Install `focus-trap-react` package for modal focus trapping
    - Wrap modal content in `<FocusTrap>` component to trap focus within modal
    - Add skip-to-content link in `health-care/src/app/layout.jsx`: `<a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white">Skip to content</a>`
    - Add `id="main-content"` to main content area in layout
    - Add `:focus-visible` styles to `health-care/src/app/globals.css`: `:focus-visible { outline: 2px solid #2563eb; outline-offset: 2px; border-radius: 4px; }`
    - Test keyboard navigation: verify all interactive elements are reachable with Tab key
    - Test that Enter/Space keys activate buttons and links
    - _Requirements: 20.3, 20.4, 20.6, 20.10_

  - [x] 20.3 Audit and fix color contrast, form labels, and image alt text
    - Use browser dev tools or axe DevTools to check color contrast ratios
    - Update text colors to meet WCAG AA standard (4.5:1 for normal text, 3:1 for large text)
    - Use Tailwind `slate-700` minimum for body text on white backgrounds
    - Ensure all form inputs have associated `<label>` elements with `htmlFor` attribute
    - For inputs without visible labels, add `aria-label` attribute
    - Verify all images have descriptive `alt` text (coordinate with task 19.3)
    - Test with axe DevTools browser extension and fix all critical/serious issues
    - _Requirements: 20.5, 20.7, 20.8, 20.9_
    - **STATUS**: ✅ Complete — Fixed RegisterPage, DeliveryAddress, ForgotPasswordPage, ResetPasswordPage, LoginPage

- [ ] 21. Add JSDoc documentation and update READMEs
  - [x] 21.1 Add JSDoc comments to frontend hooks and utilities
    - Add JSDoc to all hooks in `health-care/src/hooks/` with format:
      ```javascript
      /**
       * Fetches paginated products with optional filters.
       * @param {Object} filters - Filter options (category, brand, priceRange)
       * @param {number} page - Page number (1-indexed)
       * @returns {{ products: Product[], loading: boolean, error: string|null }}
       * @example
       * const { products, loading, error } = useProducts({ category: 'diagnostic' }, 1);
       */
      ```
    - Add JSDoc to all utilities in `health-care/src/utils/` with `@param`, `@returns`, and `@example` tags
    - Document component props using TypeScript interfaces or PropTypes with JSDoc comments
    - _Requirements: 15.1, 15.2, 15.10_

  - [x] 21.2 Add JSDoc comments to backend controllers and middleware
    - Add JSDoc to all controller methods in `health-care/backend/src/controllers/` with format:
      ```javascript
      /**
       * Get paginated list of products with filters.
       * @param {Request} req - Express request object
       * @param {Response} res - Express response object
       * @param {NextFunction} next - Express next middleware function
       * @returns {Promise<void>}
       */
      ```
    - Add JSDoc to all middleware functions in `health-care/backend/src/middleware/`
    - Document all service and repository functions with `@param` and `@returns` tags
    - _Requirements: 15.4, 15.5_

  - [x] 21.3 Set up Swagger/OpenAPI documentation for backend API
    - Install `swagger-jsdoc` and `swagger-ui-express` packages
    - Create `health-care/backend/src/config/swagger.js` with Swagger configuration
    - Define API info: `title: "MedCore BD API"`, `version: "1.0.0"`, `description: "Medical equipment e-commerce API"`
    - Add `@swagger` JSDoc annotations to all route files with: path, method, tags, summary, parameters, responses
    - Example: `@swagger /api/products - GET - Returns paginated list of products`
    - Mount Swagger UI at `/api/docs` in `server.js`: `app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))`
    - Test by visiting `http://localhost:5000/api/docs` and verifying all endpoints are documented
    - _Requirements: 15.3_

  - [x] 21.4 Update README files and document environment variables
    - Update `health-care/README.md` with sections: Setup Instructions, Environment Variables, Architecture Overview, Common Commands, Deployment
    - Create environment variables table with columns: Variable, Description, Required, Example
    - Add architecture diagram (can be ASCII art or link to diagram)
    - Update `health-care/backend/README.md` with: Setup Instructions, Environment Variables, API Documentation Link, Database Schema, Deployment Guide
    - Document all frontend env vars in `health-care/.env.example` with comments
    - Document all backend env vars in `health-care/backend/.env.example` with comments
    - _Requirements: 15.6, 15.7, 15.8, 15.9_

- [x] 22. Phase 5 Checkpoint
  - Verify all product pages have metadata by checking page source
  - Verify SEO schema components render JSON-LD scripts
  - Run axe DevTools and verify no critical accessibility violations
  - Visit `/api/docs` and verify Swagger UI loads with all endpoints
  - Check that README files are complete and accurate
  - Ask the user if questions arise before proceeding to Phase 6

---

### Phase 6: Testing & Build (Requirements 9, 16, 17)

- [ ] 23. Enhance test coverage
  - [-] 23.1 Add unit tests for frontend context providers and custom hooks
    - Create `health-care/src/context/__tests__/AuthContext.test.jsx` to test login, logout, token refresh, and auth state
    - Create `health-care/src/context/__tests__/CartContext.test.jsx` to test add to cart, remove from cart, update quantity, clear cart
    - Create `health-care/src/context/__tests__/WishlistContext.test.jsx` to test add/remove wishlist items
    - Create `health-care/src/hooks/__tests__/useApi.test.js` to test API call wrapper, error handling, loading states
    - Create `health-care/src/hooks/__tests__/useProducts.test.js` to test product fetching, filtering, pagination
    - Create `health-care/src/hooks/__tests__/useOrders.test.js` to test order fetching and status updates
    - Create `health-care/src/hooks/__tests__/useDebounce.test.js` to test debounce functionality
    - Create `health-care/src/utils/__tests__/helpers.test.js` to test utility functions (formatPrice, formatDate, etc.)
    - Create `health-care/src/utils/__tests__/validation.test.js` to test validation functions (email, phone, password)
    - Use `@testing-library/react` and `@testing-library/react-hooks` for testing
    - _Requirements: 9.1, 9.5_

  - [-] 23.2 Add unit tests for backend controllers and middleware
    - Create `health-care/backend/src/controllers/__tests__/authController.test.js` to test login, register, refresh token, logout
    - Create `health-care/backend/src/controllers/__tests__/productController.test.js` to test CRUD operations (create, read, update, delete, list)
    - Create `health-care/backend/src/controllers/__tests__/orderController.test.js` to test order creation, status updates, order history
    - Create `health-care/backend/src/middleware/__tests__/auth.test.js` to test JWT verification, role-based access control
    - Create `health-care/backend/src/middleware/__tests__/rateLimiter.test.js` to test rate limiting logic
    - Create `health-care/backend/src/services/__tests__/redisCache.test.js` to test cache operations (get, set, delete, invalidate)
    - Use Jest with Supertest for HTTP testing and mock MongoDB/Redis connections
    - _Requirements: 9.2, 9.3, 9.4, 9.5, 9.7_

  - [-] 23.3 Add integration tests for critical API endpoints
    - Create `health-care/backend/src/__tests__/integration/auth.test.js` to test full auth flow: register → login → access protected route → refresh token
    - Create `health-care/backend/src/__tests__/integration/products.test.js` to test: `GET /api/products` with filters, `GET /api/products/:id`, `POST /api/products` (admin only)
    - Create `health-care/backend/src/__tests__/integration/orders.test.js` to test: `POST /api/orders` (create order), `GET /api/orders/:id`, `PATCH /api/orders/:id/status`
    - Create `health-care/backend/src/__tests__/integration/health.test.js` to test: `GET /api/health` returns correct status
    - Test authentication flows: valid login, invalid credentials, expired token, token refresh
    - Test authorization flows: admin-only routes, user-only routes, public routes
    - Mock payment processing logic to avoid real transactions
    - Use test database or in-memory MongoDB for integration tests
    - _Requirements: 9.6, 9.7, 9.8_

  - [~] 23.4 Configure Jest coverage thresholds and HTML reporting
    - Update `health-care/jest.config.js` to add `coverageThreshold: { global: { branches: 70, functions: 75, lines: 75, statements: 75 } }`
    - Update `health-care/backend/jest.config.js` with same thresholds
    - Configure `coverageReporters: ['html', 'text', 'lcov', 'json-summary']` in both configs
    - Add `collectCoverageFrom` patterns to include all source files and exclude test files
    - Run `npm test -- --coverage` in both workspaces and verify coverage reports are generated
    - Verify tests fail if coverage drops below thresholds
    - _Requirements: 9.9, 9.10_

- [x] 24. Optimize build pipeline and CI gates
  - [x] 24.1 Add build-time environment variable validation
    - Create `health-care/src/utils/validateEnv.js` that checks required env vars at build time
    - Define required vars: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_GA_MEASUREMENT_ID`, `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`
    - Throw error with helpful message if any required var is missing: `throw new Error('Missing required environment variable: NEXT_PUBLIC_API_URL')`
    - Call validation function in `next.config.mjs` at the top of the file
    - Create similar validation for backend in `health-care/backend/src/utils/validateEnv.js`
    - Check required backend vars: `MONGODB_URI`, `JWT_SECRET`, `REDIS_URL`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
    - Call validation in `health-care/backend/src/server.js` before starting server
    - _Requirements: 16.5_

  - [x] 24.2 Update CI workflow with all gates in `.github/workflows/test.yml`
    - Add frontend lint step: `cd health-care && npm run lint` — fail on any ESLint error
    - Add backend lint step: `cd health-care/backend && npm run lint` — fail on any ESLint error
    - Add frontend test step: `cd health-care && npm test -- --coverage` — fail if coverage below thresholds
    - Add backend test step: `cd health-care/backend && npm test -- --coverage` — fail if coverage below thresholds
    - Add frontend build step: `cd health-care && npm run build` — fail on build errors
    - Add bundle analysis step: `cd health-care && ANALYZE=true npm run build` — upload bundle report as artifact
    - Add security audit step: `cd health-care && npm audit --audit-level=high` — fail on high/critical vulnerabilities
    - Add backend security audit: `cd health-care/backend && npm audit --audit-level=high`
    - Configure workflow to run on pull requests and pushes to main branch
    - Add status badge to README showing build status
    - _Requirements: 16.1, 16.2, 16.6, 16.7, 16.8, 16.9, 16.10_

- [x] 25. Audit and update dependencies
  - [x] 25.1 Run security audits and update dependencies
    - Run `npm audit` in `health-care/` and review vulnerabilities
    - Run `npm audit --fix` to auto-fix vulnerabilities with compatible updates
    - Run `npm audit` in `health-care/backend/` and review vulnerabilities
    - Run `npm audit --fix` in backend
    - Run `npx npm-check-updates -u --target minor` in `health-care/` to update to latest minor versions
    - Test frontend after updates: run build and tests
    - Run `npx npm-check-updates -u --target minor` in `health-care/backend/`
    - Test backend after updates: run tests and start server
    - Remove packages confirmed unused by `depcheck` (coordinate with tasks 16.1 and 16.2)
    - Document any packages that couldn't be updated due to breaking changes
    - _Requirements: 17.1, 17.2, 17.3, 17.4, 17.5, 17.6_

  - [x] 25.2 Verify and update Dependabot configuration
    - Check `.github/dependabot.yml` exists and is properly configured
    - Verify it includes both `health-care/` and `health-care/backend/` directories
    - Set schedule to weekly: `schedule: { interval: "weekly" }`
    - Configure to create PRs for major version updates: `open-pull-requests-limit: 10`
    - Add auto-merge rules for patch updates in GitHub settings (optional)
    - Test by manually triggering Dependabot or waiting for scheduled run
    - Review and merge any pending Dependabot PRs
    - _Requirements: 17.7, 17.8, 17.9, 17.10_
    - **STATUS**: ✅ Complete — Dependabot properly configured for frontend, backend, and GitHub Actions

- [~] 26. Final Checkpoint — Ensure all tests pass
  - Run full test suite in frontend: `cd health-care && npm test -- --coverage`
  - Run full test suite in backend: `cd health-care/backend && npm test -- --coverage`
  - Verify coverage thresholds are met in both workspaces
  - Run full CI pipeline locally or in GitHub Actions
  - Verify bundle size report is generated and shows ≥20% reduction
  - Check that all lint, test, build, and audit steps pass
  - Review final bundle analyzer report and identify any remaining optimization opportunities
  - Ask the user if questions arise or if they want to proceed with deployment

---

## Notes

- **Optional Tasks**: Tasks marked with `*` are optional and can be skipped for faster MVP delivery (none in this plan — all tasks are required)
- **Traceability**: Each task references specific requirements for full traceability back to the requirements document
- **Execution Order**: Phase 1 must complete before Phases 2 and 3; Phases 2 and 3 can run in parallel; Phases 4, 5, and 6 can run in parallel after Phases 2 and 3
- **Parallelization**: Tasks within the same phase that modify different files can execute in parallel (see dependency graph below)
- **Code Standards**: All frontend code uses `@/` path aliases; all backend code follows Route → Controller → Service → Repository pattern
- **Design Reference**: The design document (`design.md`) contains code snippets and patterns to follow during implementation
- **Testing Strategy**: Write tests as you implement features; don't wait until Phase 6 to start testing
- **Documentation**: Update documentation as you make changes; don't wait until Phase 5 to document

## Task Dependency Graph

```json
{
  "waves": [
    {
      "id": 0,
      "tasks": ["1.1", "1.2", "1.3", "2.1", "3.1"]
    },
    {
      "id": 1,
      "tasks": ["1.4", "1.5", "2.2", "2.3", "3.2", "3.3"]
    },
    {
      "id": 2,
      "tasks": ["2.4"]
    },
    {
      "id": 3,
      "tasks": ["5.1", "6.1", "7.1", "8.1", "10.1", "11.1", "12.1", "13.1"]
    },
    {
      "id": 4,
      "tasks": ["5.2", "5.3", "6.2", "6.3", "7.2", "7.3", "8.2", "10.2", "11.2", "11.3", "12.2", "12.3"]
    },
    {
      "id": 5,
      "tasks": ["6.4", "7.4", "10.3"]
    },
    {
      "id": 6,
      "tasks": ["15.1", "16.1", "16.2", "17.1", "19.1", "19.2", "20.1", "21.1", "23.1", "23.2", "24.1", "25.1"]
    },
    {
      "id": 7,
      "tasks": ["15.2", "15.3", "17.2", "17.3", "19.3", "20.2", "20.3", "21.2", "21.3", "23.3", "24.2", "25.2"]
    },
    {
      "id": 8,
      "tasks": ["21.4", "23.4"]
    }
  ]
}
```

**Wave Explanation:**
- **Wave 0**: Initial security and infrastructure setup (can run in parallel)
- **Wave 1**: Depends on Wave 0 — error handling, auth mechanisms, DB resilience
- **Wave 2**: Frontend error boundary (depends on Sentry config from Wave 1)
- **Wave 3**: Backend and frontend performance foundations (can run in parallel after Wave 2)
- **Wave 4**: Performance optimizations building on Wave 3 foundations
- **Wave 5**: Final performance tuning (depends on Wave 4)
- **Wave 6**: Code quality, SEO, accessibility, testing, and build setup (can run in parallel after Wave 5)
- **Wave 7**: Refinements and integrations (depends on Wave 6)
- **Wave 8**: Final documentation and coverage configuration
