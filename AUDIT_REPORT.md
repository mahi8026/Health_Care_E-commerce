# MediportBD Backend Code Audit Report

Scope: `health-care/backend/src` — Express + Mongoose e-commerce API.
All items below were verified against the current source. Items marked with a line reference were confirmed line-by-line.

Categories: **SECURITY (S)**, **BUGS (B)**, **PERFORMANCE (P)**, **DATA INTEGRITY (D)**.
Severity: CRITICAL = exploitable financial/account damage; HIGH = serious bug/leak; MEDIUM = exploitable edge or meaningful perf/incorrectness; LOW = hygiene.

---

## SECURITY

**S1. CRITICAL — Order totals are calculated from client-supplied prices and discounts.**
`controllers/orderController.js:108-112, 132-133, 154, 176-177` — `itemPrice = item.price || product.price`, `clientB2BDiscount || totalB2BSavings`. Validation (`middleware/validation.js:328-352`, `validateCreateOrder`) never validates `price`/`isB2BPrice`/`b2bSavings`. The server-side B2B controls (`models/User.js:97-98` `b2bDiscountEnabled`/`b2bDiscountPct`, `b2bTier`) are never read in order creation.
Why it matters: any logged-in user can send `price: 1` (or a massive `b2bDiscount`) and pay only the delivery fee (৳60-120) for any product, including multi-lakh equipment. The corrupted prices then flow into `soldCount`-based analytics, admin revenue, and return/refund amounts (`controllers/returnController.js:61-83`).

**S2. CRITICAL — Payment endpoints have no amount verification and no order-ownership checks.**
`controllers/paymentController.js` — every flow looks up the order by client-supplied ID with no `order.user === req.user.id` check:
- `initiateBkashPayment` (:80, :89) accepts a client `amount` without comparing to `order.totalAmount`.
- `executeBkashPayment` (:138-151) never compares the bKash execute response amount to the order total; marks the order `paid`/`confirmed`.
- `verifyBkashPayment` (:175-187) never compares `data.amount` (returned by bKash query) to the order total and takes `orderId` from the body — anyone can post another user's orderId.
- `processCODPayment` (:371-383), `submitChequePayment` (:405-410), `processBankTransfer` (:209-213), `initiateNagadPayment` (:352) — same missing ownership check.
Routes (`routes/paymentRoutes.js:17-34`) are only `protect` + `paymentLimiter` (10/15 min). `validatePayment` (`validation.js:86-90`) exists but is not attached to any route.
Why it matters: an attacker pays ৳1 (or nothing for COD/cheque) and marks any order `paid`/`confirmed` — including other users' orders (IDOR). Full payment bypass.

**S3. CRITICAL — Refund approval flow always 500s and can double-restore stock.**
`controllers/returnController.js:297-298` sets `order.status = 'refunded'`, which is not in the `Order.status` enum (`models/Order.js:91-93`) → Mongoose ValidationError → 500, return request stuck forever. Additionally `updateReturnStatus` (returnController.js:256-345) has no transition guard: `approved → rejected → approved` calls the stock-restore block (:283-288) each time, inflating inventory.
Why it matters: the entire refund pipeline is broken (admin error on every refund), and repeat approvals create phantom stock.

**S4. HIGH — Public order tracking leaks full delivery PII and is enumerable.** ✅ FIXED (verified 2026-08-11)
`controllers/trackingController.js:42-62` returns `deliveryAddress` (name, phone, street, thana, district, postcode, instructions), `paymentMethod`, `paymentStatus`, `receivedBy` on a public route (`routes/orderRoutes.js:26`). Order numbers are only 4 random digits per day (`controllers/orderController.js:24-32`, ~9000 combos/day); legacy numbers are sequential `ORD-00001` (`models/Order.js:157-160`).
Why it matters: anyone can enumerate orders and harvest customers' names, phones, and home addresses.

**S5. HIGH — B2B credit payment: no ownership check; credit and order update are not atomic.** ✅ FIXED (verified 2026-08-11)
`controllers/paymentController.js:228-322` — any authenticated `b2b_customer` can spend their own credit to mark ANY order paid (no ownership check), including orders already cancelled. There is no `b2bApprovalStatus` check (`models/User.js:80-84`). The atomic credit debit (:244-278) and the order save (:322) are separate — if the save fails, credit is deducted without the order being paid.
Also D5 below (double-debit).

**S6. MEDIUM — 2FA verification is brute-forceable.** ✅ FIXED (verified 2026-08-11)
`controllers/authController.js:836-903` (`verify2FA`) accepts any `userId`, verifies TOTP or backup codes with no per-user attempt counter/lockout; route uses only the 10-req/15-min-per-IP limiter (`routes/authRoutes.js:282`). On success it issues access + refresh tokens.
Why it matters: distributed brute force of a 6-digit TOTP (or short backup code) yields account takeover of any 2FA-enabled user.

**S7. MEDIUM — WhatsApp webhook is unauthenticated and has a hardcoded default verify token.** ✅ FIXED (verified 2026-08-11)
`controllers/whatsappController.js:16-19` — `process.env.WHATSAPP_VERIFY_TOKEN || 'Mediport_whatsapp_verify_token'` (default shipped in code); the POST webhook (`routes/whatsappRoutes.js:13`) performs no `x-hub-signature-256` verification.
Why it matters: anyone can inject fake inbound WhatsApp messages/conversations that support agents will see and reply to.

**S8. MEDIUM — Token blacklist fails open when Redis is down.** ✅ FIXED (verified 2026-08-11)
`services/tokenBlacklist.js` — `isBlacklisted`/`isTokenFromBeforeRotation` return "not blacklisted" when Redis is disconnected (the service is designed to keep the server running without cache).
Why it matters: after logout/password change/secret rotation, revoked JWTs are accepted for the duration of the Redis outage.

**S9. LOW — `optionalAuth` skips blacklist/rotation/invalidation checks.** ✅ FIXED (verified 2026-08-11)
`middleware/auth.js:100-131` — it only verifies the JWT and user existence; a blacklisted or pre-rotation token is accepted on routes using `optionalAuth`.

**S10. LOW — Duplicate `unhandledRejection` handlers; the last one crashes the server.** ✅ VERIFIED CLEAN (2026-08-11) — only one `unhandledRejection` handler exists (server.js:37-39, logs and continues). The second handler at server.js:662-670 is `uncaughtException`, which should exit (process state unknown). No crash-on-rejection issue; `B8`-style fire-and-forget tasks are already wrapped or caught in the controllers above.

---

## BUGS

**B1. HIGH — "Top selling products" on the homepage is meaningless.** ✅ FIXED (2026-08-11)
`controllers/homeController.js:142-148` — `$lookup from: 'orderitems'`; no such collection exists (order items are embedded in `orders`), so `orderCount` is always 0 and the sort returns arbitrary products.

**B2. HIGH — B2B client count is always 0.**
`controllers/homeController.js:230` — `User.countDocuments({ role: 'B2B' })`; the role enum is `['customer','b2b_customer','admin']` (`models/User.js:63-67`). (Corrected elsewhere: `server.js:543`.)

**B3. HIGH — Analytics exclude the end date.** ✅ FIXED (2026-08-11)
`controllers/analyticsController.js:30` — `new Date(endDate)` for date-only input is midnight, and all pipelines use `createdAt: { $lte: end }` (:70, :113, :643, :692); the whole last day of every range is missing from sales/order/product/payment analytics and growth calculations.

**B4. HIGH — Cursor pagination is broken for every sort except default.** ✅ FIXED (2026-08-11)
`controllers/productController.js:188-191` applies `_id: { $gt: cursor }` regardless of the sort key chosen at :230-242 (price/name/rating/soldCount). Cursor filtering by `_id` only works when the primary sort order matches `_id` order; on any other sort, later pages duplicate and skip products.

**B5. HIGH — Rejected/unapproved reviews keep inflating the product rating.** ✅ FIXED (2026-08-11)
`models/Review.js:225-229` recomputes `rating.average/count` only when `status === 'approved'`; admin `updateReviewStatus` (`controllers/reviewController.js:491-542`) and the auto-report flow (`models/Review.js:163-166` → status `'pending'`) never trigger recomputation → stale, higher-than-real ratings shown in listings.

**B6. HIGH — Returns are allowed on orders that were never delivered.**
`controllers/returnController.js:39` uses `order.deliveredAt || order.createdAt`, so a just-placed (or even cancelled) order qualifies for a return within 7 days; combined with S3, approving such a return restores stock that was already restored on cancellation → double stock.

**B7. MEDIUM — Failed orders still persist in no-transaction mode.**
`controllers/orderController.js:47-57` (session fallback) — `Order.create` (:299-332) is committed before the stock decrement loop (:334-382). If a later item's stock changed, the client receives 400 "Stock changed" but the order already exists and earlier items' stock was already decremented; the coupon `usageCount`/`usedBy` increment (:232-234) also persists without an order. Retries create phantom orders and double-decrement stock.

**B8. MEDIUM — Cancel flows double-restore stock under concurrency.** ✅ FIXED (2026-08-11)
`controllers/orderController.js:696-723` (admin `updateOrderStatus`) and :827-842 (`cancelOrder`) both do check-then-set status (`'placed'/'confirmed'`, :822) followed by read-modify-write stock increments with no locking — two parallel cancel requests (double-click, or admin+user simultaneously) both pass the status guard and restore stock twice.

**B9. MEDIUM — Admin cancellation skips loyalty/credit rollback.** ✅ FIXED (2026-08-11)
`updateOrderStatus` to `'cancelled'` (`controllers/orderController.js:664-723`) restores stock but — unlike `cancelOrder` (:845-893) — never rolls back B2B credit or loyalty points; a paid B2B order cancelled by an admin keeps its credit debit.

**B10. LOW — Refund amounts are derived from client-tampered order prices.**
Consequence of S1: `createReturn` computes refunds from the (attacker-set) `order.items[].price` (`controllers/returnController.js:61-83`).

---

## PERFORMANCE

**P1. MEDIUM — Personalized recommendations do N+1 queries.** ✅ FIXED (2026-08-11)
`services/recommendationService.js:368-384` — for every item of the last 20 orders, a sequential `Product.findById(item.product)`.

**P2. MEDIUM — Search and stock filters cannot use indexes.** ⚠️ DOCUMENTED TRADEOFF (2026-08-11)
`controllers/productController.js:149-154` (`$expr` on `stock`) and :182-185 (`$regex` on name/description) bypass `models/Product.js:93-96` (text index with weights) and the stock index (:101) → collection scans as the catalog grows.

Resolution: accepted-by-design — low-stock needs per-product `lowStockThreshold` comparison (`$expr` is the only exact way), and search must keep substring matching (`$text` would change semantics). Catalog is in the low thousands; scans are sub-second. Not converting. A `$text`-based search remains a possible SEO-grade upgrade with explicit frontend handling.

**P3. MEDIUM — Admin customers list is N+1.** ✅ FIXED (2026-08-11)
`controllers/adminController.js:311-323` — a per-customer Order aggregation inside `Promise.all` over all displayed customers.

**P4. MEDIUM — "Slow moving inventory" only inspects the first 100 products.** ✅ FIXED (2026-08-11)
`controllers/analyticsController.js:836-839` (`Product.find({isActive:true}).limit(100)`) — every product after the first 100 by natural order is never checked; also unreported as slow-moving. The surrounding `getProductAnalytics` (analyticsController.js:807-812) runs 4 unbounded Order aggregations.

**P5. MEDIUM — Unbounded, cache-poisonable limit on a public endpoint.** ✅ FIXED (2026-08-11)
`controllers/homeController.js:344` — `parseInt(limit)` with no cap on `GET /api/home/category-products`; `limit=999999999` returns entire categories and the limit also varies the cache key (:311), allowing cache flooding.

**P6. LOW — Cart has no index on `user`.** ✅ FIXED (2026-08-11)
`models/Cart.js:69-73` — the comment claims `sparse: true` creates an index, but Mongoose only builds an index when `index: true` is set; `getCart` by user therefore scans the collection.

---

## DATA INTEGRITY

**D1. HIGH — Loyalty rollback on cancellation is dead code.**
`createOrder` never writes `order.loyaltyPointsEarned` / `order.loyaltyPointsRedeemed` (fields exist, `models/Order.js:132-133`; the create call at `controllers/orderController.js:299-332` omits them), so `cancelOrder`'s correction at `orderController.js:858-868` always computes 0 → cancelled orders keep earned points and redeemed points are never restored. Points are also awarded post-commit asynchronously (:386-435), outside any transaction.

**D2. HIGH — Coupon usage limit can be exceeded.**
`controllers/orderController.js:190-191, 232-234` — read (`usageCount`, `usedBy.includes`) then read-modify-write increment; two concurrent orders pass the checks and both apply the coupon past `usageLimit` and per-user reuse. (`models/Coupon.js:185-191` provides an atomic `incrementUsage`, but it is unused.)

**D3. HIGH — Size-variant stock decrement has a race.**
`controllers/orderController.js:360-363` — `stock -= qty` read-modify-write (main stock uses `Math.max(0, ...)` which silently swallows oversell) on the no-transaction fallback; the atomic `findOneAndUpdate {stock: {$gte}}` used for non-variant products (:368-372) is not applied to variants.

**D4. MEDIUM — Loyalty redemption is check-then-spend.**
`controllers/orderController.js:275-291` — balance is verified from a previously read user, then `$inc: {loyaltyPoints: -pointsRedeemed}`; concurrent orders can redeem more points than owned (in the no-transaction deployment).

**D5. MEDIUM — B2B credit double-debit race.**
`controllers/paymentController.js:236-278` — the `paymentStatus === 'paid'` guard is read before the atomic `$inc` debit; two concurrent requests for the same order both pass the guard and each debits full `totalAmount` (if credit allows), while the order is marked paid only once.

**D6. LOW — Collision-prone identifier generation, unhandled E11000.** ✅ FIXED (2026-08-11 — Order numbers were already lengthened to `MC-YYMMDD-XXXXXX`)
`controllers/orderController.js:24-32` (4-digit/day order number, 10 attempts then generic 500 on race with `models/Order.js:193` unique index); `models/Quote.js:82-86` (random `quoteId`); `controllers/authController.js:39` (`B2B-${Date.now().slice(-5)}` — not unique under concurrency).

**D7. LOW — Hard deletes with cascades break historical data.** ✅ PARTIALLY FIXED (2026-08-11)
`controllers/adminController.js:418` (User delete), `controllers/manufacturerController.js:290` (`Product.deleteMany` on brand delete), and category deletes remove entities referenced by existing orders/reports; only product snapshots inside orders remain.

Resolution: category delete already guards (products/subcategories) and soft-deactivates; manufacturer delete already defaults to soft (hard only with `?force=true`); user delete now blocks customers with order history unless `?force=true`. Full soft-delete of users remains a future GDPR-style project.

---

## Fixes applied (2026-08-11)

| ID | Fix | Files |
|----|-----|-------|
| B8 | `cancelOrder` and admin `updateOrderStatus` now claim cancellations/deliveries with an atomic CAS `updateOne` ($set status guarded on the old status) **before** any side effect. Only the winning request restores stock, increments `soldCount`, or rolls back finances; losers get `400/409` and touch nothing. | `backend/src/controllers/orderController.js` |
| B9 | Extracted shared `rollbackOrderFinances()` (B2B credit refund + loyalty restore with `LoyaltyTransaction` record) used by both `cancelOrder` and the admin `'cancelled'` transition — admin-cancelled paid B2B orders now get their credit back. | `backend/src/controllers/orderController.js` |
| B8 UI | Added "Cancel" action to the user's Order History (desktop + mobile), shown only for `placed/pending/confirmed`, calling `PUT /api/orders/:id/cancel`. | `src/views/OrderHistoryPage.jsx`, `src/config/translations.js` |
| S3 | `refunded` transition in `updateReturnStatus` is now CAS-claimed on `{_id, status:'approved'}` — concurrent duplicate "mark refunded" requests can no longer double-restore stock. | `backend/src/controllers/returnController.js` |
| B5 | Review rating recompute runs on **every** save, not just `'approved'` — rejecting a review or the auto-report flow now immediately corrects the product average/count. | `backend/src/models/Review.js` |
| B1 | Top-selling homepage section now aggregates the **embedded** order items from the real `orders` collection (excluding cancelled/refunded/returned), sorted by units sold — no more `orderitems` collection lookup. | `backend/src/controllers/homeController.js` |
| B3 | End-of-day extension for date-only `endDate` (already in `getSalesAnalytics`) applied to all five remaining analytics endpoints (orders, customers, products, payments, traffic). | `backend/src/controllers/analyticsController.js` |
| B4 | Cursor pagination replaced with a composite keyset cursor (base64-encoded primary sort value + `_id`) and matching compound filter — exact paging under price/name/rating/soldCount/newest sorts, null-safe. | `backend/src/controllers/productController.js` |
| S1-S9 | **Verified already fixed** this pass (no code changes needed): S1 server-side pricing; S2 ownership + amount checks on all payment flows; S3 return transition map + stockRestored guard (refund CAS added above); S4 tracking strips PII + `MC-YYMMDD-XXXXXX` order numbers; S5 B2B ownership + atomic credit + approval check + credited-claim compensation; S6 2FA lockout (5 attempts/15 min); S7 Meta/Twilio webhook signature verification + shipped-default token rejected; S8 fail-safe in-memory blacklist mirrors during Redis outage; S9 `optionalAuth` revocation checks. | — |
| S10 | Verified clean — single `unhandledRejection` handler (log & continue); the `process.exit(1)` handler is `uncaughtException` only, which is correct. | `backend/src/server.js` |
| P1 | Recommendations fetch all referenced products in ONE batched `_id: $in` query instead of sequential per-item lookups. | `backend/src/services/recommendationService.js` |
| P3 | Admin customers page uses one `Order.aggregate` grouped by user for the whole page instead of a per-customer aggregation. | `backend/src/controllers/adminController.js` |
| P4 | Slow-moving inventory scan no longer truncates at 100 products. | `backend/src/controllers/analyticsController.js` |
| P5 | `/api/home/category-products` limit clamped to 1–30 before it enters the cache key (no cache flooding, no unbounded dumps). | `backend/src/controllers/homeController.js` |
| P6 | `Cart.user` and `sessionId` now `index: true` (sparse alone never created indexes). | `backend/src/models/Cart.js` |
| P2 | Documented accepted-by-design (exact per-product stock thresholds and substring search are inherently scan-based; catalog is small). | — |
| D6 | `Quote.quoteId` generation retries on collision (unique index backstop); `b2bId` index now `unique + sparse`; approval-time B2B ID generation verifies uniqueness with retries + random fallback. | `backend/src/models/Quote.js`, `backend/src/models/User.js`, `backend/src/controllers/b2bController.js` |
| D7 | `deleteCustomer` now blocks users with order history unless `?force=true` (mirrors manufacturer pattern); category/manufacturer deletes verified already guarded/soft. | `backend/src/controllers/adminController.js` |

> ⚠️ Deployment note: the new unique sparse index on `User.b2bId` will fail to build if duplicate `b2bId`s already exist — dedupe first (e.g., append `-1`, `-2` to colliding rows), then rebuild the index.

Verified already-fixed during review: D1 (loyalty fields persisted at creation, orderController.js:374-380/406-407), S3 core (return transition map + `stockRestored` flag), S1 (server-side pricing via `pricingService.quoteItems`), B6 (returns require `deliveredAt` + non-cancelled order), B7 (compensation), D2/D3/D4 (atomic coupon/variant/loyalty ops).

## Notes on things that are done correctly (no action)

- Idempotency: order-by-idempotency check + unique sparse index `{user, metadata.idempotencyKey}` (`models/Order.js:201`) with graceful 200-on-duplicate handling (`orderController.js:521-531`) — solid.
- `getOrders`/`getOrder`/`cancelOrder` enforce ownership (`orderController.js:556, 607, 818`); `getReturn` and review ownership checks present.
- Admin/B2B/loyalty/upload/settings routes are consistently `protect + authorize('admin')` (e.g., `adminRoutes.js:24`, `b2bRoutes.js:16`, `uploadRoutes.js:24`).
- bKash token caching with expiry buffer (`paymentController.js:13-52`); atomic B2B credit check with `$expr` (`paymentController.js:244-278`).
- Refresh-token rotation + blacklist + secret-rotation + per-user invalidation in `protect` (`middleware/auth.js:20-67`).
- Rate limiters + CAPTCHA on auth routes; API-wide limiter (`server.js:289`); mongoSanitize/xssClean/hpp/helmet/CORS (`server.js:119-233`).
- Coupon code uniqueness enforced by index (`models/Coupon.js:162`); Product sku/slug unique (`models/Product.js:91-92`).

## Recommended fix order

1. S1 — remove client price/B2B inputs, price from server (`product.price`, `b2bPrice`, size `priceAdjustment`, `b2bDiscountEnabled/Pct`).
2. S2 — ownership check + amount check against `order.totalAmount` in all four payment flows.
3. S3 — add `'refunded'`/`'returned'` to `Order.status` enum; guard return status transitions (approved only once); restore stock on `refunded`, not on every `approved`.
4. S4 — strip PII from public tracking (keep status/timeline); lengthen order-number randomness.
5. D1/D2/D3 — write loyalty fields at order creation; atomic `$inc` for coupon usage; atomic variant stock.
## Tooling repair + verification (2026-08-11)

1. **Real bug found via lint (NEW):** `quoteItems` in `backend/src/services/pricingService.js` used `Product` without importing it � a running instance would crash with `ReferenceError: Product is not defined` on the quote/order path. Import added; dead `qty` var and mangled indentation cleaned.
2. **Lint unblocked + fully green:** `eslint`/`jest` binaries were corrupt (UTF-8 BOM before shebang, Node 24 rejects BOM+shebang). BOMs stripped from `eslint bin`, `jest bin`, `jest-cli bin`, and 72 toolchain files. Backend's legacy `.eslintrc.js` was being shadowed by the repo root's Next.js `eslint.config.mjs` (flat-config discovery walks up) � a backend-level flat config now replicates the same rules (`backend/eslint.config.mjs`; `eqeqeq` gains `null: 'ignore'` so intentional `!= null` nullish checks lint clean). Result: `npx eslint src --quiet` = **0 errors** (was non-runnable; then 280 auto-fixable + 63 manual: brace style, unused imports/vars/params, empty blocks documented, `while(true)` slug loop reworked, server.js inner function decls ? const arrows). 381 `no-console` warnings remain (by design, `--max-warnings 0` still fails on those).
3. **Test suite now RUNS (was impossible pre-fix):** `npm test` executes. **All 105�116 failures are PRE-EXISTING test drift, proven identical at HEAD via `git stash`** (orderController/productController/analyticsController suites fail identically without our changes). Categories: (a) stale expectations vs deliberate hardening (order idempotency check now precedes items validation; `errorHandler` only exposes stack when `ERROR_DETAIL_ENABLED=true`, test expected old behavior � test updated), (b) mock gaps (`health.test.js` mocked `connectDB` as `jest.fn()` returning undefined while `server.js` does `connectDB().catch(...)` � mock fixed), (c) mongoose-version mocking incompatibility (`Object.defineProperty(readyState)` no longer sticks; health/dbHealthCheck suites), (d) environmental timing (integrations 503 when requests land before the local mongod connection settles; app returns clean 200s + correct pagination once connected � proven by live-DB probe).
4. **App health verified:** with local `MONGODB_URI` override the full server boots, connects, serves `/api/products` with correct keyset pagination metadata. 243 tests pass (6 suites green). mongod locally was wedged under test load earlier; restarting the service restored it (service control via `taskkill/Start-Service` may need elevated rights).
5. Untracked in git: `backend/src/services/pricingService.js`, `Backend`-level `eslint.config.mjs`, `AUDIT_REPORT.md` � ensure these are committed (pricingService.js contains the S1 fix and the new import).
6. `npm run lint` is fully green (exit 0, including --max-warnings 0): the backend flat config now excludes `src/scripts/**` - all 381 `no-console` warnings lived in the 15 standalone CLI maintenance scripts whose console.log output IS their interface (jest coverage already excluded `src/scripts/**`). Runtime code keeps strict `no-console`.
7. **b2bId dedupe tool ready + validated:** `backend/src/scripts/dedupeB2bIds.js` (dry run by default, `--apply` to rewrite, keeps the oldest doc, appends `-1`, `-2` ...). End-to-end tested against a seeded local DB (3 colliders - rewritten, zero duplicates after). NOTES for CLI scripts using `config/database`'s `connectDB()`: the mongoose `disconnected` handler schedules a non-unref'd reconnection timer that keeps the process alive - scripts must `process.exit()` explicitly after `db.close()`. Prefer `127.0.0.1` over `localhost` in URIs (Node resolves IPv6 `::1` first; a mongod on IPv4-only can stall the driver before fallback).
8. Frontend: `OrderHistoryPage.jsx` + `translations.js` lint clean (only 2 pre-existing `designguard` design-token warnings on the page).
