# Import Finecare Products to Production
# Usage: .\import-to-production.ps1 <admin-token>

param(
    [Parameter(Mandatory=$true)]
    [string]$Token
)

$apiUrl = "https://health-care-e-commerce.onrender.com/api/product-sync/import"
$exportFile = "exports\finecare-products-1778304216946.json"

Write-Host "🚀 Finecare Products Import to Production" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Check if export file exists
if (-not (Test-Path $exportFile)) {
    Write-Host "❌ Export file not found: $exportFile" -ForegroundColor Red
    exit 1
}

# Read export data
Write-Host "📂 Reading export file..." -ForegroundColor Yellow
$exportData = Get-Content $exportFile -Raw | ConvertFrom-Json

Write-Host "✅ Found $($exportData.totalProducts) products" -ForegroundColor Green
Write-Host ""

# Prepare import payload
$payload = @{
    manufacturer = $exportData.manufacturer
    products = $exportData.products
} | ConvertTo-Json -Depth 10

# Import to production
Write-Host "🌐 Importing to production..." -ForegroundColor Yellow
Write-Host "   API: $apiUrl" -ForegroundColor Gray
Write-Host ""

try {
    $response = Invoke-RestMethod -Uri $apiUrl -Method Post `
        -Headers @{
            "Content-Type" = "application/json"
            "Authorization" = "Bearer $Token"
        } `
        -Body $payload

    if ($response.success) {
        Write-Host "✅ Import Successful!" -ForegroundColor Green
        Write-Host ""
        Write-Host "📊 Summary:" -ForegroundColor Cyan
        Write-Host "   Total:   $($response.summary.total)" -ForegroundColor White
        Write-Host "   Created: $($response.summary.created)" -ForegroundColor Green
        Write-Host "   Updated: $($response.summary.updated)" -ForegroundColor Yellow
        Write-Host "   Errors:  $($response.summary.errors)" -ForegroundColor Red
        Write-Host ""
        
        if ($response.errors -and $response.errors.Count -gt 0) {
            Write-Host "⚠️  Errors:" -ForegroundColor Yellow
            foreach ($error in $response.errors) {
                Write-Host "   - $($error.sku): $($error.error)" -ForegroundColor Red
            }
            Write-Host ""
        }
        
        Write-Host "🎉 Finecare products are now available in production!" -ForegroundColor Green
        Write-Host "🔗 View: https://health-care-e-commerce-murex.vercel.app/products?brand=Finecare" -ForegroundColor Cyan
    } else {
        Write-Host "❌ Import Failed: $($response.message)" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Troubleshooting:" -ForegroundColor Yellow
    Write-Host "1. Make sure you are using a valid admin token" -ForegroundColor Gray
    Write-Host "2. Check that the production API is accessible" -ForegroundColor Gray
    Write-Host "3. Verify the deployment is complete" -ForegroundColor Gray
}
