# ============================================================================
# MedCore BD - Deployment Verification Script
# ============================================================================
# This script verifies that your deployment is working correctly
# Run after deploying to Vercel and Render
# ============================================================================

Write-Host "🚀 MedCore BD - Deployment Verification" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$FRONTEND_URL = "https://health-care-e-commerce-murex.vercel.app"
$BACKEND_URL = "https://health-care-e-commerce.onrender.com"
$API_URL = "$BACKEND_URL/api"

$allPassed = $true

# ============================================================================
# Function to test endpoint
# ============================================================================
function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Url,
        [string]$ExpectedStatus = "200"
    )
    
    Write-Host "Testing: $Name" -ForegroundColor Yellow
    Write-Host "URL: $Url" -ForegroundColor Gray
    
    try {
        $response = Invoke-WebRequest -Uri $Url -Method Get -TimeoutSec 30 -UseBasicParsing
        
        if ($response.StatusCode -eq $ExpectedStatus) {
            Write-Host "✅ PASSED - Status: $($response.StatusCode)" -ForegroundColor Green
            return $true
        } else {
            Write-Host "❌ FAILED - Status: $($response.StatusCode) (Expected: $ExpectedStatus)" -ForegroundColor Red
            return $false
        }
    }
    catch {
        Write-Host "❌ FAILED - Error: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
    finally {
        Write-Host ""
    }
}

# ============================================================================
# Backend Tests
# ============================================================================
Write-Host "📡 Backend Tests" -ForegroundColor Cyan
Write-Host "----------------" -ForegroundColor Cyan
Write-Host ""

# Test 1: Backend Health
if (-not (Test-Endpoint -Name "Backend Health Check" -Url "$API_URL/health")) {
    $allPassed = $false
}

# Test 2: Products API
if (-not (Test-Endpoint -Name "Products API" -Url "$API_URL/products")) {
    $allPassed = $false
}

# Test 3: Categories API
if (-not (Test-Endpoint -Name "Categories API" -Url "$API_URL/categories")) {
    $allPassed = $false
}

# Test 4: Auth Status
if (-not (Test-Endpoint -Name "Auth Status" -Url "$API_URL/auth/status")) {
    $allPassed = $false
}

# ============================================================================
# Frontend Tests
# ============================================================================
Write-Host "🌐 Frontend Tests" -ForegroundColor Cyan
Write-Host "-----------------" -ForegroundColor Cyan
Write-Host ""

# Test 5: Homepage
if (-not (Test-Endpoint -Name "Homepage" -Url $FRONTEND_URL)) {
    $allPassed = $false
}

# Test 6: Products Page
if (-not (Test-Endpoint -Name "Products Page" -Url "$FRONTEND_URL/products")) {
    $allPassed = $false
}

# Test 7: Login Page
if (-not (Test-Endpoint -Name "Login Page" -Url "$FRONTEND_URL/login")) {
    $allPassed = $false
}

# ============================================================================
# Summary
# ============================================================================
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "📊 Test Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

if ($allPassed) {
    Write-Host "✅ All tests passed! Deployment is successful!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🎉 Your application is live:" -ForegroundColor Green
    Write-Host "   Frontend: $FRONTEND_URL" -ForegroundColor White
    Write-Host "   Backend:  $BACKEND_URL" -ForegroundColor White
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "1. Test user registration and login" -ForegroundColor White
    Write-Host "2. Test product search and filtering" -ForegroundColor White
    Write-Host "3. Test cart and checkout flow" -ForegroundColor White
    Write-Host "4. Verify payment integration" -ForegroundColor White
    Write-Host "5. Check email notifications" -ForegroundColor White
    Write-Host ""
    exit 0
} else {
    Write-Host "❌ Some tests failed. Please check the errors above." -ForegroundColor Red
    Write-Host ""
    Write-Host "Troubleshooting:" -ForegroundColor Yellow
    Write-Host "1. Check Render logs: https://dashboard.render.com" -ForegroundColor White
    Write-Host "2. Check Vercel logs: https://vercel.com/dashboard" -ForegroundColor White
    Write-Host "3. Verify environment variables are set correctly" -ForegroundColor White
    Write-Host "4. Check MongoDB and Redis connections" -ForegroundColor White
    Write-Host "5. Review DEPLOYMENT_GUIDE.md for detailed troubleshooting" -ForegroundColor White
    Write-Host ""
    exit 1
}

# ============================================================================
# End of Script
# ============================================================================
