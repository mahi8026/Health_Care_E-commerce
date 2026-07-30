# ===================================================================
# Disk Space Cleanup Script for MediportBD Project
# ===================================================================
# This script safely cleans up development cache and temporary files
# to free up disk space without affecting your source code.
# ===================================================================

Write-Host "`n🧹 Starting Disk Space Cleanup..." -ForegroundColor Cyan
Write-Host "=" * 60

# Check initial disk space
$initialFree = (Get-PSDrive C).Free / 1GB
Write-Host "`n📊 Initial Free Space: $([math]::Round($initialFree, 2)) GB" -ForegroundColor Yellow

$totalFreed = 0

# ===================================================================
# 1. Clean Next.js Build Cache (.next folder)
# ===================================================================
Write-Host "`n🔍 Checking Next.js cache..." -ForegroundColor Cyan

$nextPath = "health-care\.next"
if (Test-Path $nextPath) {
    $size = (Get-ChildItem -Path $nextPath -Recurse -File -ErrorAction SilentlyContinue | 
             Measure-Object -Property Length -Sum).Sum / 1MB
    
    Write-Host "   Found .next folder: $([math]::Round($size, 2)) MB" -ForegroundColor White
    Remove-Item -Path $nextPath -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "   ✅ Deleted .next folder" -ForegroundColor Green
    $totalFreed += $size
} else {
    Write-Host "   ℹ️  No .next folder found" -ForegroundColor Gray
}

# ===================================================================
# 2. Clean npm Cache
# ===================================================================
Write-Host "`n🔍 Cleaning npm cache..." -ForegroundColor Cyan

Push-Location "health-care"
$npmOutput = npm cache clean --force 2>&1
Pop-Location

Write-Host "   ✅ npm cache cleaned" -ForegroundColor Green

# ===================================================================
# 3. Clean Backend Logs (optional - keep last 7 days)
# ===================================================================
Write-Host "`n🔍 Checking backend logs..." -ForegroundColor Cyan

$logsPath = "health-care\backend\logs"
if (Test-Path $logsPath) {
    $oldLogs = Get-ChildItem -Path $logsPath -File | 
               Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-7) }
    
    if ($oldLogs) {
        $logsSize = ($oldLogs | Measure-Object -Property Length -Sum).Sum / 1MB
        Write-Host "   Found old logs (>7 days): $([math]::Round($logsSize, 2)) MB" -ForegroundColor White
        $oldLogs | Remove-Item -Force
        Write-Host "   ✅ Deleted old logs" -ForegroundColor Green
        $totalFreed += $logsSize
    } else {
        Write-Host "   ℹ️  No old logs to clean" -ForegroundColor Gray
    }
} else {
    Write-Host "   ℹ️  No logs folder found" -ForegroundColor Gray
}

# ===================================================================
# 4. Clean Temporary Upload Files (if any)
# ===================================================================
Write-Host "`n🔍 Checking temporary uploads..." -ForegroundColor Cyan

$uploadsPath = "health-care\backend\tmp"
if (Test-Path $uploadsPath) {
    $tempFiles = Get-ChildItem -Path $uploadsPath -Recurse -File
    
    if ($tempFiles) {
        $uploadsSize = ($tempFiles | Measure-Object -Property Length -Sum).Sum / 1MB
        Write-Host "   Found temp uploads: $([math]::Round($uploadsSize, 2)) MB" -ForegroundColor White
        $tempFiles | Remove-Item -Force
        Write-Host "   ✅ Deleted temp uploads" -ForegroundColor Green
        $totalFreed += $uploadsSize
    } else {
        Write-Host "   ℹ️  No temp files to clean" -ForegroundColor Gray
    }
} else {
    Write-Host "   ℹ️  No temp folder found" -ForegroundColor Gray
}

# ===================================================================
# 5. Check for Large Files in Project (Information Only)
# ===================================================================
Write-Host "`n🔍 Checking for large files..." -ForegroundColor Cyan

$largeFiles = Get-ChildItem -Path "." -Recurse -File -ErrorAction SilentlyContinue |
              Where-Object { $_.Length -gt 10MB -and $_.DirectoryName -notlike "*node_modules*" } |
              Sort-Object Length -Descending |
              Select-Object -First 10

if ($largeFiles) {
    Write-Host "   ⚠️  Large files found (>10MB):" -ForegroundColor Yellow
    foreach ($file in $largeFiles) {
        $sizeMB = [math]::Round($file.Length / 1MB, 2)
        $relativePath = $file.FullName.Replace($PWD.Path + "\", "")
        Write-Host "      • $relativePath - $sizeMB MB" -ForegroundColor White
    }
    Write-Host "   ℹ️  Review these files manually if needed" -ForegroundColor Gray
} else {
    Write-Host "   ✅ No large files found" -ForegroundColor Green
}

# ===================================================================
# 6. Final Disk Space Check
# ===================================================================
$finalFree = (Get-PSDrive C).Free / 1GB
$actualFreed = $finalFree - $initialFree

Write-Host "`n" + ("=" * 60) -ForegroundColor Cyan
Write-Host "📊 Cleanup Summary" -ForegroundColor Cyan
Write-Host ("=" * 60) -ForegroundColor Cyan
Write-Host "   Initial Free Space: $([math]::Round($initialFree, 2)) GB" -ForegroundColor White
Write-Host "   Final Free Space:   $([math]::Round($finalFree, 2)) GB" -ForegroundColor White
Write-Host "   Space Freed:        $([math]::Round($actualFreed, 2)) GB" -ForegroundColor Green
Write-Host ("=" * 60) -ForegroundColor Cyan

# ===================================================================
# 7. Recommendations
# ===================================================================
Write-Host "`n💡 Recommendations:" -ForegroundColor Cyan

if ($finalFree -lt 5) {
    Write-Host "   ⚠️  Disk space still low (<5GB free)" -ForegroundColor Red
    Write-Host "   Consider:" -ForegroundColor Yellow
    Write-Host "      1. Moving node_modules to another drive" -ForegroundColor White
    Write-Host "      2. Cleaning Windows temp files (Disk Cleanup utility)" -ForegroundColor White
    Write-Host "      3. Uninstalling unused programs" -ForegroundColor White
    Write-Host "      4. Moving large files to external storage" -ForegroundColor White
} elseif ($finalFree -lt 10) {
    Write-Host "   ⚠️  Disk space is adequate but could be better" -ForegroundColor Yellow
    Write-Host "   Recommended free space: >10GB for smooth development" -ForegroundColor White
} else {
    Write-Host "   ✅ Disk space looks good!" -ForegroundColor Green
}

Write-Host "`n🎉 Cleanup complete!`n" -ForegroundColor Green

# ===================================================================
# Additional Commands (commented out - uncomment if needed)
# ===================================================================

# Clean Windows Temp folder (use with caution)
# Write-Host "`n🔍 Cleaning Windows Temp..." -ForegroundColor Cyan
# Remove-Item -Path "$env:TEMP\*" -Recurse -Force -ErrorAction SilentlyContinue
# Write-Host "   ✅ Windows Temp cleaned" -ForegroundColor Green

# Clean browser cache (Chrome example)
# $chromePath = "$env:LOCALAPPDATA\Google\Chrome\User Data\Default\Cache"
# if (Test-Path $chromePath) {
#     Remove-Item -Path "$chromePath\*" -Recurse -Force -ErrorAction SilentlyContinue
# }

