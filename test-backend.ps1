# Backend Diagnostic Test Script
# Tests all critical endpoints to diagnose the "no data" issue

Write-Host "`n=== MediportBD Backend Diagnostic Test ===" -ForegroundColor Cyan
Write-Host "Testing Railway backend to find why data isn't showing...`n" -ForegroundColor Yellow

$baseUrl = "https://healthcaree-commerce-production.up.railway.app"

# Test 1: Health Check
Write-Host "[1/6] Testing health endpoint..." -ForegroundColor White
try {
    $health = Invoke-RestMethod -Uri "$baseUrl/api/health/detailed" -Method Get -UseBasicParsing
    Write-Host "  Status: $($health.status)" -ForegroundColor $(if($health.status -eq "healthy") {"Green"} else {"Yellow"})
    Write-Host "  Database: $($health.services.database.status)" -ForegroundColor $(if($health.services.database.connected) {"Green"} else {"Red"})
    Write-Host "  DB Host: $($health.services.database.host)" -ForegroundColor Gray
    Write-Host "  Redis: $($health.services.redis.status)" -ForegroundColor Gray
    
    if (-not $health.services.database.connected) {
        Write-Host "`n  ❌ DATABASE IS NOT CONNECTED!" -ForegroundColor Red
        Write-Host "  This is why no data is showing." -ForegroundColor Red
        Write-Host "`n  Check Railway environment variables:" -ForegroundColor Yellow
        Write-Host "  - MONGODB_URI should be set" -ForegroundColor Yellow
        Write-Host "  - Format: mongodb+srv://..." -ForegroundColor Yellow
        exit 1
    }
} catch {
    Write-Host "  ❌ Health check failed: $_" -ForegroundColor Red
    exit 1
}

# Test 2: Home Data
Write-Host "`n[2/6] Testing home data endpoint..." -ForegroundColor White
try {
    $home = Invoke-RestMethod -Uri "$baseUrl/api/home/data" -Method Get -UseBasicParsing
    if ($home.success) {
        $featuredCount = $home.data.featuredProducts.Count
        $categoryCount = $home.data.categories.Count
        Write-Host "  ✅ Home data loaded" -ForegroundColor Green
        Write-Host "  Featured Products: $featuredCount" -ForegroundColor Gray
        Write-Host "  Categories: $categoryCount" -ForegroundColor Gray
        
        if ($featuredCount -eq 0) {
            Write-Host "`n  ⚠️  WARNING: No featured products in database!" -ForegroundColor Yellow
            Write-Host "  The database may be empty." -ForegroundColor Yellow
        }
        
        if ($home.data.dbConnecting) {
            Write-Host "`n  ⚠️  Database is still connecting..." -ForegroundColor Yellow
        }
    } else {
        Write-Host "  ❌ Failed: $($home.message)" -ForegroundColor Red
    }
} catch {
    Write-Host "  ❌ Error: $_" -ForegroundColor Red
}

# Test 3: Categories
Write-Host "`n[3/6] Testing categories endpoint..." -ForegroundColor White
try {
    $categories = Invoke-RestMethod -Uri "$baseUrl/api/categories" -Method Get -UseBasicParsing
    if ($categories.success) {
        $count = $categories.data.Count
        Write-Host "  ✅ Categories loaded: $count categories" -ForegroundColor Green
        
        if ($count -eq 0) {
            Write-Host "  ⚠️  No categories in database!" -ForegroundColor Yellow
        } else {
            Write-Host "  First 3 categories:" -ForegroundColor Gray
            $categories.data | Select-Object -First 3 | ForEach-Object {
                Write-Host "    - $($_.name) ($($_.productCount) products)" -ForegroundColor Gray
            }
        }
    }
} catch {
    Write-Host "  ❌ Error: $_" -ForegroundColor Red
}

# Test 4: Products
Write-Host "`n[4/6] Testing products endpoint..." -ForegroundColor White
try {
    $products = Invoke-RestMethod -Uri "$baseUrl/api/products?limit=5" -Method Get -UseBasicParsing
    if ($products.success) {
        $count = $products.data.products.Count
        $total = $products.data.pagination.total
        Write-Host "  ✅ Products endpoint working" -ForegroundColor Green
        Write-Host "  Total products in DB: $total" -ForegroundColor Gray
        Write-Host "  Returned: $count products" -ForegroundColor Gray
        
        if ($total -eq 0) {
            Write-Host "`n  ❌ DATABASE IS EMPTY - No products found!" -ForegroundColor Red
            Write-Host "  You need to import products into the database." -ForegroundColor Yellow
        } else {
            Write-Host "  First product:" -ForegroundColor Gray
            $firstProduct = $products.data.products[0]
            Write-Host "    - Name: $($firstProduct.name)" -ForegroundColor Gray
            Write-Host "    - Price: ৳$($firstProduct.price)" -ForegroundColor Gray
        }
    }
} catch {
    Write-Host "  ❌ Error: $_" -ForegroundColor Red
}

# Test 5: Settings
Write-Host "`n[5/6] Testing settings endpoint..." -ForegroundColor White
try {
    $settings = Invoke-RestMethod -Uri "$baseUrl/api/settings" -Method Get -UseBasicParsing
    if ($settings.success) {
        Write-Host "  ✅ Settings loaded" -ForegroundColor Green
    }
} catch {
    Write-Host "  ❌ Error: $_" -ForegroundColor Red
}

# Test 6: Stats
Write-Host "`n[6/6] Testing stats endpoint..." -ForegroundColor White
try {
    $stats = Invoke-RestMethod -Uri "$baseUrl/api/stats" -Method Get -UseBasicParsing
    if ($stats.success) {
        Write-Host "  ✅ Stats loaded" -ForegroundColor Green
        Write-Host "  Total Products: $($stats.data.totalProducts)" -ForegroundColor Gray
        Write-Host "  Total Brands: $($stats.data.totalBrands)" -ForegroundColor Gray
        Write-Host "  Total Orders: $($stats.data.totalOrders)" -ForegroundColor Gray
        
        if ($stats.data.totalProducts -eq 0) {
            Write-Host "`n  ❌ DATABASE IS EMPTY!" -ForegroundColor Red
        }
    }
} catch {
    Write-Host "  ❌ Error: $_" -ForegroundColor Red
}

# Final Diagnosis
Write-Host "`n======================================" -ForegroundColor Cyan
Write-Host "DIAGNOSIS SUMMARY" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan

if ($health.services.database.connected -and $stats.data.totalProducts -gt 0) {
    Write-Host "✅ Backend is working correctly" -ForegroundColor Green
    Write-Host "✅ Database is connected" -ForegroundColor Green
    Write-Host "✅ Products exist in database" -ForegroundColor Green
    Write-Host "`nIf frontend still shows no data, the issue is:" -ForegroundColor Yellow
    Write-Host "- CORS headers" -ForegroundColor Yellow
    Write-Host "- Frontend API URL configuration" -ForegroundColor Yellow
    Write-Host "- Browser cache" -ForegroundColor Yellow
} elseif ($health.services.database.connected -and $stats.data.totalProducts -eq 0) {
    Write-Host "✅ Database is connected" -ForegroundColor Green
    Write-Host "❌ DATABASE IS EMPTY - No products!" -ForegroundColor Red
    Write-Host "`nSOLUTION: Import products into database" -ForegroundColor Yellow
    Write-Host "Run: npm run seed (in backend directory)" -ForegroundColor Yellow
} else {
    Write-Host "❌ Database is NOT connected" -ForegroundColor Red
    Write-Host "`nSOLUTION: Fix MONGODB_URI in Railway" -ForegroundColor Yellow
    Write-Host "1. Go to Railway dashboard" -ForegroundColor Yellow
    Write-Host "2. Backend service → Variables" -ForegroundColor Yellow
    Write-Host "3. Update MONGODB_URI" -ForegroundColor Yellow
    Write-Host "4. Redeploy" -ForegroundColor Yellow
}

Write-Host ""
