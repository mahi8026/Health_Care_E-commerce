# ============================================================================
# Merge Dependabot Pull Requests
# ============================================================================
# This script helps you review and merge Dependabot PRs safely
# ============================================================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Dependabot PR Merger" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if GitHub CLI is installed
$ghInstalled = Get-Command gh -ErrorAction SilentlyContinue

if (-not $ghInstalled) {
    Write-Host "ERROR: GitHub CLI (gh) is not installed!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install GitHub CLI:" -ForegroundColor Yellow
    Write-Host "  1. Download from: https://cli.github.com/" -ForegroundColor Gray
    Write-Host "  2. Or use winget: winget install GitHub.cli" -ForegroundColor Gray
    Write-Host "  3. Then run: gh auth login" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Alternative: Merge PRs manually on GitHub" -ForegroundColor Yellow
    Write-Host "  https://github.com/mahi8026/Health_Care_E-commerce/pulls" -ForegroundColor Gray
    Write-Host ""
    exit 1
}

Write-Host "✓ GitHub CLI is installed" -ForegroundColor Green
Write-Host ""

# Check if authenticated
$authStatus = gh auth status 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Not authenticated with GitHub!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please run: gh auth login" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

Write-Host "✓ Authenticated with GitHub" -ForegroundColor Green
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Fetching Dependabot PRs..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Get all open Dependabot PRs
$prs = gh pr list --author "app/dependabot" --json number,title,state --limit 100 | ConvertFrom-Json

if ($prs.Count -eq 0) {
    Write-Host "No Dependabot PRs found!" -ForegroundColor Yellow
    exit 0
}

Write-Host "Found $($prs.Count) Dependabot PRs" -ForegroundColor Green
Write-Host ""

# Categorize PRs
$criticalUpdates = @()
$minorUpdates = @()
$majorUpdates = @()

foreach ($pr in $prs) {
    $title = $pr.title
    
    # Check for major version updates (potentially breaking)
    if ($title -match "bump .* from \d+\.\d+\.\d+ to (\d+)\.\d+\.\d+") {
        $newMajor = [int]$matches[1]
        if ($title -match "from (\d+)\.\d+\.\d+") {
            $oldMajor = [int]$matches[1]
            if ($newMajor -gt $oldMajor) {
                $majorUpdates += $pr
                continue
            }
        }
    }
    
    # Check for critical security updates
    if ($title -match "security|vulnerability|CVE") {
        $criticalUpdates += $pr
    } else {
        $minorUpdates += $pr
    }
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "PR Categories:" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Critical/Security: $($criticalUpdates.Count)" -ForegroundColor Red
Write-Host "Minor Updates: $($minorUpdates.Count)" -ForegroundColor Green
Write-Host "Major Updates: $($majorUpdates.Count)" -ForegroundColor Yellow
Write-Host ""

# Function to merge PRs
function Merge-PRs {
    param (
        [array]$PRList,
        [string]$Category
    )
    
    if ($PRList.Count -eq 0) {
        return
    }
    
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "Merging $Category ($($PRList.Count) PRs)" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    
    foreach ($pr in $PRList) {
        Write-Host "PR #$($pr.number): $($pr.title)" -ForegroundColor White
        
        # Merge the PR
        $result = gh pr merge $pr.number --auto --squash 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  ✓ Merged successfully" -ForegroundColor Green
        } else {
            Write-Host "  ⚠ Failed to merge: $result" -ForegroundColor Yellow
        }
        
        Write-Host ""
    }
}

# Ask user what to do
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "What would you like to do?" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Merge all minor updates (safe)" -ForegroundColor Green
Write-Host "2. Merge all (including major updates)" -ForegroundColor Yellow
Write-Host "3. Review each PR manually" -ForegroundColor White
Write-Host "4. Exit" -ForegroundColor Gray
Write-Host ""

$choice = Read-Host "Enter your choice (1-4)"

switch ($choice) {
    "1" {
        Write-Host ""
        Write-Host "Merging critical and minor updates..." -ForegroundColor Green
        Write-Host ""
        
        Merge-PRs -PRList $criticalUpdates -Category "Critical Updates"
        Merge-PRs -PRList $minorUpdates -Category "Minor Updates"
        
        if ($majorUpdates.Count -gt 0) {
            Write-Host "========================================" -ForegroundColor Yellow
            Write-Host "Major updates NOT merged (review manually):" -ForegroundColor Yellow
            Write-Host "========================================" -ForegroundColor Yellow
            Write-Host ""
            foreach ($pr in $majorUpdates) {
                Write-Host "  PR #$($pr.number): $($pr.title)" -ForegroundColor White
            }
            Write-Host ""
            Write-Host "Review these manually at:" -ForegroundColor Yellow
            Write-Host "  https://github.com/mahi8026/Health_Care_E-commerce/pulls" -ForegroundColor Gray
        }
    }
    
    "2" {
        Write-Host ""
        Write-Host "Merging ALL updates..." -ForegroundColor Yellow
        Write-Host ""
        
        Merge-PRs -PRList $criticalUpdates -Category "Critical Updates"
        Merge-PRs -PRList $minorUpdates -Category "Minor Updates"
        Merge-PRs -PRList $majorUpdates -Category "Major Updates"
    }
    
    "3" {
        Write-Host ""
        Write-Host "Opening GitHub PRs page..." -ForegroundColor White
        Start-Process "https://github.com/mahi8026/Health_Care_E-commerce/pulls"
    }
    
    "4" {
        Write-Host ""
        Write-Host "Exiting..." -ForegroundColor Gray
        exit 0
    }
    
    default {
        Write-Host ""
        Write-Host "Invalid choice. Exiting..." -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Done!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor White
Write-Host "  1. Wait for GitHub Actions to complete" -ForegroundColor Gray
Write-Host "  2. Check for any failed tests" -ForegroundColor Gray
Write-Host "  3. Test your application locally" -ForegroundColor Gray
Write-Host "  4. Deploy to production" -ForegroundColor Gray
Write-Host ""

