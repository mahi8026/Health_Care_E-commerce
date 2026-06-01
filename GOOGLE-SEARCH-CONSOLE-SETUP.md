# Google Search Console Setup Guide — MedCore BD

## Step 1: Add Property

1. Go to [search.google.com/search-console](https://search.google.com/search-console)
2. Click **Add property** → choose **URL prefix**
3. Enter: `https://medcorebd.com`

## Step 2: Verify Ownership

The site already has the verification meta tag in `src/app/layout.jsx`:

```js
verification: {
  google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
}
```

Set the env var in Vercel:
1. Vercel Dashboard → Project → Settings → Environment Variables
2. Add: `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` = (value from Search Console)
3. Redeploy — Google will verify automatically

## Step 3: Submit Sitemap

1. In Search Console → **Sitemaps** (left sidebar)
2. Enter: `sitemap.xml`
3. Click **Submit**

The sitemap at `https://medcorebd.com/sitemap.xml` includes:
- All static pages (homepage, products, reagent-store, b2b, about)
- 8 category filter pages
- All product pages (slug-based URLs, revalidated every hour)

## Step 4: Submit to Bing

1. Go to [bing.com/webmasters](https://www.bing.com/webmasters)
2. Import from Google Search Console (easiest option)
3. Or add manually with `NEXT_PUBLIC_BING_SITE_VERIFICATION` env var

## Step 5: Request Indexing for Key Pages

In Search Console → **URL Inspection**:
1. Enter `https://medcorebd.com` → Request indexing
2. Enter `https://medcorebd.com/products` → Request indexing
3. Enter `https://medcorebd.com/reagent-store` → Request indexing
4. Enter `https://medcorebd.com/b2b` → Request indexing

## Step 6: Monitor Performance

Check weekly in Search Console:
- **Performance** → Queries: track target keywords
- **Coverage** → fix any crawl errors
- **Core Web Vitals** → monitor LCP, CLS, FID
- **Rich Results** → verify Product schema is working

## Target Keywords to Track

Add these to a keyword tracking tool (e.g. Google Search Console filters):

| Keyword | Target Position |
|---------|----------------|
| medical equipment Bangladesh | Top 20 |
| diagnostic equipment Dhaka | Top 10 |
| reagent supplier Bangladesh | Top 5 |
| ECG machine price Bangladesh | Top 10 |
| HbA1c kit Bangladesh | Top 5 |
| surgical instruments supplier Dhaka | Top 10 |
| laboratory reagents Bangladesh | Top 5 |
| hospital equipment supplier Bangladesh | Top 10 |

## Rich Results Verification

After deploying, test structured data:
- **Product schema**: [search.google.com/test/rich-results](https://search.google.com/test/rich-results)
- **FAQ schema**: Same tool — test a product URL
- **Breadcrumb schema**: Same tool
- **Local Business**: [validator.schema.org](https://validator.schema.org)

## Running Lighthouse Locally

```bash
# Start the dev server first (in one terminal)
npm run dev

# Then in another terminal
npm run lighthouse
```

Results saved to `.lighthouseci/` directory.

## Running Bundle Analysis

```bash
npm run analyze
```

Opens `client.html` and `server.html` in `.next/analyze/` showing bundle sizes.
Look for chunks > 100KB that could be code-split or lazy-loaded.

## Environment Variables Checklist

Ensure these are set in Vercel production:

```
NEXT_PUBLIC_SITE_URL=https://medcorebd.com
NEXT_PUBLIC_API_URL=https://api.medcorebd.com/api
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=<from Search Console>
NEXT_PUBLIC_BING_SITE_VERIFICATION=<from Bing Webmaster>
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=<your cloud name>
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=<your preset>
```
