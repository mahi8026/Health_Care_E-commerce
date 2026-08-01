# reCAPTCHA Quick Reference Card

## ✅ Status: CONFIGURED

### Your Keys

| Key | Value | Location |
|-----|-------|----------|
| **Site Key** (Public) | `6LdVrXAtAAAAAMNOH94w6PscYbNyCPbsQ8wGty97` | `health-care/.env.local` |
| **Secret Key** (Private) | `6LdVrXAtAAAAAPaPI-7Z1cSZoZYCNoIAK7jxtHdF` | `health-care/backend/.env` |
| **Threshold** | `0.5` | Backend (0.0=bot, 1.0=human) |
| **Dev Bypass** | `false` | CAPTCHA enabled |

### Registered Domains
- ✅ `localhost`
- ✅ `health-care-e-commerce-murex.vercel.app`

### Quick Commands

```bash
# Verify configuration
node verify-recaptcha-setup.js

# Start backend
cd health-care/backend && npm run dev

# Start frontend (new terminal)
cd health-care && npm run dev

# Test registration
# Visit: http://localhost:3000/register
```

### Toggle CAPTCHA On/Off

**Disable CAPTCHA (for quick testing)**:
```env
# health-care/backend/.env
SKIP_CAPTCHA_DEV=true
```

**Enable CAPTCHA (normal mode)**:
```env
# health-care/backend/.env
SKIP_CAPTCHA_DEV=false
```

*Restart backend after changing*

### Adjust Security Level

**More lenient** (accept more users):
```env
RECAPTCHA_THRESHOLD=0.3
```

**Balanced** (recommended):
```env
RECAPTCHA_THRESHOLD=0.5
```

**More strict** (higher security):
```env
RECAPTCHA_THRESHOLD=0.7
```

### Troubleshooting

| Problem | Solution |
|---------|----------|
| "CAPTCHA token required" | Check frontend `.env.local` has site key |
| "CAPTCHA verification failed" | Check backend `.env` has secret key |
| "CAPTCHA score too low" | Lower `RECAPTCHA_THRESHOLD` or set `SKIP_CAPTCHA_DEV=true` |
| Badge not showing | Check browser console for script errors |
| Still not working | Set `SKIP_CAPTCHA_DEV=true` to bypass temporarily |

### Admin Dashboard

**View Analytics**: https://www.google.com/recaptcha/admin
- Request volume
- Score distribution  
- Bot detection patterns

### Production Deployment

**Vercel** (Frontend):
```
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=6LdVrXAtAAAAAMNOH94w6PscYbNyCPbsQ8wGty97
```

**Railway** (Backend):
```
RECAPTCHA_SECRET_KEY=6LdVrXAtAAAAAPaPI-7Z1cSZoZYCNoIAK7jxtHdF
RECAPTCHA_THRESHOLD=0.5
SKIP_CAPTCHA_DEV=false
```

### Files to Check

| File | What to Look For |
|------|------------------|
| `health-care/.env.local` | `NEXT_PUBLIC_RECAPTCHA_SITE_KEY=...` |
| `health-care/backend/.env` | `RECAPTCHA_SECRET_KEY=...` |
| `health-care/src/hooks/useRecaptcha.js` | Hook implementation |
| `health-care/src/views/RegisterPage.jsx` | `useRecaptcha` import & usage |

### Documentation

- **Full Guide**: `docs/RECAPTCHA_SETUP.md`
- **Configuration**: `RECAPTCHA_CONFIGURED.md`
- **Fix Summary**: `RECAPTCHA_FIX_SUMMARY.md`

---

**Need Help?** 
1. Check `docs/RECAPTCHA_SETUP.md` troubleshooting section
2. View backend logs for detailed errors
3. Temporarily bypass with `SKIP_CAPTCHA_DEV=true`
