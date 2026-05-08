# Sync Missing Products from Localhost to Production
# Finds and copies the 12 missing products

Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║         SYNC MISSING PRODUCTS TO PRODUCTION                ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

Write-Host "📊 Current Status:" -ForegroundColor Yellow
Write-Host "   Localhost: 486 products" -ForegroundColor White
Write-Host "   Production: 474 products" -ForegroundColor White
Write-Host "   Missing: 12 products" -ForegroundColor Red
Write-Host ""

Write-Host "This script will:" -ForegroundColor White
Write-Host "   1. Compare localhost and production databases" -ForegroundColor White
Write-Host "   2. Find the 12 missing products" -ForegroundColor White
Write-Host "   3. Show you which products are missing" -ForegroundColor White
Write-Host "   4. Ask for confirmation before copying" -ForegroundColor White
Write-Host ""

$confirmation = Read-Host "Continue? (Y/N)"

if (($confirmation -ne 'Y') -and ($confirmation -ne 'y')) {
    Write-Host ""
    Write-Host "❌ Cancelled" -ForegroundColor Red
    Write-Host ""
    exit 0
}

Write-Host ""
Write-Host "🔍 Finding missing products..." -ForegroundColor Green
Write-Host ""

# Change to backend directory
Set-Location ".\health-care\backend"

# First, run without AUTO_CONFIRM to see what's missing
Write-Host "📋 Step 1: Identifying missing products..." -ForegroundColor Cyan
Write-Host ""

node src/scripts/syncMissingProducts.js

Write-Host ""
Write-Host "📋 Missing products identified above." -ForegroundColor Yellow
Write-Host ""

$copy = Read-Host "Do you want to copy these products to production? (Y/N)"

if (($copy -eq 'Y') -or ($copy -eq 'y')) {
    Write-Host ""
    Write-Host "🚀 Copying products to production..." -ForegroundColor Green
    Write-Host ""
    
    # Run with AUTO_CONFIRM to actually copy
    $env:AUTO_CONFIRM = "true"
    node src/scripts/syncMissingProducts.js
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ Products synced successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "📝 Next steps:" -ForegroundColor Yellow
        Write-Host "   1. Go to Render.com dashboard" -ForegroundColor White
        Write-Host "   2. Restart your backend service" -ForegroundColor White
        Write-Host "   3. Visit production site and verify 486 products" -ForegroundColor White
        Write-Host ""
    }
    else {
        Write-Host ""
        Write-Host "⚠️  Some products failed to copy. Check output above." -ForegroundColor Yellow
        Write-Host ""
    }
}
else {
    Write-Host ""
    Write-Host "❌ Sync cancelled" -ForegroundColor Red
    Write-Host ""
}

# Return to original directory
Set-Location "..\..\"

Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
