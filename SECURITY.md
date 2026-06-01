# Security Policy

## 🚨 CRITICAL: Exposed Credentials

**IMMEDIATE ACTION REQUIRED**: The `.env` files in this repository contain real credentials that have been committed to version control. This is a **CRITICAL SECURITY VULNERABILITY**.

### Affected Files:
- `health-care/backend/.env`
- `health-care/backend/.env.production`
- `health-care/.env.local`

### Exposed Secrets:
- MongoDB Atlas connection strings with passwords
- JWT secrets
- Gmail SMTP passwords
- Cloudinary API secrets
- Redis passwords
- Google OAuth credentials
- Twilio API credentials

### Required Actions:

#### 1. **IMMEDIATELY Rotate All Credentials**
- [ ] Change MongoDB Atlas password
- [ ] Generate new JWT secrets
- [ ] Revoke and create new Gmail App Password
- [ ] Rotate Cloudinary API secret
- [ ] Change Redis password
- [ ] Regenerate Google OAuth credentials
- [ ] Rotate Twilio credentials

#### 2. **Remove Sensitive Files from Git History**
```bash
# WARNING: This rewrites git history. Coordinate with team first.
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch health-care/backend/.env health-care/backend/.env.production health-care/.env.local" \
  --prune-empty --tag-name-filter cat -- --all

# Force push (DANGEROUS - coordinate with team)
git push origin --force --all
git push origin --force --tags
```

#### 3. **Use .env.example Templates**
```bash
# Backend
cp health-care/backend/.env.example health-care/backend/.env
# Edit .env with your NEW credentials

# Frontend
cp health-care/.env.example health-care/.env.local
# Edit .env.local with your NEW credentials
```

#### 4. **Verify .gitignore**
Ensure `.gitignore` contains:
```
.env
.env.local
.env.production
.env.development
*.env
*.env.local
```

#### 5. **Never Commit .env Files Again**
- Use `.env.example` templates only
- Store real credentials in:
  - Local `.env` files (gitignored)
  - Environment variables on hosting platforms
  - Secret management services (AWS Secrets Manager, HashiCorp Vault)

---

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 2.0.x   | :white_check_mark: |
| < 2.0   | :x:                |

---

## Reporting a Vulnerability

**DO NOT** open a public issue for security vulnerabilities.

Instead, email: **security@medcorebd.com**

Include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

We will respond within 48 hours and provide a timeline for fixes.

---

## Security Best Practices

### For Developers:

1. **Never commit credentials**
   - Use `.env.example` templates
   - Keep real `.env` files local only

2. **Use strong secrets**
   ```bash
   # Generate secure random secrets
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```

3. **Keep dependencies updated**
   ```bash
   npm audit
   npm audit fix
   npm update
   ```

4. **Enable 2FA**
   - GitHub account
   - npm account
   - Cloud provider accounts

5. **Review code before committing**
   ```bash
   git diff --cached
   ```

### For Production:

1. **Use environment variables**
   - Vercel: Project Settings → Environment Variables
   - Render: Dashboard → Environment → Environment Variables
   - Never hardcode secrets

2. **Enable security headers**
   - Already configured in `next.config.mjs`
   - Verify with: https://securityheaders.com

3. **Use HTTPS only**
   - Enforce HTTPS redirects
   - Set `Strict-Transport-Security` header

4. **Monitor for vulnerabilities**
   - Enable Dependabot alerts
   - Run `npm audit` regularly
   - Subscribe to security advisories

5. **Implement rate limiting**
   - Already configured in backend
   - Monitor for abuse

6. **Regular security audits**
   - Review access logs
   - Check for suspicious activity
   - Update dependencies monthly

---

## Security Features Implemented

✅ **Authentication & Authorization**
- JWT with expiry (7 days)
- Bcrypt password hashing (12 rounds)
- Role-based access control (admin, b2b_customer, customer)
- 2FA support for admin accounts
- Google OAuth integration

✅ **API Security**
- Helmet.js security headers
- CORS configuration
- Rate limiting (5 login attempts per 15 min)
- MongoDB sanitization
- HPP protection
- XSS filtering

✅ **Data Protection**
- Passwords never stored in plaintext
- Sensitive fields excluded from queries
- Input validation on all routes
- CSRF protection

✅ **Infrastructure Security**
- HTTPS enforced in production
- Security headers configured
- Safe area insets for mobile
- Content Security Policy

---

## Known Issues

### Resolved ✅
- ✅ Credentials rotated — all secrets replaced (May 18, 2026)
- ✅ Next.js updated to 16.2.6 (fixes 13 CVEs)

### Medium Priority:
- Rate limiting skipped in development mode
- CSRF secret has default fallback

### Low Priority:
- Lighthouse CI has low severity vulnerabilities (dev dependency)
- csurf package has low severity cookie vulnerability

---

## Security Checklist for Deployment

- [ ] All credentials rotated
- [ ] `.env` files removed from git history
- [ ] Environment variables set on hosting platform
- [ ] HTTPS enabled and enforced
- [ ] Security headers verified
- [ ] Rate limiting tested
- [ ] Dependencies updated (`npm audit` clean)
- [ ] 2FA enabled for admin accounts
- [ ] Backup strategy in place
- [ ] Monitoring and alerting configured
- [ ] Incident response plan documented

---

## Contact

- **Security Issues**: security@medcorebd.com
- **General Support**: support@medcorebd.com
- **Website**: https://medcorebd.com

---

**Last Updated**: May 17, 2026
