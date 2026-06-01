# 🔐 Generate Production Secrets

## Quick Commands

### Generate JWT Secret (64 characters):
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Generate JWT Refresh Secret (64 characters):
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Generate CSRF Secret (32 characters):
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Copy These to Render Dashboard

After running the commands above, copy the outputs and set them in Render:

1. Go to Render Dashboard → Your Backend Service
2. Click "Environment" tab
3. Add/Update these variables:

```
JWT_SECRET=[paste-64-char-hex-here]
JWT_REFRESH_SECRET=[paste-64-char-hex-here]
CSRF_SECRET=[paste-32-char-hex-here]
```

4. Click "Save Changes"
5. Render will automatically redeploy

---

## ⚠️ Important Notes

- **Never commit secrets to Git**
- **Use different secrets for dev and production**
- **Rotating JWT_SECRET will log out all users**
- **Do this during low-traffic hours**
- **Keep a backup of old secrets for 24h**

---

## Current Development Secrets (DO NOT USE IN PRODUCTION)

These are in your `.env` file - **REPLACE THEM** for production:

```
JWT_SECRET=e72d9bbe92128ef308ab7d5adc11ad5b9c6a63991e34c44871dc887aaa00a5a4b21195e79fcd94b0ec2ae9429858ef9fa5494c0952ae6a48a09c6cb6d470a9c1

JWT_REFRESH_SECRET=71977538c660fdb967a56dd43bf6449e1d4306cee610c6a9bc9cb6f69a6c378dccd5121b015ecb8c7e0f7d1a78344b66ff9daa884a7ac751903487b9d1314556

CSRF_SECRET=5ddb4f5c74a9d3fd051c9b843de946586041adf5723b8970a55639bd611df3c6
```

**Status:** ⚠️ Development only - MUST rotate for production

---

## Verification

After setting new secrets in Render:

1. Wait for deployment to complete
2. Test login on production site
3. Verify JWT tokens work
4. Check admin access
5. Test password reset flow

If anything breaks, you can temporarily revert to old secrets.
