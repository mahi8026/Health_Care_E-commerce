# Sitemap Fix Guide

## Issue Identified

Google Search Console shows "Couldn't fetch" error for `/sitemap.xml` because:

1. **Backend Timeout**: The production backend at `https://health-care-e-commerce.onrender.com/api` is timing out
2. **Render.com Free Tier**: Free tier services spin down after 15 minutes of inactivity
3. **Build-Time Generation**: Sitemap tries to fetch products during build, but backend may be asleep

## Current Status

✅ **Sitemap is functional** - it gracefully degrades to static + category pages when backend is unavailable
✅ **Build succeeds** - no errors during build process
⚠️ **Backend unavailable** - Render.com backend is not responding (timeout after 10 seconds)

## Solutions

### Option 1: Wake Up Backend Before Sitemap Fetch (Recommended)

Add a "wake-up" request before fetching products in the sitemap:

**File:** `src/app/sitemap.js`

```javascript
// Add this function before the sitemap export
async function wakeUpBackend(backendUrl) {
  try {
    console.log('[sitemap] Waking up backend...');
    // Make a simple request to wake up the backend
    await fetch(`${backendUrl}/products?limit=1`, {
      signal: AbortSignal.timeout(30000), // 30 second timeout for wake-up
    });
    // Wait a bit for backend to fully initialize
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log('[sitemap] Backend is awake');
  } catch (err) {
    console.log('[sitemap] Backend wake-up failed, will try anyway');
  }
}

// Then in the sitemap function, before fetching products:
await wakeUpBackend(backendUrl);
```

### Option 2: Use Vercel Cron Job to Keep Backend Alive

Create a Vercel cron job that pings the backend every 10 minutes:

**File:** `vercel.json`

```json
{
  "crons": [
    {
      "path": "/api/cron/keep-alive",
      "schedule": "*/10 * * * *"
    }
  ]
}
```

**File:** `src/app/api/cron/keep-alive/route.js`

```javascript
export async function GET() {
  try {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL;
    await fetch(`${backendUrl}/products?limit=1`, {
      signal: AbortSignal.timeout(5000),
    });
    return Response.json({ success: true, timestamp: new Date().toISOString() });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}
```

### Option 3: Upgrade Render.com Backend (Paid Solution)

Upgrade the Render.com backend to a paid tier ($7/month) to prevent spin-down:

1. Go to Render.com dashboard
2. Select the backend service
3. Upgrade to "Starter" plan ($7/month)
4. Backend will stay alive 24/7

### Option 4: Static Sitemap with Manual Updates

Generate a static sitemap file and update it manually or via CI/CD:

**File:** `public/sitemap.xml`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://health-care-e-commerce-murex.vercel.app/</loc>
    <lastmod>2026-05-25</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <!-- Add more URLs manually -->
</urlset>
```

## Recommended Implementation

**Implement Option 1 + Option 2** for best results:

1. Add wake-up logic to sitemap (handles one-time requests)
2. Add Vercel cron job (keeps backend alive for regular traffic)

This ensures:
- ✅ Sitemap always works (even if backend is asleep)
- ✅ Backend stays responsive for users
- ✅ No additional costs
- ✅ Google Search Console can fetch sitemap successfully

## Testing the Fix

### Test Sitemap Locally

```bash
# Start dev server
npm run dev

# In another terminal, test sitemap
curl http://localhost:3000/sitemap.xml
```

### Test Sitemap in Production

```bash
# After deployment, test production sitemap
curl https://health-care-e-commerce-murex.vercel.app/sitemap.xml
```

### Verify in Google Search Console

1. Go to Google Search Console
2. Navigate to Sitemaps section
3. Click "Refresh" on the existing sitemap
4. Wait 24-48 hours for Google to re-crawl
5. Check status changes from "Couldn't fetch" to "Success"

## Current Sitemap Contents

Even with backend unavailable, the sitemap includes:

- ✅ 8 static pages (home, products, about, etc.)
- ✅ 8 category pages (diagnostic equipment, surgical instruments, etc.)
- ⚠️ 0 product pages (backend unavailable)

**Total URLs:** 16 (without products)
**Expected URLs:** 16 + ~100-500 products = 116-516 URLs

## Next Steps

1. **Immediate**: Implement Option 1 (wake-up logic) - 5 minutes
2. **Short-term**: Implement Option 2 (cron job) - 10 minutes
3. **Long-term**: Consider Option 3 (upgrade backend) - if budget allows
4. **After fix**: Re-submit sitemap in Google Search Console
5. **Monitor**: Check Google Search Console after 24-48 hours

## Files Modified

- ✅ `src/app/sitemap.js` - Added timeout, better error handling, revalidate export
- 📝 `vercel.json` - (To be created for cron job)
- 📝 `src/app/api/cron/keep-alive/route.js` - (To be created for cron job)

## Environment Variables Required

Ensure these are set in Vercel:

```bash
NEXT_PUBLIC_API_URL=https://health-care-e-commerce.onrender.com/api
NEXT_PUBLIC_SITE_URL=https://health-care-e-commerce-murex.vercel.app
```

## Additional Notes

- The sitemap has a 1-hour cache (`revalidate = 3600`)
- Google typically re-crawls sitemaps every 24-48 hours
- The sitemap is dynamic and will include products once backend is responsive
- The graceful degradation ensures the sitemap is always valid XML
