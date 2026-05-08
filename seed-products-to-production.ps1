# Seed All Products to Production
# This script seeds all brand products to the production database

Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║         SEED PRODUCTS TO PRODUCTION                        ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Check if we're in the right directory
if (-not (Test-Path ".\health-care\backend\src\scripts")) {
    Write-Host "❌ Error: Please run this script from the project root directory" -ForegroundColor Red
    Write-Host "   Current directory: $PWD" -ForegroundColor Yellow
    Write-Host "   Expected: C:\Projects\Health Care\" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

Write-Host "⚠️  WARNING: This will seed products to PRODUCTION database!" -ForegroundColor Yellow
Write-Host ""
Write-Host "   Database: cluster0.rqyzhey.mongodb.net/medcore-bd" -ForegroundColor Yellow
Write-Host ""
Write-Host "   This will:" -ForegroundColor White
Write-Host "   - Seed Finecare products (5 products)" -ForegroundColor White
Write-Host "   - Seed BSMI products" -ForegroundColor White
Write-Host "   - Seed LabKit products" -ForegroundColor White
Write-Host "   - Seed GPL products" -ForegroundColor White
Write-Host "   - Seed all other brand products" -ForegroundColor White
Write-Host ""

$confirmation = Read-Host "   Type 'YES' to continue, or anything else to cancel"

if ($confirmation -ne 'YES') {
    Write-Host ""
    Write-Host "❌ Cancelled by user" -ForegroundColor Red
    Write-Host ""
    exit 0
}

Write-Host ""
Write-Host "🚀 Starting seed process..." -ForegroundColor Green
Write-Host ""

# Change to backend directory
Set-Location ".\health-care\backend"

# Run the master seed script
try {
    node src/scripts/seedAllProductsToProduction.js
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ All products seeded successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "📝 Next steps:" -ForegroundColor Yellow
        Write-Host "   1. Go to Render.com dashboard" -ForegroundColor White
        Write-Host "   2. Restart your backend service (to clear cache)" -ForegroundColor White
        Write-Host "   3. Visit: https://health-care-e-commerce-murex.vercel.app/products" -ForegroundColor White
        Write-Host "   4. Filter by Finecare, BSMI, etc. to verify products" -ForegroundColor White
        Write-Host ""
    } else {
        Write-Host ""
        Write-Host "⚠️  Some seed scripts failed. Check the output above." -ForegroundColor Yellow
        Write-Host ""
    }
} catch {
    Write-Host ""
    Write-Host "❌ Error running seed script: $_" -ForegroundColor Red
    Write-Host ""
    exit 1
} finally {
    # Return to original directory
    Set-Location "..\..\"
}

Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
