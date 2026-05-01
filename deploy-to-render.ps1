# Deploy to Render Script
# This script commits and pushes changes to trigger Render deployment

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "Deploy to Render" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

# Check if we're in a git repository
if (-not (Test-Path ".git")) {
    Write-Host "❌ Error: Not in a git repository" -ForegroundColor Red
    exit 1
}

# Check git status
Write-Host "Checking git status..." -ForegroundColor Yellow
$status = git status --porcelain

if ($status) {
    Write-Host "✓ Found uncommitted changes" -ForegroundColor Green
    Write-Host ""
    git status --short
    Write-Host ""
    
    # Ask for confirmation
    $commit = Read-Host "Commit these changes? (y/n)"
    
    if ($commit -eq "y" -or $commit -eq "Y") {
        $message = Read-Host "Enter commit message (or press Enter for default)"
        
        if ([string]::IsNullOrWhiteSpace($message)) {
            $message = "Deploy: Fix MongoDB connection and duplicate indexes"
        }
        
        Write-Host ""
        Write-Host "Committing changes..." -ForegroundColor Yellow
        git add .
        git commit -m $message
        Write-Host "✓ Changes committed" -ForegroundColor Green
    }
} else {
    Write-Host "✓ No uncommitted changes" -ForegroundColor Green
    Write-Host ""
    Write-Host "Creating empty commit to trigger deployment..." -ForegroundColor Yellow
    git commit --allow-empty -m "Deploy: Trigger Render deployment"
    Write-Host "✓ Empty commit created" -ForegroundColor Green
}

Write-Host ""
Write-Host "Pushing to GitHub..." -ForegroundColor Yellow
git push origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "==================================================" -ForegroundColor Green
    Write-Host "✓ Successfully pushed to GitHub!" -ForegroundColor Green
    Write-Host "==================================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Render will automatically deploy the changes." -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Monitor deployment at:" -ForegroundColor Yellow
    Write-Host "https://dashboard.render.com" -ForegroundColor Blue
    Write-Host ""
    Write-Host "Expected in logs:" -ForegroundColor Yellow
    Write-Host "  ✓ MongoDB Connected: cluster0-shard-00-00..." -ForegroundColor Green
    Write-Host "  Server running on port 5000" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "❌ Failed to push to GitHub" -ForegroundColor Red
    Write-Host "Please check your git configuration and try again." -ForegroundColor Yellow
    exit 1
}
