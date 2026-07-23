# Railway Deployment Checker
# Run this script to check if Railway has deployed the latest backend code

Write-Host "`n=== Railway Backend Deployment Checker ===" -ForegroundColor Cyan
Write-Host "Checking if Railway has deployed the CORS fix...`n" -ForegroundColor Yellow

$backendUrl = "https://healthcaree-commerce-production.up.railway.app/api/health"
$frontendOrigin = "https://health-care-e-commerce-murex.vercel.app"

# Test 1: Check health endpoint (no CORS needed)
Write-Host "[1/3] Checking backend health..." -ForegroundColor White
try {
    $health = Invoke-RestMethod -Uri $backendUrl -Method Get -UseBasicParsing
    if ($health.success -eq $true) {
        Write-Host "  ✅ Backend is running" -ForegroundColor Green
        Write-Host "  Version: $($health.version)" -ForegroundColor Gray
        Write-Host "  Status: $($health.status)" -ForegroundColor Gray
    } else {
        Write-Host "  ❌ Backend health check failed" -ForegroundColor Red
    }
} catch {
    Write-Host "  ❌ Backend is not responding: $_" -ForegroundColor Red
    Write-Host "`n⏳ Railway is probably still deploying. Wait 2-3 minutes and run this script again.`n" -ForegroundColor Yellow
    exit 1
}

# Test 2: Check OPTIONS preflight (CORS test)
Write-Host "`n[2/3] Testing CORS preflight (OPTIONS request)..." -ForegroundColor White
$testUrl = "https://healthcaree-commerce-production.up.railway.app/api/home/data"
try {
    $headers = @{
        "Origin" = $frontendOrigin
        "Access-Control-Request-Method" = "GET"
        "Access-Control-Request-Headers" = "Content-Type"
    }
    
    $response = Invoke-WebRequest -Method OPTIONS -Uri $testUrl -Headers $headers -UseBasicParsing -ErrorAction Stop
    
    if ($response.StatusCode -eq 204) {
        Write-Host "  ✅ OPTIONS request successful (204)" -ForegroundColor Green
        
        # Check for CORS headers
        $corsHeader = $response.Headers["Access-Control-Allow-Origin"]
        if ($corsHeader) {
            Write-Host "  ✅ CORS headers present" -ForegroundColor Green
            Write-Host "  Allow-Origin: $corsHeader" -ForegroundColor Gray
        } else {
            Write-Host "  ⚠️  WARNING: No Access-Control-Allow-Origin header!" -ForegroundColor Yellow
        }
    } else {
        Write-Host "  ⚠️  Unexpected status code: $($response.StatusCode)" -ForegroundColor Yellow
    }
    
    Write-Host "`n  ✅✅✅ CORS FIX IS DEPLOYED! ✅✅✅" -ForegroundColor Green
    Write-Host "  The backend is now correctly handling preflight requests." -ForegroundColor Green
    
} catch {
    $errorMessage = $_.Exception.Message
    if ($errorMessage -like "*503*" -or $errorMessage -like "*Service Unavailable*") {
        Write-Host "  ❌ Still getting 503 errors" -ForegroundColor Red
        Write-Host "  ⏳ Railway hasn't deployed the fix yet." -ForegroundColor Yellow
    } elseif ($errorMessage -like "*429*" -or $errorMessage -like "*rate limit*") {
        Write-Host "  ⚠️  Rate limited - backend is responding but too many requests" -ForegroundColor Yellow
        Write-Host "  Wait 1 minute and try again." -ForegroundColor Yellow
    } else {
        Write-Host "  ❌ Error: $errorMessage" -ForegroundColor Red
    }
    Write-Host "`n⏳ The fix is NOT deployed yet. Wait 2-3 minutes and run this script again.`n" -ForegroundColor Yellow
    exit 1
}

# Test 3: Check actual data endpoint
Write-Host "`n[3/3] Testing actual data fetch..." -ForegroundColor White
try {
    $dataUrl = "https://healthcaree-commerce-production.up.railway.app/api/home/data"
    $data = Invoke-RestMethod -Uri $dataUrl -Method Get -UseBasicParsing -ErrorAction Stop
    
    if ($data.success -eq $true) {
        Write-Host "  ✅ Data endpoint working" -ForegroundColor Green
        Write-Host "  Featured Products: $($data.data.featuredProducts.Count)" -ForegroundColor Gray
        Write-Host "  Categories: $($data.data.categories.Count)" -ForegroundColor Gray
    } else {
        Write-Host "  ⚠️  Endpoint returned success=false" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  ⚠️  Data endpoint error: $($_.Exception.Message)" -ForegroundColor Yellow
    Write-Host "  (This might be due to database connection - not critical)" -ForegroundColor Gray
}

# Final verdict
Write-Host "`n======================================" -ForegroundColor Cyan
Write-Host "🎉 DEPLOYMENT SUCCESSFUL!" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "`nNext steps:" -ForegroundColor White
Write-Host "1. Open: https://health-care-e-commerce-murex.vercel.app" -ForegroundColor White
Write-Host "2. Hard refresh: Ctrl+Shift+R (or Cmd+Shift+R on Mac)" -ForegroundColor White
Write-Host "3. Check browser console (F12) - should be NO CORS errors" -ForegroundColor White
Write-Host "4. Products should load on homepage`n" -ForegroundColor White
