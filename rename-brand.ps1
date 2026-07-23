$ErrorActionPreference = "Continue"

# Define replacements in order (most specific first)
$replacements = @(
    @{Old="MedCore Bangladesh Ltd."; New="Mediport Bangladesh Ltd."},
    @{Old="MedCore Bangladesh"; New="Mediport Bangladesh"},
    @{Old="MedCoreBD"; New="MediportBD"},
    @{Old="MedCore BD"; New="MediportBD"},
    @{Old="medcorebd.com"; New="mediportbd.com"},
    @{Old="medcore-bd"; New="mediport-bd"},
    @{Old="medcorebd"; New="mediportbd"},
    @{Old="MedCore"; New="Mediport"},
    @{Old="medcore"; New="mediport"},
    @{Old="MEDCORE"; New="MEDIPORT"}
)

# File extensions to process
$extensions = @("*.js", "*.jsx", "*.ts", "*.tsx", "*.json", "*.md", "*.html", "*.css", "*.txt", "*.env*", "*.yml", "*.yaml")

# Directories to exclude
$excludeDirs = @("node_modules", ".next", ".git", "coverage", "dist", "build")

$count = 0
$fileCount = 0

Write-Host "Starting brand rename from MedCore BD to MediportBD..." -ForegroundColor Cyan

foreach ($ext in $extensions) {
    $files = Get-ChildItem -Path "." -Filter $ext -Recurse -File -ErrorAction SilentlyContinue | Where-Object {
        $path = $_.FullName
        $exclude = $false
        foreach ($dir in $excludeDirs) {
            if ($path -like "*\$dir\*") {
                $exclude = $true
                break
            }
        }
        -not $exclude
    }
    
    foreach ($file in $files) {
        try {
            $content = Get-Content $file.FullName -Raw -ErrorAction SilentlyContinue
            if ($null -ne $content) {
                $modified = $false
                $newContent = $content
                
                foreach ($replacement in $replacements) {
                    if ($newContent -match [regex]::Escape($replacement.Old)) {
                        $newContent = $newContent -replace [regex]::Escape($replacement.Old), $replacement.New
                        $modified = $true
                        $count++
                    }
                }
                
                if ($modified) {
                    Set-Content -Path $file.FullName -Value $newContent -NoNewline -ErrorAction Stop
                    $fileCount++
                    Write-Host "Updated: $($file.FullName)" -ForegroundColor Green
                }
            }
        } catch {
            Write-Host "Skipped (locked): $($file.FullName)" -ForegroundColor Yellow
        }
    }
}

Write-Host "`nRename complete!" -ForegroundColor Green
Write-Host "Files updated: $fileCount" -ForegroundColor Cyan
Write-Host "Total replacements: $count" -ForegroundColor Cyan
