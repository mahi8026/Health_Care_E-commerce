# Push Notifications Troubleshooting Guide

## Current Issue

Push notification subscription fails with error:
```
AbortError: Registration failed - push service error
```

## Diagnostic Steps

### 1. Test Locally First

#### A. Run Backend Locally
```bash
cd health-care/backend
npm run dev
```

Check console for these lines:
```
[Push] VAPID keys configured successfully
[Push] VAPID_EMAIL: mailto:mahimrahman07@gmail.com
[Push] VAPID_PUBLIC_KEY: BDEe8zM773HcRKN7F8FTDNs5aP3Eal4tItO7V...
[Push] web-push configured with VAPID details
```

If you see errors about missing VAPID keys, the .env file is not loaded correctly.

#### B. Test VAPID Keys
```bash
cd health-care/backend
node test-vapid.js
```

This will validate:
- ✅ VAPID keys exist in .env
- ✅ Keys are correct format
- ✅ web-push accepts the keys

#### C. Run Frontend Locally
```bash
cd health-care
npm run dev
```

#### D. Visit Test Page
Open: http://localhost:3000/test-push

This diagnostic page will:
1. Check browser support for push notifications
2. Verify VAPID key is loaded
3. Check service worker registration
4. Test backend connectivity
5. Run a full subscription test with detailed logging

### 2. Verify Environment Variables

#### Backend (Railway)

Login to Railway dashboard and verify these environment variables are set:

```bash
VAPID_PUBLIC_KEY=BDEe8zM773HcRKN7F8FTDNs5aP3Eal4tItO7V-BE5i0proQIY7_R13lU7XRKM3jenGpCKJ_u6v7BuB6luLMwj_I
VAPID_PRIVATE_KEY=A56rmQ0TarLaPvUJEinH1yvNjN4slEG7u0AEcqOFfaM
VAPID_EMAIL=mailto:mahimrahman07@gmail.com
```

**CRITICAL**: Keys must be **EXACTLY** the same as in `backend/.env` (no extra spaces, line breaks, or quotes)

To verify Railway has loaded them:
1. Go to Railway dashboard → Your project → Variables tab
2. Check each variable exists
3. Click "Redeploy" after adding/changing variables

#### Frontend (Vercel)

Login to Vercel dashboard and verify this environment variable is set:

```bash
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BDEe8zM773HcRKN7F8FTDNs5aP3Eal4tItO7V-BE5i0proQIY7_R13lU7XRKM3jenGpCKJ_u6v7BuB6luLMwj_I
```

To verify Vercel has loaded it:
1. Go to Vercel dashboard → Your project → Settings → Environment Variables
2. Check variable exists
3. Click "Redeploy" after adding/changing variables

### 3. Check Service Worker

#### Clear Service Worker Cache

The old service worker might be cached. To clear it:

**Chrome/Edge:**
1. Open DevTools (F12)
2. Go to Application tab → Service Workers
3. Click "Unregister" for all service workers
4. Check "Update on reload"
5. Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)

**Firefox:**
1. Open DevTools (F12)
2. Go to Application tab → Service Workers
3. Click "Unregister" for the service worker
4. Hard refresh: Ctrl+F5 (Windows) or Cmd+Shift+R (Mac)

#### Verify Service Worker is Active

After clearing cache and refreshing:
1. Open DevTools → Application → Service Workers
2. You should see:
   - **Status**: Activated and running
   - **Source**: /sw.js
   - **Scope**: /

If you see "Installing" or "Waiting" for a long time, the service worker is stuck. Unregister and refresh again.

### 4. Check Backend Logs

#### Railway Logs

1. Go to Railway dashboard → Your project
2. Click "View Logs"
3. Look for push-related logs:

**What you SHOULD see:**
```
[Push] VAPID keys configured successfully
[Push] VAPID_EMAIL: mailto:mahimrahman07@gmail.com
[Push] VAPID_PUBLIC_KEY: BDEe8zM773HcRKN7F8FTDNs5aP3Eal4tItO7V...
[Push] web-push configured with VAPID details
```

**If you see errors:**
```
[Push] Missing VAPID environment variables
[Push] VAPID_EMAIL: MISSING
[Push] VAPID_PUBLIC_KEY: MISSING
```
→ Environment variables are not set correctly in Railway

#### Test Backend Endpoint

Test if the backend push endpoint is reachable:

```bash
curl -X POST https://your-railway-url.up.railway.app/api/push/subscribe \
  -H "Content-Type: application/json" \
  -d '{
    "subscription": {
      "endpoint": "test",
      "keys": { "p256dh": "test", "auth": "test" }
    }
  }'
```

**Expected response:**
```json
{"success": false, "message": "..."}
```

**If you get 404 or 500:**
- Check Railway logs for errors
- Verify pushRoutes is registered in server.js
- Check if backend is running

### 5. Browser-Specific Issues

#### Chrome/Edge

Push notifications require HTTPS in production. Check:
1. Your site is served over HTTPS (Vercel does this automatically)
2. No mixed content warnings in console
3. Notifications are not blocked: chrome://settings/content/notifications

#### Firefox

Firefox uses Mozilla's push service. Check:
1. dom.push.enabled is true in about:config
2. dom.webnotifications.enabled is true
3. Notifications are allowed in Firefox settings

#### Safari

Safari on iOS does not support Web Push API yet (as of iOS 16.3).
Safari on macOS supports push notifications but requires user interaction.

### 6. Common Issues & Solutions

#### Issue: "Registration failed - push service error"

**Possible causes:**
1. **VAPID key mismatch** - Frontend and backend keys don't match
   - Solution: Verify keys in Vercel and Railway match exactly
2. **Service worker not active** - Old SW cached
   - Solution: Unregister service worker, hard refresh
3. **Backend unreachable** - API endpoint returns 404/500
   - Solution: Check Railway logs, verify routes registered
4. **VAPID keys invalid format** - Keys corrupted or incomplete
   - Solution: Run `node test-vapid.js` locally to verify

#### Issue: "useAuth must be used within AuthProvider"

This is unrelated to push notifications. It means a component is trying to use AuthContext outside the provider.

**Solution:**
Check that `<AuthProvider>` wraps all routes in `layout.jsx`

#### Issue: Permission shows "denied"

User has blocked notifications. They need to:
1. Click the lock icon in address bar
2. Allow notifications
3. Refresh the page

#### Issue: Service worker fails to register

Check console for errors. Common causes:
1. **Syntax error in sw.js** - Check DevTools console
2. **Service worker not found** - Verify `/public/sw.js` exists
3. **HTTPS required** - Service workers only work on HTTPS (or localhost)

### 7. Production Deployment Checklist

Before deploying to production, verify:

- [ ] VAPID keys generated: `npm run generate-vapid` (backend)
- [ ] Backend .env has all 3 VAPID keys
- [ ] Railway environment variables set (3 keys)
- [ ] Vercel environment variable set (1 public key)
- [ ] Both deployments redeployed after adding env vars
- [ ] Service worker registered successfully
- [ ] Backend logs show VAPID keys loaded
- [ ] Test page works: /test-push
- [ ] NotificationBanner appears after 20 seconds
- [ ] Subscription succeeds when clicking "Enable Notifications"

### 8. Testing Workflow

1. **Clear everything:**
   ```bash
   # Unregister service worker in DevTools
   # Clear browser cache: Ctrl+Shift+Delete
   # Hard refresh: Ctrl+Shift+R
   ```

2. **Visit test page:**
   ```
   http://localhost:3000/test-push  (local)
   https://your-site.vercel.app/test-push  (production)
   ```

3. **Run diagnostics:**
   - Click "🔍 Re-run Diagnostics"
   - Verify all status indicators are green

4. **Test subscription:**
   - Click "🚀 Test Subscribe"
   - Watch console logs for detailed progress
   - If it fails, read the error message carefully

5. **Check backend:**
   - Check Railway logs for `[Push] Subscribe request received`
   - Should see `[Push] Subscription saved to database`

### 9. Debug Logs

Enable verbose logging by adding this to your browser console:

```javascript
// Enable verbose service worker logs
navigator.serviceWorker.addEventListener('message', (event) => {
  console.log('[SW Message]', event.data);
});

// Log all push events
navigator.serviceWorker.ready.then((reg) => {
  reg.pushManager.getSubscription().then((sub) => {
    console.log('[Push] Current subscription:', sub);
  });
});
```

### 10. Still Not Working?

If after all these steps it still fails:

1. **Check browser console** - Look for the EXACT error message
2. **Check Railway logs** - Look for backend errors
3. **Test with curl** - Verify backend endpoint is reachable
4. **Try different browser** - Rule out browser-specific issues
5. **Compare with working example** - Use test page to isolate the issue

### Files to Check

If you need to modify code:

**Frontend:**
- `health-care/src/hooks/usePushNotification.js` - Subscription logic
- `health-care/src/components/pwa/NotificationBanner.jsx` - UI component
- `health-care/public/sw.js` - Service worker with push handlers
- `health-care/.env.local` - Local environment variables

**Backend:**
- `health-care/backend/src/utils/pushService.js` - VAPID configuration
- `health-care/backend/src/controllers/pushController.js` - Subscribe endpoint
- `health-care/backend/src/routes/pushRoutes.js` - API routes
- `health-care/backend/src/server.js` - Route registration (line ~333)
- `health-care/backend/.env` - Local environment variables

## Quick Fix Checklist

Try these in order:

1. [ ] Clear service worker cache (DevTools → Application → Unregister)
2. [ ] Hard refresh (Ctrl+Shift+R)
3. [ ] Verify VAPID keys match on Vercel and Railway
4. [ ] Redeploy both frontend and backend
5. [ ] Test on /test-push page
6. [ ] Check Railway logs for VAPID configuration messages
7. [ ] Try different browser
8. [ ] Run `node test-vapid.js` locally

## Contact

If you've tried everything and it still doesn't work, provide:
1. Screenshot of /test-push page showing diagnostics
2. Browser console errors (full message)
3. Railway logs (push-related lines)
4. Browser and OS version
