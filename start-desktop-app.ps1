Write-Host "🚀 Starting EmbroideryTech Desktop Application..." -ForegroundColor Green
Write-Host ""

Write-Host "📊 Starting Desktop Backend..." -ForegroundColor Yellow
Set-Location "desktop-backend"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm start" -WindowStyle Normal
Set-Location ".."

Write-Host ""
Write-Host "⏳ Waiting for backend to start..." -ForegroundColor Cyan
Start-Sleep -Seconds 3

Write-Host "🌐 Starting React Frontend..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm start" -WindowStyle Normal

Write-Host ""
Write-Host "⏳ Waiting for React server to be ready..." -ForegroundColor Cyan
Write-Host "   This may take 30-60 seconds..." -ForegroundColor Gray
Start-Sleep -Seconds 45

Write-Host "🖥️ Starting Electron Desktop App..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run electron" -WindowStyle Normal

Write-Host ""
Write-Host "✅ All applications starting..." -ForegroundColor Green
Write-Host ""
Write-Host "📋 Access URLs:" -ForegroundColor White
Write-Host "   🌐 Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "   🔧 Backend:  http://localhost:5001" -ForegroundColor Cyan
Write-Host "   🖥️ Desktop:  Electron window" -ForegroundColor Cyan
Write-Host ""
Write-Host "🔐 Login Credentials:" -ForegroundColor White
Write-Host "   Username: admin" -ForegroundColor Yellow
Write-Host "   Password: admin123" -ForegroundColor Yellow
Write-Host ""
Write-Host "🎯 Instructions:" -ForegroundColor White
Write-Host "   1. Wait for all servers to start (React takes longest)" -ForegroundColor Gray
Write-Host "   2. The Electron window will open automatically" -ForegroundColor Gray
Write-Host "   3. Login with admin/admin123" -ForegroundColor Gray
Write-Host "   4. View the professional dashboard with real data!" -ForegroundColor Gray
Write-Host ""
Write-Host "⚠️  If Electron shows blank screen:" -ForegroundColor Red
Write-Host "   1. Wait for React to fully load (check browser at localhost:3000)" -ForegroundColor Gray
Write-Host "   2. Press Ctrl+R in Electron window to reload" -ForegroundColor Gray
Write-Host "   3. Or restart Electron: npm run electron" -ForegroundColor Gray
Write-Host ""
Read-Host "Press Enter to continue..."
