# MediportBD — Comprehensive Systematic Fix Plan

**Generated:** July 31, 2026
**Based on:** MEDIPORTBD_AUDIT_REPORT.md (104 issues across 12 categories)
**Scope:** Frontend (`/health-care/src/`) + Backend (`/health-care/backend/src/`)

---

## Pre-Requisite Steps (Do Before Any Phase)

| Step | Action | Detail |
|------|--------|--------|
| P1 | **Rotate ALL production secrets** | Every key in `.env` (MongoDB URI, JWT secrets, CSRF secret, Brevo API key, Cloudinary creds, Twilio keys, Redis password, Google OAuth secret, OneSignal API key) must be rotated IMMEDIATELY via their respective dashboards. The repo copy is compromised. |
| P2 | **Add `.env` to `.gitignore`**, create `.env.example` with placeholders | Remove the committed `.env` from git tracking. Create a template. |
| P3 | **Create a separate `staging` branch** | All fixes should land on `staging` first, then `main` after QA sign-off. |
| P4 | **Set up Sentry / error monitoring** | Needed to verify Phase 3 fixes are working. |

> **Prerequisites block all other work.** Estimated: **4 hours** (mostly ops/DevOps time for secret rotation).

---

## Phase 1: Security & Infrastructure (Blocking — Do First)

**Goal:** Eliminate all critical/high-severity security vulnerabilities. Fixes that unblock all other phases.

### Work Unit 1.1: Emergency Secret Rotation & Git Hygiene

**Files affected:**
- `health-care/backend/.env` → DELETE from repo, rotate all secrets
- `health-care/backend/.env.example` → CREATE with placeholders
- `health-care/backend/.gitignore` → ADD `.env`

**Changes:**
- Rotate every secret in the `.env` file via its respective provider dashboard
- Remove `.env` from git tracking with `git rm --cached`
- Create `.env.example` with all keys but dummy placeholder values
- Add `.env` to `.gitignore`

**Effort:** 3 hours
**Risk:** High — any missed rotation leaves an active exploit. Must coordinate with all service providers.
**Dependencies:** None (this is the first thing to do)

---

### Work Unit 1.2: CSRF Protection

**Files affected:**
- `health-care/backend/src/middleware/csrf.js`
- `health-care/backend/src/server.js`

**Changes:**
- Import and apply `doubleCsrfProtection` middleware to all state-changing routes in `server.js`
- Remove hardcoded fallback `'default-csrf-secret-change-in-production'` in `csrf.js`
- Add startup validation in `server.js` that exits with error if `CSRF_SECRET` env var is missing
- Apply only to cookie-based/session routes if JWT is primary; document the threat model

**Effort:** 2 hours
**Risk:** Medium — incorrectly applying CSRF could block legitimate API calls. Test thoroughly.
**Dependencies:** Work Unit 1.1 (secrets rotated, CSRF_SECRET set)

---

### Work Unit 1.3: reCAPTCHA & Rate Limiting Hardening

**Files affected:**
- `health-care/backend/.env` → ADD valid reCAPTCHA keys
- `health-care/backend/src/middleware/captcha.js`
- `health-care/backend/src/routes/authRoutes.js`
- `health-care/backend/src/middleware/rateLimiter.js`

**Changes:**
- Configure valid reCAPTCHA secret key in `.env.example` and ensure it's required at startup
- Remove CAPTCHA bypass in dev mode (or gate it behind explicit `SKIP_CAPTCHA_DEV` flag)
- Re-enable CAPTCHA on login endpoint in `authRoutes.js` (remove "temporarily disabled" comment)
- Remove the hardcoded fallback password `'password123'` from `LoginPage.jsx` line 259
- Add monitoring/alert when rate limiter falls back to in-memory store (Redis down detection)

**Effort:** 3 hours
**Risk:** Medium — CAPTCHA re-enablement may break automated tests; needs coordination.
**Dependencies:** Work Unit 1.1 (for setting new reCAPTCHA keys)

---

### Work Unit 1.4: Mass Assignment & Input Validation

**Files affected:**
- `health-care/backend/src/controllers/categoryController.js`
- `health-care/backend/src/controllers/manufacturerController.js`
- `health-care/backend/src/controllers/productController.js`
- `health-care/backend/src/controllers/authController.js` (refresh token)
- `health-care/backend/src/middleware/errorHandler.js`

**Changes:**
- In `categoryController.js:173` — whitelist allowed fields before `Model.create()`
- In `manufacturerController.js:107` — whitelist allowed fields before `findByIdAndUpdate()`
- In `productController.js:547,642` — whitelist allowed fields before database operations
- In `authController.js:12` — remove the fallback `JWT_SECRET` when `JWT_REFRESH_SECRET` is not set; throw a startup error instead
- Use a separate flag (`ERROR_DETAIL_ENABLED`) to control stack trace exposure instead of `NODE_ENV`
- In `errorHandler.js:101` — never pass `err.stack` to client in any environment

**Effort:** 3 hours
**Risk:** Low — targeted whitelisting changes, easy to unit test.

**Dependencies:** None (can run in parallel with 1.2, 1.3)

---

### Work Unit 1.5: Unauthenticated Endpoints & Auth Hardening

**Files affected:**
- `health-care/backend/src/routes/chatRoutes.js`
- `health-care/backend/src/routes/authRoutes.js`
- `health-care/backend/src/server.js`
- `health-care/backend/src/middleware/csrf.js`

**Changes:**
- Add `protect` middleware to chat message reading/sending endpoints (chatRoutes.js:49,52-53)
- Re-enable CAPTCHA on login route (overlaps with 1.3)
- Apply `protect` and `authorize('admin')` to `/api/test` test routes (server.js:332)
- Replace deprecated `xss-clean` with `xss` library or use DOMPurify on frontend

**Effort:** 2 hours
**Risk:** Low — straightforward middleware additions.

**Dependencies:** Work Unit 1.2 (CSRF applied)

---

### Work Unit 1.6: Seed Data Security

**Files affected:**
- `health-care/backend/src/utils/seedData.js`

**Changes:**
- Replace plaintext passwords (`admin123`, `password123`) with pre-computed bcrypt hashes
- Add a big warning comment: "NEVER RUN IN PRODUCTION"
- Perform ObjectId lookups for brand/category fields (or use actual ObjectIds)
- Update expired product expiry date (`2025-12-31`) to a future date
- Add `isB2BOrder: true` to B2B seed orders
- Add placeholder Cloudinary image URLs to seed products

**Effort:** 2 hours
**Risk:** Low — only affects seed/dev data.

**Dependencies:** None

---

### Phase 1 Testing Strategy

- **Security scan:** Run `npm audit` and Snyk/Trivy after dependency changes
- **CSRF test:** Verify cookie-based endpoints return 403 without CSRF token
- **reCAPTCHA test:** Verify login fails without valid reCAPTCHA response
- **Mass assignment test:** Attempt to set unauthorized fields via API; verify they are stripped
- **Auth test:** Verify unauthenticated requests to chat/test endpoints return 401
- **Seed data test:** `npm run seed` completes without errors; verify hashed passwords work for login
- **Unit tests:** `npm test` (or `jest`) on affected controllers

---

## Phase 2: Critical Functional Bugs (Blocks Core Workflows)

**Goal:** Fix bugs that prevent users from completing core flows (checkout, payment, auth, email).

### Work Unit 2.1: Checkout Auth Gate

**Files affected:**
- `health-care/src/views/CheckoutPage.jsx`
- `health-care/src/components/checkout/EmptyCartCheckout.jsx` (or similar)

**Changes:**
- Replace `return null` (lines 362-364) with auth gate modal or `<Navigate to="/login">` when user is unauthenticated
- Show login prompt when cart is empty AND user is not authenticated (not just empty cart)
- Add "Please log in to continue" messaging with a login button
- Use the existing `AuthModal` component if available, or redirect with `useRouter`

**Effort:** 2 hours
**Risk:** Low — conditional rendering change.

**Dependencies:** None

---

### Work Unit 2.2: Missing Email Functions

**Files affected:**
- `health-care/backend/src/services/emailService.js`
- `health-care/backend/src/controllers/authController.js`
- `health-care/backend/src/utils/stockAlertCron.js`

**Changes:**
- Implement `sendPasswordResetEmail(email, resetToken)` function in `emailService.js`
- Implement `sendAbandonedCartEmail(email, cartData)` function in `emailService.js`
- Update `authController.js:452` to pass correct parameters to the new function
- Update `stockAlertCron.js:84` to pass correct parameters to the new function
- Use existing email sending infrastructure (Brevo/transporter) consistent with other email functions in the file
- Add HTML templates for both email types

**Effort:** 3 hours
**Risk:** Medium — new email templates may need visual QA; ensure correct token/data passed.

**Dependencies:** Work Unit 1.1 (API keys rotated and working)

---

### Work Unit 2.3: Email Content Fix (text → html)

**Files affected:**
- `health-care/backend/src/controllers/returnController.js`
- `health-care/backend/src/services/orderService.js`

**Changes:**
- In `returnController.js:106,127,323` — change `text:` parameter to `html:` in all 3 `sendEmail` calls
- In `orderService.js:386-408` — add email notification calls in `sendStatusUpdateNotifications` alongside SMS/WhatsApp for shipped/delivered status transitions
- Format HTML bodies with proper styling consistent with other transactional emails

**Effort:** 2 hours
**Risk:** Low — parameter name change; easy to verify.

**Dependencies:** Work Unit 1.1 (email service operational)

---

### Work Unit 2.4: Order Double-Submission Prevention

**Files affected:**
- `health-care/src/views/CheckoutPage.jsx`
- `health-care/src/components/checkout/OrderSummary.jsx`
- `health-care/src/components/payment/PaymentModal.jsx`

**Changes:**
- Add `loading` state check to both "Place Order" buttons (desktop OrderSummary + mobile sticky footer at lines 384-393, 474-489)
- Ensure only one button is visible at any viewport using responsive CSS (`hidden lg:block` / `block lg:hidden`)
- Add `disabled` prop and loading spinner to all payment submit buttons when `isProcessing` is true (PaymentModal.jsx:67-72, 107-112, 160-165)
- Prevent form submission when already submitting

**Effort:** 2 hours
**Risk:** Low — UI state management change.

**Dependencies:** None

---

### Work Unit 2.5: Cart Sync Error Handling

**Files affected:**
- `health-care/src/context/CartContext.jsx`
- `health-care/src/views/CartPage.jsx`

**Changes:**
- In `CartContext.jsx:59-61,102-106` — show error toast when backend sync fails instead of always showing success toast
- Revert optimistic state on failure (restore previous cart items)
- In `CartPage.jsx:50-61` — wrap `toggleWishlist` async call in try/catch, handle error state (clear spinner)
- Expose `syncPending` state in context value (cartContext.jsx:294-305)
- Add `syncError` to context for components to display

**Effort:** 3 hours
**Risk:** Medium — state rollback logic must be carefully implemented to avoid inconsistent cart.

**Dependencies:** None

---

### Work Unit 2.6: Coupon Validation Auth Fix

**Files affected:**
- `health-care/src/components/checkout/OrderSummary.jsx`

**Changes:**
- Replace raw `fetch()` call on line 133 with the app's `api` utility (or `fetchWithAuth`) so expired tokens get auto-refreshed
- Add success toast with discount amount when coupon is validated successfully (line 155-162)
- Replace `alert()` calls on lines 315, 319 with `showToast()` from the Toast context for loyalty points validation

**Effort:** 1.5 hours
**Risk:** Low — targeted replacement.

**Dependencies:** None

---

### Work Unit 2.7: Toast System Consolidation

**Files affected:**
- `health-care/src/views/CartPage.jsx`

**Changes:**
- Remove the inline/duplicate toast implementation (lines 36-39, 112-122) that conflicts with global ToastProvider
- Replace all uses of the inline toast with the global ToastProvider's `showToast()`
- Fix z-index conflicts (inline toast uses z-index 50 vs global 10000)

**Effort:** 1 hour
**Risk:** Low — removal of duplicate code.

**Dependencies:** None

---

### Work Unit 2.8: Legal Pages (Privacy & Terms)

**Files affected:**
- `health-care/src/app/privacy/page.jsx` → CREATE
- `health-care/src/app/terms/page.jsx` → CREATE

**Changes:**
- Create `/app/privacy/page.jsx` with actual Privacy Policy content (or link to hosted version)
- Create `/app/terms/page.jsx` with actual Terms of Service content
- Ensure both pages have proper metadata (`title`, `description`)
- Footer links and registration page links now resolve instead of returning 404

**Effort:** 2 hours
**Risk:** Low — new static pages; content needs legal review.

**Dependencies:** None

---

### Work Unit 2.9: Frontend Validation Error Messages

**Files affected:**
- `health-care/src/views/CheckoutPage.jsx`

**Changes:**
- Replace internal field identifiers like `"field-0: Full name must be at least 2 characters"` with user-friendly labels like `"Full name must be at least 2 characters"`
- Strip "field-N:" prefix from all validation messages (lines 174-175, 394-398)

**Effort:** 0.5 hours
**Risk:** Low — string manipulation.

**Dependencies:** None

---

### Phase 2 Testing Strategy

- **Checkout flow:** Full E2E test: add to cart → checkout → place order (both auth states)
- **Email flow:** Trigger password reset; verify email sent. Verify return/order emails render with content
- **Double-submit test:** Rapid-click "Place Order"; verify only one request sent
- **Cart sync test:** Disconnect network; modify cart; verify error toast shown and state reverts
- **Coupon test:** Apply coupon with expired token; verify auto-refresh works
- **Toast test:** Verify single toast system, no duplicates
- **Legal pages:** Verify `/privacy` and `/terms` render 200
- **Unit tests:** `jest` for backend email functions, frontend validation

---

## Phase 3: Error Handling & UX (User-Facing Reliability)

**Goal:** Prevent blank screens, provide meaningful error states, and make the app resilient.

### Work Unit 3.1: Centralized Error Handler in Controllers

**Files affected:**
- `health-care/backend/src/controllers/authController.js`
- `health-care/backend/src/controllers/productController.js`
- `health-care/backend/src/controllers/orderController.js`
- `health-care/backend/src/controllers/cartController.js`
- `health-care/backend/src/controllers/categoryController.js`
- `health-care/backend/src/controllers/manufacturerController.js`
- `health-care/backend/src/controllers/returnController.js`
- `health-care/backend/src/controllers/couponController.js`
- `health-care/backend/src/controllers/flashDealController.js`
- **~10 additional controllers** — every catch block needs `next(err)` instead of `res.status().json()`

**Changes:**
- Add an `asyncHandler` wrapper function that catches errors and forwards to `next(err)`
- Wrap all route handler functions with `asyncHandler`
- Remove direct `res.status().json()` calls from catch blocks
- Ensure centralized error handler in `errorHandler.js` handles all forwarded errors consistently
- Standardize error response format to `{ success, message, errors, requestId }`

**Effort:** 8 hours
**Risk:** High — this is the largest single change. Touches every controller. Must regression-test all API endpoints.

**Dependencies:** Work Unit 1.4 (error handler middleware updated)

---

### Work Unit 3.2: Global Error Boundaries

**Files affected:**
- `health-care/src/app/error.jsx` → CREATE
- `health-care/src/app/global-error.jsx` → CREATE
- `health-care/src/app/not-found.jsx` → CREATE
- `health-care/src/app/layout.jsx`

**Changes:**
- Create `error.jsx` with "Something went wrong" UI, retry button, and support contact link
- Create `global-error.jsx` for root-level errors (catches errors in root layout)
- Create `not-found.jsx` with branded 404 page, navigation links
- Wrap each provider in `layout.jsx:177-201` (Language, Auth, Cart, Wishlist, Compare) with its own `ErrorBoundary` to prevent cascading crashes

**Effort:** 3 hours
**Risk:** Low — new files, no existing code changed (except layout.jsx wrapping).

**Dependencies:** None

---

### Work Unit 3.3: Global API-Down Fallback

**Files affected:**
- `health-care/src/services/api.js` (or equivalent)
- `health-care/src/app/layout.jsx` (provider level)

**Changes:**
- Implement global API health monitoring (periodic `GET /api/health` or intercept all 5xx responses)
- Show a unified "Service Unavailable" banner/toast when backend is unreachable
- Show friendly message instead of blank/loading states on ProductDetailPage, SearchPage, and Cart page when API is down
- Add `isApiOnline` state to a shared context

**Effort:** 4 hours
**Risk:** Medium — must be careful not to introduce false positives; use retry logic.

**Dependencies:** Work Unit 3.2 (error boundaries in place)

---

### Work Unit 3.4: SearchPage Error Handling

**Files affected:**
- `health-care/src/views/SearchPage.jsx`

**Changes:**
- Check error state from `useProducts` hook
- Add error state UI: error message, retry button, support link
- Add loading skeleton state
- Handle empty results gracefully with "No results found" message and suggestions

**Effort:** 1.5 hours
**Risk:** Low — adding existing patterns.

**Dependencies:** Work Unit 3.3 (API-down fallback can be reused)

---

### Work Unit 3.5: `force-dynamic` Optimization

**Files affected:**
- `health-care/src/app/layout.jsx`

**Changes:**
- Remove `export const dynamic = 'force-dynamic'` from root layout (line 26)
- Add `force-dynamic` only to individual routes that absolutely need it (e.g., search, checkout, cart)
- This enables static optimization / ISR for static pages, improving resilience when backend is down

**Effort:** 1 hour
**Risk:** Medium — routes that need fresh data on every request must be identified.

**Dependencies:** None

---

### Work Unit 3.6: Error Handling Edge Cases

**Files affected:**
- `health-care/src/components/ui/ErrorBoundary.jsx`
- `health-care/src/views/ProductDetailPage.jsx`

**Changes:**
- Track retry count in `ErrorBoundary.handleReset`; after N attempts (e.g., 3), show support contact info instead of retry button (line 47-52)
- Add `AbortController` with timeout (e.g., 8s) to recommendation fetch calls (ProductDetailPage.jsx:95-148)
- Handle recommendation failure gracefully — show fallback message or hide section (lines 120-121, 138-140)

**Effort:** 2 hours
**Risk:** Low — targeted changes.

**Dependencies:** None

---

### Work Unit 3.7: Offline Page Service Worker

**Files affected:**
- `health-care/src/app/offline/page.jsx`
- `health-care/public/sw.js` (or `next-pwa` config)

**Changes:**
- Implement service worker offline fallback routing so users are redirected to the custom `/offline` page when offline (instead of browser default)
- If using `next-pwa`, configure the offline fallback in `next.config.js`

**Effort:** 2 hours
**Risk:** Medium — service worker changes need careful testing; clearing caches may be needed.

**Dependencies:** None

---

### Phase 3 Testing Strategy

- **Error handler test:** For each controller, trigger an error; verify response has `requestId`, consistent format, no stack trace
- **Error boundary test:** Force a render error; verify `error.jsx` shows, retry works, retry limit kicks in
- **API-down test:** Stop backend; verify frontend shows "Service Unavailable", not blank/loading
- **Search page test:** Set API to fail; verify error UI with retry works
- **Offline test:** Use DevTools offline mode; verify `/offline` page loads
- **Integration tests:** Postman/Newman collection for all API error scenarios

---

## Phase 4: Business Logic & Data Integrity (Revenue Protection)

**Goal:** Fix issues that cause direct revenue loss, data corruption, or incorrect financial calculations.

### Work Unit 4.1: Server-Side Price Verification (Critical)

**Files affected:**
- `health-care/backend/src/controllers/orderController.js`

**Changes:**
- At line 109: Remove `item.price` from client request body entirely
- Look up product price from database for each item in the order
- Validate that the client's requested quantity is available and matches price
- Log any price mismatch attempts for security monitoring

**Effort:** 3 hours
**Risk:** Medium — must ensure price lookup handles variants, flash deals, and discounts correctly.

**Dependencies:** Work Unit 3.1 (error handling refactored)

---

### Work Unit 4.2: Flash Deal Stock Tracking

**Files affected:**
- `health-care/backend/src/controllers/flashDealController.js`
- `health-care/backend/src/controllers/orderController.js`

**Changes:**
- In `orderController.js` (at order creation): when a product in the order has an active flash deal, atomically increment `soldCount` on the flash deal document
- Use `findOneAndUpdate` with `$inc: { soldCount: qty }` and condition `{ soldCount: { $lte: maxQuantity - qty } }` to prevent overselling
- In `flashDealController.js:34-38`: ensure `soldCount` is properly initialized and validated

**Effort:** 3 hours
**Risk:** High — flash deal logic intersects with order placement. Must not block successful orders.

**Dependencies:** Work Unit 4.1 (order controller refactored)

---

### Work Unit 4.3: TOCTOU Stock Race Condition Fix

**Files affected:**
- `health-care/backend/src/controllers/orderController.js`

**Changes:**
- Replace the current read-check-write pattern for size variant stock (lines 339-365) with an atomic `findOneAndUpdate` using `{ stock: { $gte: qty } }` condition
- If the atomic update fails (no matching document), return "insufficient stock" error
- Apply same atomic pattern to non-variant product stock updates

**Effort:** 3 hours
**Risk:** High — stock management is critical for order fulfillment. Must test under concurrent load.

**Dependencies:** Work Unit 4.1 (order controller refactored)

---

### Work Unit 4.4: B2B Discount Server-Side Calculation

**Files affected:**
- `health-care/backend/src/controllers/orderController.js`

**Changes:**
- Remove B2B discount amount from client request body (lines 176-178)
- Calculate discount server-side based on the authenticated user's B2B tier/account type
- Apply the calculated discount before order total computation

**Effort:** 2 hours
**Risk:** Medium — must correctly map user tier to discount percentage.

**Dependencies:** Work Unit 4.1 (order controller refactored)

---

### Work Unit 4.5: B2B Credit Limit Check

**Files affected:**
- `health-care/backend/src/controllers/orderController.js`

**Changes:**
- Before creating B2B credit orders (lines 69-167), check the user's available credit
- Compare order total against `(creditLimit - usedCredit)`
- Reject order with appropriate error if limit would be exceeded
- Deduct credit atomically during order creation

**Effort:** 2 hours
**Risk:** Medium — race condition on credit limit check must be avoided.

**Dependencies:** Work Unit 4.1 (order controller refactored)

---

### Work Unit 4.6: B2B Credit Rollback on Cancellation

**Files affected:**
- `health-care/backend/src/controllers/orderController.js`

**Changes:**
- Add `creditUsed` rollback logic to `updateOrderStatus` cancellation path (lines 668-695)
- Mirror the logic that exists in the dedicated `cancelOrder` endpoint
- Ensure credit is only restored once (defensive check against double-rollback)

**Effort:** 1.5 hours
**Risk:** Low — additive change to existing cancellation path.

**Dependencies:** Work Unit 4.5 (credit limit system in place)

---

### Work Unit 4.7: Coupon Minimum Order Check

**Files affected:**
- `health-care/backend/src/controllers/couponController.js`
- `health-care/backend/src/controllers/orderController.js`

**Changes:**
- Check coupon minimum order amount against the net total after B2B discounts, not the raw subtotal
- In `couponController.js:69` — accept an optional `netTotal` parameter or calculate from order
- In `orderController.js:192` — pass the net total after B2B discount for coupon validation

**Effort:** 1.5 hours
**Risk:** Low — parameter change in validation logic.

**Dependencies:** Work Unit 4.4 (B2B discount calculation)

---

### Work Unit 4.8: Return Eligibility Fix

**Files affected:**
- `health-care/backend/src/controllers/returnController.js`

**Changes:**
- At line 39: Require order to be in `"delivered"` status before allowing return request
- Remove the fallback from `deliveredAt` to `createdAt` for return window calculation
- Add explicit check: `order.status !== 'delivered' → reject`

**Effort:** 1 hour
**Risk:** Low — clear business logic change.

**Dependencies:** None

---

### Work Unit 4.9: Data Quality Fixes

**Files affected:**
- `health-care/backend/src/controllers/productController.js`
- `health-care/backend/src/models/Product.js`
- `health-care/src/config/translations.js`

**Changes:**
- In `productController.js:252,797` — remove `discount: 1` from projection or map to actual `discountPct` field
- In `Product.js:20` — change `min: 0` to `min: 0.01` for price field
- In `Product.js:25-65` — deprecate legacy duplicate fields (document with JSDoc comments); consolidate data in a migration script
- In `translations.js:240-471` — complete Bengali translations with proper Unicode Bengali script (requires native speaker)
- In `translations.js` — replace `?` placeholder characters in English translations with actual icon components or remove them

**Effort:** 8 hours
**Risk:** Medium — Bengali translations need native speaker; field consolidation needs data migration.

**Dependencies:** None

---

### Phase 4 Testing Strategy

- **Price manipulation test:** Send order with modified price; verify server uses DB price
- **Flash deal test:** Create flash deal with max 10; attempt to order 11; verify rejection
- **Concurrent stock test:** Use `artillery` or `k6` to send 50 concurrent orders for same product; verify no overselling
- **B2B discount test:** Verify server-calculated discount matches user tier
- **Credit limit test:** Create B2B order exceeding credit limit; verify rejection
- **Coupon test:** Apply coupon with B2B discount; verify minimum check against net total
- **Return test:** Verify return cannot be created for non-delivered orders
- **Data integrity test:** Verify `discount` field returns correctly; verify price validation rejects $0
- **L10n test:** Switch to Bengali; verify UI text appears in Bengali script

---

## Phase 5: Performance & Mobile (Speed and Usability)

**Goal:** Improve Core Web Vitals, rendering performance, and mobile usability.

### Work Unit 5.1: localStorage Performance Fix

**Files affected:**
- `health-care/src/context/CartContext.jsx`

**Changes:**
- Replace synchronous `localStorage.setItem` calls (line 149) with debounced writes
- Use `requestIdleCallback` with fallback to `setTimeout` for localStorage persistence
- Consider using a Web Worker for serialization if cart size is large
- Keep the latest cart snapshot; skip intermediate writes during rapid mutations

**Effort:** 3 hours
**Risk:** Medium — race condition between multiple tabs; use `storage` event for cross-tab sync.

**Dependencies:** None

---

### Work Unit 5.2: Image Optimization Migration

**Files affected:**
- 12+ admin components: products, categories, manufacturers, reviews, banners management
- `health-care/src/components/ui/OptimizedImage.jsx`

**Changes:**
- Replace bare `<img>` tags with `next/image` or the custom `OptimizedImage` component in all admin management views
- Wrap `OptimizedImage.jsx` with `React.memo` to prevent unnecessary re-renders (line 40)
- Add missing `@keyframes shimmer` CSS keyframes for the shimmer loading animation (lines 129-134)

**Effort:** 5 hours
**Risk:** Low — mechanical replacement in admin components.

**Dependencies:** None

---

### Work Unit 5.3: React.memo Optimization Pass

**Files affected:**
- `health-care/src/components/product/ProductImageGalleryEnhanced.jsx`
- `health-care/src/components/product/FrequentlyBoughtRedesigned.jsx`
- `health-care/src/components/product/CustomersAlsoViewed.jsx`
- `health-care/src/components/product/TrendingProducts.jsx`
- `health-care/src/components/product/ProductTabsEnhanced.jsx`
- `health-care/src/components/product/ProductReviewsEnhanced.jsx`

**Changes:**
- Wrap each component with `React.memo`
- Memoize callback props with `useCallback` where appropriate
- For `ProductImageGalleryEnhanced`, ensure zoom/lightbox callbacks are stable references

**Effort:** 3 hours
**Risk:** Low — additive wrapping, no logic changes.

**Dependencies:** None

---

### Work Unit 5.4: Cart Hook Dependency Chain

**Files affected:**
- `health-care/src/context/CartContext.jsx`

**Changes:**
- Flatten the cascading dependency chain: `addToCart` → `updateBackendCart` → `isLoggedIn`
- Use `useRef` for stable callback references
- Fix `syncCartToBackend` closure issue where `cart` value is captured stale (line 107) — use ref for cart value in the effect
- Add `useMemo`/`useCallback` to minimize hook recalculations on login state change

**Effort:** 4 hours
**Risk:** High — refactoring core context logic. Must not break cart functionality.

**Dependencies:** Work Unit 2.5 (cart error handling refactored)

---

### Work Unit 5.5: Code Splitting

**Files affected:**
- `health-care/src/views/ProductDetailPage.jsx`

**Changes:**
- Use `next/dynamic` for below-the-fold components: `ProductReviewsEnhanced`, `CustomersAlsoViewed`, `FrequentlyBoughtRedesigned`, `ProductVideo`, `RecentlyViewed`
- Add loading skeletons for each dynamically imported component
- Ensure SSR is preserved where beneficial

**Effort:** 2 hours
**Risk:** Low — Next.js-native pattern.

**Dependencies:** Work Unit 5.3 (memoization for dynamic imports)

---

### Work Unit 5.6: Checkout BottomNav Overlap Fix

**Files affected:**
- `health-care/src/views/CheckoutPage.jsx`
- `health-care/src/components/layout/BottomNav.jsx`

**Changes:**
- Add `/checkout` route to BottomNav exclusion list (BottomNav.jsx:80-88) or
- Offset checkout fixed bottom bar by 60px to avoid overlap with BottomNav z-[1000] (CheckoutPage.jsx:467)
- Use CSS variable for offset instead of hardcoded `bottom-[60px]` (ProductDetailPage.jsx:457) — use `env(safe-area-inset-bottom)` or CSS custom property

**Effort:** 1.5 hours
**Risk:** Low — CSS/z-index fix.

**Dependencies:** None

---

### Work Unit 5.7: Mobile Font Size & Touch Target Pass

**Files affected:**
- `health-care/src/components/layout/BottomNav.jsx`
- `health-care/src/components/mobile/MobileBottomNav.jsx`
- `health-care/src/components/product/ProductImageGallery.jsx`
- `health-care/src/components/product/SizeSelector.jsx`
- `health-care/src/components/mobile/MobileFeaturedProducts.jsx`
- `health-care/src/components/mobile/MobileHero.jsx`
- `health-care/src/components/mobile/MobileCategories.jsx`
- `health-care/src/components/mobile/MobileB2BBanner.jsx`
- `health-care/src/views/CartPage.jsx`

**Changes:**
- BottomNav labels: `fontSize: 9.5` → `fontSize: 11` min (line 169)
- MobileBottomNav: `text-[9px]` → `text-[11px]` (line 43)
- ProductImageGallery wishlist/zoom buttons: `w-[36px] h-[36px]` → `w-11 h-11` (44px) (lines 157, 175)
- SizeSelector close button: `w-8 h-8` → `w-11 h-11` (lines 134)
- Mobile components (FeaturedProducts, Hero, Categories, B2BBanner): increase badge/brand/price text from 8-10px to 11px minimum
- CartPage trust badge labels: `text-[9px]` → `text-[11px]` (line 419)
- BottomNav padding: `padding: '6px 4px'` → `padding: '6px 8px'` (line 121)

**Effort:** 3 hours
**Risk:** Low — CSS-only changes.

**Dependencies:** None

---

### Work Unit 5.8: Admin Table Mobile Responsiveness

**Files affected:**
- `health-care/src/components/admin/WhatsAppAnalytics.jsx`
- `health-care/src/components/admin/LoyaltyDashboard.jsx`
- `health-care/src/components/admin/B2BUsersList.jsx`
- `health-care/src/components/admin/CategoryDiscounts.jsx`
- `health-care/src/components/admin/SystemMonitoring.jsx`
- `health-care/src/components/compare/CompareModal.jsx`

**Changes:**
- Add responsive card-based layout for mobile viewports (`md:hidden` block) to replace `overflow-x-auto` tables
- For CompareModal: reduce `min-w-[220px]` on mobile or use stacked comparison layout

**Effort:** 6 hours
**Risk:** Medium — admin UI logic intertwined with table rendering.

**Dependencies:** None

---

### Phase 5 Testing Strategy

- **Lighthouse audit:** Run Lighthouse before/after; compare Performance score, LCP, TBT
- **localStorage test:** Rapid cart mutations; verify no frame drops (Chrome DevTools Performance tab)
- **Image test:** Verify `next/image` serves optimized images (check `_next/image` URL)
- **Rendering test:** Use React DevTools Profiler to verify `React.memo` reduces re-renders
- **Bundle analysis:** Run `next-bundle-analyzer` to verify code splitting reduces initial JS
- **Mobile test:** Test on actual mobile device (Chrome DevTools device mode); verify no overlap, readable text, touch targets ≥44px
- **Admin responsive test:** Verify admin tables show card layout on <768px viewports

---

## Phase 6: Accessibility, SEO & Polish (Non-Blocking Improvements)

**Goal:** Meet WCAG standards, improve search engine visibility, and brand consistency.

### Work Unit 6.1: Footer Accessibility

**Files affected:**
- `health-care/src/components/layout/Footer.jsx`

**Changes:**
- Add proper `<label>` elements (or `aria-label`) to newsletter email and name `<input>` elements (lines 135-141)
- Remove `display: contents` from `<nav>` element (line 92) to preserve accessibility tree
- Use `aria-label="Subscribing..."` on newsletter subscribe button during loading instead of `'...'` text (line 148)
- Add `aria-hidden="true"` to emoji icons (`📱`, `✉️`) in contact links (lines 244, 248, 274, 278, 296, 300)
- Wrap newsletter form status messages in `aria-live="polite"` container (lines 135-141, success/failure icons)

**Effort:** 2 hours
**Risk:** Low — attribute additions only.

**Dependencies:** None

---

### Work Unit 6.2: Header Accessibility

**Files affected:**
- `health-care/src/components/layout/Header.jsx`

**Changes:**
- Toggle mobile menu button `aria-label` based on `mobileMenuOpen` state: "Open menu" → "Close menu" (line 415)

**Effort:** 0.5 hours
**Risk:** Low — one-line change.

**Dependencies:** None

---

### Work Unit 6.3: SEO Metadata for Client Components

**Files affected:**
- 27 client-component page files (all `'use client'` pages listed in report)
- `health-care/src/app/layout.jsx`

**Changes:**
- For the 27 client-component pages that cannot export `metadata`, use one of these approaches:
  - Restructure critical pages as server components with metadata export (preferred for admin pages)
  - Use `next/head` or `<title>` tag in client components (with `useEffect` for document.title)
  - Use `generateMetadata` where possible for pages that can be server components
- Remove duplicate `<link>` tags in JSX `<head>` (layout.jsx:135-166) that are already in `metadata.icons` export (layout.jsx:115-127)

**Effort:** 8 hours
**Risk:** Medium — converting client components to server components may require data fetching restructure.

**Dependencies:** None

---

### Work Unit 6.4: SEO Content & Sitemap

**Files affected:**
- `health-care/src/utils/metadata.js`
- `health-care/src/config/seo.js`
- `health-care/src/app/sitemap-static.xml/route.js`
- `health-care/src/app/search/page.jsx`
- `health-care/src/app/account/payment-methods/page.jsx`

**Changes:**
- Refactor product detail page to use the existing `generateProductMetadata()` utility function from `metadata.js` (removes code duplication)
- Render `CATEGORY_CONTENT` rich SEO content on category/[slug] pages (from `seo.js`)
- Add `/privacy` and `/terms` URLs to the static sitemap `staticPages` array
- Add descriptive `title` metadata to search page (even though it's noindex)
- Add `description` and Open Graph tags to `account/payment-methods` page

**Effort:** 4 hours
**Risk:** Low — additive SEO content, no functional changes.

**Dependencies:** Work Unit 2.8 (legal pages exist)

---

### Work Unit 6.5: Brand Consistency

**Files affected:**
- `health-care/src/app/account/notifications/page.jsx`
- `health-care/PUSH_NOTIFICATIONS_SETUP.md`
- `health-care/PUSH_QUICK_START.md`

**Changes:**
- Rename `'medcore_token'` localStorage key to `'mediport_token'` (notifications/page.jsx:15)
- Add migration logic to read old key and write new key for existing users
- Update documentation files to reference `mediport_token` instead of `medcore_token`

**Effort:** 1 hour
**Risk:** Low — key rename with migration.

**Dependencies:** None

---

### Phase 6 Testing Strategy

- **a11y audit:** Run axe DevTools / Lighthouse Accessibility audit; verify 0 violations
- **Screen reader test:** Tab through footer newsletter; verify labels announced; verify nav landmark
- **SEO audit:** Verify each of the 27 pages has unique `<title>` and `<meta name="description">`
- **Sitemap test:** Verify `/privacy` and `/terms` appear in `/sitemap-static.xml`
- **Metadata test:** Verify no duplicate `<link rel="icon">` or `<link rel="apple-touch-icon">` in rendered HTML
- **Brand test:** Set `medcore_token` in localStorage; verify app migrates to `mediport_token`
- **Lighthouse SEO:** Verify SEO score improves from baseline

---

## Timeline Estimate

All estimates are in **consecutive developer-hours**. Parallel tracks are noted.

| Phase | Total Hours | Can Parallelize? | Recommended Team |
|-------|------------|-------------------|------------------|
| **Prerequisites** | 4 | Ops/DevOps only | 1 DevOps |
| **Phase 1: Security** | 15 | 1.1 serial, then 1.2/1.3/1.4/1.5 in parallel (3 tracks) | 2 backend devs |
| **Phase 2: Critical Bugs** | 17 | 2.1/2.2/2.8/2.9 in parallel (4 tracks), then 2.3/2.4/2.5/2.6/2.7 in parallel (5 tracks) | 2 frontend + 1 backend |
| **Phase 3: Error Handling** | 21.5 | 3.1 serial (large), then 3.2/3.4/3.5/3.6/3.7 in parallel (5 tracks) | 2 backend (3.1) + 1 frontend |
| **Phase 4: Business Logic** | 25 | 4.1→4.2→4.3 serial chain; 4.4/4.5/4.6 serial chain; 4.7/4.8/4.9 parallel | 2 backend devs |
| **Phase 5: Performance & Mobile** | 27.5 | 5.1/5.2/5.3/5.6/5.7 in parallel (5 tracks) | 1 frontend + 1 full-stack |
| **Phase 6: Accessibility & SEO** | 15.5 | 6.1/6.2 in parallel; 6.3/6.4 in parallel; 6.5 standalone | 2 frontend devs |
| **Buffer (20%)** | 25 | — | — |
| **TOTAL** | **~150** | — | **3-4 devs** |

### Optimized Timeline (3-4 Developers)

| Week | Focus | Parallel Tracks |
|------|-------|-----------------|
| **Week 1** | Prerequisites + Phase 1 | DevOps rotates secrets; 2 backend devs do CSRF + CAPTCHA + mass assignment |
| **Week 2** | Phase 2 | Frontend: checkout + toast + validation; Backend: email functions + order fixes |
| **Week 3** | Phase 3 (3.1) + Phase 4 start | 2 backend devs refactor error handler; 1 frontend starts error boundaries |
| **Week 4** | Phase 3 remaining + Phase 4 | Backend devs do business logic; Frontend finishes error handling UX |
| **Week 5** | Phase 5 | Frontend: performance pass; Full-stack: mobile fixes |
| **Week 6** | Phase 6 + Buffer + QA | Accessiblity + SEO polish; Buffer for overflow; Full regression testing |

---

## Total Estimated Effort

| Category | Hours |
|----------|-------|
| Phase 1: Security & Infrastructure | 15 |
| Phase 2: Critical Functional Bugs | 17 |
| Phase 3: Error Handling & UX | 21.5 |
| Phase 4: Business Logic & Data Integrity | 25 |
| Phase 5: Performance & Mobile | 27.5 |
| Phase 6: Accessibility, SEO & Polish | 15.5 |
| Buffer (20%) | 25 |
| **Grand Total** | **~146.5 hours** |

---

## Parallelization Opportunities

| Parallel Group | Work Units | Who |
|---------------|------------|-----|
| **Track A** (Backend Security) | 1.1, 1.2, 1.3 | 1-2 backend devs |
| **Track B** (Backend Validation) | 1.4, 1.5, 1.6 | 1 backend dev |
| **Track C** (Frontend Cart/Checkout) | 2.1, 2.4, 2.5, 2.6, 2.7, 2.9 | 1-2 frontend devs |
| **Track D** (Backend Email/Seed) | 2.2, 2.3, 2.8 | 1 backend dev |
| **Track E** (Backend Error Handler) | 3.1 (large, needs focus) | 2 backend devs |
| **Track F** (Frontend Error UX) | 3.2, 3.3, 3.4, 3.5, 3.6, 3.7 | 1-2 frontend devs |
| **Track G** (Backend Business Logic) | 4.1, 4.2, 4.3, 4.4, 4.5, 4.6 | 2 backend devs (serial chain) |
| **Track H** (Data Quality) | 4.7, 4.8, 4.9 | 1 dev |
| **Track I** (Frontend Perf) | 5.1, 5.2, 5.3, 5.4, 5.5 | 1-2 frontend devs |
| **Track J** (Mobile/CSS) | 5.6, 5.7, 5.8 | 1 frontend dev |
| **Track K** (a11y) | 6.1, 6.2, 6.5 | 1 frontend dev |
| **Track L** (SEO) | 6.3, 6.4 | 1 frontend dev |

---

## Recommended Team Allocation

| Role | Count | Responsibility |
|------|-------|----------------|
| **Backend Developer (Senior)** | 1 | Phase 1 (security), Phase 3.1 (error handler), Phase 4 (business logic) |
| **Backend Developer** | 1 | Phase 2 (email functions, seed data), Phase 4 support |
| **Frontend Developer (Senior)** | 1 | Phase 2 (checkout/cart), Phase 5 (performance), Phase 6 (a11y/SEO) |
| **Frontend Developer** | 1 | Phase 3 (error boundaries), Phase 5 (mobile/CSS), Phase 6 support |
| **QA Engineer** | 1 | Testing across all phases, regression, Lighthouse audits |
| **DevOps** | 0.5 | Secret rotation, CI/CD pipeline updates |

---

## Testing Checklist Per Phase

### Phase 1: Security & Infrastructure
- [ ] All production secrets rotated and verified working
- [ ] `.env` removed from git; `.gitignore` updated
- [ ] CSRF token required for all state-changing cookie-based requests
- [ ] reCAPTCHA challenge appears on login; invalid response rejected
- [ ] Mass assignment: unauthorized fields stripped from create/update
- [ ] Chat endpoints require authentication
- [ ] Test routes require admin authentication
- [ ] No stack traces in API error responses
- [ ] Seed data loads without errors; passwords hashed
- [ ] `npm audit` has 0 critical vulnerabilities

### Phase 2: Critical Functional Bugs
- [ ] Unauthenticated user navigating to `/checkout` sees login prompt (not blank)
- [ ] Password reset email sent and received with reset link
- [ ] Abandoned cart email sent with correct data
- [ ] Email content renders correctly (HTML, not blank)
- [ ] Rapid "Place Order" clicks only submit once
- [ ] Cart sync failure shows error toast; state reverts
- [ ] Payment buttons disabled during processing
- [ ] Coupon validation works with expired token (auto-refreshes)
- [ ] Success toast shown when coupon applied
- [ ] `/privacy` and `/terms` pages render 200
- [ ] No duplicate/conflicting toasts visible
- [ ] Validation errors show user-friendly field names

### Phase 3: Error Handling & UX
- [ ] All controllers forward errors to `next(err)` (none send res directly)
- [ ] Error response format is consistent: `{ success, message, errors, requestId }`
- [ ] `error.jsx` shows on render errors with retry button
- [ ] Retry limit reached → shows support contact (not retry)
- [ ] `not-found.jsx` shows on 404 with navigation
- [ ] Provider crash doesn't crash entire app (error-isolated)
- [ ] Backend down → shows "Service Unavailable" (not blank/loading)
- [ ] Search page shows error state with retry on API failure
- [ ] `force-dynamic` only on routes that need it
- [ ] Recommendation fetches timeout after 8s
- [ ] Custom `/offline` page shown when offline

### Phase 4: Business Logic & Data Integrity
- [ ] Client price override rejected; server price used
- [ ] Flash deal soldCount correctly incremented; limit enforced
- [ ] No overselling under concurrent load (atomic stock decrement)
- [ ] B2B discount calculated server-side by user tier
- [ ] B2B credit limit enforced at order creation
- [ ] B2B credit restored when order cancelled via any path
- [ ] Coupon min order check uses net total after discounts
- [ ] Returns rejected for non-delivered orders
- [ ] `discount` field returns value (not undefined)
- [ ] Price validation rejects $0 products
- [ ] Bengali translations visible and correct
- [ ] No `?` placeholder visible in English UI

### Phase 5: Performance & Mobile
- [ ] Lighthouse Performance score ≥ 80 (baseline before: measure)
- [ ] LCP < 2.5s on desktop, < 4s on mobile
- [ ] cart mutations don't cause frame drops (DevTools Performance)
- [ ] `next/image` used instead of bare `<img>` in admin components
- [ ] `React.memo` reduces re-renders (verify with Profiler)
- [ ] Code splitting reduces initial JS bundle size
- [ ] BottomNav does not overlap checkout button
- [ ] Mobile sticky bar offset uses CSS variable, not hardcoded
- [ ] All mobile touch targets ≥ 44x44px
- [ ] All mobile text ≥ 11px
- [ ] Admin tables show card layout on mobile

### Phase 6: Accessibility, SEO & Polish
- [ ] Lighthouse Accessibility score ≥ 90
- [ ] Newsletter form inputs have associated labels
- [ ] Footer `<nav>` is in accessibility tree
- [ ] Loading button announces "Subscribing..." to screen reader
- [ ] Emoji icons have `aria-hidden="true"`
- [ ] Mobile menu button announces correct state (open/closed)
- [ ] Newsletter status wrapped in `aria-live="polite"`
- [ ] All 27 client pages have unique `<title>` metadata
- [ ] Sitemap includes `/privacy` and `/terms`
- [ ] No duplicate favicon/apple-touch-icon `<link>` tags
- [ ] localStorage key uses `mediport_token` (with migration)
- [ ] Documentation references `mediport_token`
