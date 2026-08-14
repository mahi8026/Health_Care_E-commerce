# PowerShell script to fix UTF-8 encoding issues in JSX files

$files = @(
    "health-care\src\views\RegisterPage.jsx",
    "health-care\src\views\ReagentStorePage.jsx",
    "health-care\src\views\OrderHistoryPage.jsx",
    "health-care\src\views\OrderTrackingPage.jsx",
    "health-care\src\views\FAQPage.jsx",
    "health-care\src\views\account\LoyaltyPage.jsx",
    "health-care\src\views\B2BDashboardPage.jsx",
    "health-care\src\components\checkout\OrderSummary.jsx"
)

# Map of broken patterns to correct emojis
$replacements = @{
    "ðŸ'¤" = "👤"  # Person
    "ðŸ¢" = "🏢"  # Office
    "ðŸ§ª" = "🧪"  # Test tube
    "ðŸ"¬" = "🔬"  # Microscope
    "ðŸ"¦" = "📦"  # Package
    "ðŸ"‹" = "📋"  # Clipboard
    "âœ…" = "✅"  # Check
    "âš™ï¸" = "⚙️"  # Gear
    "ðŸšš" = "🚚"  # Truck
    "ðŸ"—" = "🔗"  # Link
    "ðŸ›¡ï¸" = "🛡️"  # Shield
    "ðŸ"„" = "📄"  # Document
    "ðŸ'¬" = "💬"  # Speech
    "ðŸ›'" = "🛒"  # Cart
    "ðŸ¥" = "🏥"  # Hospital
    "ðŸ"" = "🔒"  # Lock
    "â­" = "⭐"  # Star
    "ðŸ'¥" = "👥"  # People
    "ðŸ¥‰" = "🥉"  # Bronze
    "ðŸ¥ˆ" = "🥈"  # Silver
    "ðŸ¥‡" = "🥇"  # Gold
    "ðŸ'Ž" = "💎"  # Gem
    "ðŸ'°" = "💰"  # Money
    "ðŸ¦" = "🏦"  # Bank
    "ðŸšš" = "🚚"  # Truck (dup)
    "ðŸ"§" = "🔧"  # Wrench
    "ðŸ·ï¸" = "🏷️"  # Tag
    "â†©" = "↩️"  # Return
}

$totalFixed = 0

Write-Host "Fixing UTF-8 encoding issues..." -ForegroundColor Cyan
Write-Host ""

foreach ($file in $files) {
    if (Test-Path $file) {
        $content = Get-Content -Path $file -Raw -Encoding UTF8
        $fixed = $false
        
        foreach ($broken in $replacements.Keys) {
            if ($content -like "*$broken*") {
                $content = $content.Replace($broken, $replacements[$broken])
                $fixed = $true
            }
        }
        
        if ($fixed) {
            $content | Out-File -FilePath $file -Encoding UTF8 -NoNewline
            Write-Host "[FIXED] $file" -ForegroundColor Green
            $totalFixed++
        } else {
            Write-Host "[CLEAN] $file" -ForegroundColor Gray
        }
    } else {
        Write-Host "[SKIP]  $file (not found)" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Total files fixed: $totalFixed" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
