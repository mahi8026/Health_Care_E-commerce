# Quick Import All Tynor Products from Healthway
# This script automates the entire import process

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║    Healthway Tynor Complete Import & Cloudinary Setup     ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Check if we're in the correct directory
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Error: Please run this script from the backend directory" -ForegroundColor Red
    Write-Host "   cd c:\Projects\Health Care\health-care\backend" -ForegroundColor Yellow
    exit 1
}

# Step 1: Fetch all products from Healthway
Write-Host "📡 Step 1: Fetching ALL Tynor products from Healthway API..." -ForegroundColor Yellow
Write-Host ""
npm run fetch:healthway-all

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "❌ Failed to fetch products from Healthway API" -ForegroundColor Red
    Write-Host "   Check your internet connection and try again" -ForegroundColor Yellow
    exit 1
}

# Step 2: Format the data
Write-Host ""
Write-Host "🔄 Step 2: Converting to MedCore format..." -ForegroundColor Yellow
Write-Host ""
npm run format:healthway

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "❌ Failed to format products" -ForegroundColor Red
    exit 1
}

# Step 3: Import to database
Write-Host ""
Write-Host "📦 Step 3: Importing to database..." -ForegroundColor Yellow
Write-Host ""
npm run import:auto

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "❌ Failed to import products" -ForegroundColor Red
    exit 1
}

# Step 4: Upload images to Cloudinary (optional)
Write-Host ""
Write-Host "☁️  Step 4: Upload images to Cloudinary? (Y/N)" -ForegroundColor Yellow
$upload = Read-Host "Press Y to upload, N to skip"

if ($upload -eq "Y" -or $upload -eq "y") {
    Write-Host ""
    Write-Host "📤 Uploading Tynor images to Cloudinary..." -ForegroundColor Yellow
    Write-Host "   This may take several minutes..." -ForegroundColor Gray
    Write-Host ""
    npm run upload:cloudinary-tynor

    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ Images uploaded successfully!" -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "⚠️  Some images failed to upload, but products are still imported" -ForegroundColor Yellow
    }
} else {
    Write-Host ""
    Write-Host "⏭️  Skipped Cloudinary upload" -ForegroundColor Gray
    Write-Host "   You can upload later with: npm run upload:cloudinary-tynor" -ForegroundColor Gray
}

# Success message
Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║                    ✅ IMPORT COMPLETE!                     ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "🎉 All Tynor products imported successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 View products at:" -ForegroundColor Cyan
Write-Host "   http://localhost:3000/admin" -ForegroundColor White
Write-Host ""
Write-Host "🔍 Next steps:" -ForegroundColor Cyan
Write-Host "   1. Review products in admin dashboard" -ForegroundColor White
Write-Host "   2. Update stock quantities if needed" -ForegroundColor White
Write-Host "   3. Set featured products" -ForegroundColor White
Write-Host "   4. Configure product variants (sizes)" -ForegroundColor White
Write-Host ""
