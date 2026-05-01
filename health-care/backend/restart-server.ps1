# Backend Server Restart Script
# This script stops any process using port 5000 and starts the server fresh

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "Backend Server Restart Script" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

# Check if port 5000 is in use
Write-Host "Checking if port 5000 is in use..." -ForegroundColor Yellow

try {
    $connection = Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue
    
    if ($connection) {
        $processId = $connection.OwningProcess
        $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
        
        Write-Host "✓ Found process using port 5000:" -ForegroundColor Green
        Write-Host "  Process ID: $processId" -ForegroundColor White
        Write-Host "  Process Name: $($process.ProcessName)" -ForegroundColor White
        Write-Host ""
        
        Write-Host "Stopping process..." -ForegroundColor Yellow
        Stop-Process -Id $processId -Force
        Start-Sleep -Seconds 2
        Write-Host "✓ Process stopped" -ForegroundColor Green
    } else {
        Write-Host "✓ Port 5000 is available" -ForegroundColor Green
    }
} catch {
    Write-Host "✓ Port 5000 is available" -ForegroundColor Green
}

Write-Host ""
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "Starting Backend Server" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

# Start the server
node src/server.js
