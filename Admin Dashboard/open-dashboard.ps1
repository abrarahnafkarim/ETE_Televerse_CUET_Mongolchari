# AERAS Admin Dashboard - Quick Launch Script
# This script checks if the server is running and opens the dashboard in your browser

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "AERAS Admin Dashboard Launcher" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is running
$nodeProcesses = Get-Process node -ErrorAction SilentlyContinue

if ($nodeProcesses) {
    Write-Host "✓ Server is running!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Node.js processes found:" -ForegroundColor Yellow
    $nodeProcesses | Format-Table Id, ProcessName, CPU -AutoSize
} else {
    Write-Host "✗ Server is not running!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Starting development server..." -ForegroundColor Yellow
    
    # Start the dev server in a new window
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot'; npm run dev"
    
    Write-Host "Waiting for server to start..." -ForegroundColor Yellow
    Start-Sleep -Seconds 10
}

Write-Host ""
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Opening Dashboard in Browser..." -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Try different ports
$ports = @(5173, 5174, 3000)
$opened = $false

foreach ($port in $ports) {
    $url = "http://localhost:$port"
    
    # Test if port is listening
    $connection = Test-NetConnection -ComputerName localhost -Port $port -InformationLevel Quiet -WarningAction SilentlyContinue
    
    if ($connection) {
        Write-Host "✓ Dashboard found at: $url" -ForegroundColor Green
        Write-Host ""
        Write-Host "Opening in your default browser..." -ForegroundColor Cyan
        Start-Process $url
        $opened = $true
        break
    }
}

if (-not $opened) {
    Write-Host "Could not find the dashboard on common ports." -ForegroundColor Red
    Write-Host ""
    Write-Host "Please try manually:" -ForegroundColor Yellow
    Write-Host "  1. Open PowerShell in this directory" -ForegroundColor White
    Write-Host "  2. Run: npm run dev" -ForegroundColor White
    Write-Host "  3. Open: http://localhost:5173" -ForegroundColor White
}

Write-Host ""
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Login Credentials" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Email:    admin@aeras.com" -ForegroundColor White
Write-Host "Password: admin123" -ForegroundColor White
Write-Host ""
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Quick Reference" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Dashboard:  http://localhost:5173" -ForegroundColor White
Write-Host "Map View:   http://localhost:5173/map" -ForegroundColor White
Write-Host "Rides:      http://localhost:5173/rides" -ForegroundColor White
Write-Host "Users:      http://localhost:5173/users" -ForegroundColor White
Write-Host "Reviews:    http://localhost:5173/reviews" -ForegroundColor White
Write-Host "Analytics:  http://localhost:5173/analytics" -ForegroundColor White
Write-Host ""
Write-Host "Press any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

