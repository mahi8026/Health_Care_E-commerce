# Google reCAPTCHA v3 Setup Guide

## Overview

MediportBD uses Google reCAPTCHA v3 to protect authentication endpoints (registration, login, password reset) from automated abuse and bot attacks.

## What Was Implemented

### Frontend Changes

1. **New Hook**: `src/hooks/useRecaptcha.js`
   - Manages reCAPTCHA v3 script loading
   - Provides `executeRecaptcha(action)` function to get tokens
   - Handles ready state and error scenarios

2. **Updated RegisterPage**: `src/views/RegisterPage.jsx`
   - Integrated `useRecaptcha` hook
   - Executes reCAPTCHA before form submission
   - Includes reCAPTCHA token in registration API call
   - Shows reCAPTCHA notice to users

3. **Environment Variable**: Added `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` to `.env.example`

### Backend (Already Configured)

- CAPTCHA middleware exists at `backend/src/middleware/captcha.js`
- Validates reCAPTCHA tokens on registration, login, and password reset
- Environment variables already configured in `backend/.env.example`:
  - `RECAPTCHA_SECRET_KEY` - Secret key from Google
  - `RECAPTCHA_THRESHOLD` - Minimum score (0.0-1.0, default 0.5)
  - `SKIP_CAPTCHA_DEV` - Set to `true` to bypass in development

## Setup Instructions

### Step 1: Get reCAPTCHA Keys from Google

1. Go to [Google reCAPTCHA Admin Console](https://www.google.com/recaptcha/admin)
2. Click **Create** (+ icon) to register a new site
3. Fill in the form:
   - **Label**: MediportBD
   - **reCAPTCHA type**: Select **reCAPTCHA v3**
   - **Domains**: Add your domains:
     - `localhost` (for local development)
     - `mediportbd.com`
     - `www.mediportbd.com`
     - `mediportbd.vercel.app` (if using Vercel preview deployments)
   - Accept terms and submit

4. Copy the keys shown:
   - **Site Key** (public key) - for frontend
   - **Secret Key** (private key) - for backend

### Step 2: Configure Frontend Environment Variables

Add to `health-care/.env.local`:

```env
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=your_site_key_here
```

**Important**: The site key is public and safe to expose in client-side code.

### Step 3: Configure Backend Environment Variables

Add to `health-care/backend/.env`:

```env
# reCAPTCHA Configuration
RECAPTCHA_SECRET_KEY=your_secret_key_here
RECAPTCHA_THRESHOLD=0.5
SKIP_CAPTCHA_DEV=false
```

**Configuration Options:**

- `RECAPTCHA_SECRET_KEY`: Your secret key from Google (required for production)
- `RECAPTCHA_THRESHOLD`: Minimum score to accept (0.0 = bot, 1.0 = human). Default: 0.5
- `SKIP_CAPTCHA_DEV`: Set to `true` to bypass CAPTCHA in development (useful for testing)

### Step 4: Development Testing

**Option 1: Skip CAPTCHA (Recommended for local dev)**

```env
# In backend/.env
SKIP_CAPTCHA_DEV=true
```

This allows you to test registration without setting up reCAPTCHA keys.

**Option 2: Use Real reCAPTCHA**

1. Set up keys as described in Steps 1-3
2. Ensure `localhost` is added to allowed domains
3. Set `SKIP_CAPTCHA_DEV=false`
4. Test registration - you should see the reCAPTCHA badge in bottom-right corner

### Step 5: Production Deployment

1. **Vercel (Frontend)**:
   - Go to Project Settings → Environment Variables
   - Add `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` with your production site key
   - Redeploy

2. **Railway (Backend)**:
   - Go to Project → Variables
   - Add:
     - `RECAPTCHA_SECRET_KEY` = your secret key
     - `RECAPTCHA_THRESHOLD` = 0.5
     - `SKIP_CAPTCHA_DEV` = false
   - Redeploy

3. **Verify domains**: Ensure all production domains are added in reCAPTCHA admin console

## How It Works

### User Flow

1. User fills out registration form
2. On submit, `useRecaptcha` hook calls `grecaptcha.execute()` with action `'register'`
3. Google analyzes user behavior and returns a token
4. Frontend includes token in API request body as `recaptchaToken`
5. Backend middleware verifies token with Google API
6. Google returns a score (0.0 - 1.0)
7. If score >= threshold, registration proceeds; otherwise, request is rejected

### Actions Used

- `register` - Registration form
- `login` - Login form (to be implemented)
- `password_reset` - Password reset form (to be implemented)

## Updating Other Forms

To add reCAPTCHA to LoginPage or other forms:

```javascript
import { useRecaptcha } from '@/hooks/useRecaptcha';

export default function LoginPage() {
  const recaptchaSiteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
  const { executeRecaptcha } = useRecaptcha(recaptchaSiteKey);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Get reCAPTCHA token
    let recaptchaToken = null;
    if (recaptchaSiteKey) {
      recaptchaToken = await executeRecaptcha('login');
      if (!recaptchaToken) {
        setError('Security verification failed. Please refresh and try again.');
        return;
      }
    }
    
    // Include token in API call
    const result = await login({ 
      email, 
      password,
      recaptchaToken 
    });
  };
}
```

## Troubleshooting

### Error: "CAPTCHA token required"

**Cause**: Frontend is not sending reCAPTCHA token

**Solutions**:
- Check if `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` is set in frontend `.env.local`
- If developing locally, set `SKIP_CAPTCHA_DEV=true` in backend `.env`
- Check browser console for reCAPTCHA script loading errors

### Error: "CAPTCHA verification failed"

**Cause**: Backend cannot verify token with Google

**Solutions**:
- Check if `RECAPTCHA_SECRET_KEY` is set correctly in backend `.env`
- Ensure domain is added to reCAPTCHA admin console
- Check backend logs for detailed error from Google API
- Verify internet connectivity from backend server

### Error: "CAPTCHA score too low"

**Cause**: Google's bot detection scored user below threshold

**Solutions**:
- Lower `RECAPTCHA_THRESHOLD` (e.g., from 0.5 to 0.3)
- Check if user is using VPN, Tor, or automated tools
- Review Google reCAPTCHA admin console for score distribution
- Consider adding user feedback: "Please try again" with refresh

### reCAPTCHA badge overlaps content

**Solution**: Add CSS to reposition badge

```css
.grecaptcha-badge {
  bottom: 80px !important; /* Move up if bottom nav is present */
}
```

### Testing in Incognito/Private Mode

reCAPTCHA may give lower scores in private browsing. This is expected behavior. For development:
- Use normal browsing mode
- Or set `SKIP_CAPTCHA_DEV=true`

## Security Best Practices

1. **Never commit secrets**: Keep `.env` files out of git
2. **Use environment-specific keys**: Different keys for dev/staging/production
3. **Monitor scores**: Check reCAPTCHA admin dashboard regularly for unusual patterns
4. **Adjust threshold**: Start with 0.5, adjust based on false positive/negative rates
5. **Don't skip in production**: Always verify CAPTCHA in production environments
6. **Rate limiting**: reCAPTCHA is not a replacement for rate limiting (already implemented via Redis)

## Monitoring

Visit [reCAPTCHA Admin Console](https://www.google.com/recaptcha/admin) to:
- View request volume
- See score distribution
- Identify suspicious traffic patterns
- Download detailed analytics

## Further Reading

- [reCAPTCHA v3 Documentation](https://developers.google.com/recaptcha/docs/v3)
- [Score Interpretation Guide](https://developers.google.com/recaptcha/docs/v3#interpreting_the_score)
- [Migration from v2 to v3](https://developers.google.com/recaptcha/docs/v3#migrating_from_recaptcha_v2)

## Status

- ✅ Backend middleware configured
- ✅ Frontend hook created (`useRecaptcha`)
- ✅ RegisterPage updated with reCAPTCHA
- ⏳ LoginPage needs update (optional)
- ⏳ Password reset pages need update (optional)
- ⏳ Production keys need configuration

## Next Steps

1. Obtain reCAPTCHA keys from Google
2. Add keys to `.env.local` (frontend) and `.env` (backend)
3. Test registration flow
4. Update LoginPage with reCAPTCHA (optional but recommended)
5. Configure production environment variables on Vercel and Railway
6. Monitor reCAPTCHA admin console for anomalies
