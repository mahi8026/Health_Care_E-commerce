# 📊 Marketing Tracking & Ads Setup Guide

This guide explains everything you need to **turn on tracking and run paid ads**
for MediportBD. All the code is already implemented — you only need to add your
IDs and verify.

---

## 1. What was implemented

### ✅ Google Analytics 4 (GA4)
Already active:
- `NEXT_PUBLIC_GA_MEASUREMENT_ID=G-VCQNJESVNM` (set in `.env.local` and Vercel)
- `WebVitalsReporter` initialises `GA4Tracker` on every page
- Custom events fire automatically: `view_item`, `add_to_cart`,
  `begin_checkout`, `purchase`, `search`, `payment_method_selected`,
  `quotation_request`, `credit_usage`

**New:** client-side route changes now also fire GA4 `page_view` events
(`src/components/tracking/MetaPixel.jsx`).

### ✅ Meta / Facebook Pixel (NEW)
New files:
- `src/services/MetaPixelTracker.js` — SSR-safe wrapper around the Facebook pixel
- `src/components/tracking/MetaPixel.jsx` — loads the pixel + fires PageView on
  every route change (SPA-safe)
- Wired into the root layout (`src/app/layout.jsx`)

**Mirrors GA4 events into Facebook standard events** automatically
(`src/services/GA4Tracker.js`):

| GA4 event | Meta Pixel event |
|---|---|
| `view_item` | `ViewContent` |
| `add_to_cart` | `AddToCart` |
| `remove_from_cart` | `RemoveFromCart` (custom) |
| `begin_checkout` | `InitiateCheckout` |
| `payment_method_selected` | `AddPaymentInfo` |
| `purchase` | `Purchase` |
| `quotation_request` (B2B) | `Lead` |
| `search` | `Search` |

### ✅ Google Merchant Center feed (NEW)
- Endpoint: `GET /api/feeds/google-products.xml`
- Generates an RSS 2.0 XML feed (`g:id`, `g:title`, `g:description`, `g:link`,
  `g:image_link`, `g:availability`, `g:price` in BDT, `g:condition`,
  `g:brand`, `g:gtin`, `g:mpn`, `g:product_type`) from all active products.
- Public, no auth, cached 6 hours.
- New files: `backend/src/controllers/feedController.js`,
  `backend/src/routes/feedRoutes.js` (mounted at `/api/feeds` in `server.js`).
- Link domain comes from `FRONTEND_URL` → `NEXT_PUBLIC_SITE_URL` →
  fallback `https://www.mediportbd.com`.

---

## 2. One-time setup (10 minutes)

### 2.1 GA4 (if not already done)
Open [analytics.google.com](https://analytics.google.com) → Admin → Data
streams. Copy the **Measurement ID** (starts with `G-`).

The repo already has `G-VCQNJESVNM` in `.env.local` / Vercel. If you ever change
it, update:
- `.env.local` / `.env.production` / `.env.vercel.production`
- Vercel → Project → Settings → Environment Variables → `NEXT_PUBLIC_GA_MEASUREMENT_ID`

### 2.2 Meta Pixel (Facebook) — REQUIRED to run FB/IG ads
1. Go to [business.facebook.com](https://business.facebook.com) → **Events Manager**.
2. **Connect a data source** → choose **Web** → **Meta Pixel**.
3. Name it `MediportBD Purchase Tracking`.
4. On the "Set up your tracking" step choose **"Install code manually"** and
   copy the **Pixel ID** (a 15-16 digit number, e.g. `1234567890123456`).
5. Add it to your environment as `NEXT_PUBLIC_META_PIXEL_ID`.

For **Vercel (production frontend)**:
```
NEXT_PUBLIC_META_PIXEL_ID=1234567890123456
```
Add to all three environments (Production, Preview, Development), then redeploy.

For local development: add the same line to `health-care/.env.local`.

> ✅ **Status: configured.** Your Pixel ID `1031908332996798` has been added to
> Vercel (`NEXT_PUBLIC_META_PIXEL_ID`) and to the local/production env files.

### 2.3 Google Merchant Center
1. Sign up at [merchants.google.com](https://merchants.google.com) (use your
   `mediportbd.com` domain, country **Bangladesh**, currency **BDT**).
2. Verify the domain (HTML tag / DNS TXT record).
3. **Products → All products → Product sources → New product source.** Choose
   **Scheduled fetch** and enter:
   - File name: `google-products.xml`
   - File URL: `https://api.mediportbd.com/api/feeds/google-products.xml`
   - Schedule: daily
4. After the first fetch, address any item-level warnings in **Products →
   Needs attention**.

> ⚠️ **Honest note about Bangladesh:** Google **Shopping ads** are not available
> in every country. If they are not yet available in BD, the feed is still
> useful for **free listings** (when available), price benchmarking, and as the
> product feed for **Google Ads Dynamic Remarketing** later. Meta/Facebook ads
> are currently your most effective paid channel in Bangladesh.

---

## 3. Verify it works (5 minutes)

### GA4
1. Open [analytics.google.com](https://analytics.google.com) → GA4 property →
   **DebugView** (left menu).
2. Install the **Google Analytics Debugger** extension in Chrome, turn it on,
   and browse `mediportbd.com`.
   - Product pages must show `view_item`
   - Add to cart → `add_to_cart`
   - Checkout page → `begin_checkout`
   - Place a test order → `purchase` ✅

### Meta Pixel
1. Install the **Meta Pixel Helper** Chrome extension.
2. Browse `mediportbd.com`. The extension badge should show **1 active pixel**.
3. Open a product → helper shows `ViewContent`; add to cart → `AddToCart`;
   checkout → `InitiateCheckout`; place an order → `Purchase`.

### Feed
1. Visit `https://api.mediportbd.com/api/feeds/google-products.xml` (or your
   backend URL). You should see `<?xml`, `<rss ...` and your products as `<item>`.

---

## 4. Files changed

| File | What changed |
|---|---|
| `health-care/src/app/layout.jsx` | Mounted `MetaPixel`; preconnect for fbcdn |
| `health-care/src/services/GA4Tracker.js` | Mirrors e-commerce events to Meta |
| `health-care/src/services/MetaPixelTracker.js` | NEW — pixel service |
| `health-care/src/components/tracking/MetaPixel.jsx` | NEW — pixel boot + SPA PageView |
| `health-care/next.config.mjs` | CSP allows facebook + ga4 beacon domains |
| `health-care/.env.local` / `.env.production` / `.env.vercel.production` | `NEXT_PUBLIC_META_PIXEL_ID` placeholder |
| `health-care/backend/src/controllers/feedController.js` | NEW — Google XML feed |
| `health-care/backend/src/routes/feedRoutes.js` | NEW — feed route |
| `health-care/backend/src/server.js` | Mounted `/api/feeds` |

---

## 5. Next marketing steps (recommended after this is live)
1. **Meta ads funnel**: run a small budget campaign to test the pixel →
   retargeting audiences build automatically from `ViewContent` / `AddToCart`.
2. **WhatsApp-to-order buttons** on product pages (people in BD often buy via
   WhatsApp instead of checkout).
3. **Abandoned-cart flow** already built — make sure n8n/backend cron is running
   and include a 5% coupon.
4. **Email campaigns** via your newsletter broadcast (welcome / flash sale /
   re-engagement).