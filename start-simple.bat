@echo off
echo 🚀 Starting EmbroideryTech Desktop Application (Simple Way)...
echo.

echo 🔧 Installing dependencies...
npm install

echo.
echo 🌐 Starting React + Electron...
npm run electron-dev

echo.
echo ✅ Application started!
echo.
echo 📋 Access URLs:
echo    🌐 Frontend: http://localhost:3000
echo    🔧 Backend:  http://localhost:5001 (if needed)
echo    🖥️ Desktop:  Electron window
echo.
echo 🔐 Login Credentials:
echo    Username: admin
echo    Password: admin123
echo.
pause
