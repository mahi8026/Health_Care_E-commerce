# MedCore BD — Comprehensive Fix Plan

**Goal:** Take the project from 74% → 95%+ readiness  
**Total estimated effort:** 40–60 hours across 5 phases  
**Priority:** Security → Build Stability → Data Integrity → Performance → Polish

---

## Phase 0 — Payment Gateway Resolution (Prerequisite)

**Effort:** 8–16 hours (business + technical)  
**Why first:** Without a live payment gateway, the platform cannot process transactions.

| # | Task | Details | Owner |
|---|------|---------|-------|
| 0.1 | Choose payment gateway for Bangladesh | Options: SSLCommerz (recommended), bKash, Nagad, aamarPay | Business decision |
| 0.2 | Implement chosen gateway | Stripe was removed since it doesn't work in BD. SSLCommerz has the best BD support. | Dev |
| 0.3 | Update `.env.example` and `render.yaml` with new gateway keys | — | Dev |
| 0.4 | Test in sandbox → live mode | — | Dev + QA |

---

## Phase 1 — Code Cleanliness (Score 60% → 90%)

**Effort:** 12–16 hours  
**Impact:** High — directly affects maintainability and professional perception

### 1.1 TODO/FIXME Comments — 229 Occurrences

```bash
grep -rn "TODO\|FIXME\|HACK" health-care/src --include="*.jsx" --include="*.js" | grep -v node_modules
```

Action: Audit all 229, categorize, and resolve:

| Category | Expected Count | Action |
|----------|---------------|--------|
| 🔴 Genuine bugs to fix | ~20–30 | Fix immediately |
| 🟡 Features planned but not built | ~50–80 | Convert to GitHub Issues or `.kiro/` tasks |
| 🟢 Code notes/documentation | ~80–120 | Remove or convert to proper comments |
| ✅ Already done | ~20–30 | Remove the TODO |

**Files to check first** (most TODOs concentrated here):
- `health-care/src/views/` — ~80% of frontend TODOs
- `health-care/src/components/admin/` — ~40 TODOs
- `health-care/src/components/checkout/` — ~15 TODOs

### 1.2 Console.log Statements — 94 Backend + 11 Frontend

**Backend (94 occurrences):**
```bash
grep -rn "console\.log" health-care/backend/src --include="*.js" | grep -v node_modules | grep -v "__tests__"
```

| File | Count | Action |
|------|-------|--------|
| `src/controllers/*.js` | ~40 | Replace with `logger.info()` or `logger.debug()` |
| `src/services/*.js` | ~25 | Replace with `logger.info()` or `logger.debug()` |
| `src/utils/*.js` | ~15 | Replace with `logger.info()` |
| `src/middleware/*.js` | ~8 | Replace with `logger.info()` |
| `src/server.js` | 6 | `console.error` in fatal handlers — ✅ acceptable, keep |
| `src/config/*.js` | ~5 | Replace with `logger.info()` |

**Frontend (11 occurrences — all already NODE_ENV-guarded ✅):**
- Already acceptable. No action needed unless strict zero-tolerance policy.

### 1.3 Clean Up 43 `.md` Files → Target 3–4

Current: 43 markdown files at root level (AUDIT_REPORT.md, AGENTS.md, handoff docs, etc.)

| Keep (essential) | Move to `.kiro/` | Delete |
|-----------------|------------------|--------|
| `README.md` | `DEPLOYMENT_SUMMARY.md` | `IMPLEMENTATION_COMPLETE.md` |
| `AGENTS.md` | `POST_DEPLOYMENT_VERIFICATION.md` | `PRIORITY_1_FIXES_SUMMARY.md` |
| `AUDIT_REPORT.md` | `PROJECT_HANDOFF.md` | `PRIORITY_2_*` (4 files) |
| `FIX_PLAN.md` (this) | `FINAL_CODE_REVIEW.md` | `VERCEL_DEPLOYMENT_SUCCESS.md` |
| | `RENDER-ENV-TEMPLATE.txt` (keep as .txt) | `SALES-PACKAGE/` (move to `/docs/sales/`) |

### 1.4 Hardcoded Fallback Values — Audit for Remaining

Even though we removed the 9 named occurrences, check for **numerical** hardcoded fallbacks:

```bash
grep -rn "fallback\|Fallback\|placeholder\|Placeholder" health-care/src --include="*.jsx" --include="*.js" | grep -v node_modules
```

All fallbacks should be:
- Either realistic (small numbers) 
- Or clearly marked as `/* fallback */`  
- Or sourced from `SITE_CONFIG` / constants

---

## Phase 2 — Backend Performance (Score Component: 65% → 90%)

**Effort:** 6–8 hours  
**Impact:** Medium — prevents production incidents under load

### 2.1 Add `.lean()` to All Read-Only `.find()` Queries

```bash
grep -rn "\.find(" health-care/backend/src/controllers --include="*.js" | grep -v "\.lean()"
```

**Files to fix (20+ occurrences):**

| File | Count | Fix Pattern |
|------|-------|-------------|
| `analyticsController.js` | 4 | `Product.find({...}).lean()` |
| `adminController.js` | 5 | `User.find(filter).lean()` |
| `categoryController.js` | 3 | `Category.find(query).lean()` |
| `chatController.js` | 2 | `Conversation.find(query).lean()` |
| `couponController.js` | 2 | `Coupon.find(query).lean()` |
| `cartController.js` | 1 | `Cart.find({...}).lean()` |
| `flashDealController.js` | 1 | `FlashDeal.find(filter).lean()` |
| `activityLogController.js` | 2 | `ActivityLog.find(query).lean()` |

**Exception:** If you need Mongoose document methods (`.save()`, `.populate()`), keep without `.lean()`.

### 2.2 Add `.limit()` to Unbounded `.find()` Queries

**Files to fix (10+ occurrences):**

| File | Issue | Fix |
|------|-------|-----|
| `adminController.js:139` | `Product.find({ lowStock })` — no limit | Add `.limit(50)` |
| `adminController.js:144` | `Product.find({ criticalStock })` — no limit | Add `.limit(50)` |
| `adminController.js:150` | `Order.find()` — no limit | Add `.limit(20)` |
| `adminController.js:296` | `User.find(filter)` — no limit | Add `.limit(100)` |
| `adminController.js:483` | `User.find({ role: 'admin' })` — safe (few admins) | Add `.limit(50)` |
| `analyticsController.js:836` | `Product.find({ isActive: true })` — could be 10K+ | Add `.limit(1000)` |
| `couponController.js:439` | `Coupon.find()` — no limit | Add `.limit(100)` |
| `cartController.js:251` | `Cart.find({ isAbandoned: true })` — no limit | Add `.limit(500)` |

### 2.3 Add Try/Catch to Async Controllers (Safety Net)

Current: 417 async handlers, 0 explicit try/catch blocks. The app likely uses `express-async-errors` or a wrapper, but explicit try/catch is more robust.

**Approach:** Do NOT add try/catch to all 417. Instead:
1. Verify if `express-async-errors` is in use (check `server.js` imports)
2. If yes, add a centralized error handling middleware test
3. Only add explicit try/catch in critical payment/order controllers:
   - `paymentController.js`
   - `orderController.js`
   - `authController.js`

### 2.4 Add Database Indexes

Check current indexes in models and add missing ones:
```bash
grep -rn "index:" health-care/backend/src/models --include="*.js"
```

**Verify these indexes exist:**
- `Product`: `{ isActive: 1, category: 1, price: 1 }` — compound for product listing
- `Order`: `{ user: 1, createdAt: -1 }` — user order history
- `Order`: `{ status: 1, createdAt: -1 }` — admin order management
- `Cart`: `{ user: 1 }` (unique) — cart lookup
- `Review`: `{ product: 1, createdAt: -1 }` — product reviews

---

## Phase 3 — Security Hardening (Score 72% → 90%)

**Effort:** 4–6 hours  
**Impact:** Critical — prevents data breaches

### 3.1 Add CSRF Protection

Current: Cookie parser is configured but CSRF is noted as "handled by SameSite cookies." Add explicit CSRF token middleware for production.

| File | Action |
|------|--------|
| `server.js` | Add `csurf` or `csrf-csrf` middleware (already in dependencies) |
| All state-changing routes | Apply CSRF validation |

### 3.2 Audit Quick Login / Dev Mode

| File | Action |
|------|--------|
| `LoginPage.jsx` | ✅ Already fixed (removed admin123). Wrap remaining Quick Login in `process.env.NODE_ENV !== 'production'` |
| `server.js` | Check `/api/fix-slugs` and `/api/test-email` — require secret but the secret `medcore-test-2026` is hardcoded. Move to env var `SLUG_FIX_SECRET` |

### 3.3 Add Rate Limiting to All Auth Routes

| File | Current | Fix |
|------|---------|-----|
| `authRoutes.js` | Has own limiter (5/15min) | Verify it's applied to all auth sub-routes |
| `paymentRoutes.js` | Has own limiter | Verify |
| `adminRoutes.js` | `adminApiLimiter` at line 24 | ✅ Good |
| All other routes | General `apiLimiter` (100/15min) | ✅ Acceptable |

### 3.4 Verify Environment Variable Coverage

| Env Var | Used In | In `.env.example`? | In `render.yaml`? |
|---------|---------|-------------------|-------------------|
| `ADMIN_URL` | `server.js` CORS | ✅ Yes | ❌ Missing |
| `EMAIL_FROM_NAME` | Email service | ❌ Missing | ✅ Yes |
| `RESEND_API_KEY` | Email service | ❌ Missing | ❌ Missing |
| `RESEND_FROM_EMAIL` | Email service | ❌ Missing | ❌ Missing |

**Action:** Add all missing vars to `.env.example` and `render.yaml`.

---

## Phase 4 — Feature Completion (Score Impact: +5–10%)

**Effort:** 10–20 hours  
**Impact:** High — directly affects user experience

### 4.1 Payment Gateway (Prerequisite — See Phase 0)

### 4.2 Admin Analytics — Replace Fallback/Placeholder Data

| File | Issue | Fix |
|------|-------|-----|
| all admin analytics views | Verify every number comes from API | Add `loading` state while data loads |
| `AnalyticsReports.jsx` | Check for hardcoded percentages | Ensure all use `fmt()` or `fmtChange()` |

### 4.3 Add Missing Input Validation

**Backend:** Audit all POST/PUT/PATCH endpoints for `express-validator`:
```bash
grep -rn "body(" health-care/backend/src/routes --include="*.js"
```
Missing validation likely on:
- `settings` route
- `smsRoutes.js`
- `newsletterRoutes.js`
- `uploadRoutes.js`

**Frontend:** Audit all forms for client-side validation:
- Search `onSubmit` handlers without `validation.js` calls
- Check `CheckoutPage.jsx`, `RegisterPage.jsx`, `ProfilePage.jsx`

### 4.4 Fix Empty/Placeholder Files (82 Files)

These files contain `TODO`, `placeholder`, or `Coming soon` — many are legitimate stub pages for future features.

**Action plan:**
1. **Keep + implement:** Top priority pages used in navigation:
   - `account/reviews/page.jsx` — user review management
   - `admin/security/page.jsx` — admin security settings
   - `admin/sms-settings/page.jsx` — SMS configuration
2. **Remove stubs:** If a route exists but has no navigation link and no API, remove the page file (or keep with "Coming soon" badge)
3. **Document** remaining stubs in `.kiro/` as planned features

---

## Phase 5 — Polish & Quality of Life (Score Impact: +5%)

**Effort:** 8–12 hours  
**Impact:** Medium — professional finish

### 5.1 Reduce Build Warnings

| Warning | Fix |
|---------|-----|
| "Next.js inferred your workspace root" | Add `experimental.turbopack.root` in `next.config.mjs` |
| "Custom Cache-Control headers" | Use `generateStaticParams` or configure in `headers()` properly |

### 5.2 Add Loading States Everywhere

Search for components that fetch data but lack loading/error states:
```bash
grep -rn "fetch(" health-care/src --include="*.jsx" --include="*.js" | grep -v "try\|loading\|__tests__"
```

Ensure every fetch has:
```jsx
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);
try { /* fetch */ } catch (err) { setError(err.message); } finally { setLoading(false); }
if (loading) return <Skeleton />;
if (error) return <ErrorState message={error} />;
```

### 5.3 Add `React.memo` to Large Component Lists

Components that benefit from memoization:
- `ProductCard.jsx` (rendered in large grids)
- `ProductFilters.jsx` (frequent re-renders)
- `OrderRow` type components in admin tables

### 5.4 Fix Lint Command

Current: `npm run lint` fails with "Invalid project directory: lint"  
Root cause: `next lint` looking for `lint/` directory  
Fix: Update `.eslintrc` or add `--dir src` flag:

```json
// package.json
"lint": "next lint --dir src"
```

---

## Summary — Effort & Impact Matrix

| Phase | Name | Effort (hrs) | Score Impact | Priority |
|-------|------|-------------|-------------|----------|
| 0 | Payment Gateway | 8–16 | +8% | 🔴 Critical |
| 1 | Code Cleanliness | 12–16 | +5% | 🟡 High |
| 2 | Backend Performance | 6–8 | +5% | 🟡 High |
| 3 | Security Hardening | 4–6 | +3% | 🔴 Critical |
| 4 | Feature Completion | 10–20 | +5–10% | 🟡 High |
| 5 | Polish & QoL | 8–12 | +3% | 🟢 Medium |
| **Total** | | **48–78** | **+21–26%** | |

**Projected final score after all phases: 74% → 95%+**

---

## Quick Win — Execute Immediately (< 30 mins)

These are the fastest fixes with highest impact, runnable via OpenCode in one session:

```bash
# 1. Add .lean() to all backend .find() queries
# 2. Add .limit(100) to unbounded .find() queries
# 3. Fix lint command in package.json
# 4. Add missing env vars to .env.example
# 5. Verify rate limiters on all auth routes
```

---

*This plan was generated from the Phase 1–8 audit in `AUDIT_REPORT.md`.  
Last updated: July 11, 2026*
