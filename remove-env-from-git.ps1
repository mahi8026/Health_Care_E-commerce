# ============================================================================
# Remove .env files from Git tracking
# ============================================================================
# This script removes .env files from Git tracking while keeping them locally
# Run this from the project root directory
# ============================================================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Removing .env files from Git tracking" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if we're in a git repository
if (-not (Test-Path ".git")) {
    Write-Host "ERROR: Not in a git repository!" -ForegroundColor Red
    Write-Host "Please run this script from the project root directory." -ForegroundColor Yellow
    exit 1
}

Write-Host "Step 1: Removing .env files from Git tracking..." -ForegroundColor Yellow
Write-Host ""

# Remove .env files from git tracking
$envFiles = @(
    "health-care/.env.local",
    "health-care/.env.production",
    "health-care/backend/.env",
    "health-care/backend/.env.production"
)

foreach ($file in $envFiles) {
    if (Test-Path $file) {
        Write-Host "  Removing: $file" -ForegroundColor Gray
        git rm --cached $file 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "    ✓ Removed from Git" -ForegroundColor Green
        } else {
            Write-Host "    ⚠ File not tracked or already removed" -ForegroundColor Yellow
        }
    } else {
        Write-Host "  Skipping: $file (not found)" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "Step 2: Adding .gitignore and .env.example files..." -ForegroundColor Yellow
Write-Host ""

# Add .gitignore and .env.example files
git add .gitignore
git add health-care/.gitignore
git add health-care/.env.example
git add health-care/backend/.env.example

Write-Host "  ✓ Added .gitignore files" -ForegroundColor Green
Write-Host "  ✓ Added .env.example files" -ForegroundColor Green

Write-Host ""
Write-Host "Step 3: Creating commit..." -ForegroundColor Yellow
Write-Host ""

# Commit the changes
git commit -m "security: remove exposed .env files and add templates"

if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✓ Commit created successfully" -ForegroundColor Green
} else {
    Write-Host "  ⚠ No changes to commit or commit failed" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Review the changes:" -ForegroundColor White
Write-Host "   git status" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Push to GitHub:" -ForegroundColor White
Write-Host "   git push origin main" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Verify .env files are not in the repository:" -ForegroundColor White
Write-Host "   Check GitHub repository - .env files should be gone" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Continue with deployment:" -ForegroundColor White
Write-Host "   See DEPLOY_NOW.md for next steps" -ForegroundColor Gray
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "IMPORTANT REMINDERS:" -ForegroundColor Red
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "• Your .env files are still on your local machine" -ForegroundColor Yellow
Write-Host "• They are just removed from Git tracking" -ForegroundColor Yellow
Write-Host "• NEVER commit .env files again!" -ForegroundColor Red
Write-Host "• Use .env.example for templates only" -ForegroundColor Yellow
Write-Host "• Set environment variables in Vercel and Render" -ForegroundColor Yellow
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Script completed!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

