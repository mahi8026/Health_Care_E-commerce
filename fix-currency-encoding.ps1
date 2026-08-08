# PowerShell script to fix Bengali Taka currency symbol encoding issues
# This fixes corrupted UTF-8 encoding where ৳ (U+09F3) appears as à§³

Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "  Fix Bengali Taka Symbol Encoding" -ForegroundColor Cyan
Write-Host "  Replacing corrupted symbols with proper ৳" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""

# Define the corrupted and correct symbols
$corrupted = "Ã Â§Â³"  # URL-encoded version
$correct = "৳"

# File patterns to search
$patterns = @(
    "health-care\src\**\*.jsx",
    "health-care\src\**\*.js"
)

$totalFiles = 0
$totalReplacements = 0

foreach ($pattern in $patterns) {
    $files = Get-ChildItem -Path $pattern -Recurse -ErrorAction SilentlyContinue
    
    foreach ($file in $files) {
        try {
            # Read file with UTF-8 encoding
            $content = [System.IO.File]::ReadAllText($file.FullName, [System.Text.Encoding]::UTF8)
            
            # Check if file contains corrupted symbol
            if ($content.Contains("à§³")) {
                # Count occurrences
                $count = ([regex]::Matches($content, "à§³")).Count
                
                # Replace corrupted symbol with correct one
                $newContent = $content.Replace("à§³", "৳")
                
                # Save file with UTF-8 encoding without BOM
                $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
                [System.IO.File]::WriteAllText($file.FullName, $newContent, $utf8NoBom)
                
                Write-Host "Fixed $count occurrence(s) in: $($file.Name)" -ForegroundColor Green
                $totalFiles++
                $totalReplacements += $count
            }
        }
        catch {
            Write-Host "Error processing $($file.Name): $_" -ForegroundColor Red
        }
    }
}

Write-Host ""
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "Summary: $totalFiles files, $totalReplacements replacements" -ForegroundColor Yellow
Write-Host "===============================================" -ForegroundColor Cyan
