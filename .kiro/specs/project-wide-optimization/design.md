# Design Document: Project-Wide Optimization

## Overview

This document describes the technical design for comprehensive optimization of the MedCore BD platform. The work spans frontend performance, backend efficiency, code quality, security, testing, SEO, accessibility, and documentation. Changes are organized into logical groups that can be executed in parallel where dependencies allow.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Vercel (Frontend)                     │
│  Next.js 16 App Router                                   │
│  ├── Bundle Optimization (code splitting, tree shaking)  │
│  ├── Image Pipeline (Next/Image + Cloudinary AVIF/WebP)  │
│  ├── Performance Monitoring (GA4 + Sentry + web-vitals)  │
│  ├── SEO Layer (metadata, schemas, sitemap)              │
│  └── Accessibility Layer (ARIA, keyboard nav, a11y)      │
└────────────────────┬────────────────────────────────────┘
                     │ HTTPS / gzip
┌────────────────────▼────────────────────────────────────┐
│               Render/Heroku (Backend)                    │
│  Express.js API                                          │
│  ├── Security Middleware (Helmet, rate-limit, CSRF)      │
│  ├── Caching Layer (Redis → in-memory fallback)          │
│  ├── Response Optimization (ETag, compression, fields)   │
│  ├── Error Handling (Winston + Sentry + request IDs)     │
│  └── Monitoring (/api/health, /api/metrics)              │
└────────────────────┬────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        ▼                         ▼
┌───────────────┐        ┌────────────────┐
│ MongoDB Atlas │        │  Redis Cloud   │
│ (indexes,     │        │  (TTL caching, │
│  pooling,     │        │   warming,     │
│  transactions)│        │   hit-rate     │
└───────────────┘        │   monitoring)  │
                         └────────────────┘
```

## Design Decisions

### 1. Frontend Bundle Size Optimization

**Approach:** Audit with `@next/bundle-analyzer`, then apply targeted dynamic imports and dependency pruning.

**Key changes:**
- Enable `ANALYZE=true` mode in `next.config.mjs` to generate bundle reports on each production build
- Convert heavy below-the-fold components (admin charts, PDF generators, rich text editors) to `dynamic()` imports with `{ ssr: false }` where appropriate
- Replace full Recharts import with named imports: `import { LineChart, BarChart } from 'recharts'`
- Replace full react-icons import with direct path imports: `import { FiSearch } from 'react-icons/fi'`
- Audit `package.json` for unused packages; remove confirmed dead dependencies
- Configure `next.config.mjs` `experimental.optimizePackageImports` for large icon/component libraries

**Bundle size targets:**
- Initial JS: ≤250KB gzipped per route
- Total reduction: ≥20% from baseline

### 2. Image Optimization and Delivery

**Approach:** Enforce Next.js `<Image>` component everywhere; configure Cloudinary transformations for AVIF/WebP.

**Key changes:**
- Audit all `.jsx` files for raw `<img>` tags and replace with `next/image`
- Add `width` and `height` props to every `<Image>` to eliminate CLS
- Set `priority` on hero/above-the-fold images; `loading="lazy"` is default for the rest
- Add `placeholder="blur"` with `blurDataURL` for product images (generate via Cloudinary `e_blur:200,q_1,f_auto`)
- Configure `next.config.mjs` image formats: `['image/avif', 'image/webp']`
- Cloudinary delivery URL pattern: `f_auto,q_auto,w_{width},dpr_auto`
- Define `sizes` prop on product grid images: `"(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"`

### 3. Core Web Vitals Optimization

**Approach:** Address each vital with targeted fixes; validate with Lighthouse CI in the build pipeline.

| Vital | Target | Primary Fix |
|-------|--------|-------------|
| LCP | <2.5s | Priority image loading, font preload, preconnect |
| FID/INP | <100ms | Defer non-critical JS, reduce main thread work |
| CLS | <0.1 | Explicit image dimensions, skeleton loaders |
| TTI | <3.8s | Code splitting, reduce JS parse time |

**Key changes:**
- `next/font` already configured; verify `display: 'swap'` and `preload: true`
- Add `<link rel="preconnect">` for `res.cloudinary.com`, `fonts.googleapis.com`, `www.google-analytics.com`
- Move non-critical scripts (chat widgets, analytics) to `next/script` with `strategy="lazyOnload"`
- Add skeleton/shimmer placeholders for product grids to prevent layout shifts
- Run `npm run lighthouse` in CI and fail if scores drop below thresholds (90 desktop / 80 mobile)

### 4. Database Query Optimization

**Approach:** Add targeted indexes to MongoDB, use projections everywhere, replace chained queries with aggregation pipelines.

**Indexes to add (`health-care/backend/src/models/`):**

```javascript
// Product.js
ProductSchema.index({ category: 1, brand: 1, price: 1 });
ProductSchema.index({ category: 1, isActive: 1, stock: 1 });
ProductSchema.index({ slug: 1 }, { unique: true });
ProductSchema.index({ name: 'text', description: 'text', brand: 'text' }); // text search

// Order.js
OrderSchema.index({ user: 1, createdAt: -1 });
OrderSchema.index({ status: 1, createdAt: -1 });

// Review.js
ReviewSchema.index({ product: 1, createdAt: -1 });
```

**Query patterns:**
- Always use `.select('field1 field2 -_id')` projection — never return full documents for list views
- Replace `Product.find().populate('category').populate('brand')` chains with `$lookup` aggregation
- Use cursor-based pagination (`{ _id: { $gt: lastId } }`) for large collections instead of `skip()`
- Add Mongoose plugin for slow query logging: log any query >100ms with query details

### 5. Redis Caching Strategy

**Approach:** Standardize cache keys, TTLs, and invalidation patterns across all controllers.

**Cache key schema:**
```
products:list:{page}:{limit}:{filters_hash}   TTL: 3600s (1h)
products:detail:{slug}                         TTL: 1800s (30m)
categories:list                                TTL: 86400s (24h)
homepage:featured                              TTL: 300s (5m)
```

**Cache warming on startup:**
```javascript
// server.js — after DB connection established
async function warmCache() {
  await cacheService.warmFeaturedProducts();
  await cacheService.warmCategories();
}
```

**Invalidation triggers:**
- `POST/PUT/DELETE /api/products/*` → delete `products:list:*` and `products:detail:{slug}`
- `POST/PUT/DELETE /api/categories/*` → delete `categories:list`

**Hit-rate monitoring:** Log warning when `cache_hits / (cache_hits + cache_misses) < 0.70` on a rolling 5-minute window.

**Connection pooling:** Configure `ioredis` with `maxRetriesPerRequest: 3`, `enableReadyCheck: true`, `lazyConnect: false`.

### 6. API Response Optimization

**Approach:** Add compression, ETag support, field filtering, and consistent pagination to all list endpoints.

**Middleware additions to `server.js`:**
```javascript
import compression from 'compression';
app.use(compression({ threshold: 1024 })); // gzip responses >1KB
```

**ETag pattern:**
```javascript
// middleware/etag.js
import etag from 'etag';
res.setHeader('ETag', etag(JSON.stringify(data)));
if (req.headers['if-none-match'] === res.getHeader('ETag')) {
  return res.status(304).end();
}
```

**Field filtering:** Accept `?fields=name,price,slug` query param; apply as Mongoose `.select()` projection.

**Pagination metadata format:**
```json
{
  "data": [...],
  "pagination": {
    "page": 1, "limit": 20, "total": 450,
    "totalPages": 23, "hasNext": true, "hasPrev": false
  }
}
```

**Null field removal:** Use `JSON.stringify(data, (k, v) => v ?? undefined)` or a `toJSON` transform on Mongoose schemas.

### 7. Code Quality and Consistency

**Approach:** Enforce via ESLint rules and Husky pre-commit hooks; fix all existing violations.

**ESLint additions (`.eslintrc.js`):**
```javascript
rules: {
  'import/order': ['error', { groups: ['builtin','external','internal','parent','sibling'] }],
  'no-console': ['error', { allow: ['warn', 'error'] }],
  'no-unused-vars': 'error',
  'no-unused-imports': 'error',
}
```

**Path alias enforcement:** ESLint rule `no-restricted-imports` to flag relative imports that cross directory boundaries.

**Pre-commit hook (`.husky/pre-commit`):**
```bash
cd health-care && npm run lint
cd health-care/backend && npm run lint
```

### 8. Dead Code Elimination

**Approach:** Use ESLint `no-unused-vars`, manual audit of components/controllers, and `depcheck` for unused packages.

**Process:**
1. Run `npx depcheck` in both `health-care/` and `health-care/backend/` to identify unused npm packages
2. Run ESLint with `--fix` to auto-remove unused imports
3. Manually audit `src/components/` for components not imported anywhere
4. Manually audit `backend/src/controllers/` for exported functions not referenced in routes
5. Remove commented-out code blocks (identified by `// TODO` and `/* ... */` blocks >5 lines)

### 9. Test Coverage Enhancement

**Approach:** Add tests systematically by layer; configure Jest coverage thresholds to enforce minimums.

**Coverage thresholds (`jest.config.js`):**
```javascript
coverageThreshold: {
  global: { branches: 70, functions: 75, lines: 75, statements: 75 }
}
```

**Priority test additions:**
- Frontend: `AuthContext`, `CartContext`, `useApi`, `useProducts`, `helpers.js`, `validation.js`
- Backend: auth controller (login/register/refresh), product controller (CRUD), order controller, auth middleware, rate limiter middleware, Redis cache service
- Integration: `POST /api/auth/login`, `GET /api/products`, `POST /api/orders`, `GET /api/health`

**Test file locations:**
- Frontend: `src/components/__tests__/`, `src/hooks/__tests__/`, `src/utils/__tests__/`
- Backend: `backend/src/controllers/__tests__/`, `backend/src/middleware/__tests__/`

### 10. Security Hardening

**Approach:** Verify all existing security middleware is correctly configured; add missing pieces.

**Middleware audit checklist:**
- `helmet()` — verify CSP, HSTS, X-Frame-Options are set
- `express-mongo-sanitize` — applied before all routes
- `xss-clean` — applied before all routes
- `hpp` — applied before all routes
- `express-rate-limit` — auth routes: 5 req/15min; general API: 100 req/15min

**CSRF protection:** Add `csurf` middleware for all state-changing endpoints (POST/PUT/DELETE); exempt API routes using JWT (stateless).

**JWT refresh mechanism:**
```
Access token:  15 minutes TTL
Refresh token: 7 days TTL, stored in httpOnly cookie
Refresh endpoint: POST /api/auth/refresh
```

**Auth failure logging:**
```javascript
logger.warn('AUTH_FAILURE', { ip: req.ip, email: req.body.email, reason, timestamp: new Date() });
```

### 11. Error Handling and Logging

**Approach:** Centralize all error handling; add request ID tracing; configure log rotation.

**Request ID middleware:**
```javascript
import { v4 as uuidv4 } from 'uuid';
app.use((req, res, next) => {
  req.id = uuidv4();
  res.setHeader('X-Request-ID', req.id);
  next();
});
```

**Centralized error handler (`middleware/errorHandler.js`):**
```javascript
export const errorHandler = (err, req, res, next) => {
  const status = err.status || 500;
  logger.error({ requestId: req.id, error: err.message, stack: err.stack });
  if (status >= 500) Sentry.captureException(err);
  res.status(status).json({
    success: false,
    message: status >= 500 ? 'Internal server error' : err.message,
    requestId: req.id,
  });
};
```

**Log rotation:** Configure Winston `DailyRotateFile` transport — keep 14 days, max 20MB per file.

**Frontend error boundaries:** Wrap each major page section in `<ErrorBoundary>` component that reports to Sentry.

### 12. Database Connection Management

**Approach:** Configure Mongoose connection options for pooling, timeouts, and graceful shutdown.

**Mongoose connection config (`config/database.js`):**
```javascript
mongoose.connect(MONGODB_URI, {
  minPoolSize: 10,
  maxPoolSize: 50,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 10000,
  heartbeatFrequencyMS: 30000,
  waitQueueTimeoutMS: 5000,
});
```

**Graceful shutdown:**
```javascript
process.on('SIGTERM', async () => {
  await mongoose.connection.close();
  server.close(() => process.exit(0));
});
```

**Health check:** `mongoose.connection.readyState === 1` → healthy; return 503 otherwise.

**Transaction support:** Use `mongoose.startSession()` + `session.withTransaction()` for multi-document operations (order creation, stock decrement).

### 13. Frontend Performance Monitoring

**Approach:** Use `web-vitals` library to capture and report CWV; integrate with GA4 and Sentry.

**Implementation (`src/utils/webVitals.js`):**
```javascript
import { onCLS, onFID, onLCP, onTTFB, onINP } from 'web-vitals';

export function reportWebVitals(metric) {
  // Send to GA4
  gtag('event', metric.name, { value: Math.round(metric.value), metric_id: metric.id });
  // Log warning if threshold exceeded
  const thresholds = { LCP: 2500, FID: 100, CLS: 0.1, INP: 200 };
  if (thresholds[metric.name] && metric.value > thresholds[metric.name]) {
    console.warn(`[CWV] ${metric.name} exceeded threshold: ${metric.value}`);
  }
}
```

**Error boundaries:** `src/components/ui/ErrorBoundary.jsx` — catches React render errors, reports to Sentry, shows fallback UI.

### 14. Backend Performance Monitoring

**Approach:** Add request timing middleware; expose `/api/health` and `/api/metrics` endpoints.

**Request timing middleware:**
```javascript
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (duration > 1000) logger.warn(`SLOW_REQUEST ${req.method} ${req.path} ${duration}ms`);
  });
  next();
});
```

**`/api/health` response:**
```json
{
  "status": "ok",
  "db": "connected",
  "redis": "connected",
  "uptime": 3600,
  "memory": { "used": "128MB", "total": "512MB" }
}
```

**`/api/metrics` response:** Expose `process.memoryUsage()`, `process.cpuUsage()`, request counts, cache hit/miss ratio, average response time per endpoint.

### 15. Documentation Updates

**Approach:** Add JSDoc to all hooks and utilities; generate Swagger docs from existing route definitions.

**JSDoc pattern for hooks:**
```javascript
/**
 * Fetches paginated products with optional filters.
 * @param {Object} filters - Filter options (category, brand, priceRange)
 * @param {number} page - Page number (1-indexed)
 * @returns {{ products: Product[], loading: boolean, error: string|null }}
 */
export function useProducts(filters, page) { ... }
```

**Swagger setup (`backend/src/config/swagger.js`):** Use `swagger-jsdoc` + `swagger-ui-express`; document all routes with `@swagger` JSDoc annotations; expose at `/api/docs`.

**README updates:**
- `health-care/README.md`: setup steps, env vars table, architecture diagram, common commands
- `health-care/backend/README.md`: setup steps, env vars table, API docs link, deployment guide

### 16. Build and Deployment Optimization

**Approach:** Leverage Next.js built-in optimizations; add CI gates for lint, tests, and bundle size.

**`next.config.mjs` additions:**
```javascript
const nextConfig = {
  compiler: { removeConsole: { exclude: ['error', 'warn'] } },
  experimental: {
    optimizePackageImports: ['react-icons', 'recharts', 'date-fns'],
  },
  productionBrowserSourceMaps: true, // for Sentry
};
```

**CI pipeline gates (`.github/workflows/test.yml`):**
1. `npm run lint` — fail on any ESLint error
2. `npm test -- --coverage` — fail if coverage below thresholds
3. `npm run build` — fail on build errors
4. `npm run analyze` — upload bundle report as artifact

**Build-time env validation:** Add `src/utils/validateEnv.js` that checks required env vars at startup and throws if missing.

### 17. Dependency Management

**Approach:** Run `npm audit`, update safe minor/patch versions, configure Dependabot.

**Process:**
1. `npm audit --fix` in both `health-care/` and `health-care/backend/`
2. `npx npm-check-updates -u --target minor` for safe updates
3. Test after each batch of updates
4. Remove packages confirmed unused by `depcheck`

**Dependabot config (`.github/dependabot.yml`):** Already exists — verify it covers both `health-care/` and `health-care/backend/` directories with weekly schedule.

**CI security gate:** Add `npm audit --audit-level=high` step to CI; fail pipeline on high/critical vulnerabilities.

### 18. Code Architecture Refinements

**Approach:** Extract business logic from controllers into services; standardize response format; add repository layer.

**Backend response format (all endpoints):**
```javascript
// Success
{ "success": true, "data": {...}, "message": "optional" }
// Error
{ "success": false, "message": "...", "errors": [...], "requestId": "..." }
// List
{ "success": true, "data": [...], "pagination": {...} }
```

**Repository pattern example:**
```javascript
// backend/src/repositories/productRepository.js
export const productRepository = {
  findBySlug: (slug) => Product.findOne({ slug }).select('name price images category brand'),
  findWithFilters: (filters, pagination) => Product.find(filters).select(...).skip(...).limit(...),
};
```

**Frontend architecture:** Extract data-fetching logic from view components into custom hooks; keep view components as pure presentational components receiving props.

### 19. SEO and Metadata Optimization

**Approach:** Add `generateMetadata()` to all dynamic pages; create missing schema components.

**Product page metadata (`app/products/[id]/page.jsx`):**
```javascript
export async function generateMetadata({ params }) {
  const product = await fetchProduct(params.id);
  return {
    title: `${product.name} — Price in Bangladesh | MedCore BD`,
    description: `Buy ${product.name} by ${product.brand} in Bangladesh. ৳${product.price?.toLocaleString()}. DGDA certified. Free delivery in Dhaka.`,
    alternates: { canonical: `${SITE_CONFIG.url}/products/${product.slug}` },
    openGraph: { images: [{ url: product.images[0], width: 800, height: 600 }] },
  };
}
```

**Schema components to create:**
- `src/components/seo/ProductSchema.jsx` — Product JSON-LD with price, availability, brand
- `src/components/seo/BreadcrumbSchema.jsx` — BreadcrumbList JSON-LD
- `src/components/seo/FAQSchema.jsx` — FAQPage JSON-LD for product pages

**Sitemap (`src/app/sitemap.js`):** Fetch all products and categories from API; include `lastModified`, `changeFrequency`, `priority`.

### 20. Accessibility Improvements

**Approach:** Audit with axe-core; fix semantic HTML, ARIA, keyboard navigation, and focus management.

**Key fixes:**
- Replace `<div onClick>` with `<button>` for interactive elements
- Add `aria-label` to icon-only buttons: `<button aria-label="Add to cart">`
- Add `role="alert"` and `aria-live="polite"` to form error messages
- Implement focus trap in modals using `focus-trap-react` or custom hook
- Add skip link: `<a href="#main-content" className="sr-only focus:not-sr-only">Skip to content</a>`
- Ensure all form inputs have associated `<label>` elements
- Verify color contrast with Tailwind's color palette (use `slate-700` minimum for body text on white)
- Add `aria-expanded`, `aria-controls` to accordion/dropdown components

**Focus indicator:** Add to `globals.css`:
```css
:focus-visible {
  outline: 2px solid #2563eb;
  outline-offset: 2px;
}
```

## Implementation Phases

The 20 requirements are grouped into 6 phases based on dependencies and impact:

| Phase | Focus | Requirements | Priority |
|-------|-------|-------------|----------|
| 1 | Security & Stability | 10, 11, 12 | Critical |
| 2 | Backend Performance | 4, 5, 6, 14 | High |
| 3 | Frontend Performance | 1, 2, 3, 13 | High |
| 4 | Code Quality | 7, 8, 18 | Medium |
| 5 | SEO, A11y, Docs | 15, 19, 20 | Medium |
| 6 | Testing & Build | 9, 16, 17 | Medium |

## File Change Summary

### Frontend (`health-care/src/`)
- `next.config.mjs` — bundle analyzer, image formats, package optimization, source maps
- `app/products/[id]/page.jsx` — `generateMetadata()`, ProductSchema, BreadcrumbSchema
- `app/products/page.jsx` — `generateMetadata()`, category metadata
- `app/sitemap.js` — full product/category coverage
- `app/robots.js` — verify disallow rules
- `components/seo/ProductSchema.jsx` — new
- `components/seo/BreadcrumbSchema.jsx` — new
- `components/seo/FAQSchema.jsx` — new
- `components/ui/ErrorBoundary.jsx` — new
- `utils/webVitals.js` — new
- `utils/validateEnv.js` — new
- All components with `<img>` tags → `<Image>`
- All hooks → JSDoc comments
- All utils → JSDoc comments

### Backend (`health-care/backend/src/`)
- `server.js` — compression, request ID, timing middleware, graceful shutdown, cache warming
- `config/database.js` — connection pooling, timeouts
- `middleware/errorHandler.js` — centralized error handler with request ID
- `middleware/rateLimiter.js` — verify auth (5/15min) and API (100/15min) limits
- `middleware/etag.js` — new
- `routes/healthRoutes.js` — `/api/health` and `/api/metrics`
- `config/swagger.js` — new
- `repositories/` — new repository layer
- `models/Product.js`, `Order.js`, `Review.js` — compound indexes
- All controllers → JSDoc, consistent response format
- All utils → JSDoc comments
