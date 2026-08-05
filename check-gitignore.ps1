# ============================================================================
# Git Ignore Verification Script
# ============================================================================
# This script verifies that sensitive files are properly ignored by Git
# Run with: .\check-gitignore.ps1
# ============================================================================

Write-Host "`n" -NoNewline
Write-Host "╔══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║       Git Ignore Verification Script                    ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

$allGood = $true

# List of sensitive files that should NEVER be tracked
$sensitiveFiles = @(
    "health-care\.env.local",
    "health-care\backend\.env",
    "health-care\.env.production",
    "health-care\backend\.env.production"
)

Write-Host "🔍 Checking if sensitive files are ignored..." -ForegroundColor Yellow
Write-Host ""

foreach ($file in $sensitiveFiles) {
    if (Test-Path $file) {
        # File exists, check if it's ignored
        $checkResult = git check-ignore $file 2>$null
        
        if ($checkResult) {
            Write-Host "✅ $file" -ForegroundColor Green -NoNewline
            Write-Host " - properly ignored" -ForegroundColor DarkGray
        } else {
            Write-Host "❌ $file" -ForegroundColor Red -NoNewline
            Write-Host " - NOT IGNORED (DANGER!)" -ForegroundColor Red
            $allGood = $false
        }
    } else {
        Write-Host "⚠️  $file" -ForegroundColor Yellow -NoNewline
        Write-Host " - file does not exist yet" -ForegroundColor DarkGray
    }
}

Write-Host ""
Write-Host "📋 Checking git status for tracked sensitive files..." -ForegroundColor Yellow
Write-Host ""

# Check if any .env files are in staging or tracked
$gitStatus = git status --short 2>$null

$hasEnvFiles = $false
foreach ($line in $gitStatus) {
    if ($line -match "\.env" -and $line -notmatch "\.example") {
        Write-Host "❌ DANGER! Sensitive file in git: $line" -ForegroundColor Red
        $hasEnvFiles = $true
        $allGood = $false
    }
}

if (-not $hasEnvFiles) {
    Write-Host "✅ No sensitive .env files are tracked" -ForegroundColor Green
}

Write-Host ""
Write-Host "📂 Checking .gitignore files exist..." -ForegroundColor Yellow
Write-Host ""

$gitignoreFiles = @(
    ".gitignore",
    "health-care\.gitignore",
    "health-care\backend\.gitignore"
)

foreach ($gitignore in $gitignoreFiles) {
    if (Test-Path $gitignore) {
        Write-Host "✅ $gitignore exists" -ForegroundColor Green
    } else {
        Write-Host "❌ $gitignore is missing!" -ForegroundColor Red
        $allGood = $false
    }
}

Write-Host ""
Write-Host "🔒 Verifying .gitignore patterns..." -ForegroundColor Yellow
Write-Host ""

# Check if .gitignore contains essential patterns
$rootGitignore = Get-Content ".gitignore" -Raw

$essentialPatterns = @(
    "**/.env",
    "**/.env.local",
    "**/.env.production"
)

foreach ($pattern in $essentialPatterns) {
    if ($rootGitignore -match [regex]::Escape($pattern)) {
        Write-Host "✅ Pattern found: $pattern" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Pattern not found: $pattern" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan

if ($allGood) {
    Write-Host ""
    Write-Host "✅ ALL CHECKS PASSED!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Your .gitignore is working correctly." -ForegroundColor Green
    Write-Host "Sensitive files are properly protected." -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "⚠️  ISSUES FOUND!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please review the errors above and fix them." -ForegroundColor Red
    Write-Host ""
    Write-Host "To remove accidentally tracked files:" -ForegroundColor Yellow
    Write-Host "  git rm --cached filename" -ForegroundColor Gray
    Write-Host ""
}

Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Additional helpful information
Write-Host "📚 Useful Commands:" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Check if a file is ignored:" -ForegroundColor Gray
Write-Host "    git check-ignore -v filename" -ForegroundColor DarkGray
Write-Host ""
Write-Host "  Remove a file from Git (keep local copy):" -ForegroundColor Gray
Write-Host "    git rm --cached filename" -ForegroundColor DarkGray
Write-Host ""
Write-Host "  See all tracked files:" -ForegroundColor Gray
Write-Host "    git ls-files" -ForegroundColor DarkGray
Write-Host ""
Write-Host "  Test gitignore patterns:" -ForegroundColor Gray
Write-Host "    git check-ignore -v *" -ForegroundColor DarkGray
Write-Host ""
