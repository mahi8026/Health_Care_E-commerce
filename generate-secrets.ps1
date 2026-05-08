# ============================================================================
# Generate New Secrets for Production
# ============================================================================
# This script generates new cryptographically secure secrets
# Use these to replace the exposed secrets in your deployment
# ============================================================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Generating New Secrets" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "⚠️  IMPORTANT: Save these secrets securely!" -ForegroundColor Yellow
Write-Host "   - Add them to Vercel environment variables" -ForegroundColor Yellow
Write-Host "   - Add them to Render environment variables" -ForegroundColor Yellow
Write-Host "   - DO NOT commit them to Git!" -ForegroundColor Red
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Generate JWT Secret
Write-Host "JWT_SECRET:" -ForegroundColor Green
$jwtSecret = node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
Write-Host $jwtSecret -ForegroundColor White
Write-Host ""

# Generate JWT Refresh Secret
Write-Host "JWT_REFRESH_SECRET:" -ForegroundColor Green
$jwtRefreshSecret = node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
Write-Host $jwtRefreshSecret -ForegroundColor White
Write-Host ""

# Generate CSRF Secret
Write-Host "CSRF_SECRET:" -ForegroundColor Green
$csrfSecret = node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
Write-Host $csrfSecret -ForegroundColor White
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Copy the secrets above" -ForegroundColor White
Write-Host ""
Write-Host "2. Add to Render (Backend):" -ForegroundColor White
Write-Host "   https://dashboard.render.com" -ForegroundColor Gray
Write-Host "   → Your Service → Environment" -ForegroundColor Gray
Write-Host "   → Add the three secrets above" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Also rotate these secrets manually:" -ForegroundColor White
Write-Host "   • Cloudinary API Secret" -ForegroundColor Gray
Write-Host "     https://cloudinary.com/console/settings/security" -ForegroundColor Gray
Write-Host ""
Write-Host "   • Google OAuth Credentials" -ForegroundColor Gray
Write-Host "     https://console.cloud.google.com/apis/credentials" -ForegroundColor Gray
Write-Host ""
Write-Host "   • MongoDB Password" -ForegroundColor Gray
Write-Host "     https://cloud.mongodb.com/" -ForegroundColor Gray
Write-Host ""
Write-Host "   • Redis Password" -ForegroundColor Gray
Write-Host "     https://app.redislabs.com/" -ForegroundColor Gray
Write-Host ""
Write-Host "4. See DEPLOY_NOW.md for complete instructions" -ForegroundColor White
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Script completed!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

