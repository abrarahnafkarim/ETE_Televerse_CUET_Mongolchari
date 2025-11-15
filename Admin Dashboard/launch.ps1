# Simple AERAS Dashboard Launcher
Write-Host "Opening AERAS Admin Dashboard..." -ForegroundColor Cyan
Write-Host ""

# Open the dashboard
Start-Process "http://localhost:5173"

Write-Host "Dashboard URL: http://localhost:5173" -ForegroundColor Green
Write-Host ""
Write-Host "Login Credentials:" -ForegroundColor Yellow
Write-Host "  Email: admin@aeras.com" -ForegroundColor White
Write-Host "  Password: admin123" -ForegroundColor White
Write-Host ""
Write-Host "If the page doesn't load, make sure the server is running:" -ForegroundColor Yellow
Write-Host "  npm run dev" -ForegroundColor White


